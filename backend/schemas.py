from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime


# ─── TIKET SCHEMAS ────────────────────────────────────────────────────────────

class TiketBase(BaseModel):
    id_layanan: str
    data_request: Dict[str, Any]
    file_lampiran: Optional[str] = None


class TiketCreate(TiketBase):
    """Schema untuk mahasiswa submit tiket baru (POST /tiket)."""
    pass


class TiketUpdate(BaseModel):
    """Schema untuk staff update status tiket (PUT /tiket/{id_tiket})."""
    status: str  # Contoh: "In Progress", "Selesai", "Ditolak"

class TiketResponse(TiketBase):
    """Schema response tiket — dikembalikan ke client."""
    id_tiket: str
    waktu_submit: datetime
    status: str
    email_mahasiswa: str
    email_staff: Optional[str] = None  # Diisi saat staff mulai memproses

    class Config:
        from_attributes = True
