export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Tambahkan baris ini untuk operasi tangkap tangan:
console.log("VITE MENGGUNAKAN URL INI:", API_BASE_URL);

export const apiFetch = async (path, opts = {}) => {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    
    // Tunggu respons dari backend
    const response = await fetch(url, opts);

    // SATPAM GLOBAL: Cek apakah responsnya 401 (Unauthorized)
    if (response.status === 401) {
        // Hapus token yang basi
        localStorage.removeItem("sapa_ipb_token");
        
        // Lempar paksa ke login. 
        // Catatan: Kita pakai window.location.href karena file ini bukan 
        // komponen React, jadi kita tidak bisa pakai useNavigate().
        window.location.href = "/login"; 
        
        // Hentikan proses fetch agar tidak memicu error lanjutan di halaman
        return Promise.reject(new Error("Session expired")); 
    }

    // Jika aman (bukan 401), kembalikan respons seperti biasa
    return response;
};