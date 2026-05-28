import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import image3 from "../assets/image-3.png";

const StatusBadge = ({ status }) => {
  if (status === "Open" || status === "Diproses")
    return <span className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-xs rounded flex items-center gap-1">⏱ DIPROSES</span>;
  if (status === "Selesai")
    return <span className="px-3 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-xs rounded flex items-center gap-1">✓ SELESAI</span>;
  return <span className="px-3 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-xs rounded flex items-center gap-1">⊘ DITOLAK</span>;
};

const SectionHeader = ({ icon, title }) => (
  <div className="bg-[#130962] text-white px-5 py-3 flex items-center gap-3 rounded-t-lg">
    <span>{icon}</span>
    <span className="font-semibold text-sm tracking-wide">{title}</span>
  </div>
);

const InfoRow = ({ label, value, isFile }) => (
  <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0">
    <span className="w-28 text-[#130962] font-semibold text-sm shrink-0">{label}</span>
    <span className="text-gray-500 text-sm">:</span>
    {isFile ? (
      <button className="text-sm text-blue-600 underline flex items-center gap-1 hover:opacity-70">
        📄 {value}
        <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded ml-1">Unduh</span>
      </button>
    ) : (
      <span className="text-[#130962] text-sm">{value}</span>
    )}
  </div>
);

export const DetailTiketPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTicket = async () => {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("sapa_ipb_token");
        if (!token) {
          setError("Silakan login terlebih dahulu untuk melihat detail tiket.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`http://127.0.0.1:8000/api/v1/tiket/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || "Tiket tidak ditemukan.");
          setTicket(null);
        } else {
          setTicket(data);
        }
      } catch (e) {
        console.error("Error fetching ticket detail:", e);
        setError("Gagal memuat detail tiket. Periksa koneksi.");
        setTicket(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationSection onBuatTiket={() => setShowForm(true)} />

      <div className="w-full max-w-[900px] mx-auto px-6 mt-8 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-[#130962] hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="font-bold text-[#130962] text-xl">Detail Tiket</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">

          {/* No tiket & status */}
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Memuat detail tiket...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : ticket ? (
            <div className="flex flex-col gap-1">
              <p className="text-[#130962] text-sm font-semibold">
                NO. TIKET : <span className="font-bold">{ticket.id_tiket}</span>
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[#130962] text-sm font-semibold">STATUS :</p>
                <StatusBadge status={ticket.status} />
              </div>
            </div>
          ) : null}

          {/* Informasi Pengajuan */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="📋" title="INFORMASI PENGAJUAN" />
            <div className="p-5">
              <InfoRow label="Kategori" value={ticket?.kategori || ticket?.id_layanan} />
              <InfoRow label="Pengaju" value={ticket?.email_mahasiswa || "-"} />
              <InfoRow label="Tanggal" value={ticket?.waktu_submit ? new Date(ticket.waktu_submit).toLocaleString("id-ID") : "-"} />
              <InfoRow label="Keterangan" value={ticket?.subjek || ticket?.data_request?.deskripsi || "-"} />
              {ticket?.file_lampiran && (
                <InfoRow label="Lampiran" value={ticket.file_lampiran} isFile />
              )}
            </div>
          </div>

          {/* Tanggapan Staff */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="💬" title="TANGGAPAN STAFF" />
            <div className="p-5">
              {ticket?.tanggapan ? (
                <>
                  <InfoRow label="Direspon" value={ticket.tanggapan.direspon} />
                  <InfoRow label="Pesan" value={ticket.tanggapan.pesan} />
                  {ticket.tanggapan.berkas && (
                    <InfoRow label="Berkas" value={ticket.tanggapan.berkas} isFile />
                  )}
                </>
              ) : (
                <p className="text-gray-400 italic text-sm text-center py-6">
                  Belum ada tanggapan dari staff.
                </p>
              )}
            </div>
          </div>

          {/* Log Aktivitas */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="🕐" title="LOG AKTIVITAS" />
            <div className="p-5 flex flex-col gap-3">
              {(ticket?.log || []).length === 0 ? (
                <p className="text-gray-400 italic text-sm text-center py-6">Tidak ada log aktivitas.</p>
              ) : (
                (ticket.log || []).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0 mt-1`} />
                    <div>
                      <span className="text-xs text-gray-400 mr-2">{item.time}</span>
                      <span className="text-xs text-[#130962]">{item.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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

export default DetailTiketPage;