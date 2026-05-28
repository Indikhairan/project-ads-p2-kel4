import os
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv

from backend.database import get_db
from backend import models
from backend.security import sec_helper

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# Schema
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
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), self.client_id)
            return idinfo.get("email"), idinfo.get("name")
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token Google tidak valid.")

    def validasi_domain(self, email: str):
        if not email.endswith("@apps.ipb.ac.id"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hanya email kampus yang diizinkan.")

    def kelola_user_db(self, db: Session, email: str, nama: str):
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
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

# instansiasi objek
auth_helper = GoogleAuthService()

# Routers
@router.post("/login", response_model=TokenResponse)
def login(payload: GoogleLoginPayload, request: Request, db: Session = Depends(get_db)):
    
    # 1. Panggil Dapur Google
    try:
        email_google, nama_google = auth_helper.verifikasi_google(payload.google_id_token)
    except HTTPException:
        # Catat jika ada yang mencoba pakai token Google palsu
        sec_helper.log_aktivitas(
            db=db, email="Unknown", role="Guest", 
            aksi="Login via Google", status_log="Failed (Invalid Token)", ip_address=request.client.host
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Token Google tidak valid.")

    # 2. Validasi Domain (Email Kampus)
    if not email_google.endswith("@apps.ipb.ac.id"):
        # CATAT LOG GAGAL SEBELUM RAISE ERROR
        sec_helper.log_aktivitas(
            db=db, email=email_google, role="Guest", 
            aksi="Login via Google", status_log="Failed (Non-IPB Email)", ip_address=request.client.host
        )
        db.commit()
        raise HTTPException(status_code=403, detail="Hanya email kampus yang diizinkan.")

    # 3. Kelola User di Database
    user = auth_helper.kelola_user_db(db, email_google, nama_google)

    if not user.is_active:
        # CATAT LOG GAGAL JIKA AKUN DINONAKTIFKAN
        sec_helper.log_aktivitas(
            db=db, email=email_google, role=user.role, 
            aksi="Login via Google", status_log="Failed (Account Disabled)", ip_address=request.client.host
        )
        db.commit()
        raise HTTPException(status_code=403, detail="Akun Anda telah dinonaktifkan.")
    
    # SIMPAN DATA KE VARIABEL LOKAL DULU (Biar aman dari efek db.commit)
    user_email = user.email
    user_nama = user.nama_lengkap
    user_role = user.role

    # 4. Panggil Dapur Keamanan (Membuat JWT)
    token_data = {"email": user_email, "nama_lengkap": user_nama, "role": user_role}
    token = sec_helper.buat_token_akses(token_data)

    # 5. Panggil Dapur Keamanan (Mencatat Log Sukses)
    sec_helper.log_aktivitas(
        db=db, email=user_email, role=user_role, 
        aksi="Login via Google", status_log="Success", ip_address=request.client.host
    )
    db.commit()

    return TokenResponse(
        access_token=token, role=user_role, email=user_email, nama_lengkap=user_nama
    )

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    # 1. Ambil informasi user (email/role) dari token dengan aman
    email = "Unknown"
    role = "Guest"
    try:
        user_data = sec_helper.ekstrak_token(request)
        email = user_data.get("email", "Unknown")
        role = user_data.get("role", "Guest")
    except:
        pass # Biarkan tetap Unknown/Guest kalau token sudah mati

    # 2. Catat log dengan JELAS
    sec_helper.log_aktivitas(
        db=db, 
        email=email, 
        role=role, 
        aksi="Logout", 
        status_log="Success", 
        ip_address=request.client.host
    )
    
    # 3. PASTIKAN COMMIT!
    db.commit() 
    
    return {"message": "Logout berhasil."}