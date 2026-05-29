import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavigationSection } from "../components/TopNavigationSection";
import { WelcomeBannerSection } from "../components/WelcomeBannerSection";
import { AcademicServicesDashboardSection } from "../components/AcademicServicesDashboardSection";
import { FormPengajuanTiket } from "../components/FormPengajuanTiket";
import { ChatbotSAPA } from "../components/ChatbotSAPA";
import { apiGet } from "../utils/apiClient";
import API_ENDPOINTS from "../config/api";
import image3 from "../assets/image-3.png";

export const HomepageMahasiswa = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const token = localStorage.getItem("sapa_ipb_token");
        if (!token) {
          setError("Silakan login terlebih dahulu");
          navigate("/login");
          return;
        }

        // Fetch user profile data
        const response = await apiGet(API_ENDPOINTS.USERS.ME, "Fetch User Profile");
        setUserProfile(response);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(err.message || "Gagal memuat profil pengguna");
        // Don't redirect, just show generic welcome message
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  return (
    <main className="bg-[#f8f9fa] w-full min-h-screen flex flex-col relative">
      <TopNavigationSection
        onBuatTiket={() => setShowForm(true)}
        formOpen={showForm}
      />
      <div className="flex-1 flex flex-col w-full max-w-[1000px] mx-auto px-6 mt-4 gap-4 pb-20">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}
        <WelcomeBannerSection userName={userProfile?.nama_lengkap} isLoading={loading} />
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