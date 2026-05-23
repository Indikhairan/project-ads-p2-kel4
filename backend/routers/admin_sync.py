import os
import shutil
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List

from backend.ingest import knowledge_base 

router = APIRouter(
    prefix="/api/v1/admin/sync",
    tags=["Admin - AI Synchronization"]
)

# ==========================================
# 1. MOCK DATABASE (Nanti diganti PostgreSQL)
# ==========================================
# Status bisa berupa: "pending", "approved", "rejected"
db_sync_history = [
    {
        "id": 1, 
        "filename": "Panduan_Magang_2026.pdf", 
        "kategori": "Akademik",
        "uploader": "Staf Kira",
        "status": "pending", 
        "timestamp": "22 Mei 2026, 16:00"
    }
]

def kirim_notif_admin(judul_artikel: str, aksi: str):
    """
    Fungsi ini dipanggil oleh backend Staff saat ada aktivitas baru,
    untuk memberikan notifikasi ke Dashboard Admin.
    """
    # Nanti di sini isi dengan logika insert ke tabel 'notifikasi' di database PostgreSQL
    pesan = f"Notifikasi Sistem: Staff melakukan {aksi} pada dokumen '{judul_artikel}'"
    print(f"\n[BACKGROUND TASK EXEC] -> {pesan}\n")

# ==========================================
# 2. ENDPOINT: MENGAMBIL DATA UNTUK UI
# ==========================================
@router.get("/")
def get_sync_dashboard():
    """Mengambil data untuk di-render di halaman Admin Sync"""
    pending = [doc for doc in db_sync_history if doc["status"] == "pending"]
    approved = [doc for doc in db_sync_history if doc["status"] == "approved"]
    rejected = [doc for doc in db_sync_history if doc["status"] == "rejected"]
    
    return {
        "status": "success",
        "data": {
            "antrean_pending": pending,
            "riwayat_sukses": approved,
            "riwayat_ditolak": rejected
        }
    }

# ==========================================
# 3. ENDPOINT: ADMIN KLIK "SETUJUI & INGEST"
# ==========================================
@router.post("/approve/{doc_id}")
def approve_and_ingest(doc_id: int, background_tasks: BackgroundTasks):
    # Cari dokumen di database sementara
    doc = next((d for d in db_sync_history if d["id"] == doc_id), None)
    if not doc or doc["status"] != "pending":
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan di antrean")

    path_pending = os.path.join("./data_pending", doc["filename"])
    path_data = os.path.join("./data", doc["filename"])

    # Pindahkan file fisik
    if os.path.exists(path_pending):
        shutil.move(path_pending, path_data)
    else:
        raise HTTPException(status_code=404, detail="File fisik PDF hilang dari server!")

    # Ubah status di database menjadi approved
    doc["status"] = "approved"
    doc["timestamp"] = datetime.now().strftime("%d %B %Y, %H:%M")

    # TRIGGER AI BACKGROUND TASK
    print(f"🚀 Memulai proses Ingest AI untuk {doc['filename']}...")
    background_tasks.add_task(knowledge_base)

    return {"status": "success", "message": f"Dokumen {doc['filename']} disetujui. AI sedang belajar."}

# ==========================================
# 4. ENDPOINT: ADMIN KLIK "TOLAK"
# ==========================================
@router.post("/reject/{doc_id}")
def reject_document(doc_id: int):
    doc = next((d for d in db_sync_history if d["id"] == doc_id), None)
    if not doc or doc["status"] != "pending":
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan di antrean")

    path_pending = os.path.join("./data_pending", doc["filename"])

    # Hapus file fisik dari folder pending agar tidak menuhin server
    if os.path.exists(path_pending):
        os.remove(path_pending)

    # Ubah status di database menjadi rejected (tetap disimpan namanya untuk riwayat)
    doc["status"] = "rejected"
    doc["timestamp"] = datetime.now().strftime("%d %B %Y, %H:%M")

    return {"status": "success", "message": f"Dokumen {doc['filename']} berhasil ditolak dan dihapus."}