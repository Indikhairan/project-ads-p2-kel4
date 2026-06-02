import React, { useState, useRef } from "react";
import { API_BASE_URL } from "../api";

const KATEGORI_OPTIONS = ["Persuratan", "Informasi"];

const JENIS_SURAT_OPTIONS = [
  "Surat Keterangan Mahasiswa Aktif",
  "Surat Izin Akademik",
  "Surat Perubahan KRS",
  "Surat Rekomendasi Beasiswa",
  "Permohonan Surat Magang",
];

const ALASAN_IZIN_OPTIONS = ["Sakit", "Kemalangan", "Seleksi", "Lomba", "Ibadah"];

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────
function getAuthToken() {
  try {
    const t = localStorage.getItem("sapa_ipb_token");
    if (t) return t;
  } catch (_) {}

  try {
    const t = sessionStorage.getItem("sapa_ipb_token");
    if (t) return t;
  } catch (_) {}

  return null;
}

// ─── Modals ──────────────────────────────────────────────────────────
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
      <button onClick={onClose} className="w-full py-2.5 bg-[#130962] text-white font-semibold rounded-xl hover:bg-[#1a237e] transition-colors text-sm">
        Kembali ke Beranda
      </button>
    </div>
  </div>
);

const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shrink-0">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="font-bold text-[#130962] text-xl mb-2">Data Belum Lengkap / Terjadi Error</h3>
      <div className="text-gray-500 text-xs text-left bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto w-full mb-6 font-mono break-all whitespace-pre-wrap">
        {typeof message === "object" ? JSON.stringify(message, null, 2) : (message || "Terjadi kesalahan pada sistem.")}
      </div>
      <button onClick={onClose} className="w-full py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors text-sm">
        Tutup
      </button>
    </div>
  </div>
);

