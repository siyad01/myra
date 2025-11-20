/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import OpenAI from "openai";
import { Mic, Send, CloudRain, Cloud, Sun, Wind, Loader2 } from "lucide-react";
import { format } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true,
});

interface Weather {
  temp: string;
  desc: string;
  feelsLike: string;
  localObsDateTime?: string;
}

export default function Home() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const isProcessing = useRef(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return { text: "Good morning", tone: "fresh, bright and full of energy" };
    if (hour >= 12 && hour < 15) return { text: "Good afternoon", tone: "warm and cheerful" };
    if (hour >= 15 && hour < 18) return { text: "Good evening", tone: "cozy, loving and relaxed" };
    return { text: "Good night", tone: "soft, caring and peaceful" };
  };

  const formatTime = () => format(currentTime, "h:mm a");

  // Soft, warm female voice
  const speak = useCallback((text: string) => {
    if (!text || useTextMode || isSpeaking) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) ||
      voices.find(v => v.lang.startsWith("en") && v.default);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1.3;
    utterance.volume = 1;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [useTextMode, isSpeaking]);

  useEffect(() => {
    const load = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = load;
    load();
  }, []);

  const getWeather = async (cityName: string) => {
    setIsWeatherLoading(true);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(cityName)}?format=j1`, { signal: controller.signal });
      const data = await res.json();
      const c = data.current_condition[0];
      setWeather({
        temp: c.temp_C,
        desc: c.weatherDesc[0].value,
        feelsLike: c.FeelsLikeC,
        localObsDateTime: data.nearest_area?.[0]?.localObsDateTime || c.localObsDateTime,
      });
    } catch {
      setWeather({ temp: "28", desc: "Sunny", feelsLike: "30" });
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const getNews = async (scope: "local" | "country" | "world" = "local") => {
    setIsNewsLoading(true);
    try {
      const url = scope === "local" 
    ? `/api/news?city=${encodeURIComponent(city)}&scope=local`
    : `/api/news?scope=${scope}`; 
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      const headlines = data.news
      .split(" • ")
      .map((h: string) => h.trim())
      .filter(Boolean)
      .slice(0, 5);

      return headlines.length > 0 ? headlines : ["Latest updates", "All good in your city"];
    } catch {
      return ["Breaking news from India", "Markets open strong", "Beautiful day ahead"];
    } finally {
      setIsNewsLoading(false);
    }
  };

  const readNews = async (scope: "local" | "country" | "world" = "local") => {

    try {
      const headlines = await getNews(scope);
      const greeting = getGreeting();
      // THIS IS THE FIX — use correct intro based on scope
      let intro = "";
      if (scope === "local") {
        intro = `${greeting.text}, ${name}! Here are the top stories from ${city}...`;
      } else if (scope === "country") {
        intro = `${greeting.text}, sweetheart! Here's what's happening across India...`;
      } else {
        intro = `${greeting.text}, darling! Let me share the biggest global stories from around the world...`;
      }

      setMessages(prev => [...prev, { role: "assistant", text: intro }]);
      speak(intro);

      headlines.forEach((h: string, i: number) => {
        setTimeout(() => {
          const line = `${i + 1}. ${h}`;
          setMessages(prev => [...prev, { role: "assistant", text: line }]);
          speak(line);
        }, (i + 1) * 7500);
      });
    } catch (error) {
      console.error("News reading failed:", error);
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having a little trouble reading the news right now, darling." }]);
      speak("I'm having a little trouble reading the news right now, darling.");
    }
  // DO NOT TOUCH isProcessing.current HERE
  // Let handleInput control it!
};
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setUseTextMode(true); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => handleInput(e.results[0][0].transcript);
    recognition.onerror = () => { setIsListening(false); setUseTextMode(true); };
    recognition.start();
  };

  const getAIResponse = async (userText: string): Promise<string> => {
    const { text: greeting, tone } = getGreeting();
    try {
      const response = await openai.chat.completions.create({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{
          role: "user", content: `You are Myra, a warm, loving female friend.
