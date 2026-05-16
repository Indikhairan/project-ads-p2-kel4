import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationStaff } from "../components/TopNavigationStaff";

const initialArticles = [
  { id: 1, judul: "Cara Mengajukan Surat Keterangan Aktif", kategori: "Persuratan", updatedAt: "15 April 2026", konten: "Untuk mengajukan surat keterangan aktif, mahasiswa perlu mengisi form di menu Buat Tiket, pilih kategori Persuratan, lalu pilih jenis surat yang dibutuhkan. Lengkapi semua persyaratan yang diminta dan klik Submit Tiket." },
  { id: 2, judul: "Syarat dan Prosedur Transkip Nilai", kategori: "Akademik", updatedAt: "12 April 2026", konten: "Syarat pengajuan transkip nilai meliputi: KTM aktif, bukti pembayaran UKT semester berjalan, dan surat permohonan. Proses pengajuan dilakukan melalui menu Buat Tiket dengan kategori Persuratan." },
  { id: 3, judul: "Panduan Surat Izin Penelitian", kategori: "Persuratan", updatedAt: "10 April 2026", konten: "Panduan lengkap pengajuan surat izin penelitian untuk keperluan skripsi dan tesis. Mahasiswa wajib melampirkan proposal penelitian dan surat pengantar dari dosen pembimbing." },
  { id: 4, judul: "FAQ Layanan Akademik Mahasiswa", kategori: "Umum", updatedAt: "8 April 2026", konten: "Pertanyaan yang sering diajukan seputar layanan akademik IPB. Mencakup prosedur pengajuan surat, cuti akademik, dan berbagai layanan administrasi lainnya." },
];

const KATEGORI_OPTIONS = ["Persuratan", "Akademik", "Umum", "Informasi", "Lainnya"];

const kategoriColor = (k) => {
  if (k === "Persuratan") return "bg-orange-100 text-orange-600";
  if (k === "Akademik") return "bg-blue-100 text-blue-600";
  if (k === "Umum") return "bg-green-100 text-green-600";
  if (k === "Informasi") return "bg-purple-100 text-purple-600";
  return "bg-gray-100 text-gray-500";
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
      <h3 className="font-bold text-[#130962] text-base mb-2">Hapus Artikel?</h3>
      <p className="text-gray-400 text-sm mb-6">
        Artikel <span className="font-semibold text-[#130962]">"{artikel.judul}"</span> akan dihapus permanen.
      </p>
      <div className="flex gap-3 w-full">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          Batal
        </button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors">
          Hapus
        </button>
      </div>
    </div>
  </div>
);

// Form tambah/edit artikel
const FormArtikel = ({ editTarget, onSimpan, onBatal }) => {
  const [formJudul, setFormJudul] = useState(editTarget?.judul || "");
  const [formKategori, setFormKategori] = useState(editTarget?.kategori || "");
  const [formKonten, setFormKonten] = useState(editTarget?.konten || "");
  const [formError, setFormError] = useState("");

  const handleSimpan = () => {
    if (!formJudul.trim()) { setFormError("Judul artikel wajib diisi."); return; }
    if (!formKonten.trim()) { setFormError("Isi artikel/jawaban tidak boleh kosong!"); return; }
    onSimpan({ judul: formJudul, kategori: formKategori || "Umum", konten: formKonten });
  };

  return (
    <div className="border-t border-gray-100 mt-3 pt-4 flex flex-col gap-3">
      <div>
        <label className="block text-xs font-semibold text-[#130962] mb-1">Judul Artikel:</label>
        <input
          type="text"
          value={formJudul}
          onChange={(e) => { setFormJudul(e.target.value); setFormError(""); }}
          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors ${
            formError && !formJudul.trim() ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
          }`}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#130962] mb-1">Kategori:</label>
        <div className="relative">
          <select
            value={formKategori}
            onChange={(e) => setFormKategori(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[#130962] bg-white text-[#130962]"
          >
            <option value="">Pilih Kategori</option>
            {KATEGORI_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#130962] mb-1">Konten Artikel:</label>
        <textarea
          value={formKonten}
          onChange={(e) => { setFormKonten(e.target.value); setFormError(""); }}
          rows={4}
          placeholder="Tulis isi artikel atau jawaban untuk chatbot..."
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none transition-colors ${
            formError && !formKonten.trim() ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
          }`}
        />
        {formError && <p className="text-red-500 text-xs mt-1">{formError}</p>}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBatal}
          className="flex-1 py-2 bg-gray-200 text-[#130962] font-semibold rounded-xl text-sm hover:bg-gray-300 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSimpan}
          className="flex-1 py-2 bg-[#ffe030] text-[#130962] font-bold rounded-xl text-sm hover:bg-yellow-400 transition-colors"
        >
          Simpan Artikel
        </button>
      </div>
    </div>
  );
};

