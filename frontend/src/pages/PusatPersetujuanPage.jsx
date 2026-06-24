import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationAdmin } from "../components/TopNavigationAdmin";
import { API_BASE_URL } from "../api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("sapa_ipb_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapBackendToUI = (data) => ({
  id: data.id_kb,
  nama: data.filename,
  kategori: data.kategori,
  pengaju: data.diupload_oleh || "Unknown",
  waktu: data.waktu_upload ? new Date(data.waktu_upload).toLocaleString("id-ID") : "Baru saja",
  ingestTime: data.waktu_setujui ? new Date(data.waktu_setujui).toLocaleString("id-ID") : "",
  rejectTime: data.waktu_tolak ? new Date(data.waktu_tolak).toLocaleString("id-ID") : "",
});

const kategoriColor = (k) => {
  if (k === "Persuratan") return "bg-orange-100 text-orange-600";
  if (k === "Akademik") return "bg-blue-100 text-blue-600";
  if (k === "Umum") return "bg-green-100 text-green-600";
  return "bg-gray-100 text-gray-500";
};

// Modal preview dokumen
const ModalPreview = ({ item, onClose }) => {
  const handleDownload = () => {
    const downloadUrl = `${API_BASE_URL}/api/v1/staff/knowledge-base/${item.id}/download`;
    const token = localStorage.getItem("sapa_ipb_token");
    
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = item.nama;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => console.error("Gagal download:", err));
  };

  return (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
      <div className="bg-[#130962] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
        <span className="font-bold text-sm">Preview Dokumen</span>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-[#130962] text-base">{item.nama}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kategoriColor(item.kategori)} mt-1 inline-block`}>
            {item.kategori}
          </span>
          <p className="text-gray-400 text-sm mt-2">Diajukan oleh {item.pengaju} · {item.waktu}</p>
        </div>
        <div className="w-full bg-gray-50 rounded-xl p-4 text-sm text-gray-500 italic text-center">
          File PDF disimpan di server. Gunakan tombol Download untuk melihat atau mengunduh dokumen.
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 bg-blue-500 text-white font-semibold rounded-xl text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#130962] text-white font-semibold rounded-xl text-sm hover:bg-[#1a237e] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

// Toast notifikasi
const Toast = ({ message, type }) => (
  <div className={`fixed top-6 right-6 z-50 bg-white shadow-lg rounded-xl px-5 py-3 flex items-center gap-3 border ${
    type === "success" ? "border-green-200" : "border-red-200"
  }`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
      type === "success" ? "bg-green-100" : "bg-red-100"
    }`}>
      {type === "success" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </div>
    <span className="text-sm font-medium text-[#130962]">{message}</span>
  </div>
);

export const PusatPersetujuanPage = () => {
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/sync/`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        localStorage.removeItem("sapa_ipb_token");
        navigate("/login");
        return;
      }

      if (response.status === 403) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Gagal memuat data sinkronisasi");
      }

      const data = await response.json();
      setPending((data.antrean_pending || []).map(mapBackendToUI));
      setApproved((data.riwayat_sukses || []).map(mapBackendToUI));
      setRejected((data.riwayat_ditolak || []).map(mapBackendToUI));
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data. Periksa koneksi atau login ulang.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetujui = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/sync/approve/${item.id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Gagal setujui dokumen");
      }

      setPending((prev) => prev.filter((p) => p.id !== item.id));
      setApproved((prev) => [
        { ...item, ingestTime: "Baru saja" },
        ...prev,
      ]);
      showToast(`"${item.nama}" disetujui dan masuk ke database AI!`, "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Gagal setujui dokumen", "error");
    }
  };

  const handleTolak = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/sync/reject/${item.id}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Gagal tolak dokumen");
      }

      setPending((prev) => prev.filter((p) => p.id !== item.id));
      setRejected((prev) => [
        { ...item, rejectTime: "Baru saja" },
        ...prev,
      ]);
      showToast(`"${item.nama}" ditolak.`, "error");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Gagal tolak dokumen", "error");
    }
  };

  if (accessDenied) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
        <TopNavigationAdmin />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-100 p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h1 className="font-bold text-[#130962] text-2xl mb-3">Akses Ditolak</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Mohon maaf, Anda tidak memiliki izin (Role) untuk mengakses halaman ini. 
              Silakan kembali ke halaman sebelumnya.
            </p>
            <button 
              onClick={() => navigate(-1)}
              className="w-full py-3.5 bg-[#130962] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Kembali
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationAdmin />

      {toast && <Toast message={toast.message} type={toast.type} />}
      {previewItem && <ModalPreview item={previewItem} onClose={() => setPreviewItem(null)} />}

      <div className="w-full max-w-[900px] mx-auto px-6 mt-8 pb-20">

        {/* Header */}
        <h1 className="font-bold text-[#130962] text-xl mb-6">
          Pusat Persetujuan & Sinkronisasi AI
        </h1>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm">
            Memuat data dari backend...
          </div>
        )}

        {/* Info banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-start gap-3 mb-6">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="font-semibold text-yellow-700 text-sm">Perhatian: Aturan Proses Sinkronisasi AI (Ingest)</p>
            <p className="text-yellow-600 text-xs mt-1">
              Tindakan "Setujui & Ingest" akan membaca dokumen ke dalam database AI (memakan kuota API). Disarankan untuk meninjau dokumen terlebih dahulu dan melakukan Ingest secara sekaligus pada{" "}
              <span className="font-bold">Pukul 22:00 - 23:00 WIB</span>.
            </p>
          </div>
        </div>

        {/* Menunggu Persetujuan */}
        <div className="mb-8">
          <h2 className="font-bold text-[#130962] text-base mb-3 flex items-center gap-2">
            <span>⏳</span>
            Menunggu Persetujuan ({pending.length})
          </h2>

          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 italic text-sm">Tidak ada dokumen yang menunggu persetujuan.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map((item) => (
                <div key={item.id} className="bg-white border-2 border-[#130962] rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#130962] text-sm">{item.nama}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kategoriColor(item.kategori)}`}>
                        {item.kategori}
                      </span>
                      <span className="text-xs text-gray-400">{item.pengaju} · {item.waktu}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Tombol preview */}
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
                      title="Preview dokumen"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    {/* Tombol tolak */}
                    <button
                      onClick={() => handleTolak(item)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-400 text-red-500 font-semibold text-xs rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Tolak
                    </button>
                    {/* Tombol setujui */}
                    <button
                      onClick={() => handleSetujui(item)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#130962] text-white font-semibold text-xs rounded-lg hover:bg-[#1a237e] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Setujui & Ingest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disetujui & Ditolak - side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Disetujui */}
          <div>
            <h2 className="font-bold text-green-600 text-base mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Disetujui & Masuk AI
            </h2>
            <div className="flex flex-col gap-2.5">
              {approved.length === 0 ? (
                <p className="text-gray-400 italic text-sm text-center py-4">Belum ada dokumen disetujui.</p>
              ) : (
                approved.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <p className="font-medium text-[#130962] text-sm">{item.nama}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{item.pengaju} · Di-ingest: {item.ingestTime}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-600">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Aktif di Database AI
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ditolak */}
          <div>
            <h2 className="font-bold text-red-500 text-base mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Dokumen Ditolak
            </h2>
            <div className="flex flex-col gap-2.5">
              {rejected.length === 0 ? (
                <p className="text-gray-400 italic text-sm text-center py-4">Belum ada dokumen ditolak.</p>
              ) : (
                rejected.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <p className="font-medium text-[#130962] text-sm">{item.nama}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{item.pengaju} · Ditolak: {item.rejectTime}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-500">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                      Dihapus oleh Admin
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50 mt-8">
          IPB University
        </footer>
      </div>
    </main>
  );
};

export default PusatPersetujuanPage;