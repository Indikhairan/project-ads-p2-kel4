from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List

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