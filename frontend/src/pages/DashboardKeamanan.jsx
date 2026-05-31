import React, { useState, useEffect } from "react";
import { TopNavigationAdmin } from "../components/TopNavigationAdmin";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from "recharts";

// Warna untuk chart
const PIE_COLORS = ["#22c55e", "#ef4444"];
const ITEMS_PER_PAGE = 10; // Sudah diubah jadi 10 data per halaman

// --- Komponen Pendukung UI ---
const SectionHeader = ({ title, color = "bg-[#130962]" }) => (
  <div className={`${color} text-white px-4 py-2 rounded-t-lg`}>
    <span className="font-semibold text-sm">{title}</span>
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
    <p className="text-xs text-gray-500 mb-1 text-center">{label}</p>
    <p className={`font-bold text-3xl ${color}`}>{value !== undefined && value !== null ? value : "-"}</p>
  </div>
);

export const DashboardKeamanan = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("sapa_ipb_token");

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]); // Data asli disimpan di sini
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination Table -> SEKARANG MENGGUNAKAN logs BUKAN recentActivity
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const paginated = logs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const [searchLog, setSearchLog] = useState("");
  const [logsPerPage, setLogsPerPage] = useState(5);
  const [logPage, setLogPage] = useState(1);
  const LOG_ITEMS_OPTIONS = [5, 10, 20];

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  // --- FETCH DATA DARI FASTAPI (REAL-TIME) ---
  useEffect(() => {
    let intervalId; // Deklarasikan di luar supaya bisa dimatikan dari dalam fungsi

    const fetchDashboardData = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const [resStats, resLogs] = await Promise.all([
          fetch("http://localhost:8000/api/v1/admin/security/stats", {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch("http://localhost:8000/api/v1/admin/security/logs?page=1&limit=50", {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);

        // CEK JIKA AKSES DITOLAK (401 atau 403)
        if (resStats.status === 401 || resStats.status === 403 || resLogs.status === 401 || resLogs.status === 403) {
          clearInterval(intervalId); 
          localStorage.removeItem("sapa_ipb_token"); // Hapus token busuk
          navigate("/login"); // Otomatis redirect ke login
          return;
        }

        if (!resStats.ok || !resLogs.ok) {
          throw new Error("Terjadi kesalahan pada server.");
        }

        const dataStats = await resStats.json();
        const dataLogs = await resLogs.json();

        setStats(dataStats.data);
        setLogs(dataLogs);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setErrorMsg(error.message);
        clearInterval(intervalId); // Matikan timer juga kalau ada error lain (misal server mati)
      }
    };

    // 1. Panggil pertama kali
    fetchDashboardData();

    // 2. Pasang interval
    intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    // 3. Bersihkan saat pindah halaman
    return () => clearInterval(intervalId);
  }, [token, navigate]);

  // --- MAPPING DATA BACKEND KE GRAFIK ---
  
  // Memfokuskan data pada "Hari Ini"
  const filterTampilan = "today"; 
  const dataAktif = stats ? stats[filterTampilan] : null;

  // 1. Pie Chart (Login Sukses vs Gagal)
  const pieData = dataAktif ? [
    { name: "Successful Logins", value: dataAktif.authentication.success },
    { name: "Failed Logins", value: dataAktif.authentication.failed },
  ] : [];

  // 2. Bar Chart (Distribusi Authorization)
  const authorizationData = dataAktif ? [
    { name: "Authorized (All)", value: dataAktif.authorization.authorized_total },
    { name: "Role-Based (RBAC)", value: dataAktif.authorization.rbac_count },
    { name: "Object-Based (OBAC)", value: dataAktif.authorization.obac_count },
  ] : [];

  // 3. Line Chart (Aktivitas Login per-Jam Hari Ini)
  const loginActivityData = stats ? stats.today.authentication.hourly_activity : [];

  // Jika ada error, tampilkan pesan error
  if (errorMsg) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col items-center justify-center gap-2">
        <span className="text-4xl">🛑</span>
        <p className="text-red-500 font-bold">{errorMsg}</p>
      </main>
    );
  }

  // Mencegah error render grafik sebelum data pertama masuk (tanpa tulisan memuat)
  if (!stats) {
    return <main className="bg-[#f8f9fa] w-full min-h-screen flex-1"></main>;
  }

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationAdmin />

      <div className="w-full max-w-[1000px] mx-auto px-6 mt-8 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bold text-[#130962] text-xl">Dashboard Keamanan</h1>
          <p className="text-[#130962] font-semibold text-sm italic">
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {/* Authentication */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <SectionHeader title="Authentication (Today)" color="bg-[#3b4fa8]" />
            <div className="bg-white p-5 flex flex-col gap-4">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard 
                  label="Total Logins Today" 
                  value={dataAktif?.authentication.total_login} 
                  color="text-[#130962]" 
                />
                <StatCard 
                  label="Successful Logins" 
                  value={dataAktif?.authentication.success} 
                  color="text-green-500" 
                />
                <StatCard 
                  label="Failed Logins" 
                  value={dataAktif?.authentication.failed} 
                  color="text-red-500" 
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pie chart */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#130962] mb-3">Login Success vs Failed</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="40%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1 mt-2">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-gray-500">{item.name}: <span className="font-bold text-[#130962]">{item.value}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Line chart */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#130962] mb-3">Login Activity (Hourly)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={loginActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Authorization */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <SectionHeader title="Authorization (Access Controls)" color="bg-[#3b4fa8]" />
            <div className="bg-white p-5">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={authorizationData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 110, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#130962" }} width={110} />
                  <Tooltip cursor={{fill: '#f4f4f5'}} />
                  <Bar dataKey="value" fill="#3b4fa8" radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accounting / Audit Logs */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <SectionHeader title="Accounting (Audit Logs - Today)" color="bg-[#3b4fa8]" />
            <div className="bg-white p-5">
              <p className="text-sm font-semibold text-[#130962] mb-3">Recent Activity</p>

              {/* Search + Tampilkan */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2 gap-2 flex-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari email, aktivitas, atau IP..."
                    value={searchLog}
                    onChange={(e) => { setSearchLog(e.target.value); setLogPage(1); }}
                    className="flex-1 text-sm focus:outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-gray-500">Tampilkan:</span>
                  <div className="relative">
                    <select
                      value={logsPerPage}
                      onChange={(e) => { setLogsPerPage(Number(e.target.value)); setLogPage(1); }}
                      className="border border-gray-300 rounded-lg pl-3 pr-7 py-1.5 text-sm focus:outline-none focus:border-[#130962] text-[#130962] appearance-none bg-white cursor-pointer"
                    >
                      {LOG_ITEMS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
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
              {(() => {
                // SEKARANG MENGGUNAKAN logs BUKAN recentActivity
                const filteredLogs = logs.filter((row) =>
                  (row.email?.toLowerCase() || "").includes(searchLog.toLowerCase()) ||
                  (row.activity?.toLowerCase() || "").includes(searchLog.toLowerCase()) ||
                  (row.ip?.toLowerCase() || "").includes(searchLog.toLowerCase()) ||
                  (row.role?.toLowerCase() || "").includes(searchLog.toLowerCase())
                );
                const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
                const paginatedLogs = filteredLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

                return (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#ffe030] text-[#130962]">
                          <th className="py-2 px-3 text-center font-semibold text-xs">Time</th>
                          <th className="py-2 px-3 text-center font-semibold text-xs">Email</th>
                          <th className="py-2 px-3 text-center font-semibold text-xs">Role</th>
                          <th className="py-2 px-3 text-center font-semibold text-xs">Activity</th>
                          <th className="py-2 px-3 text-center font-semibold text-xs">Status</th>
                          <th className="py-2 px-3 text-center font-semibold text-xs">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center italic text-gray-400 text-sm">
                              Data tidak ditemukan.
                            </td>
                          </tr>
                        ) : (
                          paginatedLogs.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? "bg-[#f0f0ff]" : "bg-white"}>
                              <td className="py-2 px-3 text-xs text-[#130962] text-center">{row.time}</td>
                              <td className="py-2 px-3 text-xs text-[#130962] text-center">{row.email}</td>
                              <td className="py-2 px-3 text-xs text-[#130962] text-center">{row.role}</td>
                              <td className="py-2 px-3 text-xs text-[#130962] text-center">{row.activity}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  row.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                                }`}>
                                  {row.status === "success" ? "Success" : "Failed"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-xs text-[#130962] text-center">{row.ip}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Info + Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-gray-400">
                        Menampilkan {filteredLogs.length === 0 ? 0 : (logPage - 1) * logsPerPage + 1}–{Math.min(logPage * logsPerPage, filteredLogs.length)} dari {filteredLogs.length} aktivitas
                      </p>
                      {totalLogPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                            disabled={logPage === 1}
                            className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
                          >
                            &lt;
                          </button>
                          {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setLogPage(p)}
                              className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                                logPage === p ? "bg-[#130962] text-white" : "text-gray-500 hover:text-[#130962]"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                            disabled={logPage === totalLogPages}
                            className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
                          >
                            &gt;
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>
    </main>
  );
};

export default DashboardKeamanan;