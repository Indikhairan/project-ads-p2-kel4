import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationStaff } from "../components/TopNavigationStaff";

const allTickets = [
  { id: "#001", tanggal: "01/04/2026", subjek: "Pembatalan KRS ICE", kategori: "Persuratan", status: "processing", pengirim: "Budi Doremi", nim: "G64012345" },
  { id: "#002", tanggal: "01/04/2026", subjek: "Pengajuan Beasiswa", kategori: "Persuratan", status: "completed", pengirim: "Budi Doremi", nim: "G64012345" },
  { id: "#003", tanggal: "01/04/2026", subjek: "Pengajuan Surat Izin Akademik", kategori: "Persuratan", status: "rejected", pengirim: "Budi Doremi", nim: "G64012345" },
  { id: "#004", tanggal: "02/04/2026", subjek: "Pengajuan Surat Izin Akademik", kategori: "Persuratan", status: "completed", pengirim: "Sir Isaac N", nim: "G740123132" },
  { id: "#005", tanggal: "10/04/2026", subjek: "Pertanyaan persyaratan beasiswa", kategori: "Informasi", status: "completed", pengirim: "Dewi", nim: "F1401231294" },
  { id: "#006", tanggal: "11/04/2026", subjek: "Pengajuan Surat Keterangan Aktif", kategori: "Persuratan", status: "rejected", pengirim: "Rina Marlina", nim: "G64012399" },
  { id: "#007", tanggal: "12/04/2026", subjek: "Permohonan Informasi KRS", kategori: "Informasi", status: "processing", pengirim: "Agus Salim", nim: "H14012345" },
  { id: "#008", tanggal: "13/04/2026", subjek: "Pengajuan Surat Aktif Kuliah", kategori: "Persuratan", status: "completed", pengirim: "Siti Aminah", nim: "G64012401" },
  { id: "#009", tanggal: "14/04/2026", subjek: "Permohonan Informasi Beasiswa", kategori: "Informasi", status: "processing", pengirim: "Dian Pratama", nim: "F14013001" },
  { id: "#010", tanggal: "15/04/2026", subjek: "Pengajuan Surat Izin Penelitian", kategori: "Persuratan", status: "completed", pengirim: "Rizky Fajar", nim: "G64012410" },
];

const ITEMS_OPTIONS = [5, 10, 20];

const StatusBadge = ({ status }) => {
  if (status === "processing")
    return <span className="px-2.5 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">⏱ DIPROSES</span>;
  if (status === "completed")
    return <span className="px-2.5 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">✓ SELESAI</span>;
  return <span className="px-2.5 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">⊘ DITOLAK</span>;
};

