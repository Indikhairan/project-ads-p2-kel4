import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNavigationStaff } from "../components/TopNavigationStaff";

const ticketData = {
  "001": {
    id: "#001",
    noTiket: "REQ-20260401-001",
    status: "processing",
    kategori: "Persuratan - Surat Keterangan Aktif Kuliah",
    pengaju: "Budi Santoso",
    nim: "G64012345",
    email: "budisantoso@apps.ipb.ac.id",
    tanggal: "22 April 2026, 08:30 WIB",
    keterangan: "Mohon dibuatkan surat keterangan aktif untuk syarat beasiswa",
    lampiran: "KRS_Budi_Genap.pdf",
    mahasiswa: {
      nama: "Budi Santoso",
      nim: "G64012345",
      ttl: "Jakarta, 15 Januari 2002",
      alamat: "Jl. Raya Dramaga No. 123, Bogor",
      prodi: "Ilmu Komputer",
      fakultas: "Matematika dan Ilmu Pengetahuan Alam",
      angkatan: "2020",
      semester: "8",
      statusAkademik: "Aktif",
      ipk: "3.75",
    },
    log: [
      { time: "22/04/2026 - 09:00 WIB", text: "Tiket berhasil di-submit (Mahasiswa)", color: "bg-blue-500" },
      { time: "22/04/2026 - 09:15 WIB", text: "Tiket dilihat oleh Staff Agus", color: "bg-yellow-500" },
    ],
  },
  "002": {
    id: "#002",
    noTiket: "REQ-20260401-002",
    status: "completed",
    kategori: "Persuratan - Surat Keterangan Aktif Kuliah",
    pengaju: "Budi Santoso",
    nim: "G64012345",
    email: "budisantoso@apps.ipb.ac.id",
    tanggal: "22 April 2026, 08:30 WIB",
    keterangan: "Mohon dibuatkan surat keterangan aktif untuk syarat beasiswa",
    lampiran: "KRS_Budi_Genap.pdf",
    mahasiswa: {
      nama: "Budi Santoso",
      nim: "G64012345",
      ttl: "Jakarta, 15 Januari 2002",
      alamat: "Jl. Raya Dramaga No. 123, Bogor",
      prodi: "Ilmu Komputer",
      fakultas: "Matematika dan Ilmu Pengetahuan Alam",
      angkatan: "2020",
      semester: "8",
      statusAkademik: "Aktif",
      ipk: "3.75",
    },
    log: [
      { time: "22/04/2026 - 09:00 WIB", text: "Tiket berhasil di-submit (Mahasiswa)", color: "bg-blue-500" },
      { time: "22/04/2026 - 09:15 WIB", text: "Tiket dilihat oleh Staff Agus", color: "bg-yellow-500" },
      { time: "22/04/2026 - 10:00 WIB", text: "Tanggapan & file dikirim (Staff Agus)", color: "bg-blue-500" },
      { time: "22/04/2026 - 10:00 WIB", text: "Status berubah: SELESAI (Otomatis)", color: "bg-green-500" },
    ],
  },
};

