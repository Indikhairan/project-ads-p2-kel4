from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from backend.database import get_db
from backend import models, security

router = APIRouter(
    prefix="/api/v1/admin/security",
    tags=["Admin Security Dashboard (AAA)"]
)

# Schema untuk Audit Log (Accounting)
class AuditLogResponse(BaseModel):
    time: str
    email: str
    role: str
    activity: str
    status: str
    ip_address: str

# 1. GET STATISTIK KEAMANAN (Authentication & Authorization untuk Chart Figma)
@router.get("/stats")
def get_security_stats():
    return {
        "status": "success",
        "data": {
            "authentication": {
                "total_login_attempts": 1250,
                "success_rate_percentage": 92.5,
                "failed_attempts": 94,
                "method_breakdown": {"google_oauth": 1150, "form_login": 10}
            },
            "authorization": {
                "role_distribution": {"mahasiswa": 1100, "staff": 140, "admin": 10},
                "policy_enforcement": {"rbac_success": 4200, "rbac_denied": 15}
            }
        }
    }

# 2. GET AUDIT LOGS (Accounting - Untuk Tabel Recent Activity di Figma)
@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(page: int = 1, limit: int = 10):
    # Data mock peniru tabel aktivitas riil
    dummy_logs = [
        {"time": "08:15", "email": "budisantoso@apps.ipb.ac.id", "role": "Mahasiswa", "activity": "Submit Tiket #001", "status": "Success", "ip_address": "103.82.241.15"},
        {"time": "08:30", "email": "staff_agus@apps.ipb.ac.id", "role": "Staff", "activity": "Mengubah Status Tiket #001", "status": "Success", "ip_address": "103.82.241.22"},
        {"time": "08:32", "email": "hacker_unknown@gmail.com", "role": "Guest", "activity": "Akses /api/v1/admin/security/stats", "status": "Failed (403 Forbidden)", "ip_address": "198.51.100.45"},
        {"time": "09:00", "email": "fadia_kira@apps.ipb.ac.id", "role": "Admin", "activity": "Membuka Dashboard AAA", "status": "Success", "ip_address": "180.252.81.99"}
    ]
    return dummy_logs

router = APIRouter(
    prefix="/admin",
    tags=["Admin Page"]
)

# Schema Universal untuk Frontend (Bisa buat Admin, Staff, atau Mhs)
class TambahUserPayload(BaseModel):
    email: EmailStr
    nama_lengkap: str
    role: str # Pilihannya: "admin", "staff", atau "mahasiswa"
    
    # Opsional untuk Staff/Admin
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None
    
    # Opsional untuk Mahasiswa
    nim: Optional[str] = None
    program_studi: Optional[str] = None

@router.post("/tambah-user")
def tambah_user_manual(
    payload: TambahUserPayload, 
    request: Request,
    db: Session = Depends(get_db)
):
    # 1. KUNCI PINTU: Hanya admin yang boleh masuk ke sini
    user_data = security.extract_token(request)
    
    if user_data["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya Admin yang boleh mendaftarkan user baru."
        )

    # 2. Cek apakah email sudah terdaftar sebelumnya
    cek_email = db.query(models.User).filter(models.User.email == payload.email).first()
    if cek_email:
        raise HTTPException(status_code=400, detail=f"Email {payload.email} sudah terdaftar di sistem!")

    # 3. Logika Pendaftaran Berdasarkan Role
    if payload.role in ["admin", "staff"]:
        # Wajib ada NIP kalau daftarin Admin atau Staff
        if not payload.nip:
            raise HTTPException(status_code=400, detail="NIP wajib diisi untuk Admin dan Staff.")
            
        new_user = models.StaffAkademik(
            email=payload.email,
            nama_lengkap=payload.nama_lengkap,
            role=payload.role, # Bebas mau ngisi "admin" atau "staff"
            nip=payload.nip,
            unit_kerja=payload.unit_kerja
        )
        
    elif payload.role == "mahasiswa":
        new_user = models.Mahasiswa(
            email=payload.email,
            nama_lengkap=payload.nama_lengkap,
            role="mahasiswa",
            nim=payload.nim,
            program_studi=payload.program_studi
        )
    else:
        raise HTTPException(status_code=400, detail="Role tidak valid. Pilih admin, staff, atau mahasiswa.")

    # 4. Simpan ke Database
    db.add(new_user)
    db.commit()

    return {"message": f"Berhasil mendaftarkan {payload.nama_lengkap} sebagai {payload.role}!"}