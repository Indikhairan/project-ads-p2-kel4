from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime


# ─── TIKET SCHEMAS ────────────────────────────────────────────────────────────

class TiketBase(BaseModel):
    id_layanan: str
    data_request: Dict[str, Any]
    file_lampiran: Optional[str] = None


class TiketCreate(TiketBase):
    # Data inti tiket
    id_layanan: str
    data_request: dict
    file_lampiran: Optional[str] = None
    
    # Tambahan Progressive Profiling (Data Akademik)
    nim: str
    program_studi: str
    departemen: Optional[str] = None
    fakultas: Optional[str] = None


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


# ─── NOTIFIKASI SCHEMAS ───────────────────────────────────────────────────────

class NotifikasiResponse(BaseModel):
    """Schema response notifikasi — dikembalikan ke frontend."""
    id_notifikasi: str
    pesan: str
    waktu: datetime
    is_read: bool
    id_tiket: str
    # Field turunan untuk frontend
    tipe: Optional[str] = None      # "status" | "comment" | "created"
    judul: Optional[str] = None     # Judul notifikasi (dari pesan)

    class Config:
        from_attributes = True


# ─── AUTENTIKASI SCHEMAS ──────────────────────────────────────────────────────

class GoogleLoginPayload(BaseModel):
    """Payload dari frontend setelah Google OAuth callback."""
    email: str
    nama_lengkap: str
    # Field opsional – diisi kalau user sudah terdaftar di DB
    role: Optional[str] = None


class TokenResponse(BaseModel):
    """Schema response token setelah login berhasil."""
    access_token: str
    token_type: str = "Bearer"
    role: str
    email: str
    nama_lengkap: str


class UserProfile(BaseModel):
    """Schema profil user (mahasiswa atau staff)."""
    email: str
    nama_lengkap: str
    role: str
    # Mahasiswa
    nim: Optional[str] = None
    program_studi: Optional[str] = None
    departemen: Optional[str] = None
    fakultas: Optional[str] = None
    semester: Optional[int] = None
    # Staff
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None

    class Config:
        from_attributes = True


# ─── FILE SCHEMAS ─────────────────────────────────────────────────────────────

class FileUploadResponse(BaseModel):
    """Schema response untuk upload file (POST /files/upload)."""
    file_id: str
    filename_original: str
    filename_saved: str
    url: str
    size_kb: float
