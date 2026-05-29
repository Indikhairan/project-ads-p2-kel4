import React from "react";

export const WelcomeBannerSection = () => {
  // Nanti diganti dengan data dari backend/auth
  const namaUser = "Budi";

  return (
    <section className="w-full mt-2">
      <p className="text-[#130962] text-base">
        <span className="font-medium">Selamat datang, </span>
        <span className="font-bold underline">{namaUser}</span>
        <span className="font-medium">!</span>
      </p>
    </section>
  );
};