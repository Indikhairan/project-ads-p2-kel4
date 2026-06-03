export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Tambahkan baris ini untuk operasi tangkap tangan:
console.log("VITE MENGGUNAKAN URL INI:", API_BASE_URL);

export const apiFetch = async (path, opts = {}) => {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    
    // Tunggu respons dari backend
    const response = await fetch(url, opts);

    // SATPAM GLOBAL: Cek apakah responsnya 401 (Unauthorized)
    // ATAU responsnya 403 (Forbidden) seperti yang terlihat di console-mu
    if (response.status === 401 || response.status === 403) {
        // Hapus token yang basi
        localStorage.removeItem("sapa_ipb_token");
        
        // Cek posisi URL sekarang. Ubah '/login' menjadi '/' jika login page-mu ada di root.
        if (window.location.pathname !== "/") {
            window.location.href = "/"; // Arahkan kembali ke beranda/halaman login utama
        }
        
        return Promise.reject(new Error("Session expired")); 
    }

    // Jika aman (bukan 401), kembalikan respons seperti biasa
    return response;
};