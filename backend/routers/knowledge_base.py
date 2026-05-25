import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend import models
from backend.security import sec_helper

router = APIRouter(
    prefix="/api/v1/staff/knowledge-base",
    tags=["Knowledge Base Staff"]
)

# Folder penyimpanan sementara sebelum di-ACC Admin
UPLOAD_DIR = "./data_pending"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. GET ALL DOKUMEN (Dari PostgreSQL)
@router.get("/")
def lihat_dokumen(request: Request, search: str = None, db: Session = Depends(get_db)):
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "staff": 
        raise HTTPException(status_code=403, detail="Akses Ditolak! Hanya Staff Akademik yang diizinkan.")
    query = db.query(models.KnowledgeBase)
    if search:
        query = query.filter(models.KnowledgeBase.judul.ilike(f"%{search}%"))
    return query.all()

# 2. POST / CREATE ARTIKEL DENGAN FILE PDF
@router.post("/", status_code=201)
def tambah_dokumen(
    request: Request,
    judul: str = Form(...),
    kategori: str = Form(...),
    file_dokumen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file_dokumen.filename.endswith('.pdf'):
        raise HTTPException(400, "Format dokumen harus PDF!")

    # 1. SATPAM: Ekstrak token untuk tahu email Staff yang sedang login
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "staff": 
        raise HTTPException(status_code=403, detail="Akses Ditolak! Hanya Staff Akademik yang diizinkan.")
    
    email_staf = user_info["email"]

    # 1. Simpan fisik file ke folder sementara (storage)
    file_path = os.path.join(UPLOAD_DIR, file_dokumen.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file_dokumen.file, buffer)

    # 2. Rekam data ke database PostgreSQL (Status awal: Pending)
    kb_baru = models.KnowledgeBase(
        judul=judul,
        kategori=kategori,
        path=file_path,
        filename=file_dokumen.filename,
        status="Pending",
        diupload_oleh=email_staf
    )
    db.add(kb_baru)
    db.commit()
    db.refresh(kb_baru)

    # 3. KEMBALIKAN RESPONSE (Ini yang tadi terlewat)
    return {"status": "success", "message": "Dokumen berhasil diajukan dan menunggu persetujuan."}

# 3. DELETE DOKUMEN PENDING
@router.delete("/{id}")
def hapus_dokumen(id: int, request: Request, db: Session = Depends(get_db)):
    # 1. SATPAM: Ekstrak token untuk tahu email Staff yang sedang login
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "staff": 
        raise HTTPException(status_code=403, detail="Akses Ditolak! Hanya Staff Akademik yang diizinkan.")  
    
    # 1. Cari dokumen di database
    doc = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # 2. Validasi Status (Hanya boleh hapus yang Pending)
    if doc.status != "Pending":
        raise HTTPException(
            status_code=400, 
            detail="Dokumen yang sudah diproses atau ditolak tidak bisa dihapus oleh Staff."
        )
    
    # 3. Hapus file fisik dari folder ./data_pending
    if os.path.exists(doc.path):
        os.remove(doc.path)
        
    # 4. Hapus baris data dari PostgreSQL
    db.delete(doc)
    db.commit()
    
    return {"status": "success", "message": "Ajuan dokumen berhasil dibatalkan dan dihapus."}