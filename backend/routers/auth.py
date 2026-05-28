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
        # PENGGUNAAN FUNGSI PINTAR (Input Manual karena token belum ada)
        sec_helper.log_aktivitas(
            db=db, 
            aksi="Login via Google",
            request=request, # Supaya otomatis ngambil IP
            email="Unknown", 
            role="Guest", 
            status_log="Failed (Invalid Token)"
        )
        raise HTTPException(status_code=401, detail="Token Google tidak valid.")

    # 2. Validasi Domain (Email Kampus)
    if not email_google.endswith("@apps.ipb.ac.id"):
        # PENGGUNAAN FUNGSI PINTAR (Input Manual)
        sec_helper.log_aktivitas(
            db=db, 
            aksi="Login via Google", 
            request=request,
            email=email_google, 
            role="Guest", 
            status_log="Failed (Non-IPB Email)"
        )
        raise HTTPException(status_code=403, detail="Hanya email kampus yang diizinkan.")

    # 3. Kelola User di Database
    user = auth_helper.kelola_user_db(db, email_google, nama_google)

    if not user.is_active:
        # PENGGUNAAN FUNGSI PINTAR (Input Manual)
        sec_helper.log_aktivitas(
            db=db, 
            aksi="Login via Google", 
            request=request,
            email=email_google, 
            role=user.role, 
            status_log="Failed (Account Disabled)"
        )
        raise HTTPException(status_code=403, detail="Akun Anda telah dinonaktifkan.")
    
    # SIMPAN DATA KE VARIABEL LOKAL DULU
    user_email = user.email
    user_nama = user.nama_lengkap
    user_role = user.role

    # 4. Panggil Dapur Keamanan (Membuat JWT)
    token_data = {"email": user_email, "nama_lengkap": user_nama, "role": user_role}
    token = sec_helper.buat_token_akses(token_data)

    # 5. Panggil Dapur Keamanan (Mencatat Log Sukses)
    # PENGGUNAAN FUNGSI PINTAR (Input Manual)
    sec_helper.log_aktivitas(
        db=db, 
        aksi="Login via Google", 
        request=request,
        email=user_email, 
        role=user_role, 
        status_log="Success"
    )

    return TokenResponse(
        access_token=token, role=user_role, email=user_email, nama_lengkap=user_nama
    )

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    # PENGGUNAAN FUNGSI PINTAR (Otomatis ekstrak token dari request)
    # Karena ini endpoint logout yang punya token di header, kita cukup lempar 'request'-nya saja!
    sec_helper.log_aktivitas(
        db=db, 
        aksi="Logout", 
        request=request, 
        status_log="Success"
    )
    
    return {"message": "Logout berhasil."}