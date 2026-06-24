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
  const [accessDenied, setAccessDenied] = useState(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("sapa_ipb_token");
    if (!token) {
      window.location.href = "/login?timeout=1";
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== "mahasiswa") {
        setAccessDenied(true);
      }
    } catch (e) {
      window.location.href = "/login?timeout=1";
    } finally {
      setIsVerifyingAccess(false);
    }
  }, []);

  if (isVerifyingAccess) {
    return <main className="bg-[#f8f9fa] w-full min-h-screen flex-1"></main>;
  }

  if (accessDenied) {
    return (
      <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col">
        <TopNavigationSection />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-gray-100 p-8 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h1 className="font-bold text-[#130962] text-2xl mb-3">Akses Ditolak</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Mohon maaf, Anda tidak memiliki izin (Role) untuk mengakses halaman ini. 
              Silakan kembali ke halaman sebelumnya.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="w-full py-3.5 bg-[#130962] text-white font-bold rounded-xl hover:bg-[#1a237e] transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Kembali
            </button>
          </div>
        </div>
      </main>
    );
  }

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