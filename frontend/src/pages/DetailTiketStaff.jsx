import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNavigationStaff } from "../components/TopNavigationStaff";

const STATUS_OPTIONS = [
  { value: "Open", label: "OPEN" },
  { value: "Diproses", label: "DIPROSES" },
  { value: "Selesai", label: "SELESAI" },
  { value: "Ditolak", label: "DITOLAK" },
];

// Lock scroll background saat modal terbuka
const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isLocked]);
};

const SectionHeader = ({ icon, title }) => (
  <div className="bg-[#130962] text-white px-5 py-3 flex items-center gap-3 rounded-t-lg">
    <span>{icon}</span>
    <span className="font-semibold text-sm tracking-wide">{title}</span>
  </div>
);

const InfoRow = ({ label, value, isFile, onPreview, onDownload }) => (
  <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0 items-start">
    <span className="w-28 text-[#130962] font-semibold text-sm shrink-0">{label}</span>
    <span className="text-gray-500 text-sm shrink-0">:</span>
    {isFile ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[#130962] text-sm break-all">📄 {value}</span>
        {onPreview && (
          <button
            onClick={onPreview}
            className="text-[11px] bg-white border border-blue-500 text-blue-600 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition"
          >
            Preview
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="text-[11px] bg-[#130962] text-white font-semibold px-3 py-1 rounded-lg hover:bg-[#0f185f] transition"
          >
            Unduh
          </button>
        )}
      </div>
    ) : (
      <span className="text-[#130962] text-sm">{value}</span>
    )}
  </div>
);

