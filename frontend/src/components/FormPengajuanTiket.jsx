import React, { useState, useRef } from "react";

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
      <button onClick={onClose} className="w-full py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors text-sm">
        Isi Data Dulu
      </button>
    </div>
  </div>
);

const UploadBox = ({ label, file, onFileChange }) => {
  const inputRef = useRef();
  return (
    <div className="flex-1">
      {label && <p className="text-xs font-semibold text-[#130962] mb-1">{label}</p>}
      <div
        onClick={() => inputRef.current.click()}
        className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 hover:border-[#130962] transition-all"
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg" className="hidden" onChange={(e) => onFileChange(e.target.files[0])} />
        {file ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-xs text-[#130962] font-medium text-center break-all px-2">{file.name}</span>
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

// Field persyaratan berdasarkan jenis surat
const PersyaratanDinamis = ({ jenisSurat, data, onChange, submitted }) => {
  const [bahasaSurat, setBahasaSurat] = useState("");
  const [alasanIzin, setAlasanIzin] = useState("");
  const [ktmFile, setKtmFile] = useState(null);
  const [lampiranFile, setLampiranFile] = useState(null);
  const [uktFile, setUktFile] = useState(null);

  const isError = (key) => submitted && !data[key]?.trim();
  const inputClass = (key) =>
    `flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors ${
      isError(key) ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-[#130962]"
    }`;

  const fieldRow = (label, key) => (
    <div key={key} className="flex items-center gap-4">
      <span className="w-36 font-medium text-[#130962] text-sm shrink-0">{label}</span>
      <input
        type="text"
        value={data[key] || ""}
        onChange={(e) => onChange(key, e.target.value)}
        className={inputClass(key)}
      />
    </div>
  );

  // Field umum yang ada di semua jenis surat
  const commonFields = () => (
    <>
      {fieldRow("Nama", "nama")}
      {fieldRow("NIM", "nim")}
    </>
  );

  const prodiFields = () => (
    <>
      {fieldRow("Program Studi", "prodi")}
      {fieldRow("Fakultas/Sekolah", "fakultas")}
    </>
  );

  if (jenisSurat === "Surat Keterangan Mahasiswa Aktif") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {fieldRow("TTL", "ttl")}
        {fieldRow("Alamat", "alamat")}
        {fieldRow("Program Studi", "prodi")}
        {fieldRow("Departemen", "departemen")}
        {fieldRow("Fakultas/Sekolah", "fakultas")}
        {fieldRow("Keperluan Surat", "keperluan")}

        {/* Bahasa surat */}
        <div className="flex items-center gap-4">
          <span className="w-36 font-medium text-[#130962] text-sm shrink-0">Surat dalam</span>
          <div className="flex gap-2">
            {["Bahasa Indonesia", "Bahasa Inggris"].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => { setBahasaSurat(b); onChange("bahasaSurat", b); }}
                className={`px-4 py-1.5 border rounded-lg text-sm transition-colors ${
                  bahasaSurat === b ? "border-[#130962] bg-[#130962] text-white" : "border-gray-300 text-gray-500 hover:border-[#130962]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" file={ktmFile} onFileChange={(f) => { setKtmFile(f); onChange("ktmFile", f?.name || ""); }} />
          <UploadBox label="Bukti Pembayaran UKT Semester berjalan" file={uktFile} onFileChange={(f) => { setUktFile(f); onChange("uktFile", f?.name || ""); }} />
        </div>
      </div>
    );
  }

  if (jenisSurat === "Surat Izin Akademik") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {prodiFields()}

        {/* Alasan izin */}
        <div className="flex items-center gap-4">
          <span className="w-36 font-medium text-[#130962] text-sm shrink-0">Alasan Izin</span>
          <div className="relative flex-1">
            <select
              value={alasanIzin}
              onChange={(e) => { setAlasanIzin(e.target.value); onChange("alasanIzin", e.target.value); }}
              className={`w-full border rounded-lg px-3 py-1.5 text-sm appearance-none focus:outline-none bg-white ${
                submitted && !alasanIzin ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
              }`}
            >
              <option value="">Pilih alasan izin</option>
              {ALASAN_IZIN_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown /></span>
          </div>
        </div>

        {/* Upload */}
        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" file={ktmFile} onFileChange={(f) => { setKtmFile(f); onChange("ktmFile", f?.name || ""); }} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form Surat Izin Kuliah{" "}
              <a href="https://ipb.link/form-izinkuliah-dpku" target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" file={lampiranFile} onFileChange={(f) => { setLampiranFile(f); onChange("lampiranFile", f?.name || ""); }} />
          </div>
        </div>

        <p className="text-xs text-gray-400 italic">
          Lampiran pendukung: surat sakit dokter / surat kematian / surat keterangan panitia / surat keterangan ibadah (sesuai alasan)
        </p>
      </div>
    );
  }

  if (jenisSurat === "Surat Perubahan KRS") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {prodiFields()}
        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" file={ktmFile} onFileChange={(f) => { setKtmFile(f); onChange("ktmFile", f?.name || ""); }} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form Pembatalan Mata Kuliah{" "}
              <a href="https://docs.google.com/document/d/1p6NMlnIoZqMay-KPMiDsAvQ0aV7KtSjh/edit" target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" file={lampiranFile} onFileChange={(f) => { setLampiranFile(f); onChange("lampiranFile", f?.name || ""); }} />
          </div>
        </div>
      </div>
    );
  }

  if (jenisSurat === "Surat Rekomendasi Beasiswa") {
    return (
      <div className="flex flex-col gap-3">
        {commonFields()}
        {prodiFields()}
        <div className="flex gap-4 mt-1">
          <UploadBox label="KTM" file={ktmFile} onFileChange={(f) => { setKtmFile(f); onChange("ktmFile", f?.name || ""); }} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form Permohonan Rekomendasi Beasiswa{" "}
              <a href="https://ipb.link/rekomendasi-beasiswa" target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" file={lampiranFile} onFileChange={(f) => { setLampiranFile(f); onChange("lampiranFile", f?.name || ""); }} />
          </div>
        </div>
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
          <UploadBox label="KTM" file={ktmFile} onFileChange={(f) => { setKtmFile(f); onChange("ktmFile", f?.name || ""); }} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#130962] mb-1">
              Form Persetujuan Dosen Pembimbing{" "}
              <a href="https://drive.google.com/open?id=1SdncrIgrRpdI08FJhvfdCmwS4P5jODQr" target="_blank" rel="noreferrer" className="text-blue-500 underline font-normal">
                (unduh form di sini)
              </a>
            </p>
            <UploadBox label="" file={lampiranFile} onFileChange={(f) => { setLampiranFile(f); onChange("lampiranFile", f?.name || ""); }} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const FormPengajuanTiket = ({ onClose }) => {
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

  const handleSubmit = async () => {
    // Validasi field wajib
    if (!subjek.trim()) {
      setErrorMsg("Subjek tiket wajib diisi.");
      return;
    }
    if (!kategori) {
      setErrorMsg("Kategori Layanan wajib dipilih.");
      return;
    }
  const handleSubmit = () => {
    setSubmitted(true);

    if (!subjek.trim()) { setErrorMsg("Subjek tiket wajib diisi."); return; }
    if (!kategori) { setErrorMsg("Kategori Layanan wajib dipilih."); return; }

    if (kategori === "Persuratan") {
      if (!jenisSurat) { setErrorMsg("Jenis Surat wajib dipilih."); return; }

      // Validasi field wajib per jenis surat
      const requiredBase = ["nama", "nim"];

      if (jenisSurat === "Surat Keterangan Mahasiswa Aktif") {
        const required = [...requiredBase, "ttl", "alamat", "prodi", "departemen", "fakultas", "keperluan", "bahasaSurat", "ktmFile", "uktFile"];
        const empty = required.find((f) => !persyaratan[f]?.trim());
        if (empty) { setErrorMsg("Semua field persyaratan wajib diisi."); return; }
      }

      if (jenisSurat === "Surat Izin Akademik") {
        const required = [...requiredBase, "prodi", "fakultas", "alasanIzin", "ktmFile", "lampiranFile"];
        const empty = required.find((f) => !persyaratan[f]?.trim());
        if (empty) { setErrorMsg("Semua field persyaratan wajib diisi."); return; }
      }

      if (jenisSurat === "Surat Perubahan KRS") {
        const required = [...requiredBase, "prodi", "fakultas", "ktmFile", "lampiranFile"];
        const empty = required.find((f) => !persyaratan[f]?.trim());
        if (empty) { setErrorMsg("Semua field persyaratan wajib diisi."); return; }
      }

      if (jenisSurat === "Surat Rekomendasi Beasiswa") {
        const required = [...requiredBase, "prodi", "fakultas", "ktmFile", "lampiranFile"];
        const empty = required.find((f) => !persyaratan[f]?.trim());
        if (empty) { setErrorMsg("Semua field persyaratan wajib diisi."); return; }
      }

      if (jenisSurat === "Permohonan Surat Magang") {
        const required = [...requiredBase, "prodi", "fakultas", "instansi", "tanggalMagang", "ktmFile", "lampiranFile"];
        const empty = required.find((f) => !persyaratan[f]?.trim());
        if (empty) { setErrorMsg("Semua field persyaratan wajib diisi."); return; }
      }
    }
    setIsSubmitting(true);
    setErrorMsg("");

    const token = localStorage.getItem("sapa_ipb_token");
    if (!token) {
      setErrorMsg("Silakan login terlebih dahulu sebelum mengajukan tiket.");
      setIsSubmitting(false);
      return;
    }

    const id_layanan = kategori === "Persuratan" ? "Persuratan" : "Layanan";
    const dataRequest = {
      deskripsi: deskripsi.trim() || undefined,
      jenis_surat: kategori === "Persuratan" ? jenisSurat : undefined,
      tujuan: kategori === "Persuratan" ? persyaratan.keperluan : undefined,
      alamat: kategori === "Persuratan" ? persyaratan.alamat : undefined,
      bahasa_surat: kategori === "Persuratan" ? bahasaSurat : undefined,
      upload_file_name: uploadFile?.name || undefined,
      ktm_file_name: ktmFile?.name || undefined,
      ukt_file_name: uktFile?.name || undefined,
      jenis_layanan: kategori !== "Persuratan" ? kategori : undefined,
    };

    const payload = {
      id_layanan,
      kategori: kategori === "Persuratan" ? "Persuratan" : "Layanan",
      subjek: subjek.trim(),
      data_request: dataRequest,
      file_lampiran: uploadFile?.name || null,
      nim: persyaratan.nim?.trim() || "",
      program_studi: persyaratan.prodi?.trim() || "",
      departemen: persyaratan.departemen?.trim() || undefined,
      fakultas: persyaratan.fakultas?.trim() || undefined,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/tiket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.detail || "Gagal mengajukan tiket. Coba lagi.");
      } else {
        setShowSuccess(true);
      }
    } catch (err) {
      console.error("Error submit tiket:", err);
      setErrorMsg("Tidak dapat menghubungi server. Periksa koneksi backend.");
    } finally {
      setIsSubmitting(false);
    }

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
                  onChange={(e) => { setKategori(e.target.value); setJenisSurat(""); setPersyaratan({}); setSubmitted(false); }}
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
                    onChange={(e) => { setJenisSurat(e.target.value); setPersyaratan({}); setSubmitted(false); }}
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

            {/* Upload umum untuk Informasi */}
            {kategori === "Informasi" && (
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
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#ffe030] text-[#130962] font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm"
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