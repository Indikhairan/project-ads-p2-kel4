import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import image3 from "../assets/image-3.png";

const allTickets = [
  { id: "#001", tanggal: "01/04/2026", subjek: "Pembatalan KRS ICE", status: "processing", unitKerja: "DITAP" },
  { id: "#002", tanggal: "01/04/2026", subjek: "Permohonan Pengajuan Beasiswa", status: "completed", unitKerja: "DITMAWA" },
  { id: "#003", tanggal: "01/04/2026", subjek: "Pengajuan Surat Izin Akademik", status: "rejected", unitKerja: "TU Departemen" },
];

const ITEMS_PER_PAGE = 10;

const StatusBadge = ({ status }) => {
  if (status === "processing")
    return (
      <div className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
        ⏱ DIPROSES
      </div>
    );
  if (status === "completed")
    return (
      <div className="px-3 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
        ✓ SELESAI
      </div>
    );
  return (
    <div className="px-3 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
      ⊘ DITOLAK
    </div>
  );
};

export const RiwayatTiketPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState("ID Tiket");
  const [sortDir, setSortDir] = useState("Ascending");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const sortRef = useRef(null);

  // Tutup dropdown sort kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter berdasarkan search
  const filtered = allTickets.filter((t) =>
    t.subjek.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let valA, valB;
    if (sortBy === "ID Tiket") { valA = a.id; valB = b.id; }
    else if (sortBy === "Tanggal") { valA = a.tanggal; valB = b.tanggal; }
    else { valA = a.status; valB = b.status; }
    return sortDir === "Ascending"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationSection onBuatTiket={() => setShowForm(true)} />

      <div className="w-full max-w-[1000px] mx-auto px-6 mt-4 gap-4 pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-[#130962] hover:opacity-70 transition-opacity"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h1 className="font-bold text-[#130962] text-xl">Riwayat Tiket</h1>
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 gap-2 bg-white w-[220px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="flex-1 text-sm focus:outline-none bg-transparent"
                />
              </div>

              {/* Tombol sort */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSort((prev) => !prev)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${
                    showSort
                      ? "bg-[#130962] text-white border-[#130962]"
                      : "bg-white text-[#130962] border-[#130962] hover:bg-gray-50"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                  </svg>
                </button>

                {/* Dropdown sort */}
                {showSort && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 w-44">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Urutkan berdasarkan</p>
                    {["ID Tiket", "Tanggal", "Status"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          checked={sortBy === opt}
                          onChange={() => setSortBy(opt)}
                          className="accent-[#130962]"
                        />
                        <span className="text-sm text-[#130962]">{opt}</span>
                      </label>
                    ))}
                    <div className="border-t border-gray-100 my-2" />
                    {["Ascending", "Descending"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="radio"
                          name="sortDir"
                          checked={sortDir === opt}
                          onChange={() => setSortDir(opt)}
                          className="accent-[#130962]"
                        />
                        <span className="text-sm text-[#130962]">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mb-0" />

          {/* Tabel */}
          <table className="w-full">
            <thead>
              <tr className="bg-[#130962] text-white text-sm">
                <th className="py-3 px-4 text-center font-semibold rounded-tl-lg">ID Tiket</th>
                <th className="py-3 px-4 text-center font-semibold">Tanggal</th>
                <th className="py-3 px-4 text-center font-semibold">Subjek</th>
                <th className="py-3 px-4 text-center font-semibold">Status</th>
                <th className="py-3 px-4 text-center font-semibold rounded-tr-lg">Unit Kerja</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center italic text-gray-400 text-sm">
                    {search
                      ? "Hasil pencarian tidak ditemukan."
                      : "Anda belum memiliki riwayat pengajuan layanan akademik."}
                  </td>
                </tr>
              ) : (
                paginated.map((ticket, idx) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tiket/${ticket.id.replace("#", "")}`)}
                    className={`text-sm text-center ${idx % 2 === 1 ? "bg-[#f0f0ff]" : "bg-white"} hover:bg-blue-50 transition-colors cursor-pointer`}
                  >
                    <td className="py-3 px-4 font-medium text-[#130962]">{ticket.id}</td>
                    <td className="py-3 px-4 text-[#130962]">{ticket.tanggal}</td>
                    <td className="py-3 px-4 font-medium text-[#130962]">{ticket.subjek}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <StatusBadge status={ticket.status} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#130962]">{ticket.unitKerja}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
            >
              &gt;
            </button>
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

export default RiwayatTiketPage;