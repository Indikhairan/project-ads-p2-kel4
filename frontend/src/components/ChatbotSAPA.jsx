import React, { useState, useRef, useEffect } from "react";
import image3 from "../assets/image-3.png";

// Database jawaban chatbot (knowledge base sederhana)
const knowledgeBase = [
  {
    keywords: ["cuti", "cuti akademik", "cara cuti"],
    answer: "Untuk mengajukan cuti akademik, berikut langkah-langkahnya:\n1. Unduh formulir cuti di website akademik IPB.\n2. Isi formulir dan minta tanda tangan dosen wali.\n3. Serahkan ke bagian akademik fakultas.\n4. Tunggu persetujuan dari Direktorat Administrasi Pendidikan.\n\nPastikan pengajuan dilakukan sebelum batas waktu yang ditentukan.",
  },
  {
    keywords: ["krs", "isi krs", "cara krs", "kontrak mata kuliah"],
    answer: "Cara mengisi KRS di IPB:\n1. Login ke SIMAK IPB di simak.ipb.ac.id.\n2. Pilih menu 'Kartu Rencana Studi'.\n3. Pilih mata kuliah yang ingin dikontrak.\n4. Simpan dan cetak KRS.\n\nPastikan pengisian KRS dilakukan sesuai jadwal yang ditetapkan.",
  },
  {
    keywords: ["beasiswa", "informasi beasiswa", "daftar beasiswa"],
    answer: "Informasi beasiswa di IPB dapat ditemukan melalui:\n1. Website resmi IPB di beasiswa.ipb.ac.id.\n2. Pengumuman di papan informasi fakultas.\n3. Email resmi dari kemahasiswaan.\n\nJenis beasiswa yang tersedia antara lain: Beasiswa Bidikmisi, KIP-K, Beasiswa Prestasi, dan beasiswa dari pihak swasta.",
  },
  {
    keywords: ["surat", "surat aktif", "surat keterangan", "surat mahasiswa"],
    answer: "Untuk mengajukan surat keterangan mahasiswa aktif:\n1. Klik menu '+ Buat Tiket' di halaman utama.\n2. Isi subjek dan pilih kategori 'Persuratan'.\n3. Pilih jenis surat yang dibutuhkan.\n4. Lengkapi persyaratan yang diminta.\n5. Klik 'Submit Tiket'.\n\nSurat akan diproses dalam 1-3 hari kerja.",
  },
  {
    keywords: ["tiket", "buat tiket", "pengajuan", "ajukan"],
    answer: "Cara membuat tiket pengajuan layanan:\n1. Klik menu '+ Buat Tiket' di navbar.\n2. Isi subjek tiket.\n3. Pilih kategori layanan (Persuratan/Informasi/Lainnya).\n4. Isi deskripsi keperluan.\n5. Unggah dokumen pendukung jika ada.\n6. Klik 'Submit Tiket'.\n\nKamu bisa memantau status tiket di menu 'Riwayat Tiket'.",
  },
  {
    keywords: ["status tiket", "cek tiket", "riwayat tiket"],
    answer: "Untuk melihat status tiket pengajuan kamu:\n1. Klik menu 'Riwayat Tiket' di navbar.\n2. Daftar semua tiket kamu akan muncul beserta statusnya.\n3. Klik salah satu tiket untuk melihat detail dan balasan dari staff.\n\nStatus tiket: Sedang Diproses, Selesai, atau Ditolak.",
  },
  {
    keywords: ["halo", "hai", "hello", "hi", "selamat pagi", "selamat siang", "selamat malam", "hei"],
    answer: "Halo! Selamat datang di CHATBOT SAPA 👋\nSaya siap membantu kamu dengan informasi seputar layanan akademik IPB.\n\nKamu bisa tanyakan seputar:\n- Cara cuti akademik\n- Pengisian KRS\n- Informasi beasiswa\n- Pengajuan surat\n- Status tiket\n\nAda yang bisa saya bantu?",
  },
  {
    keywords: ["terima kasih", "makasih", "thanks", "thank you"],
    answer: "Sama-sama! Senang bisa membantu 😊\nJika ada pertanyaan lain seputar layanan akademik, jangan ragu untuk bertanya ya!",
  },
];

const FALLBACK_ANSWER =
  "Maaf, SAPA tidak mengerti pertanyaan Anda. Silahkan hubungi staff via tiket atau ajukan pertanyaan seputar layanan akademik IPB.";

const findAnswer = (input) => {
  const lower = input.toLowerCase().trim();
  for (const item of knowledgeBase) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.answer;
    }
  }
  return FALLBACK_ANSWER;
};

// Bubble chat
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
    { id: 1, sender: "bot", text: "Halo! Ada yang bisa saya bantu?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulasi delay seperti bot sedang mengetik
    setTimeout(() => {
      const botAnswer = findAnswer(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: botAnswer },
      ]);
      setIsTyping(false);
    }, 800);
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