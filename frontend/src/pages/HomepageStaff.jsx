import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WelcomeBannerSection } from "../components/WelcomeBannerSection";
import { TopNavigationStaff } from "../components/TopNavigationStaff";
import { API_BASE_URL } from "../api";

const ITEMS_OPTIONS = [5, 10, 20];

const StatusBadge = ({ status }) => {
  const currentStatus = status?.toLowerCase();
  if (currentStatus === "open") {
    return <span className="px-3 py-1 bg-blue-50 border border-blue-400 text-blue-500 font-semibold text-xs rounded flex items-center gap-1">📋 OPEN</span>;
  }
  if (currentStatus === "diproses" || currentStatus === "processing") {
    return <span className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-xs rounded flex items-center gap-1">⏱ DIPROSES</span>;
  }
  if (currentStatus === "selesai" || currentStatus === "completed") {
    return <span className="px-3 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-xs rounded flex items-center gap-1">✓ SELESAI</span>;
  }
  return <span className="px-3 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-xs rounded flex items-center gap-1">⊘ DITOLAK</span>;
};

export const HomepageStaff = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterKategori, setFilterKategori] = useState("Semua Kategori");
  const [dariTanggal, setDariTanggal] = useState("");
  const [sampaiTanggal, setSampaiTanggal] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState("Tanggal");
  const [sortDir, setSortDir] = useState("Descending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sapa_ipb_token");
    if (!token) {
      setError("Token tidak ditemukan. Silakan login kembali.");
      setIsLoading(false);
      return;
    }

    let isFirstLoad = true; // Penanda agar layar loading hanya muncul di awal

    const fetchTickets = async () => {
      if (isFirstLoad) setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/tiket/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Gagal memuat tiket.");
        }

        const data = await response.json();
        setTickets(data || []);
      } catch (err) {
        if (isFirstLoad) setError(err.message || "Gagal memuat tiket.");
      } finally {
        setIsLoading(false);
        isFirstLoad = false;
      }
    };

    fetchTickets(); // Panggilan pertama

    // ── POLLING: Auto-refresh data secara diam-diam setiap 5 detik ──
    const intervalId = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalId); // Bersihkan saat pindah halaman
  }, []);


  // ── PERBAIKAN LOGIKA FILTER ──
  const filtered = tickets.filter((t) => {
    const matchSearch =
      (t.subjek || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id_tiket || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.email_mahasiswa || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus =
    filterStatus === "Semua Status" || t.status === filterStatus;

    // Antisipasi jika t.kategori kosong, cek dari id_layanan
    const kategoriTeks = t.kategori || t.id_layanan || "";
    const matchKategori =
      filterKategori === "Semua Kategori" || kategoriTeks.toLowerCase().includes(filterKategori.toLowerCase());

    // Perbaikan logika jam pada tanggal
    const tiketDate = t.waktu_submit ? new Date(t.waktu_submit) : null;
    
    const dari = dariTanggal ? new Date(dariTanggal) : null;
    if (dari) dari.setHours(0, 0, 0, 0); // Mulai dari jam 00:00

    const sampai = sampaiTanggal ? new Date(sampaiTanggal) : null;
    if (sampai) sampai.setHours(23, 59, 59, 999); // Sampai detik terakhir hari itu

    const matchDari = dari && tiketDate ? tiketDate >= dari : true;
    const matchSampai = sampai && tiketDate ? tiketDate <= sampai : true;

    return matchSearch && matchStatus && matchKategori && matchDari && matchSampai;
  });

  // Parse tanggal dd/mm/yyyy ke Date
  const parseDate = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m}-${d}`);
  };

  // Filter
  const filtered = tickets.filter((t) => {
    const matchSearch =
      (t.subjek || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id_tiket || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.email_mahasiswa || "").toLowerCase().includes(search.toLowerCase());

    const matchKategori =
      filterKategori === "Semua Kategori" || (t.kategori || "").toLowerCase() === filterKategori.toLowerCase();

    const tiketDate = t.waktu_submit ? new Date(t.waktu_submit) : null;
    const dari = dariTanggal ? new Date(dariTanggal) : null;
    const sampai = sampaiTanggal ? new Date(sampaiTanggal) : null;
    const matchDari = dari ? tiketDate >= dari : true;
    const matchSampai = sampai ? tiketDate <= sampai : true;

    return matchSearch && matchStatus && matchKategori && matchDari && matchSampai;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let valA, valB;
    if (sortBy === "ID Tiket") { valA = a.id_tiket || ""; valB = b.id_tiket || ""; }
    else if (sortBy === "Tanggal") { valA = a.waktu_submit || ""; valB = b.waktu_submit || ""; }
    else if (sortBy === "Status") { valA = a.status || ""; valB = b.status || ""; }
    else { valA = a.kategori || ""; valB = b.kategori || ""; }
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
      <WelcomeBannerSection />

        {/* Search & Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex gap-3 mb-2">
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
            <button
              onClick={() => setShowFilter((p) => !p)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                filterStatus !== "Semua Status" || filterKategori !== "Semua Kategori" || dariTanggal || sampaiTanggal
                  ? "bg-[#130962] text-white border-[#130962]"
                  : showFilter
                  ? "bg-[#130962] text-white border-[#130962]"
                  : "bg-white text-gray-400 border-gray-300 hover:text-[#130962] hover:border-[#130962]"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A1 1 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/>
              </svg>
            </button>

            {/* Tombol Sort */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSort((p) => !p)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                  showSort || sortBy !== "ID Tiket" || sortDir !== "Ascending"
                    ? "bg-[#130962] text-white border-[#130962]"
                    : "bg-white text-gray-400 border-gray-300 hover:text-[#130962] hover:border-[#130962]"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
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
          {showFilter && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status */}
              <div>
                <p className="text-xs font-medium text-[#130962] mb-1">Status</p>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[#130962] bg-white text-[#130962]"
                  >
                    {["Semua Status", "Open", "Diproses", "Selesai", "Ditolak"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <p className="text-xs font-medium text-[#130962] mb-1">Kategori</p>
                <div className="relative">
                  <select
                    value={filterKategori}
                    onChange={(e) => { setFilterKategori(e.target.value); resetPage(); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[#130962] bg-white text-[#130962]"
                  >
                    {["Semua Kategori", "Persuratan", "Informasi"].map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
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
          )}
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center text-gray-500 text-sm">
                    Memuat tiket...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center text-red-500 text-sm">
                    {error}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
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
                    key={ticket.id_tiket}
                    onClick={() => navigate(`/staff/tiket/${encodeURIComponent(ticket.id_tiket)}`)}
                    className={`text-sm text-center cursor-pointer transition-colors ${
                      idx % 2 === 1 ? "bg-[#f0f0ff]" : "bg-white"
                    } hover:bg-blue-50`}
                  >
                    <td className="py-3 px-4 font-medium text-[#130962]">{ticket.id_tiket}</td>
                    <td className="py-3 px-4 text-[#130962]">{ticket.waktu_submit ? new Date(ticket.waktu_submit).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="py-3 px-4 font-medium text-[#130962] max-w-[200px] truncate">{ticket.subjek || "-"}</td>
                    <td className="py-3 px-4 text-[#130962]">{ticket.kategori || ticket.id_layanan || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <StatusBadge status={ticket.status} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#130962]">
                      <div className="font-medium">{ticket.email_mahasiswa || "-"}</div>
                      <div className="text-[11px] text-gray-400">{ticket.nim ? `(${ticket.nim})` : ""}</div>
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