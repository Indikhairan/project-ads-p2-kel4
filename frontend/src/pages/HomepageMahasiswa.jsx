import React from "react";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { WelcomeBannerSection } from "../components/WelcomeBannerSection";
import { AcademicServicesDashboardSection } from "../components/AcademicServicesDashboardSection";
import image3 from "../assets/image-3.png";

export const HomepageMahasiswa = () => {
  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col relative">
      <TopNavigationSection />
      <div className="flex-1 flex flex-col w-full max-w-[1000px] mx-auto px-6 mt-4 gap-4 pb-20">
        <WelcomeBannerSection />
        <AcademicServicesDashboardSection />
      </div>
      <button
        type="button"
        aria-label="Buka Chatbot SAPA"
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl shadow-lg hover:bg-[#283593] transition-all z-50"
      >
        <img src={image3} alt="Chatbot" className="w-8 h-8 object-contain" />
        <span className="font-semibold text-sm">CHATBOT SAPA</span>
      </button>
    </main>
  );
};

export default HomepageMahasiswa;