import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const TopNavigationAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-8 py-3">
      <div className="flex items-center gap-4">
        <span
          onClick={() => navigate("/admin/dashboard")}
          className="font-extrabold text-[#130962] text-xl tracking-wide cursor-pointer"
        >
          SAPAIPB
        </span>
        <div className="w-px h-6 bg-gray-300" />
        <nav className="flex gap-6 text-sm">
          <span
            onClick={() => navigate("/admin/dashboard")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/admin/dashboard")
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Dashboard
          </span>
          <span
            onClick={() => navigate("/admin/users")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/admin/users")
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Kelola Pengguna
          </span>
          <span
            onClick={() => navigate("/admin/persetujuan")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/admin/persetujuan")
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Pusat Persetujuan AI
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-purple-100 text-purple-600 font-bold text-xs px-3 py-1 rounded-full">
          Superadmin
        </span>
        <button
          onClick={() => navigate("/")}
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