import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import image5 from "../assets/image-5.png";
import { API_BASE_URL } from "../api";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState("");

  // Cek pesan timeout dari query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("timeout") === "1") {
      setTimeoutMessage("Session Anda telah berakhir (Timeout). Silakan login kembali.");
      // Opsional: Hapus query parameter dari URL biar ga muncul terus saat di-refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  // Cek apakah user sudah punya token di brankas browser.
  // Kalau ada, langsung tendang ke dashboard tanpa harus login lagi!
  useEffect(() => {
    const token = localStorage.getItem("sapa_ipb_token");
    const role = localStorage.getItem("sapa_ipb_role");
    
    if (token && role) {
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);
  
  // Fungsi ini dipanggil otomatis oleh komponen <GoogleLogin /> bawaan
  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      // credentialResponse.credential INILAH yang berisi ID Token (eyJ...)
      // yang sangat didambakan oleh backend FastAPI-mu!
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ google_id_token: credentialResponse.credential }),
      });

      const data = await response.json();
      console.log("Cek isi paket dari backend:", data);

      if (response.ok) {
        localStorage.setItem("sapa_ipb_token", data.access_token);
        localStorage.setItem("sapa_ipb_role", data.role);
        localStorage.setItem("nama_lengkap", data.nama_lengkap);
        
        if (data.role === "admin") {
          navigate("/admin/dashboard");
        } else if (data.role === "staff") {
          navigate("/staff/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        alert("Akses ditolak:\n" + JSON.stringify(data.detail, null, 2));
      }
    } catch (error) {
      console.error("Error nembak backend:", error);
      alert("Server sedang bermasalah, coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="w-full min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(180deg, #1a237e 0%, #3949ab 40%, #e8eaf6 100%)",
      }}
    >
      <section className="w-full max-w-[500px] bg-white rounded-[20px] shadow-2xl flex flex-col items-center py-12 px-8">

        <h1 className="font-extrabold text-[#130962] tracking-widest mb-3 text-6xl">
          SAPAIPB
        </h1>
        <p className="text-lg text-gray-800 mb-10 font-normal">
          Sarana Akses Layanan Akademik
        </p>

        <img
          src={image5}
          alt="Logo IPB"
          className="w-[130px] h-[130px] object-contain mb-10"
        />

        {timeoutMessage && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center font-medium text-sm">
            {timeoutMessage}
          </div>
        )}

        {/* Ganti elemen <button> buatan kita dengan komponen bawaan Google */}
        <div className="mb-5 flex justify-center w-full">
          {isLoading ? (
            <div className="py-2.5 px-6 bg-gray-200 text-gray-600 rounded-full font-medium">
              Memproses...
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                console.error("Login Failed");
                alert("Gagal memunculkan pop-up Google.");
              }}
              useOneTap={false}
              shape="pill"      // Biar bentuknya tetap melengkung
              size="large"      // Biar ukurannya proporsional
              width="280"       // Lebar sesuai tombol sebelumnya
            />
          )}
        </div>

        <p className="text-sm italic text-gray-400">
          Akses sistem dibatasi. Hanya untuk email resmi kampus
        </p>

      </section>
    </main>
  );
};

export default LoginPage;