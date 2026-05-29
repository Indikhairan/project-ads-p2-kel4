import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationStaff } from "../components/TopNavigationStaff";

const initialArticles = [
  { id: 1, judul: "Cara Mengajukan Surat Keterangan Aktif", kategori: "Persuratan", postedAt: "15 April 2026", konten: null, fileName: "panduan_surat_aktif.pdf", status: "approved" },
  { id: 2, judul: "Syarat dan Prosedur Transkip Nilai", kategori: "Akademik", postedAt: "12 April 2026", konten: null, fileName: "prosedur_transkip.pdf", status: "approved" },
  { id: 3, judul: "Panduan Surat Izin Penelitian", kategori: "Persuratan", postedAt: "10 April 2026", konten: null, fileName: "panduan_izin_penelitian.pdf", status: "pending" },
  { id: 4, judul: "FAQ Layanan Akademik Mahasiswa", kategori: "Umum", postedAt: "8 April 2026", konten: null, fileName: "faq_layanan.pdf", status: "pending" },
];

const KATEGORI_OPTIONS = ["Persuratan", "Akademik", "Umum", "Informasi"];

const kategoriColor = (k) => {
  if (k === "Persuratan") return "bg-orange-100 text-orange-600";
  if (k === "Akademik") return "bg-blue-100 text-blue-600";
  if (k === "Umum") return "bg-green-100 text-green-600";
  if (k === "Informasi") return "bg-purple-100 text-purple-600";
  return "bg-gray-100 text-gray-500";
};

const statusBadge = (status) => {
  if (status === "approved")
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">Aktif di Database AI</span>;
  if (status === "pending")
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">Menunggu Persetujuan</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500">Ditolak</span>;
};

const SuccessToast = ({ message }) => (
  <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3 flex items-center gap-3">
    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <span className="text-sm font-medium text-[#130962]">{message}</span>
  </div>
);

const ModalHapus = ({ artikel, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </div>
      <h3 className="font-bold text-[#130962] text-base mb-2">Hapus Knowledge Base?</h3>
      <p className="text-gray-400 text-sm mb-6">
        KB <span className="font-semibold text-[#130962]">"{artikel.judul}"</span> akan dihapus permanen.
      </p>
      <div className="flex gap-3 w-full">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors">Hapus</button>
      </div>
    </div>
  </div>
);

// Form ajukan KB baru
const FormAjukanKB = ({ onAjukan, onBatal }) => {
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("");
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = React.useRef();

  const isError = (val) => submitted && !val;

  const handleAjukan = () => {
    setSubmitted(true);
    if (!judul.trim() || !kategori || !file) return;
    onAjukan({ judul, kategori, file });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#130962] p-6 mb-5">
      <p className="font-bold text-[#130962] text-base mb-4">Ajukan Knowledge Base Baru</p>
      <div className="flex flex-col gap-4">

        {/* Judul */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Judul KB: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Masukkan judul knowledge base"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
              isError(judul.trim()) ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-[#130962]"
            }`}
          />
          {isError(judul.trim()) && <p className="text-red-500 text-xs mt-1">Judul KB wajib diisi.</p>}
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Kategori: <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none bg-white transition-colors ${
                isError(kategori) ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
              } ${kategori ? "text-[#130962]" : "text-gray-400"}`}
            >
              <option value="">Pilih Kategori</option>
              {KATEGORI_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
          {isError(kategori) && <p className="text-red-500 text-xs mt-1">Kategori wajib dipilih.</p>}
        </div>

        {/* Upload PDF */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Upload Dokumen PDF: <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => fileRef.current.click()}
            className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isError(file)
                ? "border-red-400 bg-red-50"
                : "border-gray-300 hover:border-[#130962] hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm font-semibold text-[#130962]">{file.name}</span>
                <span className="text-xs text-green-500">File terpilih</span>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
                <span className="text-sm font-semibold text-[#130962]">Klik untuk upload PDF</span>
                <span className="text-xs text-gray-400">Hanya format PDF (Maksimal 10 MB)</span>
              </>
            )}
          </div>
          {isError(file) && <p className="text-red-500 text-xs mt-1">Dokumen PDF wajib diunggah.</p>}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-blue-600 text-xs">
            KB yang diajukan akan masuk ke antrian persetujuan Admin sebelum aktif di database AI chatbot.
          </p>
        </div>

        {/* Tombol */}
        <div className="flex gap-3">
          <button
            onClick={onBatal}
            className="flex-1 py-2.5 bg-gray-200 text-[#130962] font-semibold rounded-xl text-sm hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleAjukan}
            className="flex-1 py-2.5 bg-[#ffe030] text-[#130962] font-bold rounded-xl text-sm hover:bg-yellow-400 transition-colors"
          >
            Ajukan KB
          </button>
        </div>
      </div>
    </div>
  );
};

