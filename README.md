# Myra – Your Voice-Based AI Friend

Myra is a warm, loving AI companion that interacts with users through natural voice conversations. Built using **Next.js**, **React**, **Tailwind CSS**, **OpenRouter (Mistral 7B Instruct)**, **Google News RSS**, and **WTTR Weather API**, Myra provides personalized chat responses, reads the latest news, explains headlines on request, and adapts its tone based on time and contextual information.

---

## 🚀 Features

### 🌸 AI Personality

Myra behaves like a caring female friend, offering:

* Supportive and empathetic responses
* Time-based tone adjustment (morning, afternoon, night)
* Weather‑aware greetings and context
* Personalized conversation using stored user details (name, city, tone preference)

### 🎤 Voice Interaction (Main Highlight)

* Voice input using browser SpeechRecognition
* Smooth voice replies using SpeechSynthesis API
* Hands‑free conversation mode

### 📰 Smart News Handling

Myra fetches top headlines using Google News RSS:

* Reads headlines aloud
* Users can say: “Explain news 1”, “explain headline 3”…
* Myra explains the selected news story in detail using Mistral 7B

### ⛅ Real-Time Weather Context

Uses WTTR API to gather:

* Temperature
* Weather description
* Weather-aware conversational tone

### 🤖 LLM Powered

Uses **OpenRouter Mistral 7B Instruct (Free Tier)** for:

* Conversation responses
* News explanation
* Natural language processing

---

## 🧩 Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Frontend        | Next.js 16, React, Tailwind CSS        |
| AI Model        | Mistral 7B Instruct via OpenRouter API |
| Voice           | Web Speech API (STT + TTS)             |
| News            | Google News RSS Feed                   |
| Weather         | WTTR (text-based weather API)          |
| Hosting         | Vercel (Free Tier)                     |
| Version Control | Git & GitHub                           |

---

## 🔧 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/siyad01/myra.git
cd myra
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Add Environment Variables

Create `.env.local` in the root directory:

```
OPENROUTER_API_KEY=your_key_here
```

### 4️⃣ Run Locally

```bash
npm run dev
```

Now open:

```
http://localhost:3000
```

---

## ☁️ Deployment on Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial Myra commit"
git branch -M main
git remote add origin https://github.com/siyad01/myra.git
git push -u origin main
```

### Step 2 — Deploy

1. Go to **vercel.com**
2. Click **New Project**
3. Import your GitHub repo
4. Add environment variables:

   * `NEXT_PUBLIC_OPENROUTER_API_KEY`
5. Select **Next.js** framework (auto-detected)
6. Click **Deploy**

### Step 3 — Done!

Vercel builds your app and gives you a live URL.

---

## 🎙 How Voice Mode Works

### Speech-to-Text

Uses browser `SpeechRecognition` API:

* Converts user's voice into text
* Auto-stops when user finishes speaking

### Text-to-Speech

Using `window.speechSynthesis`:

* Myra reads every response aloud
* Natural, soft female tone

### Conversation Loop

1. User speaks
2. App converts voice → text
3. Sends text + context to OpenRouter
4. Myra returns warm response
5. App speaks the answer aloud

---

## 🎯 Roadmap

* Add continuous listening mode
* Add multi-language voice support
* Add whisper-based transcription
* Add optional background music for ambience
* Add user profile page (saved preferences)

---

## 🤝 Contributing

Pull requests are welcome.

---

## 📜 License

MIT License.

---

## 💖 Acknowledgements

* OpenRouter (Mistral 7B Instruct)
* WTTR Weather API
* Google News RSS
* Next.js Team
* Vercel Hosting
* Web Speech API
