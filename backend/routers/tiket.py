from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from backend.database import get_db
from backend import models, schemas, security

router = APIRouter(
    prefix="/tiket",
    tags=["Tiket"]
)


# ─── POST /tiket ──────────────────────────────────────────────────────────────
# Mahasiswa submit pengajuan tiket baru

@router.post("/", response_model=schemas.TiketResponse, status_code=status.HTTP_201_CREATED)
def buat_tiket(payload: schemas.TiketCreate, request: Request, db: Session = Depends(get_db)):
    """
    Submit pengajuan tiket layanan baru.
    - **Hak akses**: Mahasiswa
    - **Body**: id_layanan, data_request (dict), file_lampiran (opsional)
    """
    # Authentication
    user_data = security.extract_token(request)

    # Authorization: hanya mahasiswa
    security.check_role(user_data, "mahasiswa")

    # Validasi layanan ada di DB
    layanan = db.query(models.Layanan).filter(
        models.Layanan.id_layanan == payload.id_layanan
    ).first()
    if not layanan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Layanan '{payload.id_layanan}' tidak ditemukan."
        )

    # Buat ID tiket unik: {id_layanan}-{timestamp}
    generated_id = f"{payload.id_layanan}-{int(datetime.utcnow().timestamp())}"

    new_tiket = models.TiketLayanan(
        id_tiket=generated_id,
        email_mahasiswa=user_data["email"],
        id_layanan=payload.id_layanan,
        data_request=payload.data_request,
        file_lampiran=payload.file_lampiran,
        status="Open"
    )

    # Accounting: catat aktivitas ke audit log
    security.log_activity(
        db=db,
        email=user_data["email"],
        role=user_data["role"],
        aksi=f"Submit tiket baru: {generated_id}",
        status_log="Success",
        ip_address=request.client.host
    )

    db.add(new_tiket)
    db.commit()
    db.refresh(new_tiket)
    return new_tiket


# ─── GET /tiket ───────────────────────────────────────────────────────────────
# Lihat daftar tiket (mahasiswa: miliknya saja | staff/admin: semua)

@router.get("/", response_model=List[schemas.TiketResponse])
def lihat_daftar_tiket(request: Request, db: Session = Depends(get_db)):
    """
    Ambil daftar tiket layanan.
    - **Mahasiswa**: hanya melihat tiket miliknya sendiri
    - **Staff / Admin**: melihat semua tiket
    """
    # Authentication
    user_data = security.extract_token(request)

    role = user_data["role"]

    if role == "mahasiswa":
        tikets = db.query(models.TiketLayanan).filter(
            models.TiketLayanan.email_mahasiswa == user_data["email"]
        ).order_by(models.TiketLayanan.waktu_submit.desc()).all()
    elif role in ["staff", "admin"]:
        tikets = db.query(models.TiketLayanan).order_by(
            models.TiketLayanan.waktu_submit.desc()
        ).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role tidak dikenali."
        )

    return tikets


# ─── GET /tiket/{id_tiket} ────────────────────────────────────────────────────
# Lihat detail satu tiket

@router.get("/{id_tiket}", response_model=schemas.TiketResponse)
def detail_tiket(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    """
    Ambil detail tiket berdasarkan ID.
    - **Mahasiswa**: hanya bisa akses tiket miliknya
    - **Staff / Admin**: bisa akses tiket siapapun
    """
    # Authentication
    user_data = security.extract_token(request)

    tiket = db.query(models.TiketLayanan).filter(
        models.TiketLayanan.id_tiket == id_tiket
    ).first()

    if not tiket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tiket tidak ditemukan."
        )

    # Authorization: OBAC
    security.check_ticket_ownership(
        user_email=user_data["email"],
        ticket_owner_email=tiket.email_mahasiswa,
        user_role=user_data["role"]
    )

    return tiket


# ─── PUT /tiket/{id_tiket} ────────────────────────────────────────────────────
# Staff update status tiket

@router.put("/{id_tiket}", response_model=schemas.TiketResponse)
def update_status_tiket(
    id_tiket: str,
    payload: schemas.TiketUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update status tiket oleh staff akademik.
    - **Hak akses**: Staff / Admin
    - **Body**: status — pilihan: `"In Progress"`, `"Selesai"`, `"Ditolak"`
    - Staff yang memproses akan tercatat di field `email_staff`
    """
    # Authentication
    user_data = security.extract_token(request)

    # Authorization: hanya staff atau admin
    security.check_role(user_data, "staff", "admin")

    # Validasi status yang diperbolehkan
    VALID_STATUSES = {"Open", "In Progress", "Selesai", "Ditolak"}
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status tidak valid. Pilihan: {', '.join(VALID_STATUSES)}"
        )

    # Ambil tiket
    tiket = db.query(models.TiketLayanan).filter(
        models.TiketLayanan.id_tiket == id_tiket
    ).first()

    if not tiket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tiket tidak ditemukan."
        )

    # Cegah update jika tiket sudah final
    if tiket.status in ("Selesai", "Ditolak"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tiket sudah berstatus '{tiket.status}' dan tidak dapat diubah lagi."
        )

    # Update status dan catat staff pemroses
    tiket.status = payload.status
    tiket.email_staff = user_data["email"]  # Siapa staff yang menangani

    # Accounting: catat perubahan status
    security.log_activity(
        db=db,
        email=user_data["email"],
        role=user_data["role"],
        aksi=f"Update status tiket {id_tiket} → {payload.status}",
        status_log="Success",
        ip_address=request.client.host
    )

    db.commit()
    db.refresh(tiket)
    return tiket
