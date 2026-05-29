import React from "react";

export const WelcomeBannerSection = ({ userName = "Pengguna", isLoading = false }) => {
  // Display user name from props (from API), fallback to "Pengguna" jika tidak ada data
  const displayName = isLoading ? "..." : (userName || "Pengguna");

  return (
    <section className="w-full mt-2">
      <p className="text-[#130962] text-base">
        <span className="font-medium">Selamat datang, </span>
        <span className="font-bold underline">{displayName}</span>
        <span className="font-medium">!</span>
      </p>
    </section>
  );
};