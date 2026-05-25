import os
import shutil
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend import models
from backend.ingest import knowledge_base
from backend.security import sec_helper

router = APIRouter(
    prefix="/api/v1/admin/sync",
    tags=["Admin Sinkronisasi Knowledge Base"]
)

DATA_DIR = "./data"
os.makedirs(DATA_DIR, exist_ok=True)

# 1. GET DATA DASHBOARD
@router.get("/")
def lihat_data_sinkronisasi(request: Request,db: Session = Depends(get_db)):
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "admin": 
        raise HTTPException(status_code=403, detail="Akses Ditolak! Hanya Admin yang diizinkan.")
    pending = db.query(models.KnowledgeBase).filter_by(status="Pending").all()
    approved = db.query(models.KnowledgeBase).filter_by(status="Approved").all()
    rejected = db.query(models.KnowledgeBase).filter_by(status="Rejected").all()
    
    return {
        "antrean_pending": pending,
        "riwayat_sukses": approved,
        "riwayat_ditolak": rejected
    }

# 2. APPROVE & INGEST AI
@router.post("/approve/{doc_id}")
def setujui_ingest(
    doc_id: int, 
    request: Request,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # 1. SATPAM: Ekstrak token untuk tahu email Admin yang sedang login
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "admin": 
        raise HTTPException(status_code=403, detail="Akses Ditolak! Hanya Admin yang diizinkan.")
    email_admin = user_info["email"]

    doc = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == doc_id).first()
    
    if not doc or doc.status != "Pending":
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan atau sudah diproses")

    path_data_utama = os.path.join(DATA_DIR, doc.filename)

    # Pindahkan file fisik dari pending ke folder data utama
    if os.path.exists(doc.path):
        shutil.move(doc.path, path_data_utama)
    else:
        raise HTTPException(status_code=404, detail="File fisik PDF hilang dari server!")

    # Ubah status di database dan update path baru
    doc.status = "Approved"
    doc.path = path_data_utama
    doc.waktu_setujui = datetime.now()
    doc.disetujui_oleh = email_admin
    db.commit()

    # TRIGGER AI BACKGROUND TASK (Membaca file PDF -> Chunking -> Vector DB)
    print(f"🚀 Memulai proses Ingest AI untuk {doc.filename}...")
    background_tasks.add_task(knowledge_base, path_data_utama)

    return {"status": "success", "message": f"Dokumen {doc.filename} disetujui. AI sedang belajar."}

# 3. REJECT DOKUMEN
@router.post("/reject/{doc_id}")
def tolak_dokumen(
    doc_id: int, 
    request: Request, # <--- Tambahkan request untuk mengambil token JWT
    db: Session = Depends(get_db)
):
    # 1. SATPAM: Ekstrak token untuk tahu email Admin yang menolak
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "admin": 
        raise HTTPException(status_code=403, detail="Akses Ditolak! Hanya Admin yang diizinkan.")
        
    email_admin = user_info["email"]

    # 2. Cari dokumen di database
    doc = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == doc_id).first()
    
    if not doc or doc.status != "Pending":
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan atau sudah diproses")

    # 3. Hapus file fisik dari folder ./data_pending agar storage server bersih
    if os.path.exists(doc.path):
        os.remove(doc.path)

    # 4. UPDATE DATABASE DENGAN REKAM JEJAK PENOLAKAN
    doc.status = "Rejected"
    doc.waktu_tolak = datetime.now() # Catat waktu penolakan
    doc.ditolak_oleh = email_admin   # Catat email eksekutornya
    
    db.commit()

    return {"status": "success", "message": f"Dokumen {doc.filename} ditolak dan dihapus oleh Admin {email_admin}."}