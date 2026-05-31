import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
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
    # SATPAM PINTAR: Validasi Token & Role
    user_info = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_info, db, request, "staff", "admin") # Beri akses ke Admin juga untuk melihat
    
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

    # 1. SATPAM PINTAR: Validasi Token & Role
    user_info = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_info, db, request, "staff")
    
    email_staf = user_info["email"]

    # 2. Simpan fisik file ke folder sementara (storage)
    file_path = os.path.join(UPLOAD_DIR, file_dokumen.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file_dokumen.file, buffer)

    # 3. Rekam data ke database PostgreSQL (Status awal: Pending)
    kb_baru = models.KnowledgeBase(
        judul=judul,
        kategori=kategori,
        path=file_path,
        filename=file_dokumen.filename,
        status="Pending",
        diupload_oleh=email_staf
    )
    db.add(kb_baru)
    
    # 4. TANAM LOG & COMMIT
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Mengunggah draft Knowledge Base: {file_dokumen.filename}",
        request=request
    )

    return {"status": "success", "message": "Dokumen berhasil diajukan dan menunggu persetujuan."}

# 3. DELETE DOKUMEN PENDING
@router.delete("/{id}")
def hapus_dokumen(id: int, request: Request, db: Session = Depends(get_db)):
    # 1. SATPAM PINTAR: Validasi Token & Role
    user_info = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_info, db, request, "staff")  
    
    email_staf = user_info["email"]
    
    # 2. Cari dokumen di database
    doc = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id == id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # 3. GERBANG OBAC: Pastikan yang menghapus adalah uploader aslinya
    if doc.diupload_oleh != email_staf:
        sec_helper.log_aktivitas(
            db=db,
            aksi=f"Mencoba menghapus dokumen KB milik {doc.diupload_oleh}",
            request=request,
            status_log="Failed (OBAC - Unauthorized)"
        )
        raise HTTPException(
            status_code=403, 
            detail="Akses ditolak! Anda hanya bisa membatalkan dokumen yang Anda unggah sendiri."
        )
    
    # 4. Validasi Status (Hanya boleh hapus yang Pending)
    if doc.status != "Pending":
        raise HTTPException(
            status_code=400, 
            detail="Dokumen yang sudah diproses atau ditolak tidak bisa dihapus."
        )
    
    # 5. Hapus file fisik dari folder ./data_pending
    if os.path.exists(doc.path):
        os.remove(doc.path)
        
    # 6. Hapus baris data dari PostgreSQL
    db.delete(doc)
    
    # 7. TANAM LOG & COMMIT
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Membatalkan & menghapus draft KB: {doc.filename}",
        request=request
    )
    
    return {"status": "success", "message": "Ajuan dokumen berhasil dibatalkan dan dihapus."}

# 4. DOWNLOAD DOKUMEN PDF
@router.get("/{id}/download")
def download_dokumen(id: int, request: Request, db: Session = Depends(get_db)):
    # 1. SATPAM PINTAR: Validasi Token & Role
    user_info = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_info, db, request, "staff", "admin")
    
    # 2. Cari dokumen di database
    doc = db.query(models.KnowledgeBase).filter(models.KnowledgeBase.id_kb == id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # 3. Validasi file fisik ada
    if not os.path.exists(doc.path):
        raise HTTPException(status_code=404, detail="File PDF tidak ditemukan di server")
    
    # 4. TANAM LOG & Return file
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Download dokumen KB: {doc.filename}",
        request=request
    )
    
    return FileResponse(
        path=doc.path,
        filename=doc.filename,
        media_type="application/pdf"
    )