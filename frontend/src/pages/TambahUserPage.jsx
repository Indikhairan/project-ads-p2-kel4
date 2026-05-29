import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationAdmin } from "../components/TopNavigationAdmin";

const SUPERADMIN_EMAIL = "superadmin@apps.ipb.ac.id";
const ROLE_OPTIONS = ["Mahasiswa", "Staff", "Admin"];

const initialUsers = [
  { id: 1, email: SUPERADMIN_EMAIL, nama: "Super Admin", nim_nip: "-", unitKerja: "-", role: "Superadmin", createdAt: "01/01/2026" },
  { id: 2, email: "budisantoso@apps.ipb.ac.id", nama: "Budi Santoso", nim_nip: "G64012345", unitKerja: "-", role: "Mahasiswa", createdAt: "01/04/2026" },
  { id: 3, email: "agus.staff@apps.ipb.ac.id", nama: "Agus Salim", nim_nip: "NIP198501012010011001", unitKerja: "Direktorat Administrasi Pendidikan", role: "Staff", createdAt: "01/03/2026" },
];

const roleColor = (role) => {
  if (role === "Superadmin") return "bg-purple-100 text-purple-600";
  if (role === "Admin") return "bg-blue-100 text-blue-600";
  if (role === "Staff") return "bg-orange-100 text-orange-600";
  return "bg-green-100 text-green-600";
};

const SuccessToast = ({ message }) => (
  <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3 flex items-center gap-3">
    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <span className="text-sm font-medium text-[#130962]">{message}</span>
  </div>
);

