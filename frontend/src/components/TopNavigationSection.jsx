import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const TopNavigationSection = ({ onBuatTiket, formOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const handleLogout = async () => {
    const token = localStorage.getItem("sapa_ipb_token");

    // Kirim sinyal logout ke backend
    try {
      await fetch("http://localhost:8000/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      console.error("Gagal logout:", err);
    }

    // Baru hapus token dan pindah halaman
    localStorage.removeItem("sapa_ipb_token");
    navigate("/");
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-8 py-3">
      <div className="flex items-center gap-4">
        <span
          onClick={() => navigate("/dashboard")}
          className="font-extrabold text-[#130962] text-xl tracking-wide cursor-pointer"
        >
          SAPAIPB
        </span>
        <div className="w-px h-6 bg-gray-300" />
        <nav className="flex gap-6 text-sm">
          <span
            onClick={() => navigate("/dashboard")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/dashboard") && !formOpen
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Home
          </span>
          <span
            onClick={onBuatTiket}
            className={`cursor-pointer pb-0.5 transition-colors ${
              formOpen
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            + Buat Tiket
          </span>
          <span
            onClick={() => navigate("/riwayat")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/riwayat")
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Riwayat Tiket
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/notifikasi")}
          className="text-[#ffe030] hover:opacity-70 transition-opacity"
        >
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
      </div>
    </header>
  );
};