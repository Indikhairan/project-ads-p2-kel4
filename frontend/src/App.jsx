import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { HomepageMahasiswa } from "./pages/HomepageMahasiswa";
import { NotifikasiPage } from "./pages/NotifikasiPage";
import { RiwayatTiketPage } from "./pages/RiwayatTiketPage";
import { DetailTiketPage } from "./pages/DetailTiketPage";
import { HomepageStaff } from "./pages/HomepageStaff";
import { DetailTiketStaff } from "./pages/DetailTiketStaff";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Path "/" adalah halaman pertama kali web dibuka (Login) */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Path "/dashboard" adalah halaman setelah berhasil login */}
        <Route path="/dashboard" element={<HomepageMahasiswa />} />
        <Route path="/notifikasi" element={<NotifikasiPage />} />
        <Route path="/riwayat" element={<RiwayatTiketPage />} />
        <Route path="/tiket/:id" element={<DetailTiketPage />} />
        <Route path="/staff/dashboard" element={<HomepageStaff />} />
        <Route path="/staff/tiket/:id" element={<DetailTiketStaff />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;