// Card KB
const KBCard = ({ artikel, onHapus }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl transition-all ${
      expanded ? "border-[#130962] bg-blue-50/40" : "border-gray-200 bg-white hover:bg-gray-50"
    }`}>
      <div
        className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#130962] text-sm truncate">{artikel.judul}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kategoriColor(artikel.kategori)}`}>
              {artikel.kategori}
            </span>
            <span className="text-[11px] text-gray-400">Diterbitkan: {artikel.postedAt}</span>
            {statusBadge(artikel.status)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol hapus hanya muncul kalau belum masuk database (status pending/rejected) */}
          {artikel.status !== "approved" && (
            <button
              onClick={(e) => { e.stopPropagation(); onHapus(artikel); }}
              className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
              title="Hapus"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded - tampilkan nama file PDF */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-gray-200 mt-1 pt-3 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-sm text-[#130962] font-medium">{artikel.fileName}</span>
            <span className="text-[10px] bg-red-100 text-red-500 font-bold px-2 py-0.5 rounded">PDF</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const KnowledgeBasePage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState("");
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [hapusTarget, setHapusTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAjukan = ({ judul, kategori, file }) => {
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    setArticles((prev) => [
      { id: Date.now(), judul, kategori, postedAt: today, konten: null, fileName: file.name, status: "pending" },
      ...prev,
    ]);
    setShowTambahForm(false);
    showToast("KB berhasil diajukan! Menunggu persetujuan Admin.");
  };

  const confirmHapus = () => {
    setArticles((prev) => prev.filter((a) => a.id !== hapusTarget.id));
    setHapusTarget(null);
    showToast("Knowledge Base berhasil dihapus.");
  };

  const filtered = articles.filter((a) =>
    a.judul.toLowerCase().includes(search.toLowerCase()) ||
    a.kategori.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationStaff />

      {toast && <SuccessToast message={toast} />}
      {hapusTarget && (
        <ModalHapus artikel={hapusTarget} onConfirm={confirmHapus} onCancel={() => setHapusTarget(null)} />
      )}

      <div className="w-full max-w-[900px] mx-auto px-6 mt-8 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/staff/dashboard")} className="text-[#130962] hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="font-bold text-[#130962] text-xl">Kelola Knowledge Base</h1>
          </div>
          <button
            onClick={() => setShowTambahForm((p) => !p)}
            className={`flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-lg transition-colors ${
              showTambahForm
                ? "bg-gray-200 text-gray-500 cursor-default"
                : "bg-[#ffe030] text-[#130962] hover:bg-yellow-400"
            }`}
          >
            + Ajukan KB
          </button>
        </div>

        {/* Form ajukan */}
        {showTambahForm && (
          <FormAjukanKB
            onAjukan={handleAjukan}
            onBatal={() => setShowTambahForm(false)}
          />
        )}

        {/* Daftar KB */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2.5 gap-2 mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm focus:outline-none bg-transparent"
            />
          </div>

          <p className="text-[#130962] font-semibold text-sm mb-3">
            Daftar Knowledge Base ({filtered.length})
          </p>

          <div className="flex flex-col gap-2.5">
            {filtered.length === 0 ? (
              <p className="text-center italic text-gray-400 text-sm py-10">Knowledge Base tidak ditemukan.</p>
            ) : (
              filtered.map((artikel) => (
                <KBCard
                  key={artikel.id}
                  artikel={artikel}
                  onHapus={setHapusTarget}
                />
              ))
            )}
          </div>
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>
    </main>
  );
};

export default KnowledgeBasePage;