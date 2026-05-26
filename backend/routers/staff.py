from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models
from backend.security import sec_helper

router = APIRouter(
    prefix="/api/v1/staff",
    tags=["Portal Staff Akademik"]
)

@router.post("/generate-key")
def buat_kunci_keamanan(request: Request, db: Session = Depends(get_db)):
    # 1. Pastikan yang akses adalah Staff
    user_info = sec_helper.ekstrak_token(request)
    if user_info.get("role", "").lower() != "staff":
        raise HTTPException(status_code=403, detail="Akses Ditolak! Khusus Staff Akademik.")

    email_staff = user_info.get("email")
    staff = db.query(models.StaffAkademik).filter(models.StaffAkademik.email == email_staff).first()

    if not staff:
        raise HTTPException(status_code=404, detail="Akun staff tidak ditemukan.")

    # 2. Cek apakah dia sudah pernah bikin kunci (Kunci tidak boleh ditimpa sembarangan!)
    if staff.public_key:
        raise HTTPException(status_code=400, detail="Anda sudah memiliki Kunci Keamanan! Jika kunci hilang, hubungi Admin Sistem.")

    # 3. Panggil Mesin Kripto
    private_pem, public_pem = sec_helper.buat_pasangan_kunci()

    # 4. Simpan HANYA Public Key ke database
    staff.public_key = public_pem
    db.commit()

    # 5. Bungkus Private Key menjadi file berektensi .pem untuk diunduh
    return Response(
        content=private_pem,
        media_type="application/x-pem-file",
        headers={"Content-Disposition": f"attachment; filename=SAPA_PrivateKey_{staff.nip}.pem"}
    )