import React, { useState, useRef } from "react";

const KATEGORI_OPTIONS = ["Persuratan", "Informasi", "Lainnya"];
const JENIS_SURAT_OPTIONS = [
  "Surat Keterangan Mahasiswa Aktif",
  "Surat Izin Akademik",
  "Surat Perubahan KRS",
  "Surat Rekomendasi Beasiswa",
  "Permohonan Surat Magang"
];

// Komponen dropdown arrow SVG
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Pop up sukses
const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="font-bold text-[#130962] text-xl mb-2">Tiket Berhasil Diajukan!</h3>
      <p className="text-gray-400 text-sm mb-6">Tiket Anda telah berhasil dikirim. Kami akan segera memproses permohonan Anda.</p>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-[#130962] text-white font-semibold rounded-xl hover:bg-[#1a237e] transition-colors text-sm"
      >
        Kembali ke Beranda
      </button>
    </div>
  </div>
);

// Pop up error validasi
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="font-bold text-[#130962] text-xl mb-2">Data Belum Lengkap</h3>
      <p className="text-gray-400 text-sm mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors text-sm"
      >
        Isi Data Dulu
      </button>
    </div>
  </div>
);

// Komponen upload file
const UploadBox = ({ label, file, onFileChange }) => {
  const inputRef = useRef();
  return (
    <div className="flex-1">
      {label && <p className="text-xs font-semibold text-[#130962] mb-1">{label}</p>}
      <div
        onClick={() => inputRef.current.click()}
        className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 hover:border-[#130962] transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files[0])}
        />
        {file ? (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-xs text-[#130962] font-medium text-center break-all px-2">{file.name}</span>
            <span className="text-[10px] text-green-500">File terpilih</span>
          </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <span className="text-xs font-semibold text-[#130962]">Unggah Dokumen Pendukung</span>
            <span className="text-[10px] text-gray-400">Hanya format PDF atau JPG (Maksimal 5 MB)</span>
          </>
        )}
      </div>
    </div>
  );
};

// Field persyaratan untuk kategori Persuratan
const PersyaratanPersuratan = ({ data, onChange, bahasaSurat, onBahasa, ktmFile, onKtm, uktFile, onUkt }) => (
  <div className="mt-2">
    <label className="block font-bold text-[#130962] text-sm mb-2">
      Persyaratan: <span className="text-red-500">*</span>
    </label>
    <div className="border-2 border-red-400 rounded-xl p-4 flex flex-col gap-3">
      {[
        { key: "nama", label: "Nama" },
        { key: "nim", label: "NIM" },
        { key: "ttl", label: "TTL" },
        { key: "alamat", label: "Alamat" },
        { key: "prodi", label: "Program Studi" },
        { key: "departemen", label: "Departemen" },
        { key: "fakultas", label: "Fakultas" },
        { key: "semester", label: "Semester" },
        { key: "keperluan", label: "Keperluan Surat" },
      ].map(({ key, label }) => (
        <div key={key} className="flex items-center gap-4">
          <span className="w-36 font-medium text-[#130962] text-sm shrink-0">{label}</span>
          <input
            type="text"
            value={data[key] || ""}
            onChange={(e) => onChange(key, e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#130962]"
          />
        </div>
      ))}

      {/* Bahasa surat */}
      <div className="flex items-center gap-4">
        <span className="w-36 font-medium text-[#130962] text-sm shrink-0">Surat dalam</span>
        <div className="flex gap-2">
          {["Bahasa Indonesia", "Bahasa Inggris"].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onBahasa(b)}
              className={`px-4 py-1.5 border rounded-lg text-sm transition-colors ${
                bahasaSurat === b
                  ? "border-[#130962] bg-[#130962] text-white"
                  : "border-gray-300 text-gray-500 hover:border-[#130962]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Upload KTM dan UKT */}
      <div className="flex gap-4 mt-2">
        <UploadBox label="KTM" file={ktmFile} onFileChange={onKtm} />
        <UploadBox label="Bukti Pembayaran UKT Semester berjalan" file={uktFile} onFileChange={onUkt} />
      </div>
    </div>
    <p className="text-red-500 text-xs italic mt-2">*Persyaratan wajib diisi</p>
  </div>
);

export const FormPengajuanTiket = ({ onClose }) => {
  const [subjek, setSubjek] = useState("");
  const [kategori, setKategori] = useState("");
  const [jenisSurat, setJenisSurat] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [persyaratan, setPersyaratan] = useState({});
  const [bahasaSurat, setBahasaSurat] = useState("");
  const [ktmFile, setKtmFile] = useState(null);
  const [uktFile, setUktFile] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePersyaratan = (key, value) => {
    setPersyaratan((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Validasi field wajib
    if (!subjek.trim()) {
      setErrorMsg("Subjek tiket wajib diisi.");
      return;
    }
    if (!kategori) {
      setErrorMsg("Kategori Layanan wajib dipilih.");
      return;
    }
    if (kategori === "Persuratan") {
      if (!jenisSurat) {
        setErrorMsg("Jenis Surat wajib dipilih.");
        return;
      }
      const requiredFields = ["nama", "nim", "ttl", "alamat", "prodi", "departemen", "fakultas", "semester", "keperluan"];
      const emptyField = requiredFields.find((f) => !persyaratan[f]?.trim());
      if (emptyField) {
        setErrorMsg("Semua field Persyaratan wajib diisi.");
        return;
      }
      if (!bahasaSurat) {
        setErrorMsg("Pilih bahasa surat terlebih dahulu.");
        return;
      }
      if (!ktmFile || !uktFile) {
        setErrorMsg("KTM dan Bukti Pembayaran UKT wajib diunggah.");
        return;
      }
    }
    // Semua valid
    setShowSuccess(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto">
        <div className="w-full max-w-[680px] bg-white rounded-2xl border-2 border-[#130962] shadow-2xl p-8 my-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <button onClick={onClose} className="text-[#130962] hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h2 className="font-bold text-[#130962] text-xl">Form Pengajuan Tiket</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Subjek */}
            <div>
              <label className="block font-bold text-[#130962] text-sm mb-1.5">
                Subjek: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#130962] focus:ring-1 focus:ring-[#130962]"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block font-bold text-[#130962] text-sm mb-1.5">
                Kategori Layanan: <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={kategori}
                  onChange={(e) => { setKategori(e.target.value); setJenisSurat(""); }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-[#130962] focus:ring-1 focus:ring-[#130962] bg-white text-gray-600"
                >
                  <option value="">Pilih Kategori Layanan</option>
                  {KATEGORI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ChevronDown />
                </span>
              </div>
            </div>

            {/* Jenis Surat */}
            {kategori === "Persuratan" && (
              <div>
                <label className="block font-bold text-[#130962] text-sm mb-1.5">
                  Jenis Surat: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={jenisSurat}
                    onChange={(e) => setJenisSurat(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-[#130962] focus:ring-1 focus:ring-[#130962] bg-white text-gray-600"
                  >
                    <option value="">Pilih Jenis Surat</option>
                    {JENIS_SURAT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown />
                  </span>
                </div>
              </div>
            )}

            {/* Deskripsi */}
            <div>
              <label className="block font-bold text-[#130962] text-sm mb-1.5">
                Deskripsi Keperluan:
              </label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={5}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#130962] focus:ring-1 focus:ring-[#130962] resize-none"
              />
            </div>

            {/* Persyaratan khusus Persuratan */}
            {kategori === "Persuratan" && (
              <PersyaratanPersuratan
                data={persyaratan}
                onChange={handlePersyaratan}
                bahasaSurat={bahasaSurat}
                onBahasa={setBahasaSurat}
                ktmFile={ktmFile}
                onKtm={setKtmFile}
                uktFile={uktFile}
                onUkt={setUktFile}
              />
            )}

            {/* Upload umum - bukan Persuratan */}
            {kategori !== "Persuratan" && (
              <UploadBox file={uploadFile} onFileChange={setUploadFile} />
            )}

            {/* Tombol */}
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-200 text-[#130962] font-bold rounded-xl hover:bg-gray-300 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-3 bg-[#ffe030] text-[#130962] font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm"
              >
                Submit Tiket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pop up error */}
      {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />}

      {/* Pop up sukses */}
      {showSuccess && (
        <SuccessModal onClose={() => { setShowSuccess(false); onClose(); }} />
      )}
    </>
  );
};

export default FormPengajuanTiket;