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
def lihat_data_sinkronisasi(request: Request, db: Session = Depends(get_db)):
    user_info = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR (Otomatis catat log kalau ada pelanggaran RBAC)
    sec_helper.cek_role(user_info, db, request, "admin")
    
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
    user_info = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR
    sec_helper.cek_role(user_info, db, request, "admin")
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

    # --- TANAM LOG AKTIVITAS DI SINI ---
    sec_helper.log_aktivitas(
        db=db, 
        aksi=f"Approve dokumen Knowledge Base: {doc.filename}", 
        request=request
    )

    return {"status": "success", "message": f"Dokumen {doc.filename} disetujui. AI sedang belajar."}

# 3. REJECT DOKUMEN
@router.post("/reject/{doc_id}")
def tolak_dokumen(
    doc_id: int, 
    request: Request, 
    db: Session = Depends(get_db)
):
    user_info = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR
    sec_helper.cek_role(user_info, db, request, "admin")
    email_admin = user_info["email"]

    # Cari dokumen di database
    doc = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == doc_id).first()
    
    if not doc or doc.status != "Pending":
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan atau sudah diproses")

    # Hapus file fisik dari folder ./data_pending agar storage server bersih
    if os.path.exists(doc.path):
        os.remove(doc.path)

    # UPDATE DATABASE DENGAN REKAM JEJAK PENOLAKAN
    doc.status = "Rejected"
    doc.waktu_tolak = datetime.now() 
    doc.ditolak_oleh = email_admin   
    db.commit()

    # --- TANAM LOG AKTIVITAS DI SINI ---
    sec_helper.log_aktivitas(
        db=db, 
        aksi=f"Reject dokumen Knowledge Base: {doc.filename}", 
        request=request,
        status_log="Success (Rejected)" # Status log bisa disesuaikan agar mudah difilter
    )

    return {"status": "success", "message": f"Dokumen {doc.filename} ditolak dan dihapus oleh Admin {email_admin}."}