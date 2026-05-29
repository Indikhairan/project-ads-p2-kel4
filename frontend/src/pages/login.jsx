import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { apiPost } from "../utils/apiClient";
import API_ENDPOINTS from "../config/api";
import image5 from "../assets/image-5.png";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setError(null);
    try {
      // credentialResponse.credential INILAH yang berisi ID Token (eyJ...)
      const response = await apiPost(API_ENDPOINTS.AUTH.LOGIN, {
        google_id_token: credentialResponse.credential
      }, "Google Login");

      if (response) {
        localStorage.setItem("sapa_ipb_token", response.access_token);
        localStorage.setItem("sapa_ipb_role", response.role);
        
        if (response.role === "admin") {
          navigate("/admin/dashboard");
        } else if (response.role === "staff") {
          navigate("/staff/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Gagal login. Coba lagi nanti.");
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

        {/* Error message */}
        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-sm text-red-600">
            ⚠️ {error}
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
                setError("Gagal memunculkan pop-up Google. Coba refresh halaman.");
              }}
              useOneTap={false}
              shape="pill"
              size="large"
              width="280"
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