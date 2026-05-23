from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from backend.database import get_db
from backend import models
from backend.security import sec_helper

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin"]
)

# Schema Audit Log
class AuditLogResponse(BaseModel):
    time: str
    email: str
    role: str
    activity: str
    status: str
    ip_address: str


# Schema tambah user
class TambahUserPayload(BaseModel):
    email: EmailStr
    nama_lengkap: str
    role: str                          # "admin" | "staff" | "mahasiswa"
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None
    nim: Optional[str] = None
    program_studi: Optional[str] = None


class AdminSecurityService:
    def __init__(self, db: Session | None = None):
        self.db = db

    def get_security_stats(self) -> dict:
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

    def get_audit_logs(self, page: int = 1, limit: int = 10) -> List[dict]:
        dummy_logs = [
            {"time": "08:15", "email": "budisantoso@apps.ipb.ac.id", "role": "Mahasiswa",
             "activity": "Submit Tiket #001", "status": "Success", "ip_address": "103.82.241.15"},
            {"time": "08:30", "email": "staff_agus@apps.ipb.ac.id", "role": "Staff",
             "activity": "Mengubah Status Tiket #001", "status": "Success", "ip_address": "103.82.241.22"},
            {"time": "08:32", "email": "hacker_unknown@gmail.com", "role": "Guest",
             "activity": "Akses /api/v1/admin/security/stats", "status": "Failed (403 Forbidden)",
             "ip_address": "198.51.100.45"},
            {"time": "09:00", "email": "fadia_kira@apps.ipb.ac.id", "role": "Admin",
             "activity": "Membuka Dashboard AAA", "status": "Success", "ip_address": "180.252.81.99"}
        ]
        start = (page - 1) * limit
        return dummy_logs[start:start + limit]

    def tambah_user_manual(self, payload: TambahUserPayload) -> dict:
        if self.db is None:
            raise HTTPException(status_code=500, detail="Database tidak tersedia untuk operasi ini.")

        cek_email = self.db.query(models.User).filter(models.User.email == payload.email).first()
        if cek_email:
            raise HTTPException(
                status_code=400,
                detail=f"Email {payload.email} sudah terdaftar di sistem!"
            )

        if payload.role in ["admin", "staff"]:
            if not payload.nip:
                raise HTTPException(status_code=400, detail="NIP wajib diisi untuk Admin dan Staff.")
            new_user = models.StaffAkademik(
                email=payload.email,
                nama_lengkap=payload.nama_lengkap,
                role=payload.role,
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

        self.db.add(new_user)
        self.db.commit()
        return {"message": f"Berhasil mendaftarkan {payload.nama_lengkap} sebagai {payload.role}!"}


@router.get("/security/stats")
def get_security_stats(request: Request):
    """Statistik keamanan (Authentication & Authorization)."""
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "admin")

    service = AdminSecurityService()
    return service.get_security_stats()


@router.get("/security/logs", response_model=List[AuditLogResponse])
def get_audit_logs(request: Request, db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """
    Ambil audit log dari database (Accounting).
    Data mock dipakai sampai tabel audit_logs siap diisi data nyata.
    """
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "admin")

    service = AdminSecurityService(db)
    return service.get_audit_logs(page=page, limit=limit)


@router.post("/tambah-user")
def tambah_user_manual(
    payload: TambahUserPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """Daftarkan user baru secara manual oleh Admin."""
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "admin")

    service = AdminSecurityService(db)
    return service.tambah_user_manual(payload)
