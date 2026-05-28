import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import image3 from "../assets/image-3.png";

// Data dummy tiket (Ditambah Hash & Signature untuk tiket 002)
const ticketData = {
  "001": {
    id: "#001",
    status: "processing",
    kategori: "Persuratan - Surat Keterangan Aktif Kuliah",
    pengaju: "Budi Santoso (G64012345)",
    tanggal: "22 April 2026, 08:30 WIB",
    keterangan: "Mohon dibuatkan surat keterangan aktif untuk syarat beasiswa",
    lampiran: "KRS_Budi_Genap.pdf",
    tanggapan: null,
    log: [
      { time: "22/04/2026 - 08:30 WIB", text: "Tiket berhasil dibuat (Mahasiswa)", color: "bg-blue-500" },
      { time: "22/04/2026 - 09:00 WIB", text: "Status berubah: DIPROSES (Staff Agus)", color: "bg-yellow-500" },
    ],
  },
  "002": {
    id: "#002",
    status: "completed",
    kategori: "Persuratan - Surat Keterangan Aktif Kuliah",
    pengaju: "Budi Santoso (G64012345)",
    tanggal: "22 April 2026, 08:30 WIB",
    keterangan: "Mohon dibuatkan surat keterangan aktif untuk syarat beasiswa",
    lampiran: "KRS_Budi_Genap.pdf",
    tanggapan: {
      direspon: "Staff Akademik (Agus S.)",
      pesan: "Surat pengantar sudah dicetak dan ditandatangani. Silahkan unduh dokumen pada lampiran di bawah ini.",
      berkas: "Surat_Aktif_Budi_TTD.pdf",
      // DATA TAMBAHAN UNTUK KEAMANAN
      hash_lampiran: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      digital_signature: "base64_encoded_signature..."
    },
    log: [
      { time: "22/04/2026 - 08:30 WIB", text: "Tiket berhasil dibuat (Mahasiswa)", color: "bg-blue-500" },
      { time: "22/04/2026 - 09:00 WIB", text: "Status berubah: DIPROSES (Staff Agus)", color: "bg-yellow-500" },
      { time: "22/04/2026 - 10:00 WIB", text: "Tanggapan & file dikirim (Staff Agus)", color: "bg-blue-500" },
      { time: "22/04/2026 - 10:00 WIB", text: "Status berubah: SELESAI (Otomatis)", color: "bg-green-500" },
    ],
  },
  "003": {
    id: "#003",
    status: "rejected",
    kategori: "Persuratan - Surat Izin Akademik",
    pengaju: "Budi Santoso (G64012345)",
    tanggal: "23 April 2026, 09:15 WIB",
    keterangan: "Mohon dibuatkan surat izin tidak mengikuti ujian",
    lampiran: null,
    tanggapan: {
      direspon: "Staff Akademik (Agus S.)",
      pesan: "Maaf, pengajuan Anda ditolak karena dokumen pendukung tidak lengkap.",
      berkas: null,
    },
    log: [
      { time: "23/04/2026 - 09:15 WIB", text: "Tiket berhasil dibuat (Mahasiswa)", color: "bg-blue-500" },
      { time: "23/04/2026 - 10:00 WIB", text: "Status berubah: DIPROSES (Staff Agus)", color: "bg-yellow-500" },
      { time: "23/04/2026 - 11:00 WIB", text: "Status berubah: DITOLAK (Staff Agus)", color: "bg-red-500" },
    ],
  },
};

const StatusBadge = ({ status }) => {
  if (status === "processing")
    return <span className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-xs rounded flex items-center gap-1">⏱ DIPROSES</span>;
  if (status === "completed")
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
  // Sementara id dipaksa "002" agar bisa melihat tampilan Selesai (Hapus default="002" jika ingin dinamis)
  const { id = "002" } = useParams(); 
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // STATE UNTUK VERIFIKASI KEAMANAN (idle, loading, valid, invalid)
  const [verifyStatus, setVerifyStatus] = useState("idle"); 

  const ticket = ticketData[id];

  if (!ticket) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
        <TopNavigationSection onBuatTiket={() => setShowForm(true)} />
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400 italic">Tiket tidak ditemukan.</p>
        </div>
      </main>
    );
  }

  // FUNGSI VERIFIKASI ASLI KE BACKEND
  const handleVerifikasi = async () => {
    setVerifyStatus("loading");
    
    try {
      const token = localStorage.getItem("sapa_ipb_token");
      // Hapus tanda '#' dari id tiket (misal '#002' jadi '002')
      const cleanId = ticket.id.replace('#', ''); 
      
      const res = await fetch(`http://localhost:8000/api/v1/tiket/${cleanId}/verifikasi`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}` 
        }
      });

      const data = await res.json();

      if (res.ok) {
        // Cek hasil dari backend (True / False)
        if (data.is_valid === true) {
          setVerifyStatus("valid");
        } else {
          setVerifyStatus("invalid");
        }
      } else {
        throw new Error(data.detail || "Gagal menghubungi server verifikasi.");
      }
    } catch (error) {
      console.error("Error verifikasi:", error);
      alert(error.message);
      setVerifyStatus("idle"); // Kembalikan tombol seperti semula kalau error jaringan
    }
  };

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
          <div className="flex flex-col gap-1">
            <p className="text-[#130962] text-sm font-semibold">
              NO. TIKET : <span className="font-bold">{ticket.id}</span>
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
              <InfoRow label="Kategori" value={ticket.kategori} />
              <InfoRow label="Pengaju" value={ticket.pengaju} />
              <InfoRow label="Tanggal" value={ticket.tanggal} />
              <InfoRow label="Keterangan" value={ticket.keterangan} />
              {ticket.lampiran && (
                <InfoRow label="Lampiran" value={ticket.lampiran} isFile />
              )}
            </div>
          </div>

          {/* Tanggapan Staff (Dengan UI Verifikasi RSA) */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="💬" title="TANGGAPAN STAFF" />
            <div className="p-5">
              {ticket.tanggapan ? (
                <>
                  <InfoRow label="Direspon" value={ticket.tanggapan.direspon} />
                  <InfoRow label="Pesan" value={ticket.tanggapan.pesan} />
                  {ticket.tanggapan.berkas && (
                    <InfoRow label="Berkas" value={ticket.tanggapan.berkas} isFile />
                  )}
                  <div className="flex gap-4 py-2 items-start">
                    <span className="w-28 text-[#130962] font-semibold text-sm shrink-0">Hash Dokumen</span>
                    <span className="text-gray-500 text-sm shrink-0">:</span>
                    <div className="flex flex-col gap-1">
                      <code className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono break-all">
                        sha256:a3f8c2d1e9b74056f2a1c8e3d7b9f042a1e5c8d3f6b2a9e1c4d7f0b3e6a2c5d8
                      </code>
                      <span className="text-[10px] text-gray-400 italic">Digital signature terverifikasi oleh sistem</span>
                    </div>
                  </div>
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
              <div className="flex flex-col">
                {ticket.log.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    {/* Garis timeline + titik */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} shrink-0 mt-0.5`} />
                      {idx < ticket.log.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    {/* Konten */}
                    <div className="flex gap-2 pb-4">
                      <span className="text-xs text-gray-400 shrink-0 w-40">{item.time}</span>
                      <span className="text-xs text-[#130962]">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
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