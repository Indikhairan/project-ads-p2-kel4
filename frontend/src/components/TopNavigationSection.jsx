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
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-yellow-200 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-gray-100 text-[#130962] px-3 py-1.5 rounded-full font-semibold text-xs hover:bg-red-200 transition-colors"
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