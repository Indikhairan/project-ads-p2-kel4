from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend import models, schemas, security
from datetime import datetime

router = APIRouter(
    prefix="/tiket",
    tags=["Tiket"]
)

# 1. POST: Buat Tiket Baru 
@router.post("/", response_model=schemas.TiketResponse)
def buat_tiket(payload: schemas.TiketCreate, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Token missing")
    
    token = auth_header.split(" ")[1]
    user_info = security.verify_token(token)
    
    if user_info["status"] == "error":
        raise HTTPException(status_code=401, detail=user_info["message"])

    # Authorization: Cek Role Mahasiswa
    security.check_role(user_info["data"], "mahasiswa")
    generated_id = f"{payload.id_layanan}-{int(datetime.utcnow().timestamp())}"
    new_tiket = models.TiketLayanan(
        id_tiket=generated_id,
        email_mahasiswa=user_info["data"]["email"],
        id_layanan=payload.id_layanan,
        data_request=payload.data_request,
        file_lampiran=payload.file_lampiran,
        status="Open"
    )
    
    # Accounting: Log aktivitas 
    security.log_activity(
        email=user_info["data"]["email"],
        role=user_info["data"]["role"],
        aksi="Membuat Tiket Baru",
        status="Success",
        ip_address=request.client.host
    )

    db.add(new_tiket)
    db.commit()
    db.refresh(new_tiket)
    return new_tiket

# 2.GET: Ambil Daftar Tiket
@router.get("/", response_model=List[schemas.TiketResponse])
def ambil_semua_tiket(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Token missing")
    token = auth_header.split(" ")[1]
    user_info = security.verify_token(token)
    if user_info["status"] == "error":
        raise HTTPException(status_code=401, detail=user_info["message"])
    user_data = user_info["data"]

    # Mahasiswa cuma lihat miliknya, Staff/Admin lihat semua
    if user_data["role"] == "mahasiswa":
        return db.query(models.TiketLayanan).filter(
            models.TiketLayanan.email_mahasiswa == user_data["email"]
        ).all()
    else:
        return db.query(models.TiketLayanan).all()

# 3. GET: Detail Tiket Spesifik 
@router.get("/{id_tiket}", response_model=schemas.TiketResponse)
def detail_tiket(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Token missing")
    
    token = auth_header.split(" ")[1]
    user_info = security.verify_token(token)
    
    if user_info["status"] == "error":
        raise HTTPException(status_code=401, detail=user_info["message"])

    # Ambil data tiket
    tiket = db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
    if not tiket:
        raise HTTPException(status_code=404, detail="Tiket tidak ditemukan")

    # Authorization: OBAC
    security.check_ticket_ownership(
        user_email=user_info["data"]["email"],
        ticket_owner_email=tiket.email_mahasiswa,
        user_role=user_info["data"]["role"]
    )
    
    return tiket