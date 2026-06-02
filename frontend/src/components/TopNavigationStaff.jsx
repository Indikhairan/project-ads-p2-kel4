import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("sapa_ipb_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const TopNavigationStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [showProfile, setShowProfile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const profileRef = useRef(null);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/staff/knowledge-base/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const count = (data || []).filter((kb) => kb.status === "Pending").length;
        setPendingCount(count);
      }
    } catch (err) {
      console.error("Gagal fetch pending count:", err);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("sapa_ipb_token");

    // Kirim sinyal logout ke backend
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
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

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Nanti diganti data dari backend
  const user = {
    nama: "Agus Salim",
    email: "agus.staff@apps.ipb.ac.id",
    initial: "A",
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
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Home
          </span>
          <span
            onClick={() => navigate("/staff/knowledge-base")}
            className={`cursor-pointer pb-0.5 transition-colors flex items-center gap-1.5 ${
              isActive("/staff/knowledge-base")
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Knowledge Base
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
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