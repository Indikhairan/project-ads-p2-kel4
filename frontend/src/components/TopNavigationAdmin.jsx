import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("sapa_ipb_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const TopNavigationAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [showProfile, setShowProfile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const profileRef = useRef(null);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/sync/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setPendingCount((data.antrean_pending || []).length);
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
    nama: "Admin SAPA",
    email: "admin@apps.ipb.ac.id",
    initial: "A",
  };

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
            onClick={() => navigate("/admin/knowledge-base")}
            className={`cursor-pointer pb-0.5 transition-colors flex items-center gap-1.5 ${
              isActive("/admin/knowledge-base")
                ? "font-bold text-[#130962] border-b-2 border-[#ffe030]"
                : "font-medium text-gray-400 hover:text-[#130962]"
            }`}
          >
            Knowledge Base
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Badge Admin */}
        <span className="bg-[#ffe030] text-[#130962] font-bold text-xs px-3 py-1 rounded-full">
          Admin
        </span>

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