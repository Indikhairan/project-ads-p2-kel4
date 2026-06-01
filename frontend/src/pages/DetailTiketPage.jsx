import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import image3 from "../assets/image-3.png";

// Komponen Badge Status Dinamis sesuai respons Database
const StatusBadge = ({ status }) => {
  const currentStatus = status?.toLowerCase();
  if (currentStatus === "open" || currentStatus === "diproses" || currentStatus === "processing") {
    return <span className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-xs rounded flex items-center gap-1">⏱ DIPROSES</span>;
  }
  if (currentStatus === "selesai" || currentStatus === "completed") {
    return <span className="px-3 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-xs rounded flex items-center gap-1">✓ SELESAI</span>;
  }
  return <span className="px-3 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-xs rounded flex items-center gap-1">⊘ DITOLAK</span>;
};

const SectionHeader = ({ icon, title }) => (
  <div className="bg-[#130962] text-white px-5 py-3 flex items-center gap-3 rounded-t-lg">
    <span>{icon}</span>
    <span className="font-semibold text-sm tracking-wide">{title}</span>
  </div>
);

const InfoRow = ({ label, value, isFile }) => (
  <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0 items-center">
    <span className="w-28 text-[#130962] font-semibold text-sm shrink-0">{label}</span>
    <span className="text-gray-500 text-sm shrink-0">:</span>
    {isFile ? (
      <button className="text-sm text-blue-600 underline flex items-center gap-1 hover:opacity-70">
        📄 {value}
        <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded ml-1">Unduh</span>
      </button>
    ) : (
      <span className="text-[#130962] text-sm break-all">{value}</span>
    )}
  </div>
);

