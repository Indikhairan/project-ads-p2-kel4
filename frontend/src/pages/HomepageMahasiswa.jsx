import React, { useState } from "react";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { WelcomeBannerSection } from "../components/WelcomeBannerSection";
import { AcademicServicesDashboardSection } from "../components/AcademicServicesDashboardSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import image3 from "../assets/image-3.png";

export const HomepageMahasiswa = () => {
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col relative">
      <TopNavigationSection
        onBuatTiket={() => setShowForm(true)}
        formOpen={showForm}
      />
      <div className="flex-1 flex flex-col w-full max-w-[1000px] mx-auto px-6 mt-4 gap-4 pb-20">
        <WelcomeBannerSection />
        <AcademicServicesDashboardSection />
      </div>
      <button
        type="button"
        onClick={() => setShowChatbot((prev) => !prev)}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl shadow-lg hover:bg-[#283593] transition-all z-40"
      >
        <img src={image3} alt="Chatbot" className="w-8 h-8 object-contain" />
        <span className="font-semibold text-sm">CHATBOT SAPA</span>
      </button>

      {showForm && <FormPengajuanTiket onClose={() => setShowForm(false)} />}
      {showChatbot && <ChatbotSAPA onClose={() => setShowChatbot(false)} />}
    </main>
  );
};

export default HomepageMahasiswa;