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

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# ─── SCHEMAS  ──────────────
class GoogleLoginPayload(BaseModel):
    google_id_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    role: str
    email: str
    nama_lengkap: str

class GoogleAuthService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.admin_emails = ["ccmuthia@apps.ipb.ac.id"] 
        self.staff_emails = ["indikhairan@apps.ipb.ac.id"]

    def verifikasi_google(self, token: str):
        """Method 1: Cek keaslian token ke Google"""
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), self.client_id)
            return idinfo.get("email"), idinfo.get("name")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token Google tidak valid.")

    def validasi_domain(self, email: str):
        """Method 2: Gembok ketat email IPB"""
        if not email.endswith("@apps.ipb.ac.id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak. Hanya email resmi kampus (@apps.ipb.ac.id) yang diperbolehkan."
            )

    def kelola_user_db(self, db: Session, email: str, nama: str):
        """Method 3: Cari user atau auto-register dengan role yang sesuai"""
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Auto-register berdasarkan daftar email di atribut class
            if email in self.admin_emails:
                new_user = models.StaffAkademik(email=email, nama_lengkap=nama, role="admin", nip="00000000")
            elif email in self.staff_emails:
                new_user = models.StaffAkademik(email=email, nama_lengkap=nama, role="staff", nip="11111111")
            else:
                new_user = models.Mahasiswa(email=email, nama_lengkap=nama, role="mahasiswa")
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
            
        return user

#instansiasi object
auth_service = GoogleAuthService()

@router.post("/login", response_model=TokenResponse)
def login(payload: GoogleLoginPayload, request: Request, db: Session = Depends(get_db)):
    
    # 1. Panggil Method verifikasi & validasi
    email_google, nama_google = auth_service.verifikasi_google(payload.google_id_token)
    auth_service.validasi_domain(email_google)
    
    # 2. Panggil Method kelola database
    user = auth_service.kelola_user_db(db, email_google, nama_google)

    # 3. Buat JWT 
    token_data = {"email": user.email, "nama_lengkap": user.nama_lengkap, "role": user.role}
    token = security.create_access_token(token_data)

    # 4. Audit Log
    security.log_activity(
        db=db, email=user.email, role=user.role, 
        aksi="Login via Google", status_log="Success", ip_address=request.client.host
    )
    db.commit()

    return TokenResponse(
        access_token=token, role=user.role, email=user.email, nama_lengkap=user.nama_lengkap
    )

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    user_data = security.extract_token(request)
    security.log_activity(
        db=db, email=user_data["email"], role=user_data["role"], 
        aksi="Logout", status_log="Success", ip_address=request.client.host
    )
    db.commit()
    return {"message": "Logout berhasil."}