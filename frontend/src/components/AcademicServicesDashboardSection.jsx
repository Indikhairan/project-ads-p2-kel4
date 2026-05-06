import React from "react";

const summaryCards = [
  { count: "12", title: "Tiket Dibuat", description: "Total seluruh tiket", iconBg: "bg-[#fff7cb]", emoji: "📑" },
  { count: "5", title: "Sedang Diproses", description: "Tiket dalam proses", iconBg: "bg-[#dbeafe]", emoji: "⏳" },
  { count: "7", title: "Selesai", description: "Tiket selesai", iconBg: "bg-[#dcfce7]", emoji: "✅" },
  { count: "0", title: "Ditolak", description: "Tiket ditolak", iconBg: "bg-[#fee2e2]", emoji: "🚫" },
];

const tickets = [
  { id: "001", title: "Tiket #001 (Surat Aktif)", date: "21 April 2026, 10:30", status: "processing" },
  { id: "002", title: "Tiket #002 (Surat Aktif)", date: "22 April 2026, 11:00", status: "completed" },
  { id: "003", title: "Tiket #003 (Surat Aktif)", date: "23 April 2026, 09:15", status: "rejected" },
];

const StatusBadge = ({ status }) => {
  if (status === "processing")
    return (
      <div className="px-3 py-1 bg-orange-50 border border-orange-400 text-orange-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
        ⏱ SEDANG DIPROSES
      </div>
    );
  if (status === "completed")
    return (
      <div className="px-3 py-1 bg-green-50 border border-green-500 text-green-600 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
        ✓ SELESAI
      </div>
    );
  return (
    <div className="px-3 py-1 bg-red-50 border border-red-500 text-red-500 font-semibold text-[11px] rounded flex items-center gap-1 whitespace-nowrap">
      ⊘ DITOLAK
    </div>
  );
};

export const AcademicServicesDashboardSection = () => {
  return (
    <div className="w-full flex flex-col gap-5">

      {/* Portal Banner - tanpa card, langsung di background */}
      <section className="w-full flex flex-col items-center py-6">
        <h1 className="font-bold text-[#130962] text-xl text-center mb-1">
          Portal Layanan Akademik
        </h1>
        <p className="text-gray-400 text-sm text-center mb-5">
          Ajukan permohonan layanan akademik Anda dengan mudah dan cepat
        </p>
        <div className="w-full max-w-[700px] h-[180px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm border border-dashed border-gray-300 gap-2">
          <span className="text-2xl">🖼️</span>
          <span className="text-xs">Diagram panduan pembuatan tiket</span>
        </div>
      </section>

      <div className="w-full border-t border-gray-200" />

      {/* Ringkasan Tiket */}
      <section className="w-full bg-[#ffe972] rounded-xl p-5">
        <div className="mb-4">
          <h2 className="font-semibold text-[#130962] text-base mb-0.5">Ringkasan Tiket Anda</h2>
          <p className="text-[#130962] text-[11px]">Pantau status tiket akademik Anda secara ringkas</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <article key={card.title} className="bg-white p-3.5 rounded-xl flex items-center gap-3">
              <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0`}>
                {card.emoji}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#130962] text-xl leading-tight">{card.count}</span>
                <span className="font-medium text-[#130962] text-[11px]">{card.title}</span>
                <span className="text-[#130962] text-[10px] opacity-60">{card.description}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tiket Terakhir */}
      <section className="w-full bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-[#130962] text-base">Tiket Terakhir Anda</h2>
          <button className="text-[#130962] text-xs hover:underline font-medium flex items-center gap-1">
            Lihat Semua →
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📝</span>
                <div>
                  <div className="font-medium text-[#130962] text-sm">{ticket.title}</div>
                  <div className="italic text-gray-400 text-[11px]">{ticket.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <span className="text-gray-400 text-sm">›</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="w-full py-3 text-center italic text-[#130962] text-[11px] opacity-50">
        IPB University
      </footer>
    </div>
  );
};