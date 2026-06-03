import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { HomepageMahasiswa } from "./pages/HomepageMahasiswa";
import { NotifikasiPage } from "./pages/NotifikasiPage";
import { RiwayatTiketPage } from "./pages/RiwayatTiketPage";
import { DetailTiketPage } from "./pages/DetailTiketPage";
import { HomepageStaff } from "./pages/HomepageStaff";
import { DetailTiketStaff } from "./pages/DetailTiketStaff";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { DashboardKeamanan } from "./pages/DashboardKeamanan";
import { TambahUserPage } from "./pages/TambahUserPage";
import { PusatPersetujuanPage } from "./pages/PusatPersetujuanPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Path "/dashboard" adalah halaman setelah berhasil login */}
        <Route path="/dashboard" element={<HomepageMahasiswa />} />
        <Route path="/notifikasi" element={<NotifikasiPage />} />
        <Route path="/riwayat" element={<RiwayatTiketPage />} />
        <Route path="/tiket/:id" element={<DetailTiketPage />} />
        <Route path="/staff/dashboard" element={<HomepageStaff />} />
        <Route path="/staff/tiket/:id" element={<DetailTiketStaff />} />
        <Route path="/staff/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/admin/dashboard" element={<DashboardKeamanan />} />
        <Route path="/admin/users" element={<TambahUserPage />} />
        <Route path="/admin/knowledge-base" element={<PusatPersetujuanPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;