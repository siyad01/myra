"use client";
import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,  // Use env
  baseURL: 'https://openrouter.ai/api/v1',
});

export default function Home() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    // Auto-welcome on load
    speak("Hey, how can I help? Say or type your name and location.");
  }, []);

  // Weather & News (fetch on demand)
  const getWeather = async (city: string) => {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();
    const c = data.current_condition[0];
    const w = data.weather[0];
    return `${c.weatherDesc[0].value}, ${c.temp_C}°C. High: ${w.maxtempC}°C.`;
  };

  const getNews = async (city: string) => {
    const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(city)}+india&hl=en-IN&gl=IN&ceid=IN:en`);
    // Parse RSS (simplified – use xml2js in prod)
    return "Top news: Local elections heating up | Traffic alert on main road | New cafe opening!";  // Mock for demo
  };

  // Chotu Reply (OpenRouter)
  const getChotuReply = async (userText: string) => {
    const weather = await getWeather(city);
    const news = await getNews(city);
    const prompt = `You are Chotu, witty Hinglish AI for ${name} in ${city}.
    Services: Weather (${weather}), News (${news}), jokes, chat.
    User: "${userText}"
    Reply short, funny, Hinglish. Discuss news if asked (e.g., 'news 1'). End with question. Max 50 words.`;

    const response = await openai.chat.completions.create({
      model: 'nvidia/nemotron-nano-9b-v2:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 80,
    });
    return response.choices[0].message.content?.trim() || 'Kuch gadbad ho gaya!';
  };

  // Speech-to-Text
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setTranscript(text);
        handleInput(text);
      };
      recognition.start();
      setIsListening(true);
      setTimeout(() => setIsListening(false), 5000);  // 5s listen
    }
  };

  // Text-to-Speech
  const speak = (text: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current?.speak(utterance);
  };

  // Handle Input (voice or text)
  const handleInput = async (input: string) => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user' as const, text: input }]);
    const reply = await getChotuReply(input);
    setMessages(prev => [...prev, { role: 'assistant' as const, text: reply }]);
    speak(reply);
  };

  // Welcome after setup
  useEffect(() => {
    if (name && city && messages.length === 0) {
      const welcome = `Namaste ${name} from ${city}! I'm Chotu—your sidekick for weather, news, jokes, and chit-chat. Say 'weather' or 'news 1' to start! Kya chal raha hai?`;
      setMessages([{ role: 'assistant' as const, text: welcome }]);
      speak(welcome);
    }
  }, [name, city]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Chotu Voice
        </h1>
        <p className="text-gray-400">Voice Chat Like ChatGPT</p>
      </header>

      {/* Setup */}
      {(!name || !city) && (
        <div className="p-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 mb-2 bg-gray-800 rounded-lg text-white"
          />
          <input
            type="text"
            placeholder="Your City (e.g., Delhi)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-800 rounded-lg text-white"
          />
          <button
            onClick={() => name && city && handleInput('start')}
            className="w-full p-3 bg-blue-600 rounded-lg"
          >
            Start Voice Chat
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : ''}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isSpeaking && <div className="flex justify-start"><div className="chat-bubble">Chotu is speaking...</div></div>}
      </div>

      {/* Voice Button + Waves */}
      <footer className="p-4 bg-black border-t border-gray-800 fixed bottom-0 left-0 right-0">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`voice-circle ${isListening || isSpeaking ? 'wave' : ''}`}
          >
            {isListening ? '🔴' : isSpeaking ? '🔵' : '🎤'}
          </button>
          <span className="text-sm text-gray-400">{isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Tap to speak'}</span>
          <button onClick={() => window.location.reload()} className="text-red-500">❌</button>
        </div>
      </footer>
    </div>
  );
}