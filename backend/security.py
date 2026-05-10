import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ─── AUTHENTICATION ───────────────────────────────────────────────────────────

def create_access_token(data: dict):
    """Buat JWT access token dengan expiry."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verifikasi JWT — kembalikan payload atau error."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"status": "success", "data": payload}

    except jwt.ExpiredSignatureError:
        return {"status": "error", "message": "Session timeout, silakan login ulang."}

    except jwt.InvalidTokenError:
        return {"status": "error", "message": "Token tidak valid. Unauthorized."}


def extract_token(request) -> dict:
    """
    Helper: ambil dan verifikasi token dari header Authorization.
    Raise HTTP 401 langsung jika gagal.
    """
    from fastapi import Request
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak ditemukan. Harap login terlebih dahulu."
        )
    token = auth_header.split(" ")[1]
    user_info = verify_token(token)
    if user_info["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=user_info["message"]
        )
    return user_info["data"]


# ─── AUTHORIZATION ────────────────────────────────────────────────────────────

# Role-Based Access Control (RBAC)
def check_role(user_data: dict, *required_roles: str):
    """
    Pastikan user memiliki salah satu dari role yang diperbolehkan.
    Contoh: check_role(user_data, "mahasiswa")
            check_role(user_data, "staff", "admin")
    """
    if user_data.get("role") not in required_roles:
        allowed = " / ".join(required_roles)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Akses ditolak! Hanya {allowed} yang diperbolehkan."
        )


# Ownership-Based Access Control (OBAC)
def check_ticket_ownership(user_email: str, ticket_owner_email: str, user_role: str):
    """
    Staff dan admin boleh akses semua tiket.
    Mahasiswa hanya boleh akses tiket miliknya sendiri.
    """
    if user_role in ["staff", "admin"]:
        return True
    if user_email != ticket_owner_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Ini bukan tiket milik Anda."
        )


# ─── ACCOUNTING ───────────────────────────────────────────────────────────────

def log_activity(db: Session, email: str, role: str, aksi: str, status_log: str, ip_address: str):
    """
    Simpan audit log ke database.
    Harus dipanggil dengan db session agar benar-benar tersimpan.
    """
    from backend import models  # import di sini untuk hindari circular import

    new_log = models.AuditLog(
        waktu=datetime.utcnow(),
        email_aktor=email,
        role_aktor=role,
        aksi=aksi,
        status=status_log,
        ip_address=ip_address
    )
    db.add(new_log)
    # Tidak commit di sini — biarkan caller yang commit bersama operasi utama