from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend import models, security

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


# ─── SCHEMAS ──────────────────────────────────────────────────────────────────

class GoogleLoginPayload(BaseModel):
    """Payload dari frontend setelah Google OAuth callback."""
    email: str
    nama_lengkap: str
    # Field opsional – diisi kalau user sudah terdaftar di DB
    role: Optional[str] = None


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
# Dipanggil frontend setelah Google OAuth berhasil.
# Frontend kirim email + nama dari Google, backend cek DB dan keluarkan JWT.

@router.post("/login", response_model=TokenResponse)
def login(payload: GoogleLoginPayload, request: Request, db: Session = Depends(get_db)):
    """
    Login via Google OAuth.
    - Cek apakah email terdaftar di database.
    - Jika ya → keluarkan JWT dengan role yang sesuai.
    - Jika tidak → daftar otomatis sebagai mahasiswa (bisa disesuaikan).
    """
    # Validasi domain email kampus
    if not payload.email.endswith("@apps.ipb.ac.id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya email resmi kampus (@apps.ipb.ac.id) yang diperbolehkan."
        )

    # Cari user di DB
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user:
        # Auto-register sebagai mahasiswa (role default)
        # Di produksi: admin yang assign role, atau perlu kode registrasi
        new_user = models.User(
            email=payload.email,
            nama_lengkap=payload.nama_lengkap,
            role="mahasiswa"
        )
        db.add(new_user)
        # Buat entry mahasiswa
        new_mhs = models.Mahasiswa(
            email=payload.email,
        )
        db.add(new_mhs)
        db.commit()
        db.refresh(new_user)
        user = new_user

    # Buat JWT
    token_data = {
        "email": user.email,
        "nama_lengkap": user.nama_lengkap,
        "role": user.role
    }
    token = security.create_access_token(token_data)

    # Accounting
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

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    """
    Logout — catat aktivitas ke audit log.
    JWT invalidation dilakukan di sisi client (hapus token dari storage).
    """
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

@router.get("/me", response_model=UserProfile)
def get_profile(request: Request, db: Session = Depends(get_db)):
    """
    Ambil profil user yang sedang login.
    Digunakan frontend untuk:
    - Menampilkan nama di WelcomeBanner
    - Menentukan routing (mahasiswa → /dashboard, staff → /staff/dashboard)
    - Mengisi field otomatis di FormPengajuanTiket (nama, NIM, prodi, dll)
    """
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