// Card artikel dengan expand detail dan form edit inline
const ArtikelCard = ({ artikel, onEdit, onHapus }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    setExpanded(true);
    setIsEditing(true);
  };

  const handleHapus = (e) => {
    e.stopPropagation();
    onHapus(artikel);
  };

  const handleSimpan = (data) => {
    onEdit(artikel.id, data);
    setIsEditing(false);
  };

  const handleBatal = () => {
    setIsEditing(false);
    setExpanded(false);
  };

  return (
    <div className={`border rounded-xl transition-all ${
      expanded ? "border-[#130962] bg-blue-50/40" : "border-gray-200 bg-white hover:bg-gray-50"
    }`}>
      {/* Header card - klik untuk expand */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer"
        onClick={() => { setExpanded((p) => !p); if (isEditing) setIsEditing(false); }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#130962] text-sm truncate">{artikel.judul}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kategoriColor(artikel.kategori)}`}>
              {artikel.kategori}
            </span>
            <span className="text-[11px] text-gray-400">Terakhir di-update: {artikel.updatedAt}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEdit}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                expanded ? "bg-gray-200 hover:bg-gray-300" : "bg-[#ffe030] hover:bg-yellow-400"
            }`}
            title="Edit"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={handleHapus}
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
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          {isEditing ? (
            <FormArtikel editTarget={artikel} onSimpan={handleSimpan} onBatal={handleBatal} />
          ) : (
            <div className="border-t border-gray-200 mt-1 pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Konten Artikel</p>
              <p className="text-sm text-[#130962] leading-relaxed">{artikel.konten}</p>
            </div>
          )}
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

  const handleTambah = (data) => {
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    setArticles((prev) => [{ id: Date.now(), ...data, updatedAt: today }, ...prev]);
    setShowTambahForm(false);
    showToast("Artikel berhasil ditambahkan!");
  };

  const handleEdit = (id, data) => {
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, ...data, updatedAt: today } : a));
    showToast("Artikel berhasil diperbarui!");
  };

  const confirmHapus = () => {
    setArticles((prev) => prev.filter((a) => a.id !== hapusTarget.id));
    setHapusTarget(null);
    showToast("Artikel berhasil dihapus.");
  };

  const filtered = articles.filter((a) =>
    a.judul.toLowerCase().includes(search.toLowerCase()) ||
    a.kategori.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationStaff />

      {toast && <SuccessToast message={toast} />}
      {hapusTarget && <ModalHapus artikel={hapusTarget} onConfirm={confirmHapus} onCancel={() => setHapusTarget(null)} />}

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
            + Tambah Artikel
          </button>
        </div>

        {/* Form tambah baru */}
        {showTambahForm && (
          <div className="bg-white rounded-xl shadow-sm border border-[#130962] p-5 mb-5">
            <p className="font-bold text-[#130962] text-base mb-3">Tambah Artikel Baru</p>
            <FormArtikel
              editTarget={null}
              onSimpan={handleTambah}
              onBatal={() => setShowTambahForm(false)}
            />
          </div>
        )}

        {/* Daftar Artikel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {/* Search */}
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
            Daftar Artikel ({filtered.length})
          </p>

          <div className="flex flex-col gap-2.5">
            {filtered.length === 0 ? (
              <p className="text-center italic text-gray-400 text-sm py-10">Artikel tidak ditemukan.</p>
            ) : (
              filtered.map((artikel) => (
                <ArtikelCard
                  key={artikel.id}
                  artikel={artikel}
                  onEdit={handleEdit}
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