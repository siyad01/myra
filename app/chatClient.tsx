// app/ChatClient.tsx
"use client";

import { Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface ChatClientProps {
  messages: Message[];
  isThinking: boolean;
}

export default function ChatClient({ messages, isThinking }: ChatClientProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-4 max-w-4xl mx-auto w-full">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-lg px-6 py-4 rounded-3xl ${
              msg.role === "user"
                ? "bg-white text-black"
                : "bg-gray-900 border border-gray-800 text-gray-100"
            }`}
          >
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
  );
}