export const DetailTiketPage = () => {
  const { id } = useParams(); // Mengambil ID dinamis dari URL (misal: /tiket/002)
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  
  // State Utama murni dari Database
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("idle"); 

  useEffect(() => {
    const fetchTicketFromDB = async () => {
      if (!id) return;
      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("sapa_ipb_token");
        if (!token) {
          setError("Silakan login terlebih dahulu untuk melihat detail tiket.");
          setIsLoading(false);
          return;
        }

        // Request langsung ke endpoint API Backend 
        const res = await fetch(`http://127.0.0.1:8000/api/v1/tiket/${encodeURIComponent(id)}`, {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Tiket tidak ditemukan di database.");
        }

        // Set data dari database ke state
        setTicket(data);
      } catch (e) {
        console.error("Error fetching ticket:", e);
        setError(e.message || "Gagal memuat data dari server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketFromDB();
  }, [id]);

  // Fungsi Verifikasi TTD Digital langsung ke Backend
  const handleVerifikasi = async () => {
    if (!ticket) return;
    setVerifyStatus("loading");
    
    try {
      const token = localStorage.getItem("sapa_ipb_token");
      const cleanId = String(id).replace('#', ''); 
      
      const res = await fetch(`http://localhost:8000/api/v1/tiket/${cleanId}/verifikasi`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}` 
        }
      });

      const data = await res.json();

      if (res.ok) {
        setVerifyStatus(data.is_valid ? "valid" : "invalid");
      } else {
        throw new Error(data.detail || "Gagal verifikasi ke server.");
      }
    } catch (error) {
      console.error("Error verifikasi:", error);
      alert(error.message);
      setVerifyStatus("idle");
    }
  };

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationSection onBuatTiket={() => setShowForm(true)} />

      <div className="w-full max-w-[900px] mx-auto px-6 mt-8 pb-20">

        {/* Tombol Kembali */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="text-[#130962] hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="font-bold text-[#130962] text-xl">Detail Tiket</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">

          {/* Kondisi Loading */}
          {isLoading && (
            <div className="py-12 text-center text-gray-500 font-medium">Memuat data dari database...</div>
          )}

          {/* Kondisi Error / Tiket Tidak Ditemukan */}
          {!isLoading && error && (
            <div className="py-12 text-center text-red-500 font-semibold bg-red-50 rounded-xl border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Kondisi Data Berhasil Dimuat */}
          {!isLoading && ticket && (
            <>
              {/* Nomor Tiket & Status */}
              <div className="flex flex-col gap-1">
                <p className="text-[#130962] text-sm font-semibold">
                  NO. TIKET : <span className="font-bold">{ticket.id_tiket || `#${id}`}</span>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[#130962] text-sm font-semibold">STATUS :</p>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>

              {/* Informasi Pengajuan */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <SectionHeader icon="📋" title="INFORMASI PENGAJUAN" />
                <div className="p-5">
                  <InfoRow label="Kategori" value={ticket.kategori || ticket.id_layanan || "-"} />
                  <InfoRow label="Pengaju" value={ticket.email_mahasiswa || "-"} />
                  <InfoRow label="Tanggal" value={ticket.waktu_submit ? new Date(ticket.waktu_submit).toLocaleString("id-ID") : "-"} />
                  <InfoRow label="Keterangan" value={ticket.subjek || ticket.deskripsi || "-"} />
                  {ticket.file_lampiran && (
                    <InfoRow label="Lampiran" value={ticket.file_lampiran} isFile />
                  )}
                </div>
              </div>

              {/* Tanggapan Staff */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <SectionHeader icon="💬" title="TANGGAPAN STAFF" />
                <div className="p-5">
                  {ticket.tanggapan ? (
                    <>
                      <InfoRow label="Direspon" value={ticket.tanggapan.email_staff || ticket.tanggapan.direspon || "Staff Akademik"} />
                      <InfoRow label="Pesan" value={ticket.tanggapan.pesan || "-"} />
                      {ticket.tanggapan.file_output && (
                        <InfoRow label="Berkas" value={ticket.tanggapan.file_output} isFile />
                      )}

                      {/* Integrasi Keamanan TTD Digital */}
                      {ticket.tanggapan.hash_lampiran && (
                        <div className="flex gap-4 py-2 items-start border-t border-gray-100 mt-2 pt-4">
                          <span className="w-28 text-[#130962] font-semibold text-sm shrink-0">Keamanan</span>
                          <span className="text-gray-500 text-sm shrink-0">:</span>
                          <div className="flex flex-col gap-1">
                            <code className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono break-all">
                              sha256:{ticket.tanggapan.hash_lampiran}
                            </code>
                            <div className="flex items-center gap-2 mt-2">
                              <button 
                                onClick={handleVerifikasi} 
                                disabled={verifyStatus === "loading"}
                                className="px-3 py-1 bg-[#130962] text-white text-xs font-semibold rounded hover:opacity-90 disabled:bg-gray-400"
                              >
                                {verifyStatus === "loading" ? "Memverifikasi..." : "Verifikasi TTD Digital"}
                              </button>
                              {verifyStatus === "valid" && <span className="text-xs text-green-600 font-bold">✓ DOKUMEN ASLI</span>}
                              {verifyStatus === "invalid" && <span className="text-xs text-red-600 font-bold">❌ TERINDIKASI PALSU</span>}
                            </div>
                          </div>
                        </div>
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
                <div className="p-5">
                  {!ticket.log || ticket.log.length === 0 ? (
                    <p className="text-gray-400 italic text-sm text-center py-6">Tidak ada log aktivitas.</p>
                  ) : (
                    <div className="flex flex-col">
                      {ticket.log.map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${item.color || 'bg-blue-500'} shrink-0 mt-0.5`} />
                            {idx < ticket.log.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                          </div>
                          <div className="flex gap-2 pb-4">
                            <span className="text-xs text-gray-400 shrink-0 w-36">{item.time}</span>
                            <span className="text-xs text-[#130962] font-medium">{item.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>

      {/* Chatbot & Form Pembuatan Tiket */}
      <button
        onClick={() => setShowChatbot((prev) => !prev)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl shadow-lg hover:bg-[#283593] transition-all z-40"
      >
        <img src={image3} alt="Chatbot" className="w-8 h-8 object-contain" />
        <span className="font-semibold text-sm">CHATBOT SAPA</span>
      </button>
      {showChatbot && <ChatbotSAPA onClose={() => setShowChatbot(false)} />}
      
      {/* Ketika form ini disubmit, database terisi dan halaman dialihkan ke detail ID yang baru */}
      {showForm && <FormPengajuanTiket onClose={() => setShowForm(false)} />}
    </main>
  );
};

export default DetailTiketPage;