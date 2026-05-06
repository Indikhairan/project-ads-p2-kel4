import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { HomepageMahasiswa } from "./pages/HomepageMahasiswa";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Path "/" adalah halaman pertama kali web dibuka (Login) */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Path "/dashboard" adalah halaman setelah berhasil login */}
        <Route path="/dashboard" element={<HomepageMahasiswa />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;