// Modal profil mahasiswa
const ModalProfilMahasiswa = ({ mahasiswa, onClose }) => {
  useScrollLock(true);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#130962] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <span className="font-bold text-base">Data Diri Pengaju</span>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Konten */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            <p className="font-semibold text-[#130962] text-sm mb-2 border-b pb-1">Informasi Pribadi</p>
            {[
              { label: "Nama", value: mahasiswa.nama },
              { label: "NIM", value: mahasiswa.nim },
              { label: "Tempat, Tgl Lahir", value: mahasiswa.ttl },
              { label: "Alamat", value: mahasiswa.alamat },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3 py-1.5 text-sm">
                <span className="w-36 text-gray-500 shrink-0">{label}</span>
                <span className="text-[#130962]">: {value}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="font-semibold text-[#130962] text-sm mb-2 border-b pb-1">Informasi Akademik</p>
            {[
              { label: "Program Studi", value: mahasiswa.prodi },
              { label: "Fakultas", value: mahasiswa.fakultas },
              { label: "Angkatan", value: mahasiswa.angkatan },
              { label: "Semester", value: mahasiswa.semester },
              { label: "Status Akademik", value: mahasiswa.statusAkademik, green: true },
              { label: "IPK", value: mahasiswa.ipk },
            ].map(({ label, value, green }) => (
              <div key={label} className="flex gap-3 py-1.5 text-sm">
                <span className="w-36 text-gray-500 shrink-0">{label}</span>
                <span className={green ? "text-green-600 font-semibold" : "text-[#130962]"}>: {value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal preview surat
const ModalPreviewSurat = ({ mahasiswa, onClose }) => {
  useScrollLock(true);
  const today = new Date();
  const tglSurat = today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <span className="font-bold text-[#130962] text-sm">Preview Surat - Surat Keterangan Aktif Kuliah</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Isi surat */}
        <div className="overflow-y-auto flex-1 p-8 font-serif text-sm leading-relaxed">
          <div className="flex items-start gap-4 border-b-2 border-gray-800 pb-4 mb-6">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center">
              <img src="/src/assets/image-5.png" alt="Logo IPB" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Kementerian Pendidikan Tinggi, Sains, dan Teknologi</p>
              <p className="font-bold text-[#130962] text-base">INSTITUT PERTANIAN BOGOR</p>
              <p className="text-[11px] text-gray-500">Kampus IPB Dramaga, Bogor 16680 | Telp: (0251) 8622642</p>
              <p className="text-[11px] text-gray-500">Email: rektor@apps.ipb.ac.id | ipb.ac.id</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="font-bold underline text-base">SURAT KETERANGAN</p>
            <p className="text-xs text-gray-500 mt-1">Nomor: ___/IT3.KM.00.00/M/B/{today.getFullYear()}</p>
          </div>

          <p className="mb-4 text-justify">
            Yang bertanda tangan di bawah ini, Direktur Administrasi Pendidikan dan Penerimaan Mahasiswa Baru Institut Pertanian Bogor menerangkan bahwa:
          </p>
          <div className="ml-8 mb-4 flex flex-col gap-1.5">
            {[
              { label: "Nama", value: mahasiswa.nama },
              { label: "NIM", value: mahasiswa.nim },
              { label: "Program Studi", value: mahasiswa.prodi },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4">
                <span className="w-32">{label}</span>
                <span>: {value}</span>
              </div>
            ))}
          </div>
          <p className="mb-4 text-justify">
            Terdaftar sebagai mahasiswa aktif Program Pendidikan Sarjana (S-1) pada Program Studi {mahasiswa.prodi}, {mahasiswa.fakultas}, Institut Pertanian Bogor semester gasal tahun akademik {today.getFullYear()}/{today.getFullYear() + 1}.
          </p>
          <p className="mb-10 text-justify">
            Demikian Surat Keterangan ini dibuat untuk digunakan sebagaimana mestinya.
          </p>

          <div className="flex justify-end">
            <div className="text-center">
              <p>Bogor, {tglSurat}</p>
              <p>Direktur Administrasi Pendidikan dan</p>
              <p>Penerimaan Mahasiswa Baru</p>
              <div className="my-14" />
              <p className="font-bold underline">Dr. Utami Dyah Syafitri, S.Si.,M.Si</p>
              <p className="text-xs">NIP 197709172005012001</p>
            </div>
          </div>

          <div className="text-center mt-8 text-xs text-gray-400 italic border-t pt-4">
            Inspiring Innovation with Integrity
          </div>
        </div>

        {/* Footer tombol */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#ffe030] text-[#130962] font-bold rounded-xl text-sm hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Unduh Surat
          </button>
        </div>
      </div>
    </div>
  );
};

// Fungsi Validasi Realtime Passphrase
const cekKekuatan = (teks) => {
  if (teks.length < 8) return "Minimal 8 karakter.";
  if (!/[A-Z]/.test(teks)) return "Harus ada huruf besar.";
  if (!/[a-z]/.test(teks)) return "Harus ada huruf kecil.";
  if (!/[0-9]/.test(teks)) return "Harus ada angka.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(teks)) return "Harus ada simbol spesial.";
  return ""; 
};

export const DetailTiketStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();

  // State Manajemen Utama
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("Open");
  const [pesan, setPesan] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showProfil, setShowProfil] = useState(false);
  const [showSurat, setShowSurat] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [errorStatus, setErrorStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // State Keamanan & Form
  const [errorSubmit, setErrorSubmit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseConfirm, setPassphraseConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasKey, setHasKey] = useState(null); 

  const token = localStorage.getItem("sapa_ipb_token");

  const getFileName = (path) => path?.split(/[/\\]/).pop() || "file";
  const isPreviewable = (path) => {
    const ext = (path?.split(".").pop() || "").toLowerCase();
    return ["pdf", "png", "jpg", "jpeg"].includes(ext);
  };

  const handleFileAction = async (kind, action, filePath) => {
    try {
      if (!token) throw new Error("Token tidak ditemukan.");
      const url = `http://127.0.0.1:8000/api/v1/tiket/${encodeURIComponent(id)}/download-${kind}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Gagal mengunduh file.");
      }

      const blob = await res.blob();
      const filename = getFileName(filePath);
      const blobUrl = window.URL.createObjectURL(blob);

      if (action === "preview" && isPreviewable(filename)) {
        window.open(blobUrl, "_blank");
        return;
      }

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal mengunduh file.");
    }
  };

  // 1. Fetch data tiket utama saat halaman dibuka
  useEffect(() => {
    if (!token) {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setIsLoading(false);
      return;
    }

    const fetchTicket = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/tiket/${encodeURIComponent(id)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Gagal memuat detail tiket.");
        }

        const data = await response.json();
        setTicket(data);
        setStatus(data.status || "Open");
      } catch (err) {
        setError(err.message || "Gagal memuat detail tiket.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [id, token]);

  // 2. Fetch status kunci keamanan staff
  useEffect(() => {
    const fetchKeyStatus = async () => {
      if (!token) {
        console.error("Token JWT tidak ditemukan di browser!");
        setHasKey(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:8000/api/v1/staff/status-kunci", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setHasKey(data.has_key);
        } else {
          const errorData = await res.json();
          console.error("Gagal dari backend:", errorData);
          setHasKey(false);
        }
      } catch (error) {
        console.error("Network/CORS Error:", error);
        setHasKey(false);
      }
    };
    fetchKeyStatus();
  }, [token]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDataRequest = (payload) => {
    if (!payload) return "-";
    if (typeof payload === "string") return payload;
    if (typeof payload === "object") {
      return Object.entries(payload)
        .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
        .join(" | ");
    }
    return String(payload);
  };

  const statusColor =
    status === "Selesai" ? "text-green-600" :
    status === "Ditolak" ? "text-red-500" : "text-orange-500";

  const handleUpdateStatus = async () => {
    if (!ticket) return;
    setErrorStatus("");
    setStatusMessage("");
    setIsUpdating(true);

    if (!token) {
      setErrorStatus("Token tidak ditemukan. Silakan login kembali.");
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/tiket/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Gagal memperbarui status tiket.");
      }

      const data = await response.json();
      setTicket(data);
      setStatus(data.status || "Open");
      setStatusMessage("Status tiket berhasil diperbarui.");
    } catch (err) {
      setErrorStatus(err.message || "Gagal memperbarui status tiket.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateKey = async () => {
    if (passphrase !== passphraseConfirm) {
      setErrorSubmit("Konfirmasi passphrase tidak cocok!");
      return;
    }
    setErrorSubmit("");
    setIsSubmitting(true);
    
    try {
      const currentToken = localStorage.getItem("sapa_ipb_token"); 
      if (!currentToken) {
        throw new Error("Sesi tidak valid atau Token JWT kosong. Coba Logout dan Login kembali.");
      }

      const formData = new FormData();
      formData.append("passphrase", passphrase);

      const res = await fetch("http://localhost:8000/api/v1/staff/generate-key", {
        method: "POST",
        headers: { "Authorization": `Bearer ${currentToken}` },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        const errorDetail = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(errorDetail || "Gagal membuat kunci.");
      }
      
      setPassphrase(""); 
      setHasKey(true);
      alert("Kunci Keamanan berhasil dibuat! Silakan lanjutkan membalas tiket.");
    } catch (error) {
      setErrorSubmit(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKirim = async () => {
    if (!pesan.trim()) {
      setErrorSubmit("Pesan tanggapan tidak boleh kosong!");
      return;
    }
    if (!passphrase.trim()) {
      setErrorSubmit("Passphrase wajib diisi untuk keamanan!");
      return;
    }
    setErrorSubmit("");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pesan", pesan);
      formData.append("passphrase", passphrase);
      if (uploadedFile) formData.append("file_lampiran", uploadedFile);

      const cleanId = ticket.id ? ticket.id.replace('#', '') : id;
      const res = await fetch(`http://localhost:8000/api/v1/tiket/${cleanId}/tanggapan`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json(); 

      if (!res.ok) {
        const errorDetail = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(errorDetail || "Gagal mengirim tanggapan"); 
      }

      // Refresh tiket dari server untuk menampilkan tanggapan yang baru saja dibuat
      try {
        const cleanId = ticket.id ? ticket.id.replace('#', '') : id;
        const res2 = await fetch(`http://127.0.0.1:8000/api/v1/tiket/${encodeURIComponent(cleanId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res2.ok) {
          const updated = await res2.json();
          setTicket(updated);
        }
      } catch (e) {
        console.error("Gagal refresh tiket:", e);
      }

      setSubmitted(true);
      setStatus("Selesai"); 
    } catch (error) {
      setErrorSubmit(error.message); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorPassphraseRealtime = (!hasKey && passphrase) ? cekKekuatan(passphrase) : "";

  const [verifyStatus, setVerifyStatus] = useState("idle");

  const handleVerifikasi = async () => {
    if (!ticket) return;
    setVerifyStatus("loading");
    try {
      const cleanId = String(ticket.id || id).replace('#', '');
      const res = await fetch(`http://localhost:8000/api/v1/tiket/${cleanId}/verifikasi`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
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

  if (isLoading) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
        <TopNavigationStaff />
        <div className="flex items-center justify-center flex-1 py-20">
          <p className="text-gray-500">Memuat detail tiket...</p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
        <TopNavigationStaff />
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center max-w-md">
            <p className="text-red-500 font-semibold mb-3">{error || "Tiket tidak ditemukan"}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-[#130962] text-white rounded-xl hover:bg-[#1a237e]"
            >Kembali</button>
          </div>
        </div>
      </main>
    );
  }

  const mahasiswa = ticket.data_request || {};
  const logItems = [
    {
      time: ticket.waktu_submit ? formatDate(ticket.waktu_submit) : "-",
      text: `Tiket dibuat oleh ${ticket.email_mahasiswa}`,
      color: "bg-blue-500",
    },
    ...(ticket.email_staff ? [{
      time: ticket.waktu_submit ? formatDate(ticket.waktu_submit) : "-",
      text: `Staff menangani tiket: ${ticket.email_staff}`,
      color: "bg-yellow-500",
    }] : []),
  ];

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationStaff />

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
          <div className="flex flex-col gap-4">
            <p className="text-[#130962] text-sm font-semibold">
              NO. TIKET : <span className="font-bold">{ticket.id_tiket || ticket.id}</span>
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-[#130962] text-sm font-semibold">STATUS :</p>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`border rounded-lg px-3 py-1.5 text-sm font-semibold appearance-none pr-7 focus:outline-none focus:border-[#130962] bg-white border-gray-300 ${statusColor}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="px-4 py-2 bg-[#130962] text-white rounded-xl text-sm hover:bg-[#1a237e] transition-colors disabled:opacity-50"
              >{isUpdating ? "Menyimpan..." : "Simpan Status"}</button>
            </div>
            {statusMessage && <p className="text-green-600 text-sm">{statusMessage}</p>}
            {errorStatus && <p className="text-red-500 text-sm">{errorStatus}</p>}
          </div>

          {/* Informasi Pengajuan */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="📋" title="INFORMASI PENGAJUAN" />
            <div className="p-5">
              <InfoRow label="Kategori" value={ticket.kategori || "-"} />
              <InfoRow label="Pengaju" value={ticket.email_mahasiswa || "-"} />
              <InfoRow label="Tanggal" value={formatDate(ticket.waktu_submit)} />
              <InfoRow label="Subjek" value={ticket.subjek || "-"} />
              <InfoRow label="Data Request" value={formatDataRequest(ticket.data_request)} />
              {ticket.file_lampiran && (
                <InfoRow
                  label="Lampiran"
                  value={getFileName(ticket.file_lampiran)}
                  isFile
                  onPreview={() => handleFileAction("request", "preview", ticket.file_lampiran)}
                  onDownload={() => handleFileAction("request", "download", ticket.file_lampiran)}
                />
              )}

              <div className="flex flex-col gap-3 mt-5 sm:flex-row">
                <button
                  onClick={() => setShowProfil(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffe030] text-[#130962] font-semibold text-xs rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  👤 Lihat Info Pengaju
                </button>
                <button
                  onClick={() => setShowSurat(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#130962] text-white font-semibold text-xs rounded-lg hover:bg-[#1a237e] transition-colors"
                >
                  📄 Preview Data Request
                </button>
              </div>
            </div>
          </div>
          
          {/* Form Tanggapan */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="💬" title="FORM TANGGAPAN STAFF" />
            <div className="p-5 flex flex-col gap-4">
              
              {/* Skenario 0: Loading Kunci */}
              {hasKey === null && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-6 h-6 border-4 border-gray-200 border-t-[#130962] rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400 animate-pulse">Menyiapkan profil keamanan...</p>
                </div>
              )}

              {/* Skenario 1: Belum Punya Kunci */}
              {hasKey === false && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-2">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h3 className="text-[#130962] font-bold text-sm">Profil Keamanan Belum Aktif</h3>
                      <p className="text-xs text-gray-600 mt-1">Anda wajib membuat Sertifikat Digital (Passphrase) terlebih dahulu sebelum dapat menyetujui dokumen resmi.</p>
                      <div className="mt-2 bg-yellow-100/50 p-2.5 rounded-lg border border-yellow-200">
                        <p className="text-[11px] font-semibold text-yellow-800 mb-1">Ketentuan Passphrase:</p>
                        <ul className="text-[11px] text-yellow-700 list-disc list-inside space-y-0.5 ml-1">
                          <li>Minimal 8 karakter</li>
                          <li>Kombinasi huruf besar (A-Z) dan kecil (a-z)</li>
                          <li>Mengandung minimal 1 angka (0-9)</li>
                          <li>Mengandung minimal 1 simbol (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="Buat Passphrase Baru"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#130962]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#130962]"
                      >
                        {showPass ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    {errorPassphraseRealtime && <p className="text-red-500 text-xs mt-1">{errorPassphraseRealtime}</p>}

                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={passphraseConfirm}
                        onChange={(e) => setPassphraseConfirm(e.target.value)}
                        placeholder="Konfirmasi Passphrase"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#130962]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#130962]"
                      >
                        {showConfirm ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  
                    {errorSubmit && <p className="text-red-500 text-xs font-medium">{errorSubmit}</p>}
                    <button
                      onClick={handleGenerateKey}
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-[#130962] text-white font-bold rounded-lg hover:bg-[#1a237e] transition-colors text-sm disabled:opacity-50 mt-2"
                    >
                      {isSubmitting ? "MEMPROSES..." : "AKTIFKAN KUNCI SEKARANG"}
                    </button>
                  </div>
                </div>
              )}

              {/* Skenario 2: Sudah Punya Kunci, Belum Berhasil Kirim */}
              {hasKey === true && !submitted && !ticket?.tanggapan && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-[#130962] mb-1">Pesan Balasan Resmi</p>
                    <textarea
                      value={pesan}
                      onChange={(e) => { setPesan(e.target.value); setErrorSubmit(""); }}
                      placeholder="Tulis tanggapan Anda untuk mahasiswa..."
                      rows={4}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#130962] resize-none"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#130962] mb-2">Upload Dokumen Balasan (Opsional):</p>
                    <div onClick={() => fileRef.current.click()} className="border border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 hover:border-[#130962] transition-all">
                      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setUploadedFile(e.target.files[0])} />
                      {uploadedFile ? (
                        <>
                          <span className="text-2xl">📄</span>
                          <span className="text-sm font-medium text-[#130962]">{uploadedFile.name}</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-[#130962]">Unggah Dokumen (Klik Disini)</span>
                      )}
                    </div>
                  </div>

                  {/* INPUT PASSPHRASE SEBELUM KIRIM */}
                  <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-sm font-semibold text-[#130962] mb-1 flex items-center gap-2"><span>🔒</span> Passphrase Keamanan</p>
                    <p className="text-xs text-gray-500 mb-3">Masukkan passphrase Anda untuk menempelkan Tanda Tangan Digital pada balasan ini.</p>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => { setPassphrase(e.target.value); setErrorSubmit(""); }}
                        placeholder="Masukkan Passphrase Anda"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-[#130962]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#130962]"
                      >
                        {showPass ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  {errorSubmit && <p className="text-red-500 text-xs text-center font-medium">{errorSubmit}</p>}

                  <button 
                    onClick={handleKirim} 
                    disabled={isSubmitting} 
                    className="w-full mt-2 py-3 bg-[#ffe030] text-[#130962] font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? "MEMPROSES SIGNATURE..." : "KIRIM TANGGAPAN"}
                  </button>
                </>
              )}

              {/* Jika tiket sudah memiliki tanggapan, tampilkan detail & checksum */}
              {ticket && ticket.tanggapan ? (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-sm font-semibold text-[#130962]">Tanggapan Tersimpan</p>
                  <p className="text-xs text-gray-600 mt-1">Direspon oleh: <span className="font-medium text-[#130962]">{ticket.tanggapan.email_staff}</span></p>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-[#130962]">Pesan:</p>
                    <p className="text-sm text-gray-700 mt-1">{ticket.tanggapan.pesan}</p>
                  </div>
                  {ticket.tanggapan.file_output && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-[#130962]">File Balasan:</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm text-gray-700 break-all">{getFileName(ticket.tanggapan.file_output)}</span>
                        <button
                          onClick={() => handleFileAction("response", "preview", ticket.tanggapan.file_output)}
                          className="text-[11px] bg-white border border-blue-500 text-blue-600 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleFileAction("response", "download", ticket.tanggapan.file_output)}
                          className="text-[11px] bg-[#130962] text-white font-semibold px-3 py-1 rounded-lg hover:bg-[#0f185f] transition"
                        >
                          Unduh
                        </button>
                      </div>
                    </div>
                  )}

                  {ticket.tanggapan.hash_lampiran && (
                    <div className="mt-4 border-t pt-3">
                      <p className="text-xs text-gray-500">SHA-256 Checksum</p>
                      <code className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono break-all">sha256:{ticket.tanggapan.hash_lampiran}</code>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={handleVerifikasi} disabled={verifyStatus === "loading"} className="px-3 py-1 bg-[#130962] text-white text-xs font-semibold rounded hover:opacity-90 disabled:bg-gray-400">
                          {verifyStatus === "loading" ? "Memverifikasi..." : "Verifikasi TTD Digital"}
                        </button>
                        {verifyStatus === "valid" && <span className="text-xs text-green-600 font-bold">✓ DOKUMEN ASLI</span>}
                        {verifyStatus === "invalid" && <span className="text-xs text-red-600 font-bold">❌ TERINDIKASI PALSU</span>}
                      </div>
                    </div>
                  )}
                </div>
              ) : submitted ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <p className="font-semibold text-[#16a34a] text-sm">Tanggapan & Digital Signature berhasil dikirim!</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Log Aktivitas */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="🕐" title="LOG AKTIVITAS" />
            <div className="p-5 flex flex-col gap-3">
              {logItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0 mt-1`} />
                  <div>
                    <span className="text-xs text-gray-400 mr-2">{item.time}</span>
                    <span className="text-xs text-[#130962]">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>

      {showProfil && <ModalProfilMahasiswa mahasiswa={mahasiswa} onClose={() => setShowProfil(false)} />}
      {showSurat && <ModalPreviewSurat mahasiswa={mahasiswa} onClose={() => setShowSurat(false)} />}
    </main>
  );
};

export default DetailTiketStaff;