import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

// Data dummy
const authStats = {
  totalLogins: 200,
  successLogins: 150,
  failedLogins: 50,
};

const pieData = [
  { name: "Successful Logins", value: 150 },
  { name: "Failed Logins", value: 50 },
];
const PIE_COLORS = ["#22c55e", "#ef4444"];

const loginActivityData = [
  { time: "08:00", success: 20, failed: 5 },
  { time: "10:00", success: 35, failed: 8 },
  { time: "12:00", success: 50, failed: 12 },
  { time: "14:00", success: 28, failed: 6 },
  { time: "16:00", success: 40, failed: 10 },
  { time: "18:00", success: 22, failed: 4 },
  { time: "20:00", success: 15, failed: 3 },
  { time: "22:00", success: 10, failed: 2 },
];

const authorizationData = [
  { name: "Authorized", value: 168 },
  { name: "Role-Based (RBAC)", value: 30 },
  { name: "Object-Based (OBAC)", value: 35 },
];

const recentActivity = [
  { time: "20:52", email: "hohohih@apps.ipb.ac.id", role: "Mahasiswa", activity: "Submit tiket #012", status: "success", ip: "103.82.15.113" },
  { time: "19:00", email: "fufufafa@ipb.ac.id", role: "Admin", activity: "View security logs", status: "success", ip: "192.168.1.100" },
  { time: "18:30", email: "hello@apps.ipb.ac.id", role: "Staff", activity: "Login attempt", status: "failed", ip: "45.33.12.88" },
  { time: "17:45", email: "budi@apps.ipb.ac.id", role: "Mahasiswa", activity: "Submit tiket #011", status: "success", ip: "103.82.15.200" },
  { time: "16:20", email: "andi@apps.ipb.ac.id", role: "Staff", activity: "Update tiket #009", status: "success", ip: "192.168.1.105" },
];

const ITEMS_PER_PAGE = 3;

// Navbar khusus admin
const TopNavigationAdmin = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("sapa_ipb_token");
    localStorage.removeItem("sapa_ipb_role");
    navigate("/");
  };
  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-8 py-3">
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-[#130962] text-xl tracking-wide cursor-pointer" onClick={() => navigate("/admin/dashboard")}>
          SAPAIPB
        </span>
        <span className="bg-[#ffe030] text-[#130962] font-bold text-xs px-3 py-1 rounded-full">Admin</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-[#130962] hover:opacity-70 transition-opacity">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full font-semibold text-xs hover:bg-red-700 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-sm text-white">A</div>
      </div>
    </header>
  );
};

const SectionHeader = ({ title, color = "bg-[#130962]" }) => (
  <div className={`${color} text-white px-4 py-2 rounded-t-lg`}>
    <span className="font-semibold text-sm">{title}</span>
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`font-bold text-3xl ${color}`}>{value}</p>
  </div>
);

export const DashboardKeamanan = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(recentActivity.length / ITEMS_PER_PAGE);
  const paginated = recentActivity.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

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
            <SectionHeader title="Authentication" color="bg-[#3b4fa8]" />
            <div className="bg-white p-5 flex flex-col gap-4">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Logins Today" value={authStats.totalLogins} color="text-[#130962]" />
                <StatCard label="Successful Logins" value={authStats.successLogins} color="text-green-500" />
                <StatCard label="Failed Logins" value={authStats.failedLogins} color="text-red-500" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                {/* Pie chart */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#130962] mb-3">Login</p>
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
                        <span className="text-gray-500">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Line chart */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#130962] mb-3">Login Activity</p>
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
            <SectionHeader title="Authorization" color="bg-[#3b4fa8]" />
            <div className="bg-white p-5">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={authorizationData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 110, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#130962" }} width={110} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b4fa8" radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accounting */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <SectionHeader title="Accounting" color="bg-[#3b4fa8]" />
            <div className="bg-white p-5">
              <p className="text-sm font-semibold text-[#130962] mb-3">Recent Activity</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#ffe030] text-[#130962]">
                    <th className="py-2 px-3 text-left font-semibold text-xs">Time</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs">Email</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs">Role</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs">Activity</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs">Status</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[#f0f0ff]" : "bg-white"}>
                      <td className="py-2 px-3 text-xs text-[#130962]">{row.time}</td>
                      <td className="py-2 px-3 text-xs text-[#130962]">{row.email}</td>
                      <td className="py-2 px-3 text-xs text-[#130962]">{row.role}</td>
                      <td className="py-2 px-3 text-xs text-[#130962]">{row.activity}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                        }`}>
                          {row.status === "success" ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-[#130962]">{row.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-4">
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
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                      currentPage === p ? "bg-[#130962] text-white" : "text-gray-500 hover:text-[#130962]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 3 && <span className="text-gray-400 text-xs">...</span>}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-gray-400 hover:text-[#130962] disabled:opacity-30 text-sm px-1"
                >
                  &gt;
                </button>
              </div>
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