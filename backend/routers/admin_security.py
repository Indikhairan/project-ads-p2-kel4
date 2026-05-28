from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime, time
from zoneinfo import ZoneInfo

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
    role: str                                  
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None
    nim: Optional[str] = None
    program_studi: Optional[str] = None


class AdminSecurityService:
    def __init__(self, db: Session | None = None):
        self.db = db

    def get_security_stats(self) -> dict:
        hari_ini = date.today()
        # Jadikan rentang waktu memiliki Zona Asia/Jakarta agar cocok dengan PostgreSQL
        tz_jkt = ZoneInfo("Asia/Jakarta")
        awal_hari = datetime.combine(hari_ini, time.min).replace(tzinfo=tz_jkt)
        akhir_hari = datetime.combine(hari_ini, time.max).replace(tzinfo=tz_jkt)

        # Nilai default jika DB kosong/gagal
        jml_mahasiswa = 0
        jml_staff = 0
        jml_admin = 0
        login_sukses_hari_ini = 0
        login_gagal_hari_ini = 0
        authz_rbac_hari_ini = 0
        authz_obac_hari_ini = 0
        authz_total_hari_ini = 0
        hourly_data = []

        # Simulasi untuk all_time
        login_sukses_all = 4500
        login_gagal_all = 210
        authz_rbac_all = 1200
        authz_obac_all = 1500
        authz_total_all = 5800

        if self.db:
            # 1. AUTHORIZATION (Distribusi Role Akun yang Terdaftar)
            jml_mahasiswa = self.db.query(models.Mahasiswa).count()
            jml_staff = self.db.query(models.StaffAkademik).filter(models.StaffAkademik.role == "staff").count()
            jml_admin = self.db.query(models.StaffAkademik).filter(models.StaffAkademik.role == "admin").count()

            # 2. AUTHENTICATION (Login HARI INI)
            log_login_hari_ini = self.db.query(models.AuditLog).filter(
                models.AuditLog.waktu >= awal_hari,
                models.AuditLog.waktu <= akhir_hari,
                models.AuditLog.aksi.ilike("%Login%")
            ).all()

            login_sukses_hari_ini = sum(1 for log in log_login_hari_ini if "Success" in log.status)
            login_gagal_hari_ini = sum(1 for log in log_login_hari_ini if "Failed" in log.status)

            jam_dict = {}
            for log in log_login_hari_ini:
                waktu_wib = log.waktu.astimezone(tz_jkt)
                jam_str = f"{waktu_wib.hour:02d}:00" 
                if jam_str not in jam_dict:
                    jam_dict[jam_str] = {"success": 0, "failed": 0}
                
                if "Success" in log.status:
                    jam_dict[jam_str]["success"] += 1
                else:
                    jam_dict[jam_str]["failed"] += 1

            hourly_data = [{"time": k, "success": v["success"], "failed": v["failed"]} for k, v in sorted(jam_dict.items())]

            # 3. AUTHORIZATION (Akses Resource HARI INI)
            log_akses_hari_ini = self.db.query(models.AuditLog).filter(
                models.AuditLog.waktu >= awal_hari,
                models.AuditLog.waktu <= akhir_hari,
                ~models.AuditLog.aksi.ilike("%Login%"),
                ~models.AuditLog.aksi.ilike("%Logout%")
            ).all()

            # --- PERBAIKAN PENGHITUNGAN GRAFIK DI SINI ---
            authz_total_hari_ini = sum(1 for log in log_akses_hari_ini if "Success" in log.status)
            authz_rbac_hari_ini = sum(1 for log in log_akses_hari_ini if "RBAC" in log.status)
            authz_obac_hari_ini = sum(1 for log in log_akses_hari_ini if "OBAC" in log.status)

        total_login_hari_ini = login_sukses_hari_ini + login_gagal_hari_ini
        persentase_sukses = round((login_sukses_hari_ini / total_login_hari_ini * 100), 1) if total_login_hari_ini > 0 else 0.0

        total_login_all = login_sukses_all + login_gagal_all
        persentase_sukses_all = round((login_sukses_all / total_login_all * 100), 1) if total_login_all > 0 else 0.0

        return {
            "status": "success",
            "data": {
                "today": {
                    "authentication": {
                        "total_login": total_login_hari_ini,
                        "success": login_sukses_hari_ini,
                        "failed": login_gagal_hari_ini,
                        "success_rate": persentase_sukses,
                        "hourly_activity": hourly_data 
                    },
                    "authorization": {
                        "authorized_total": authz_total_hari_ini,
                        "rbac_count": authz_rbac_hari_ini,
                        "obac_count": authz_obac_hari_ini
                    }
                },
                "all_time": {
                    "authentication": {
                        "total_login": total_login_all,
                        "success": login_sukses_all,
                        "failed": login_gagal_all,
                        "success_rate": persentase_sukses_all,
                    },
                    "authorization": {
                        "authorized_total": authz_total_all,
                        "rbac_count": authz_rbac_all,
                        "obac_count": authz_obac_all
                    }
                } 
            }
        }

    def get_audit_logs(self, page: int = 1, limit: int = 10) -> List[dict]:
        # Cek jika tidak ada koneksi DB
        if not self.db:
            return []

        hari_ini = date.today()
        tz_jkt = ZoneInfo("Asia/Jakarta")
        awal_hari = datetime.combine(hari_ini, time.min).replace(tzinfo=tz_jkt)
        akhir_hari = datetime.combine(hari_ini, time.max).replace(tzinfo=tz_jkt)

        # Query Database Riil
        logs_db = self.db.query(models.AuditLog).filter(
            models.AuditLog.waktu >= awal_hari,
            models.AuditLog.waktu <= akhir_hari
        ).order_by(models.AuditLog.waktu.desc()).offset((page - 1) * limit).limit(limit).all()

        formatted_logs = []
        for log in logs_db:
            waktu_wib = log.waktu.astimezone(tz_jkt)
            formatted_logs.append({
                "time": waktu_wib.strftime("%H:%M"), 
                "email": log.email_aktor,
                "role": log.role_aktor,
                "activity": log.aksi,
                "status": log.status,
                "ip_address": log.ip_address or "Unknown"
            })

        return formatted_logs

    def tambah_user_manual(self, payload: TambahUserPayload) -> dict:
        if self.db is None:
            raise HTTPException(status_code=500, detail="Database tidak tersedia.")

        cek_email = self.db.query(models.User).filter(models.User.email == payload.email).first()
        if cek_email:
            raise HTTPException(status_code=400, detail=f"Email {payload.email} sudah terdaftar di sistem!")

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
            raise HTTPException(status_code=400, detail="Role tidak valid.")

        self.db.add(new_user)
        self.db.commit()
        return {"message": f"Berhasil mendaftarkan {payload.nama_lengkap} sebagai {payload.role}!"}


# Pastikan Depends(get_db) masuk ke parameter!
@router.get("/security/stats")
def get_security_stats(request: Request, db: Session = Depends(get_db)):
    """Statistik keamanan (Authentication & Authorization)."""
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "admin")

    service = AdminSecurityService(db) # Masukkan db ke Service
    return service.get_security_stats()


@router.get("/security/logs", response_model=List[AuditLogResponse])
def get_audit_logs(request: Request, db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Ambil audit log dari database (Accounting)."""
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "admin")

    service = AdminSecurityService(db) # Masukkan db ke Service
    return service.get_audit_logs(page=page, limit=limit)


@router.post("/tambah-user")
def tambah_user_manual(
    payload: TambahUserPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """Daftarkan user baru secara manual oleh Admin."""
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "admin")

    service = AdminSecurityService(db)
    hasil = service.tambah_user_manual(payload)
    
    # --- TANAM LOG UNTUK PENAMBAHAN USER BARU ---
    sec_helper.log_aktivitas(
        db=db, 
        aksi=f"Tambah user baru: {payload.email} ({payload.role})", 
        request=request
    )
    
    return hasil