export const HomepageStaff = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterKategori, setFilterKategori] = useState("Semua Kategori");
  const [dariTanggal, setDariTanggal] = useState("");
  const [sampaiTanggal, setSampaiTanggal] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState("ID Tiket");
  const [sortDir, setSortDir] = useState("Ascending");
  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Parse tanggal dd/mm/yyyy ke Date
  const parseDate = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m}-${d}`);
  };

  // Filter
  const filtered = allTickets.filter((t) => {
    const matchSearch =
      t.subjek.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.pengirim.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === "Semua Status" ||
      (filterStatus === "Diproses" && t.status === "processing") ||
      (filterStatus === "Selesai" && t.status === "completed") ||
      (filterStatus === "Ditolak" && t.status === "rejected");

    const matchKategori =
      filterKategori === "Semua Kategori" || t.kategori === filterKategori;

    const tiketDate = parseDate(t.tanggal);
    const dari = dariTanggal ? parseDate(dariTanggal.split("-").reverse().join("/")) : null;
    const sampai = sampaiTanggal ? parseDate(sampaiTanggal.split("-").reverse().join("/")) : null;
    const matchDari = dari ? tiketDate >= dari : true;
    const matchSampai = sampai ? tiketDate <= sampai : true;

    return matchSearch && matchStatus && matchKategori && matchDari && matchSampai;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let valA, valB;
    if (sortBy === "ID Tiket") { valA = a.id; valB = b.id; }
    else if (sortBy === "Tanggal") { valA = a.tanggal; valB = b.tanggal; }
    else if (sortBy === "Status") { valA = a.status; valB = b.status; }
    else { valA = a.kategori; valB = b.kategori; }
    return sortDir === "Ascending" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetPage = () => setCurrentPage(1);

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationStaff />

      <div className="w-full max-w-[1100px] mx-auto px-6 mt-8 pb-20">

        {/* Welcome */}
        <h1 className="text-[#130962] text-lg font-medium mb-5">
          Selamat datang!
        </h1>

        {/* Search & Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex gap-3 mb-4">
            {/* Search */}
            <div className="flex-1 flex items-center border border-gray-300 rounded-full px-4 py-2.5 gap-2 bg-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="flex-1 text-sm focus:outline-none bg-transparent"
              />
            </div>

            {/* Tombol Filter (dekoratif, filter sudah di bawah) */}
            <button className="w-10 h-10 bg-[#130962] text-white rounded-xl flex items-center justify-center hover:bg-[#1a237e] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A1 1 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/>
              </svg>
            </button>

            {/* Tombol Sort */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSort((p) => !p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  showSort ? "bg-[#283593]" : "bg-[#130962]"
                } text-white hover:bg-[#1a237e]`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                </svg>
              </button>
              {showSort && (
                <div className="absolute right-0 top-14 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 w-44">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Urutkan berdasarkan</p>
                  {["ID Tiket", "Tanggal", "Status", "Kategori"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="radio" name="sortBy" checked={sortBy === opt} onChange={() => setSortBy(opt)} className="accent-[#130962]" />
                      <span className="text-sm text-[#130962]">{opt}</span>
                    </label>
                  ))}
                  <div className="border-t border-gray-100 my-2" />
                  {["Ascending", "Descending"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="radio" name="sortDir" checked={sortDir === opt} onChange={() => setSortDir(opt)} className="accent-[#130962]" />
                      <span className="text-sm text-[#130962]">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-[#130962] mb-1">Status</p>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[#130962] bg-white text-[#130962]"
                >
                  {["Semua Status", "Diproses", "Selesai", "Ditolak"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">∨</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#130962] mb-1">Kategori</p>
              <div className="relative">
                <select
                  value={filterKategori}
                  onChange={(e) => { setFilterKategori(e.target.value); resetPage(); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[#130962] bg-white text-[#130962]"
                >
                  {["Semua Kategori", "Persuratan", "Informasi", "Lainnya"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">∨</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#130962] mb-1">Dari Tanggal</p>
              <input
                type="date"
                value={dariTanggal}
                onChange={(e) => { setDariTanggal(e.target.value); resetPage(); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#130962] text-[#130962]"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#130962] mb-1">Sampai Tanggal</p>
              <input
                type="date"
                value={sampaiTanggal}
                onChange={(e) => { setSampaiTanggal(e.target.value); resetPage(); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#130962] text-[#130962]"
              />
            </div>
          </div>
        </div>

        {/* Info & tampilkan */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[#130962] text-sm font-medium">
            Menampilkan {sorted.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, sorted.length)} dari {sorted.length} tiket
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tampilkan:</span>
            <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); resetPage(); }}
              className="border border-gray-300 rounded-lg pl-3 pr-7 py-1.5 text-sm focus:outline-none focus:border-[#130962] text-[#130962] appearance-none bg-white cursor-pointer"
            >
              {ITEMS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#130962]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
            </span>
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#130962] text-white text-sm">
                <th className="py-3 px-4 text-center font-semibold">ID Tiket</th>
                <th className="py-3 px-4 text-center font-semibold">Tanggal</th>
                <th className="py-3 px-4 text-center font-semibold">Subjek</th>
                <th className="py-3 px-4 text-center font-semibold">Kategori</th>
                <th className="py-3 px-4 text-center font-semibold">Status</th>
                <th className="py-3 px-4 text-center font-semibold">Pengirim</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center italic text-gray-400 text-sm">
                    {search || filterStatus !== "Semua Status" || filterKategori !== "Semua Kategori" || dariTanggal || sampaiTanggal
                      ? "Hasil pencarian tidak ditemukan."
                      : "Tidak ada tiket baru yang perlu ditindaklanjuti saat ini."}
                  </td>
                </tr>
              ) : (
                paginated.map((ticket, idx) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/staff/tiket/${ticket.id.replace("#", "")}`)}
                    className={`text-sm text-center cursor-pointer transition-colors ${
                      idx % 2 === 1 ? "bg-[#f0f0ff]" : "bg-white"
                    } hover:bg-blue-50`}
                  >
                    <td className="py-3 px-4 font-medium text-[#130962]">{ticket.id}</td>
                    <td className="py-3 px-4 text-[#130962]">{ticket.tanggal}</td>
                    <td className="py-3 px-4 font-medium text-[#130962] max-w-[200px] truncate">{ticket.subjek}</td>
                    <td className="py-3 px-4 text-[#130962]">{ticket.kategori}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <StatusBadge status={ticket.status} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#130962]">
                      <div className="font-medium">{ticket.pengirim}</div>
                      <div className="text-[11px] text-gray-400">({ticket.nim})</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
              >
                &lt;
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
                    currentPage === p ? "bg-[#130962] text-white" : "text-gray-500 hover:text-[#130962]"
                  }`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 3 && <span className="text-gray-400 text-sm">...</span>}
              {totalPages > 3 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
                    currentPage === totalPages ? "bg-[#130962] text-white" : "text-gray-500 hover:text-[#130962]"
                  }`}
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>
    </main>
  );
};

export default HomepageStaff;