// ─── UploadBox ────────────────────────────────────────────────────────
const UploadBox = ({ label, fileObj, onFileChange }) => {
  const inputRef = useRef();
  const fileName = fileObj?.name || "";

  return (
    <div className="flex-1">
      {label && <p className="text-xs font-semibold text-[#130962] mb-1">{label}</p>}
      <div
        onClick={() => inputRef.current.click()}
        className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 hover:border-[#130962] transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files[0] || null;
            onFileChange(selectedFile);
          }}
        />
        {fileName ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-xs text-[#130962] font-medium text-center break-all px-2">{fileName}</span>
            <span className="text-[10px] text-green-500">File terpilih</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
            <span className="text-xs font-semibold text-[#130962]">Unggah Dokumen</span>
            <span className="text-[10px] text-gray-400">PDF atau JPG (Maks. 5 MB)</span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── PersyaratanDinamis ───────────────────────────────────────────────
const PersyaratanDinamis = ({ jenisSurat, data, onChange, submitted }) => {
  const isTextError = (key) => submitted && !String(data[key] || "").trim();

  const inputClass = (key) =>
    `flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors ${
      isTextError(key) ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-[#130962]"
    }`;

  const fieldRow = (label, key) => (
    <div key={key} className="flex items-center gap-4">
      <span className="w-36 font-medium text-[#130962] text-sm shrink-0">{label}</span>
      <input
        type="text"
        value={String(data[key] || "")}
        onChange={(e) => onChange(key, e.target.value)}
        className={inputClass(key)}
      />
    </div>
  );

  const commonFields = () => (
    <>
      {fieldRow("Nama", "nama")}
      {fieldRow("NIM", "nim")}
    </>
  );

  const prodiFields = () => (
    <>
      {fieldRow("Program Studi", "prodi")}
      {fieldRow("Departemen", "departemen")}
      {fieldRow("Fakultas", "fakultas")}
    </>
  );

  if (jenisSurat === "Surat Keterangan Mahasiswa Aktif") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {fieldRow("TTL", "ttl")}
        {fieldRow("Alamat", "alamat")}
        {prodiFields()}
        {fieldRow("Keperluan Surat", "keperluan")}

        <div className="flex items-center gap-4">
          <span className="w-36 font-medium text-[#130962] text-sm shrink-0">Surat dalam</span>
          <div className="flex gap-2">
            {["Bahasa Indonesia", "Bahasa Inggris"].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onChange("bahasaSurat", b)}
                className={`px-4 py-1.5 border rounded-lg text-sm transition-colors ${
                  data.bahasaSurat === b ? "border-[#130962] bg-[#130962] text-white" : "border-gray-300 text-gray-500 hover:border-[#130962]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" fileObj={data.ktmFile} onFileChange={(f) => onChange("ktmFile", f)} />
          <UploadBox label="Bukti Pembayaran UKT" fileObj={data.uktFile} onFileChange={(f) => onChange("uktFile", f)} />
        </div>
        {submitted && (!data.ktmFile || !data.uktFile) && (
          <p className="text-red-400 text-xs">KTM dan Bukti UKT wajib diunggah.</p>
        )}
      </div>
    );
  }

  if (jenisSurat === "Surat Izin Akademik") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {prodiFields()}

        <div className="flex items-center gap-4">
          <span className="w-36 font-medium text-[#130962] text-sm shrink-0">Alasan Izin</span>
          <div className="relative flex-1">
            <select
              value={data.alasanIzin || ""}
              onChange={(e) => onChange("alasanIzin", e.target.value)}
              className={`w-full border rounded-lg px-3 py-1.5 text-sm appearance-none focus:outline-none bg-white ${
                submitted && !data.alasanIzin ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
              }`}
            >
              <option value="">Pilih alasan izin</option>
              {ALASAN_IZIN_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown /></span>
          </div>
        </div>

        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" fileObj={data.ktmFile} onFileChange={(f) => onChange("ktmFile", f)} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form Surat Izin Kuliah{" "}
              <a href="https://ipb.link/form-izinkuliah-dpku" target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" fileObj={data.lampiranFile} onFileChange={(f) => onChange("lampiranFile", f)} />
          </div>
        </div>
        {submitted && (!data.ktmFile || !data.lampiranFile) && (
          <p className="text-red-400 text-xs">KTM dan Form Izin wajib diunggah.</p>
        )}
      </div>
    );
  }

  if (["Surat Perubahan KRS", "Surat Rekomendasi Beasiswa"].includes(jenisSurat)) {
    const downloadLink =
      jenisSurat === "Surat Perubahan KRS"
        ? "https://docs.google.com/document/d/1p6NMlnIoZqMay-KPMiDsAvQ0aV7KtSjh/edit"
        : "https://ipb.link/rekomendasi-beasiswa";

    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {prodiFields()}
        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" fileObj={data.ktmFile} onFileChange={(f) => onChange("ktmFile", f)} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form {jenisSurat}{" "}
              <a href={downloadLink} target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" fileObj={data.lampiranFile} onFileChange={(f) => onChange("lampiranFile", f)} />
          </div>
        </div>
        {submitted && (!data.ktmFile || !data.lampiranFile) && (
          <p className="text-red-400 text-xs">KTM dan Form wajib diunggah.</p>
        )}
      </div>
    );
  }

  if (jenisSurat === "Permohonan Surat Magang") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {prodiFields()}
        {fieldRow("Instansi Magang", "instansi")}
        {fieldRow("Tanggal Pelaksanaan", "tanggalMagang")}
        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" fileObj={data.ktmFile} onFileChange={(f) => onChange("ktmFile", f)} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form Persetujuan Dosen Pembimbing{" "}
              <a href="https://drive.google.com/open?id=1SdncrIgrRpdI08FJhvfdCmwS4P5jODQr" target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" fileObj={data.lampiranFile} onFileChange={(f) => onChange("lampiranFile", f)} />
          </div>
        </div>
        {submitted && (!data.ktmFile || !data.lampiranFile) && (
          <p className="text-red-400 text-xs">KTM dan Form Persetujuan wajib diunggah.</p>
        )}
      </div>
    );
  }

  return null;
};

// ─── FormPengajuanTiket ───────────────────────────────────────────────
export const FormPengajuanTiket = ({ onClose, authToken: propToken }) => {
  const [subjek, setSubjek] = useState("");
  const [kategori, setKategori] = useState("");
  const [jenisSurat, setJenisSurat] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [persyaratan, setPersyaratan] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePersyaratan = (key, value) => {
    setPersyaratan((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Validasi Client-side ───────────────────────────────────────────
  const validate = () => {
    if (!subjek.trim()) return "Subjek tiket wajib diisi.";
    if (!kategori) return "Kategori Layanan wajib dipilih.";

    if (kategori === "Persuratan") {
      if (!jenisSurat) return "Jenis Surat wajib dipilih.";

      const isFieldEmpty = (key) => {
        const v = persyaratan[key];
        if (v instanceof File) return false;
        return !String(v || "").trim();
      };

      const textRequired = ["nama", "nim", "prodi", "departemen", "fakultas"];

      if (jenisSurat === "Surat Keterangan Mahasiswa Aktif") {
        const allText = [...textRequired, "ttl", "alamat", "keperluan", "bahasaSurat"];
        if (allText.some(isFieldEmpty)) return "Semua field teks wajib diisi.";
        if (!persyaratan.ktmFile || !persyaratan.uktFile) return "File KTM dan Bukti UKT wajib diunggah.";
      }

      if (jenisSurat === "Surat Izin Akademik") {
        if (textRequired.some(isFieldEmpty)) return "Semua field teks wajib diisi.";
        if (!persyaratan.alasanIzin) return "Alasan izin wajib dipilih.";
        if (!persyaratan.ktmFile || !persyaratan.lampiranFile) return "File KTM dan Form Izin wajib diunggah.";
      }

      if (["Surat Perubahan KRS", "Surat Rekomendasi Beasiswa"].includes(jenisSurat)) {
        if (textRequired.some(isFieldEmpty)) return "Semua field teks wajib diisi.";
        if (!persyaratan.ktmFile || !persyaratan.lampiranFile) return "File KTM dan Form wajib diunggah.";
      }

      if (jenisSurat === "Permohonan Surat Magang") {
        const magang = [...textRequired, "instansi", "tanggalMagang"];
        if (magang.some(isFieldEmpty)) return "Semua field teks wajib diisi.";
        if (!persyaratan.ktmFile || !persyaratan.lampiranFile) return "File KTM dan Form Persetujuan wajib diunggah.";
      }
    }

    return null;
  };

  // ─── Submit Data ────────────────────────────────────────────────────
// ─── Submit Data ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitted(true);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const token = propToken || getAuthToken();
    if (!token) {
      setErrorMsg("Silakan login terlebih dahulu sebelum mengajukan tiket.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();

      // 1. Setup data dasar tiket wajib untuk semua kategori
      formData.append("id_layanan", kategori === "Persuratan" ? "LYN-SURAT" : "LYN-INFO");
      formData.append("kategori", kategori === "Informasi" ? "Layanan" : kategori);
      formData.append("subjek", subjek.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("semester", ""); // Optional field

      // 2. KONDISIONAL: Menyusun data_request dan data mahasiswa
      if (kategori === "Persuratan") {
        const dataRequest = {
          jenis_surat: jenisSurat,
          nama: persyaratan.nama || undefined,
          ttl: persyaratan.ttl || undefined,
          alamat: persyaratan.alamat || undefined,
          prodi: persyaratan.prodi || undefined,
          departemen: persyaratan.departemen || undefined,
          fakultas: persyaratan.fakultas || undefined,
          keperluan: persyaratan.keperluan || undefined,
          bahasa_surat: persyaratan.bahasaSurat || undefined,
          alasan_izin: persyaratan.alasanIzin || undefined,
          instansi: persyaratan.instansi || undefined,
          tanggal_magang: persyaratan.tanggalMagang || undefined,
        };

        // Kirim objek dinamis sebagai String JSON sesuai kesepakatan Solusi B
        formData.append("data_request", JSON.stringify(dataRequest));
        
        // Kirim data mahasiswa pendukung ke root form data
        formData.append("nim", persyaratan.nim?.trim() || "");
        formData.append("program_studi", persyaratan.prodi?.trim() || "");
        formData.append("departemen", persyaratan.departemen?.trim() || "");
        formData.append("fakultas", persyaratan.fakultas?.trim() || "");
        formData.append("alamat", persyaratan.alamat?.trim() || ""); 

        // Lampirkan file khusus persuratan
        if (persyaratan.ktmFile instanceof File) {
          formData.append("ktm_file", persyaratan.ktmFile, persyaratan.ktmFile.name);
        }
        if (persyaratan.uktFile instanceof File) {
          formData.append("ukt_file", persyaratan.uktFile, persyaratan.uktFile.name);
        }
        if (persyaratan.lampiranFile instanceof File) {
          formData.append("lampiran_file", persyaratan.lampiranFile, persyaratan.lampiranFile.name);
        }
      } else {
        // AMAN: Jika kategorinya "Informasi", isi data_request dengan json kosongan "{}" 
        // agar FastAPI di backend tidak melempar error "data_request: Field required"
        formData.append("data_request", JSON.stringify({}));
        formData.append("nim", "");
        formData.append("program_studi", "");
        formData.append("departemen", "");
        formData.append("fakultas", "");
        formData.append("alamat", "");  // 🔐 Empty for Informasi kategori
      }

      // 3. Lampirkan file umum untuk kategori Informasi
      if (kategori === "Informasi" && uploadFile instanceof File) {
        formData.append("file_lampiran", uploadFile, uploadFile.name);
      }

      // 4. Eksekusi Tembak API
      const response = await fetch(`${API_BASE_URL}/api/v1/tiket/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // CATATAN: Jangan tambahkan Content-Type application/json di sini! 
          // Browser akan otomatis mengaturnya menjadi multipart/form-data karena ada file.
        },
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errorData = await response.json();
          if (Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map((e) => `${e.loc?.join(" → ")}: ${e.msg}`).join("\n");
            setErrorMsg(messages);
          } else {
            setErrorMsg(errorData.detail || `Error ${response.status}: Gagal mengajukan tiket.`);
          }
        } else {
          const text = await response.text().catch(() => "");
          setErrorMsg(`Server Error (${response.status}): ${text || "Periksa kesesuaian endpoint."}`);
        }
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      console.error("Network error:", err);
      setErrorMsg(`Error: ${err.message}`);
    } finally {
      window.scrollTo(0, 0);
      setIsSubmitting(false);
    }
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
                placeholder="Contoh: Pertanyaan seputar herregistrasi"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  submitted && !subjek.trim() ? "border-red-400" : "border-gray-300 focus:border-[#130962] focus:ring-1 focus:ring-[#130962]"
                }`}
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
                  onChange={(e) => {
                    setKategori(e.target.value);
                    setJenisSurat("");
                    setPersyaratan({});
                    setUploadFile(null);
                    setSubmitted(false);
                  }}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none bg-white ${
                    submitted && !kategori ? "border-red-400" : "border-gray-300 focus:border-[#130962] focus:ring-1 focus:ring-[#130962]"
                  } ${kategori ? "text-gray-800" : "text-gray-400"}`}
                >
                  <option value="">Pilih Kategori Layanan</option>
                  {KATEGORI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><ChevronDown /></span>
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
                    onChange={(e) => {
                      setJenisSurat(e.target.value);
                      setPersyaratan({});
                      setSubmitted(false);
                    }}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none bg-white ${
                      submitted && !jenisSurat ? "border-red-400" : "border-gray-300 focus:border-[#130962] focus:ring-1 focus:ring-[#130962]"
                    } ${jenisSurat ? "text-gray-800" : "text-gray-400"}`}
                  >
                    <option value="">Pilih Jenis Surat</option>
                    {JENIS_SURAT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><ChevronDown /></span>
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
                rows={4}
                placeholder="Tuliskan keperluan atau keterangan tambahan di sini..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#130962] focus:ring-1 focus:ring-[#130962] resize-none"
              />
            </div>

            {/* Persyaratan dinamis per jenis surat */}
            {kategori === "Persuratan" && jenisSurat && (
              <div>
                <label className="block font-bold text-[#130962] text-sm mb-2">
                  Persyaratan: <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <PersyaratanDinamis
                    jenisSurat={jenisSurat}
                    data={persyaratan}
                    onChange={handlePersyaratan}
                    submitted={submitted}
                  />
                </div>
                <p className="text-red-500 text-xs italic mt-2">*Persyaratan wajib diisi</p>
              </div>
            )}

            {/* Upload umum untuk Kategori Informasi */}
            {kategori === "Informasi" && (
              <UploadBox
                label="Unggah Berkas Pendukung (Opsional)"
                fileObj={uploadFile}
                onFileChange={setUploadFile}
              />
            )}

            {/* Tombol Aksi */}
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
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#ffe030] text-[#130962] font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Mengirim Tiket..." : "Submit Tiket"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />}
      {showSuccess && <SuccessModal onClose={() => { setShowSuccess(false); onClose(); }} />}
    </>
  );
};

export default FormPengajuanTiket;