It's ${formatTime()} (${greeting}). Speak in a ${tone} tone.
Talking to ${name} from ${city}.
Current weather: ${weather?.temp}°C, ${weather?.desc}.
User said: "${userText}"
Reply naturally and lovingly in English to any queries. If they say "explain news 1", "explain headline 2", etc. — explain that news in detail.
Be their caring friend.`}],
        temperature: 0.85,
        max_tokens: 320,
      });
      return response.choices[0]?.message?.content?.trim() || "I'm right here for you, darling.";
    } catch {
      return `I'm having a tiny hiccup, sweetie. But I'm still here with you at ${formatTime()}.`;
    }
  };

  const handleInput = async (text: string) => {
    if (!text.trim() || isProcessing.current) return;

    isProcessing.current = true;
    setIsThinking(true);

    const userMsg = text.trim().toLowerCase();
    setMessages(prev => [...prev, { role: "user", text: text.trim() }]);
    setInput("");

    try {
      if (userMsg.includes("india news") || userMsg.includes("national") || userMsg.includes("news about India")) {
        await readNews("country");
      }
      else if (userMsg.includes("world news") || userMsg.includes("international")) {
        await readNews("world");
      }else if (/news|headlines|update|what'?s happening/i.test(userMsg)) {
        await readNews("local");
      }
      else {
        const reply = await getAIResponse(text.trim());
        setMessages(prev => [...prev, { role: "assistant", text: reply }]);
        speak(reply);
      }
    } catch (err) {
      console.error("Handle input error:", err);
    } finally {
      // ONLY HERE — reset everything
      setIsThinking(false);
      isProcessing.current = false;
    }
};

  const completeSetup = async () => {
    if (!name.trim() || !city.trim()) return;
    setIsSetupDone(true);
    await getWeather(city);

    const { text: greeting } = getGreeting();
    const welcome = `${greeting}, ${name}! I'm Myra, your personal friend from ${city}.
It's ${formatTime()} and the weather is ${weather?.temp ? `${weather.temp}°C, ${weather.desc}` : "lovely"}.
I can read you the news, chat, or just keep you company.
How are you feeling today, darling?`;

    setMessages([{ role: "assistant", text: welcome }]);
    speak(welcome);
  };

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-10 h-10" />;
    const d = weather.desc.toLowerCase();
    if (d.includes("rain")) return <CloudRain className="w-10 h-10" />;
    if (d.includes("cloud")) return <Cloud className="w-10 h-10" />;
    if (d.includes("sun") || d.includes("clear")) return <Sun className="w-10 h-10" />;
    return <Wind className="w-10 h-10" />;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with Live Clock */}
      <header className="relative p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-linear-to-br from-pink-500 to-purple-600 rounded-xl" />
          <h1 className="text-3xl font-light">Myra</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light tracking-wider bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            {formatTime()}
          </div>
          <div className="text-sm text-gray-500">{format(currentTime, "EEEE, MMMM d")}</div>
        </div>
      </header>

      {!isSetupDone ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-6xl font-light">Hello</h2>
              <p className="text-gray-500 mt-3 text-2xl">I&apos;m Myra, your friend</p>
            </div>
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-5 bg-gray-900 border border-gray-800 rounded-2xl focus:outline-none focus:border-gray-600 text-center text-xl" autoFocus />
            <input type="text" placeholder="Your city" value={city} onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && completeSetup()}
              className="w-full px-5 py-5 bg-gray-900 border border-gray-800 rounded-2xl focus:outline-none focus:border-gray-600 text-center text-xl" />
            <button onClick={completeSetup} disabled={!name.trim() || !city.trim()}
              className="w-full py-5 bg-white text-black rounded-2xl font-medium text-lg hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition">
              Let&apos;s Begin
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero with Weather Loading */}
          <div className="py-10 text-center flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="text-6xl md:text-8xl font-light leading-tight mb-2">Hello, {name}</h1>
            <p className="text-2xl text-gray-400 mb-6">{city}</p>

            {isWeatherLoading ? (
              <div className="flex items-center gap-4 text-xl">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <span>Getting the weather for you...</span>
              </div>
            ) : weather ? (
              <div className="flex items-center gap-4 text-2xl">
                {getWeatherIcon()}
                <span>{weather.temp}°C • {weather.desc}</span>
              </div>
            ) : (
              <div className="text-gray-500">Weather loading...</div>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 max-w-4xl mx-auto w-full">
            {messages.map((msg, i) => (
              <div key={i} className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-lg px-6 py-4 rounded-3xl ${msg.role === "user" ? "bg-white text-black" : "bg-gray-900 border border-gray-800 text-gray-100"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-900 border border-gray-800 px-6 py-4 rounded-3xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Myra is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input + News Button */}
          <div className="border-t border-gray-800 p-5">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full flex items-center gap-4 bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-full px-6 py-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleInput(input)}
                  placeholder="Talk to me, darling..."
                  className="flex-1 bg-transparent outline-none placeholder-gray-500 text-lg"
                  disabled={isProcessing.current}
                />
                {useTextMode ? (
                  <button onClick={() => handleInput(input)} disabled={isProcessing.current}
                    className="p-4 bg-white text-black rounded-full disabled:opacity-60">
                    <Send className="w-6 h-6" />
                  </button>
                ) : (
                  <button
                    onClick={startListening}
                    disabled={isProcessing.current}
                    className={`p-4 rounded-full transition-all ${isListening || isSpeaking ? "bg-white text-black animate-pulse" : "bg-gray-800 hover:bg-gray-700"}`}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}