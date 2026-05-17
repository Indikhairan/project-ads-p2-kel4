import React from "react";
import { useNavigate } from "react-router-dom";
import image5 from "../assets/image-5.png";

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/dashboard");
  };

  return (
    <main
      className="w-full min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(180deg, #1a237e 0%, #3949ab 40%, #e8eaf6 100%)",
      }}
    >
      <section className="w-full max-w-[500px] bg-white rounded-[20px] shadow-2xl flex flex-col items-center py-12 px-8">

        {/* Judul */}
        <h1 className="font-extrabold text-[#130962] tracking-widest mb-3 text-6xl">
          SAPAIPB
        </h1>
        <p className="text-lg text-gray-800 mb-10 font-normal">
          Sarana Akses Layanan Akademik
        </p>

        {/* Logo IPB */}
        <img
          src={image5}
          alt="Logo IPB"
          className="w-[130px] h-[130px] object-contain mb-10"
        />

        {/* Tombol Sign In */}
        <button
          onClick={handleSignIn}
          className="w-[280px] py-2.5 bg-[#1a237e] text-white rounded-full font-medium text-base hover:bg-[#283593] transition-colors shadow-lg mb-5"
        >
          Sign in with Google
        </button>

        {/* Disclaimer */}
        <p className="text-sm italic text-gray-400">
          Akses sistem dibatasi. Hanya untuk email resmi kampus
        </p>

      </section>
    </main>
  );
};

export default LoginPage;