const STATUS_OPTIONS = [
  { value: "processing", label: "DIPROSES" },
  { value: "completed", label: "SELESAI" },
  { value: "rejected", label: "DITOLAK" },
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

const InfoRow = ({ label, value, isFile }) => (
  <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0 items-start">
    <span className="w-28 text-[#130962] font-semibold text-sm shrink-0">{label}</span>
    <span className="text-gray-500 text-sm shrink-0">:</span>
    {isFile ? (
      <div className="flex items-center gap-2">
        <span className="text-[#130962] text-sm">{value}</span>
        <button
          onClick={() => alert("Mengunduh " + value)}
          className="flex items-center gap-1.5 bg-[#130962] text-white text-[11px] font-semibold px-3 py-1 rounded-lg hover:bg-[#1a237e] transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Unduh
        </button>
      </div>
    ) : (
      <span className="text-[#130962] text-sm">{value}</span>
    )}
  </div>
);

// Modal profil mahasiswa - tanpa tombol tutup bawah, hanya X
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

        {/* Konten - bisa scroll kalau overflow */}
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

// Modal preview surat - fix scroll
const ModalPreviewSurat = ({ mahasiswa, onClose }) => {
  useScrollLock(true);
  const today = new Date();
  const tglSurat = today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header modal - tidak ikut scroll */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <span className="font-bold text-[#130962] text-sm">Preview Surat - Surat Keterangan Aktif Kuliah</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Isi surat - yang scroll hanya bagian ini */}
        <div className="overflow-y-auto flex-1 p-8 font-serif text-sm leading-relaxed">
          {/* Kop surat */}
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

          {/* Judul */}
          <div className="text-center mb-6">
            <p className="font-bold underline text-base">SURAT KETERANGAN</p>
            <p className="text-xs text-gray-500 mt-1">Nomor: ___/IT3.KM.00.00/M/B/{today.getFullYear()}</p>
          </div>

          {/* Isi */}
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

          {/* TTD */}
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

        {/* Footer tombol - tidak ikut scroll */}
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

export const DetailTiketStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();

  const ticket = ticketData[id];
  const [status, setStatus] = useState(ticket?.status || "processing");
  const [pesan, setPesan] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showProfil, setShowProfil] = useState(false);
  const [showSurat, setShowSurat] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");

  if (!ticket) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
        <TopNavigationStaff />
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400 italic">Tiket tidak ditemukan.</p>
        </div>
      </main>
    );
  }

  const handleKirim = () => {
    if (!pesan.trim()) {
      setErrorPesan("Pesan tanggapan tidak boleh kosong!");
      return;
    }
    setErrorPesan("");
    setSubmitted(true);
  };

  const statusColor =
    status === "completed" ? "text-green-600" :
    status === "rejected" ? "text-red-500" : "text-orange-500";

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
          <div className="flex flex-col gap-2">
            <p className="text-[#130962] text-sm font-semibold">
              NO. TIKET : <span className="font-bold">{ticket.noTiket}</span>
            </p>
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
          </div>

          {/* Informasi Pengajuan */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="📋" title="INFORMASI PENGAJUAN" />
            <div className="p-5">
              <InfoRow label="Kategori" value={ticket.kategori} />
              <InfoRow label="Pengaju" value={`${ticket.pengaju} (${ticket.nim})`} />
              <InfoRow label="Email" value={ticket.email} />
              <InfoRow label="Tanggal" value={ticket.tanggal} />
              <InfoRow label="Keterangan" value={ticket.keterangan} />
              {ticket.lampiran && <InfoRow label="Lampiran" value={ticket.lampiran} isFile />}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowProfil(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffe030] text-[#130962] font-semibold text-xs rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  👤 Lihat Data Lengkap Mahasiswa
                </button>
                <button
                  onClick={() => setShowSurat(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#130962] text-white font-semibold text-xs rounded-lg hover:bg-[#1a237e] transition-colors"
                >
                  📄 Generate Surat Otomatis
                </button>
              </div>
            </div>
          </div>

          {/* Form Tanggapan */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="💬" title="FORM TANGGAPAN STAFF" />
            <div className="p-5 flex flex-col gap-4">
              {submitted ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="font-semibold text-[#130962] text-sm">Tanggapan berhasil dikirim!</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-[#130962] mb-1">
                      Pesan Balasan: <span className="font-normal text-gray-400">Staff Akademik</span>
                    </p>
                    <textarea
                      value={pesan}
                      onChange={(e) => { setPesan(e.target.value); setErrorPesan(""); }}
                      placeholder="Tulis tanggapan Anda untuk mahasiswa..."
                      rows={4}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none transition-colors ${
                        errorPesan ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
                      }`}
                    />
                    {errorPesan && <p className="text-red-500 text-xs mt-1">{errorPesan}</p>}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#130962] mb-2">Upload Dokumen Balasan (Opsional):</p>
                    <div
                      onClick={() => fileRef.current.click()}
                      className="border border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 hover:border-[#130962] transition-all"
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setUploadedFile(e.target.files[0])}
                      />
                      {uploadedFile ? (
                        <>
                          <span className="text-2xl">📄</span>
                          <span className="text-sm font-medium text-[#130962]">{uploadedFile.name}</span>
                          <span className="text-xs text-green-500">File terpilih</span>
                        </>
                      ) : (
                        <>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                          </svg>
                          <span className="text-sm font-semibold text-[#130962]">Unggah Dokumen</span>
                          <span className="text-xs text-gray-400">Hanya format PDF atau JPG (Maksimal 5 MB)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleKirim}
                    className="w-full py-3 bg-[#ffe030] text-[#130962] font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    KIRIM TANGGAPAN
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Log Aktivitas */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <SectionHeader icon="🕐" title="LOG AKTIVITAS" />
            <div className="p-5 flex flex-col gap-3">
              {ticket.log.map((item, idx) => (
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

      {showProfil && <ModalProfilMahasiswa mahasiswa={ticket.mahasiswa} onClose={() => setShowProfil(false)} />}
      {showSurat && <ModalPreviewSurat mahasiswa={ticket.mahasiswa} onClose={() => setShowSurat(false)} />}
    </main>
  );
};

export default DetailTiketStaff;