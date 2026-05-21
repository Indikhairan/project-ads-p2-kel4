import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from backend import models 

load_dotenv()

class SecurityService:
    def __init__(self):
        """Constructor: Menyiapkan amunisi keamanan saat server baru menyala"""
        self.secret_key = os.getenv("SECRET_KEY")
        self.algorithm = "HS256"
        self.expire_minutes = 60

        if not self.secret_key:
            raise ValueError("SECRET_KEY tidak ditemukan. Pastikan file .env sudah ada")

    # Authentication
    def buat_token_akses(self, data: dict) -> str:
        """Buat JWT access token dengan expiry."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.expire_minutes)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verifikasi_token(self, token: str) -> dict:
        """Verifikasi JWT — kembalikan payload atau error."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return {"status": "success", "data": payload}

        except jwt.ExpiredSignatureError:
            return {"status": "error", "message": "Session timeout, silakan login ulang."}

        except jwt.InvalidTokenError:
            return {"status": "error", "message": "Token tidak valid. Unauthorized."}

    def ekstrak_token(self, request: Request) -> dict:
        """Helper: ambil dan verifikasi token dari header Authorization."""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak ditemukan. Harap login terlebih dahulu."
            )
        
        token = auth_header.split(" ")[1]
        user_info = self.verifikasi_token(token) 
        
        if user_info["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=user_info["message"]
            )
        return user_info["data"]
    
    # Authorization
    def cek_role(self, user_data: dict, *required_roles: str):
        """Pastikan user memiliki salah satu dari role yang diperbolehkan."""
        if user_data.get("role") not in required_roles:
            allowed = " / ".join(required_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak! Hanya {allowed} yang diperbolehkan."
            )

    def cek_kepemilikan_tiket(self, user_email: str, ticket_owner_email: str, user_role: str):
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

    # Accounting
    def log_aktivitas(self, db: Session, email: str, role: str, aksi: str, status_log: str, ip_address: str):
        """Simpan audit log ke database tanpa di-commit otomatis."""
        new_log = models.AuditLog(
            waktu=datetime.utcnow(),
            email_aktor=email,
            role_aktor=role,
            aksi=aksi,
            status=status_log,
            ip_address=ip_address
        )
        db.add(new_log)

# objek sec_helper yang akan di import ke file router
sec_helper = SecurityService()