import React from "react";

export const TopNavigationSection = ({ onBuatTiket }) => {
  return (
    <header className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-8 py-3">
      <div className="flex items-center gap-4">
        <span className="font-extrabold text-[#130962] text-xl tracking-wide">SAPAIPB</span>
        <div className="w-px h-6 bg-gray-300" />
        <nav className="flex gap-6 font-medium text-[#130962] text-sm">
          <span className="cursor-pointer border-b-2 border-[#130962] pb-0.5">Home</span>
          <span
            onClick={onBuatTiket}
            className="cursor-pointer text-gray-400 hover:text-[#130962] transition-colors">
              + Buat Tiket
              </span>
          <span className="cursor-pointer text-gray-400 hover:text-[#130962] transition-colors">
            Riwayat Tiket
            </span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-[#130962] text-lg hover:opacity-70 transition-opacity">🔔</button>
        <button className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full font-semibold text-xs hover:bg-red-700 transition-colors">
          Log Out
        </button>
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-sm text-white">
          B
        </div>
      </div>
    </header>
  );
};

