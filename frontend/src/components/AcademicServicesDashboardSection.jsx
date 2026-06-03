import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import infografisPanduan from "../assets/infografis-panduan.png";

// --- HELPER COMPONENTS & FUNCTIONS ---

// 1. Komponen Badge Status Tiket
    const StatusBadge = ({ status }) => {
      if (status === "open")
        return (
          <div className="px-3 py-1 bg-blue-50 border border-blue-400 text-blue-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
            📬 OPEN
          </div>
        );
      if (status === "processing")
        return (
          <div className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
            ⏱ SEDANG DIPROSES
          </div>
        );
      if (status === "completed")
        return (
          <div className="px-3 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
            ✓ SELESAI
          </div>
        );
      return (
        <div className="px-3 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
          ⊘ DITOLAK
        </div>
      );
    };

// 2. Fungsi Format Waktu (Contoh: 2026-05-30 ... menjadi "30 Mei 2026, 14.36 WIB")
const formatWaktu = (stringWaktu) => {
  if (!stringWaktu) return "Waktu tidak diketahui";
  
  try {
    const tanggal = new Date(stringWaktu);
    
    if (isNaN(tanggal.getTime())) return stringWaktu;

    return tanggal.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(".", ":") + " WIB";
  } catch (error) {
    return stringWaktu;
  }
};

// --- MAIN COMPONENT ---

export const AcademicServicesDashboardSection = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mengambil data tiket saat komponen pertama kali di-render
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("sapa_ipb_token");
        if (!token) return;
        
        const res = await fetch(`${API_BASE_URL}/api/v1/tiket/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (res.ok) setTickets(data || []);
        else setTickets([]);
      } catch (e) {
        console.error("Error fetching tickets for dashboard:", e);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // --- LOGIKA KALKULASI RINGKASAN TIKET ---
  const total = tickets.length;
  const diproses = tickets.filter(t => {
    const s = (t.status || "").toLowerCase();
    return s === "diproses" || s === "open" || s === "processing";
  }).length;
  const selesai = tickets.filter(t => {
    const s = (t.status || "").toLowerCase();
    return s === "selesai" || s === "completed";
  }).length;
  const ditolak = tickets.filter(t => (t.status || "").toLowerCase() === "ditolak").length;

  const summaryCards = [
    { count: String(total), title: "Tiket Dibuat", description: "Total seluruh tiket", iconBg: "bg-[#fff7cb]", emoji: "📑" },
    { count: String(diproses), title: "Sedang Diproses", description: "Tiket dalam proses", iconBg: "bg-[#dbeafe]", emoji: "⏳" },
    { count: String(selesai), title: "Selesai", description: "Tiket selesai", iconBg: "bg-[#dcfce7]", emoji: "✅" },
    { count: String(ditolak), title: "Ditolak", description: "Tiket ditolak", iconBg: "bg-[#fee2e2]", emoji: "🚫" },
  ];

  // --- MENGURUTKAN DAN MENGAMBIL MAXIMAL 3 TIKET TERBARU ---
  const lastTickets = [...tickets]
    .sort((a, b) => new Date(b.waktu_submit || b.waktu || 0) - new Date(a.waktu_submit || a.waktu || 0))
    .slice(0, 3);

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Portal Banner */}
      <section className="w-full flex flex-col items-center py-6">
        <h1 className="font-bold text-[#130962] text-xl text-center mb-1">
          Portal Layanan Akademik
        </h1>
        <p className="text-gray-400 text-sm text-center mb-5">
          Ajukan permohonan layanan akademik Anda dengan mudah dan cepat
        </p>
        <img
          src={infografisPanduan}
          alt="Panduan Penggunaan Web SAPA IPB"
          className="w-full max-w-[700px] object-contain rounded-lg"
        />
      </section>

      <div className="w-full border-t border-gray-200" />

      {/* Ringkasan Tiket */}
      <section className="w-full bg-[#ffe972] rounded-xl p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-[#130962] text-base mb-0.5">Ringkasan Tiket Anda</h2>
          <p className="text-[#130962] text-[11px]">Pantau status tiket akademik Anda secara ringkas</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <article key={card.title} className="bg-white p-3.5 rounded-xl flex items-center gap-3">
              <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0`}>
                {card.emoji}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#130962] text-xl leading-tight">{card.count}</span>
                <span className="font-medium text-[#130962] text-[11px]">{card.title}</span>
                <span className="text-[#130962] text-[10px] opacity-60">{card.description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tiket Terakhir Section */}
      <section className="w-full bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-[#130962] text-base">Tiket Terakhir Anda</h2>
          <button
            onClick={() => navigate("/riwayat")}
            className="text-[#130962] text-xs hover:underline font-medium flex items-center gap-1"
          >
            Lihat Semua →
          </button>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {loading ? (
            <p className="text-gray-400 text-xs text-center py-4">Memuat data tiket...</p>
          ) : lastTickets.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">Belum ada tiket yang diajukan.</p>
          ) : (
            lastTickets.map((ticket) => (
              <article
                key={ticket.id_tiket || ticket.id}
                onClick={() => navigate(`/tiket/${ticket.id_tiket || ticket.id}`)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">📝</span>
                  <div>
                    <div className="font-medium text-[#130962] text-sm">
                      {ticket.judul || ticket.title || ticket.id_layanan || "Tiket Layanan"}
                    </div>
                    <div className="italic text-gray-400 text-[11px]">
                      {formatWaktu(ticket.waktu_submit || ticket.waktu || ticket.date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <span className="text-gray-400 text-sm">›</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="w-full py-3 text-center italic text-[#130962] text-[11px] opacity-50">
        IPB University
      </footer>
    </div>
  );
};