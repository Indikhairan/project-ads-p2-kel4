import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiPost, clearAuthToken } from "../utils/apiClient";
import API_ENDPOINTS from "../config/api";

export const TopNavigationStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const handleLogout = async () => {
    try {
      await apiPost(API_ENDPOINTS.AUTH.LOGOUT, {}, "Logout");
      clearAuthToken();
      localStorage.removeItem("sapa_ipb_role");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      // Clear tokens locally even if API call fails
      localStorage.removeItem("sapa_ipb_token");
      localStorage.removeItem("sapa_ipb_role");
      navigate("/");
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-8 py-3">
      <div className="flex items-center gap-4">
        <span
          onClick={() => navigate("/staff/dashboard")}
          className="font-extrabold text-[#130962] text-xl tracking-wide cursor-pointer"
        >
          SAPAIPB
        </span>
        <div className="w-px h-6 bg-gray-300" />
        <nav className="flex gap-6 text-sm">
          <span
            onClick={() => navigate("/staff/dashboard")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/staff/dashboard")
                ? "font-bold text-[#130962] border-b-2 border-[#130962]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Home
          </span>
          <span
            onClick={() => navigate("/staff/knowledge-base")}
            className={`cursor-pointer pb-0.5 transition-colors ${
              isActive("/staff/knowledge-base")
                ? "font-bold text-[#130962] border-b-2 border-[#130962]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Knowledge Base
          </span>
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-1.5 rounded-full font-semibold text-xs hover:bg-red-700 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Log Out
      </button>
    </header>
  );
};