import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const TopNavigationStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full font-semibold text-xs hover:bg-red-700 transition-colors"
        >
          Log Out
        </button>
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-sm text-white">
          A
        </div>
      </div>
    </header>
  );
};