const ModalHapus = ({ user, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </div>
      <h3 className="font-bold text-[#130962] text-base mb-2">Hapus Pengguna?</h3>
      <p className="text-gray-400 text-sm mb-6">
        Akun <span className="font-semibold text-[#130962]">{user.nama}</span> akan dihapus permanen.
      </p>
      <div className="flex gap-3 w-full">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-colors">Hapus</button>
      </div>
    </div>
  </div>
);

const ModalResetKey = ({ user, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
      </div>
      <h3 className="font-bold text-[#130962] text-base mb-2">Reset Key Staff?</h3>
      <p className="text-gray-400 text-sm mb-6">
        Key keamanan milik <span className="font-semibold text-[#130962]">{user.nama}</span> akan direset. Staff perlu melakukan verifikasi ulang.
      </p>
      <div className="flex gap-3 w-full">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm hover:bg-orange-600 transition-colors">Reset Key</button>
      </div>
    </div>
  </div>
);

// Form tambah/edit user
const FormUser = ({ editTarget, onSimpan, onBatal }) => {
  const [formEmail, setFormEmail] = useState(editTarget?.email || "");
  const [formNama, setFormNama] = useState(editTarget?.nama || "");
  const [formNimNip, setFormNimNip] = useState(editTarget?.nim_nip || "");
  const [formUnitKerja, setFormUnitKerja] = useState(editTarget?.unitKerja || "");
  const [formRole, setFormRole] = useState(editTarget?.role || "");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isError = (val) => submitted && !val?.trim();

  const handleSimpan = () => {
    setSubmitted(true);
    if (!formEmail.trim()) { setFormError("Email wajib diisi."); return; }
    if (!formEmail.endsWith("@apps.ipb.ac.id")) { setFormError("Email harus menggunakan domain @apps.ipb.ac.id"); return; }
    if (!formNama.trim()) { setFormError("Nama lengkap wajib diisi."); return; }
    if (!formNimNip.trim()) { setFormError("NIM/NIP wajib diisi."); return; }
    if (!formRole) { setFormError("Role wajib dipilih."); return; }
    setFormError("");
    onSimpan({ email: formEmail.trim(), nama: formNama.trim(), nim_nip: formNimNip.trim(), unitKerja: formUnitKerja.trim() || "-", role: formRole });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#130962] p-6 mb-5">
      <p className="font-bold text-[#130962] text-base mb-4">
        {editTarget ? `Edit Pengguna: ${editTarget.nama}` : "Tambah Pengguna Baru"}
      </p>
      <div className="flex flex-col gap-4">

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Email: <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formEmail}
            onChange={(e) => { setFormEmail(e.target.value); setFormError(""); }}
            placeholder="nama@apps.ipb.ac.id"
            disabled={!!editTarget}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
              editTarget ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" :
              isError(formEmail) ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
            }`}
          />
          {!editTarget && <p className="text-gray-400 text-xs mt-1">Hanya email dengan domain @apps.ipb.ac.id</p>}
        </div>

        {/* Nama */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Nama Lengkap: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formNama}
            onChange={(e) => { setFormNama(e.target.value); setFormError(""); }}
            placeholder="Masukkan nama lengkap"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
              isError(formNama) ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
            }`}
          />
        </div>

        {/* NIM/NIP */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            NIM/NIP: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formNimNip}
            onChange={(e) => { setFormNimNip(e.target.value); setFormError(""); }}
            placeholder="Contoh: G64012345 atau NIP198501012010011001"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
              isError(formNimNip) ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
            }`}
          />
        </div>

        {/* Unit Kerja - opsional untuk staff */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Unit Kerja{" "}
            <span className="text-gray-400 font-normal text-xs">(opsional, khusus Staff)</span>
          </label>
          <input
            type="text"
            value={formUnitKerja}
            onChange={(e) => setFormUnitKerja(e.target.value)}
            placeholder="Contoh: Direktorat Administrasi Pendidikan"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#130962] transition-colors"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-[#130962] mb-1.5">
            Role: <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formRole}
              onChange={(e) => { setFormRole(e.target.value); setFormError(""); }}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none bg-white transition-colors ${
                isError(formRole) ? "border-red-400" : "border-gray-300 focus:border-[#130962]"
              } ${formRole ? "text-[#130962]" : "text-gray-400"}`}
            >
              <option value="">Pilih Role</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>

        {formError && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {formError}
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onBatal} className="flex-1 py-2.5 bg-gray-200 text-[#130962] font-semibold rounded-xl text-sm hover:bg-gray-300 transition-colors">
            Batal
          </button>
          <button onClick={handleSimpan} className="flex-1 py-2.5 bg-[#ffe030] text-[#130962] font-bold rounded-xl text-sm hover:bg-yellow-400 transition-colors">
            {editTarget ? "Simpan Perubahan" : "Tambahkan Pengguna"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TambahUserPage = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [hapusTarget, setHapusTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleTambah = (data) => {
    if (users.some((u) => u.email === data.email)) {
      return;
    }
    const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    setUsers((prev) => [...prev, { id: Date.now(), ...data, createdAt: today }]);
    setShowForm(false);
    showToast(`Akun ${data.nama} berhasil ditambahkan!`);
  };

  const handleEdit = (data) => {
    setUsers((prev) => prev.map((u) => u.id === editTarget.id ? { ...u, ...data } : u));
    setEditTarget(null);
    setShowForm(false);
    showToast(`Akun ${data.nama} berhasil diperbarui!`);
  };

  const confirmHapus = () => {
    setUsers((prev) => prev.filter((u) => u.id !== hapusTarget.id));
    setHapusTarget(null);
    showToast("Pengguna berhasil dihapus.");
  };

  const confirmResetKey = () => {
    setResetTarget(null);
    showToast(`Key keamanan ${resetTarget.nama} berhasil direset.`);
  };

  const handleClickEdit = (user) => {
    setEditTarget(user);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = users.filter((u) =>
    u.nama.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
      <TopNavigationAdmin />

      {toast && <SuccessToast message={toast} />}
      {hapusTarget && <ModalHapus user={hapusTarget} onConfirm={confirmHapus} onCancel={() => setHapusTarget(null)} />}
      {resetTarget && <ModalResetKey user={resetTarget} onConfirm={confirmResetKey} onCancel={() => setResetTarget(null)} />}

      <div className="w-full max-w-[1000px] mx-auto px-6 mt-8 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-bold text-[#130962] text-xl">Kelola Pengguna</h1>
          <button
            onClick={() => { setEditTarget(null); setShowForm((p) => !p); }}
            className={`flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-lg transition-colors ${
              showForm && !editTarget
                ? "bg-gray-200 text-gray-500 cursor-default"
                : "bg-[#ffe030] text-[#130962] hover:bg-yellow-400"
            }`}
          >
            + Tambah User
          </button>
        </div>

        {/* Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-purple-600 text-xs">
            Superadmin <span className="font-bold">{SUPERADMIN_EMAIL}</span> terdefinisi langsung di sistem dan tidak dapat dihapus. Mahasiswa terdaftar otomatis saat pertama login.
          </p>
        </div>

        {/* Form tambah/edit */}
        {showForm && (
          <FormUser
            editTarget={editTarget}
            onSimpan={editTarget ? handleEdit : handleTambah}
            onBatal={() => { setShowForm(false); setEditTarget(null); }}
          />
        )}

        {/* Tabel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2.5 gap-2 mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm focus:outline-none bg-transparent"
            />
          </div>

          <p className="text-[#130962] font-semibold text-sm mb-3">Daftar Pengguna ({filtered.length})</p>

          <table className="w-full">
            <thead>
              <tr className="bg-[#130962] text-white text-xs">
                <th className="py-3 px-4 text-left font-semibold rounded-tl-lg">Nama</th>
                <th className="py-3 px-4 text-left font-semibold">Email</th>
                <th className="py-3 px-4 text-left font-semibold">NIM/NIP</th>
                <th className="py-3 px-4 text-left font-semibold">Unit Kerja</th>
                <th className="py-3 px-4 text-center font-semibold">Role</th>
                <th className="py-3 px-4 text-center font-semibold">Terdaftar</th>
                <th className="py-3 px-4 text-center font-semibold rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center italic text-gray-400 text-sm">
                    Pengguna tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr key={user.id} className={idx % 2 === 1 ? "bg-[#f0f0ff]" : "bg-white"}>
                    <td className="py-3 px-4 text-sm font-medium text-[#130962]">{user.nama}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{user.email}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{user.nim_nip}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-[150px] truncate">{user.unitKerja}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${roleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-gray-400">{user.createdAt}</td>
                    <td className="py-3 px-4">
                      {user.role === "Superadmin" ? (
                        <span className="text-gray-300 text-xs italic flex justify-center">—</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => handleClickEdit(user)}
                            className="w-7 h-7 bg-[#ffe030] rounded-lg flex items-center justify-center hover:bg-yellow-400 transition-colors"
                            title="Edit"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#130962" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Reset Key - khusus Staff */}
                          {user.role === "Staff" && (
                            <button
                              onClick={() => setResetTarget(user)}
                              className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center hover:bg-orange-200 transition-colors"
                              title="Reset Key"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                              </svg>
                            </button>
                          )}

                          {/* Hapus */}
                          <button
                            onClick={() => setHapusTarget(user)}
                            className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                            title="Hapus"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="w-full py-6 text-center italic text-[#130962] text-xs opacity-50">
          IPB University
        </footer>
      </div>
    </main>
  );
};

export default TambahUserPage;