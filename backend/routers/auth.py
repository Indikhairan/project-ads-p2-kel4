import os
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv

from backend.database import get_db
from backend import models, security

load_dotenv()
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# ─── SCHEMAS ──────────────────────────────────────────────────────────────────

class GoogleLoginPayload(BaseModel):
    """Payload dari frontend HARUS HANYA token Google. Jangan terima email mentah."""
    google_id_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    role: str
    email: str
    nama_lengkap: str

class UserProfile(BaseModel):
    email: str
    nama_lengkap: str
    role: str
    # Mahasiswa
    nim: Optional[str] = None
    program_studi: Optional[str] = None
    departemen: Optional[str] = None
    fakultas: Optional[str] = None
    semester: Optional[int] = None
    # Staff
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None

    class Config:
        from_attributes = True


# ─── POST /auth/login ─────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(payload: GoogleLoginPayload, request: Request, db: Session = Depends(get_db)):
    """
    Login via Google OAuth yang AMAN.
    """
    try:
        # 1. VERIFIKASI KE GOOGLE (Mencegah pemalsuan email)
        idinfo = id_token.verify_oauth2_token(
            payload.google_id_token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        # 2. Ambil email dan nama yang VALID dari server Google
        email_google = idinfo.get("email")
        nama_google = idinfo.get("name")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token Google tidak valid atau sudah kadaluarsa.")

    # 3. Validasi domain email kampus
    if not email_google.endswith("@apps.ipb.ac.id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya email resmi kampus (@apps.ipb.ac.id) yang diperbolehkan."
        )

    # 4. Cari user di DB (Menggunakan email valid dari Google)
    user = db.query(models.User).filter(models.User.email == email_google).first()

    if payload.email == "fadia.syakira@apps.ipb.ac.id": 
        payload.role = "admin" # Bisa kamu ganti-ganti di sini jadi "staff" saat mau ngetes

    if not user:
        # 1. ADMIN PERTAMA (Genesis Account)
        admin_emails = [
            "admin@apps.ipb.ac.id" # Emailmu sebagai pemegang kunci pertama
        ]

        if email_google in admin_emails:
            new_user = models.StaffAkademik(
                email=email_google,
                nama_lengkap=nama_google,
                role="admin",      # Langsung jadi admin biasa
                nip="00000000"     # NIP default untuk admin awal
            )
        else:
            # Auto-registrasi untuk Mahasiswa
            new_user = models.Mahasiswa(
                email=email_google,
                nama_lengkap=nama_google,
                role="mahasiswa"
            )
            
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    # 5. Buat JWT
    token_data = {
        "email": user.email,
        "nama_lengkap": user.nama_lengkap,
        "role": user.role
    }
    token = security.create_access_token(token_data)

    # 6. Accounting / Audit Log
    security.log_activity(
        db=db,
        email=user.email,
        role=user.role,
        aksi="Login via Google",
        status_log="Success",
        ip_address=request.client.host
    )
    db.commit()

    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        nama_lengkap=user.nama_lengkap
    )


# ─── POST /auth/logout ────────────────────────────────────────────────────────
# (Sama persis seperti kodenya Kira, tidak ada perubahan)
@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    user_data = security.extract_token(request)

    security.log_activity(
        db=db,
        email=user_data["email"],
        role=user_data["role"],
        aksi="Logout",
        status_log="Success",
        ip_address=request.client.host
    )
    db.commit()

    return {"message": "Logout berhasil."}


# ─── GET /auth/me ─────────────────────────────────────────────────────────────
# (Sama persis seperti kodenya Kira, tidak ada perubahan)
@router.get("/me", response_model=UserProfile)
def get_profile(request: Request, db: Session = Depends(get_db)):
    user_data = security.extract_token(request)
    email = user_data["email"]

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    profile = UserProfile(
        email=user.email,
        nama_lengkap=user.nama_lengkap,
        role=user.role
    )

    if user.role == "mahasiswa":
        mhs = db.query(models.Mahasiswa).filter(models.Mahasiswa.email == email).first()
        if mhs:
            profile.nim = mhs.nim
            profile.program_studi = mhs.program_studi
            profile.departemen = mhs.departemen
            profile.fakultas = mhs.fakultas
            profile.semester = mhs.semester

    elif user.role in ("staff", "admin"):
        staff = db.query(models.StaffAkademik).filter(models.StaffAkademik.email == email).first()
        if staff:
            profile.nip = staff.nip
            profile.unit_kerja = staff.unit_kerja

    return profile