import re
from fastapi import APIRouter, Depends, HTTPException, Request, Form
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models
from backend.security import sec_helper

router = APIRouter(
    prefix="/api/v1/staff",
    tags=["Portal Staff Akademik"]
)

@router.post("/generate-key")
def buat_kunci_keamanan(request: Request, passphrase: str = Form(...),db: Session = Depends(get_db)):
    # 1. Pastikan yang akses adalah Staff
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "staff":
        raise HTTPException(status_code=403, detail="Akses Ditolak! Khusus Staff Akademik.")

    cek_kekuatan_passphrase(passphrase)
    
    email_staff = user_info.get("email")
    staff = db.query(models.StaffAkademik).filter(models.StaffAkademik.email == email_staff).first()

    if not staff:
        raise HTTPException(status_code=404, detail="Akun staff tidak ditemukan.")

    # 2. Cek apakah dia sudah pernah bikin kunci
    if staff.public_key or getattr(staff, 'encrypted_private_key', None):
        raise HTTPException(status_code=400, detail="Anda sudah memiliki Kunci Keamanan! Jika lupa Passphrase, hubungi Admin Sistem.")

    # 3. Panggil Mesin Kripto untuk buat RSA baru
    private_pem, public_pem = sec_helper.buat_pasangan_kunci()

    # 4. Bungkus Private Key menggunakan Passphrase staf (Symmetric Encryption)
    kunci_terenkripsi = sec_helper.bungkus_kunci_privat(private_pem, passphrase)

    # 5. Simpan Public Key dan Private Key Terenkripsi ke Database
    staff.public_key = public_pem
    staff.encrypted_private_key = kunci_terenkripsi
    db.commit()

    return {
        "status": "success", 
        "message": "Sertifikat Digital berhasil diaktifkan. Harap ingat Passphrase Anda baik-baik!"
    }

def cek_kekuatan_passphrase(passphrase: str):
    """
    Validasi kombinasi Passphrase:
    - Minimal 8 karakter
    - Minimal 1 huruf besar (A-Z)
    - Minimal 1 huruf kecil (a-z)
    - Minimal 1 angka (0-9)
    - Minimal 1 simbol spesial
    """
    if len(passphrase) < 8:
        raise HTTPException(status_code=400, detail="Passphrase terlalu pendek. Minimal 8 karakter.")
    if not re.search(r"[A-Z]", passphrase):
        raise HTTPException(status_code=400, detail="Passphrase harus mengandung minimal 1 huruf besar.")
    if not re.search(r"[a-z]", passphrase):
        raise HTTPException(status_code=400, detail="Passphrase harus mengandung minimal 1 huruf kecil.")
    if not re.search(r"\d", passphrase):
        raise HTTPException(status_code=400, detail="Passphrase harus mengandung minimal 1 angka.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", passphrase):
        raise HTTPException(status_code=400, detail="Passphrase harus mengandung minimal 1 karakter spesial (contoh: !@#$).")