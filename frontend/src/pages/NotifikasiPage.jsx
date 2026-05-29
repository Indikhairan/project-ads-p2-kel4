import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import image3 from "../assets/image-3.png";

const mapBackendToNotif = (n) => {
  const waktu = new Date(n.waktu);
  const today = new Date();
  const isToday = waktu.toDateString() === today.toDateString();
  return {
    id: n.id_notifikasi,
    group: isToday ? "Today" : waktu.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
    type: n.tipe || "status",
    title: n.judul || (n.pesan || "Notifikasi"),
    description: n.pesan || "",
    time: waktu.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    read: !!n.is_read,
    tiketId: n.id_tiket,
  };
};
const initialNotifications = [
  {
    id: 1,
    group: "Today",
    type: "status",
    title: "STATUS TIKET #007 TELAH DIPERBARUI",
    description: "Surat Anda telah disetujui dan siap diunduh.",
    time: "20:46",
    read: false,
    tiketId: "001",
  },
  {
    id: 2,
    group: "Today",
    type: "status",
    title: "STATUS TIKET #003 TELAH DIPERBARUI",
    description: "Terdapat kesalahan pada dokumen yang Anda unggah.",
    time: "15:03",
    read: true,
    tiketId: "003",
  },
  {
    id: 3,
    group: "10 April 2026",
    type: "status",
    title: "STATUS TIKET #001 TELAH DIPERBARUI",
    description: "Permohonan surat Anda telah diterima dan sedang diproses",
    time: "09:01",
    read: true,
    tiketId: "001",
  },
];

const TicketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const NotifItem = ({ notif, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-start gap-4 px-5 py-4 border-b border-gray-100 relative cursor-pointer hover:opacity-90 transition-opacity ${
      !notif.read ? "bg-[#ebebff]" : "bg-white"
    }`}
  >
    {!notif.read && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4f46e5] rounded-l-lg" />
    )}
    <div className="text-[#4f46e5] mt-0.5 shrink-0">
      {notif.type === "comment" ? <CommentIcon /> : <TicketIcon />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-[#130962] text-sm">{notif.title}</p>
      <p className="text-gray-500 text-sm mt-0.5">{notif.description}</p>
    </div>
    <span className="text-gray-400 text-xs shrink-0 mt-0.5">{notif.time}</span>
  </div>
);

export const NotifikasiPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fetchNotifs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("sapa_ipb_token");
        if (!token) {
          setError("Silakan login untuk melihat notifikasi.");
          setIsLoading(false);
          return;
        }

        const res = await fetch("http://127.0.0.1:8000/notifikasi", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || "Gagal memuat notifikasi.");
          setNotifications([]);
        } else {
          setNotifications((data || []).map(mapBackendToNotif));
        }
      } catch (e) {
        console.error("Error fetching notifications:", e);
        setError("Gagal memuat notifikasi. Periksa koneksi.");
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifs();
  }, []);

  const handleTandaiDibaca = async () => {
    const token = localStorage.getItem("sapa_ipb_token");
    if (!token) {
      setError("Silakan login untuk menandai notifikasi.");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/notifikasi/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.detail || "Gagal menandai notifikasi.");
        return;
      }
      // update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error("Error mark all read:", e);
      setError("Gagal menandai notifikasi. Periksa koneksi.");
    }
  };

  const handleKlikNotif = async (notif) => {
    const token = localStorage.getItem("sapa_ipb_token");
    if (!token) {
      setError("Silakan login untuk membuka notifikasi.");
      return;
    }

    try {
      // Tandai di server dulu
      await fetch(`http://127.0.0.1:8000/notifikasi/${encodeURIComponent(notif.id)}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Error marking single notif read:", e);
    }

    // Update local state and navigate
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    if (notif.tiketId) navigate(`/tiket/${notif.tiketId}`);
  };

  const grouped = notifications.reduce((acc, notif) => {
    if (!acc[notif.group]) acc[notif.group] = [];
    acc[notif.group].push(notif);
    return acc;
  }, {});

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationSection onBuatTiket={() => setShowForm(true)} />

      <div className="w-full max-w-[900px] mx-auto px-6 mt-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-[#130962] text-2xl">Notifikasi</h1>
            <span className="bg-[#ffe030] text-[#130962] font-bold text-xs px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          </div>
          <button
            onClick={handleTandaiDibaca}
            className="bg-[#ffe030] text-[#130962] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Tandai Sudah Dibaca
          </button>
        </div>

        {/* Card konten */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <p className="text-gray-400 italic text-sm">Memuat notifikasi...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-32">
              <p className="text-red-500 italic text-sm">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <p className="text-gray-400 italic text-sm">
                Anda belum memiliki riwayat notifikasi.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-5 py-3 bg-white">
                  <span className="font-semibold text-[#130962] text-sm">{group}</span>
                </div>
                {items.map((notif) => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onClick={() => handleKlikNotif(notif)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>

      {/* Chatbot */}
      <button
        onClick={() => setShowChatbot((prev) => !prev)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl shadow-lg hover:bg-[#283593] transition-all z-40"
      >
        <img src={image3} alt="Chatbot" className="w-8 h-8 object-contain" />
        <span className="font-semibold text-sm">CHATBOT SAPA</span>
      </button>
      {showChatbot && <ChatbotSAPA onClose={() => setShowChatbot(false)} />}
      {showForm && <FormPengajuanTiket onClose={() => setShowForm(false)} />}
    </main>
  );
};

export default NotifikasiPage;