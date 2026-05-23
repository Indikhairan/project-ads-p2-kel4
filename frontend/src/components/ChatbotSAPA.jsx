import React, { useState, useRef, useEffect } from "react";
import image3 from "../assets/image-3.png";

const ChatBubble = ({ message }) => {
  const isBot = message.sender === "bot";
  return (
    <div className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <img src={image3} alt="SAPA" className="w-7 h-7 object-contain shrink-0 mb-1" />
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
          isBot
            ? "bg-white border border-gray-200 text-[#130962] rounded-bl-none shadow-sm"
            : "bg-[#1a237e] text-white rounded-br-none"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

export const ChatbotSAPA = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Halo! Selamat datang di CHATBOT SAPA 👋\nAda yang bisa saya bantu?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 1. Tampilkan pesan user ke layar
    const userMsg = { id: Date.now(), sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true); // Munculkan animasi loading 3 titik

    try {
      // 2. Ambil token JWT dari brankas browser
      const token = localStorage.getItem("sapa_ipb_token"); 

      // 3. Tembak API FastAPI kamu
      const response = await fetch("http://127.0.0.1:8000/chatbot/tanya", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ pesan: trimmed })
      });

      if (!response.ok) {
        throw new Error("Gagal mendapat respons dari server");
      }

      // 4. Ekstrak jawaban JSON dari backend
      const data = await response.json();

      // 5. Tampilkan jawaban Gemini ke layar
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: data.jawaban },
      ]);
    } catch (error) {
      console.error("Error chatbot:", error);
      // Fallback kalau backend mati atau token kadaluarsa
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: "Maaf, sistem SAPA sedang gangguan atau sesi kamu habis. Coba refresh halaman ya!" },
      ]);
    } finally {
      setIsTyping(false); // Matikan animasi loading
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-[340px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200"
      style={{ height: "460px" }}
    >
      {/* Header */}
      <div className="bg-[#1a237e] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={image3} alt="SAPA" className="w-8 h-8 object-contain" />
          <span className="font-bold text-white text-sm tracking-wide">CHATBOT SAPA</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:opacity-70 transition-opacity text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Area pesan */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#f4f6fb]">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex items-end gap-2">
            <img src={image3} alt="SAPA" className="w-7 h-7 object-contain shrink-0" />
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a237e] bg-gray-50"
        />
        <button
          onClick={handleSend}
          className="w-9 h-9 bg-[#ffe030] rounded-xl flex items-center justify-center hover:bg-yellow-400 transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatbotSAPA;