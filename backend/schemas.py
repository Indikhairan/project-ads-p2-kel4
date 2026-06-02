from datetime import datetime

from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from enum import Enum

class KategoriEnum(str, Enum):
    layanan = "Layanan"
    persuratan = "Persuratan"

class TiketBase(BaseModel):
    id_layanan: str
    kategori: KategoriEnum
    subjek: str
    deskripsi: Optional[str] = None
    data_request: Optional[dict] = None
    file_lampiran: Optional[str] = None
    email_mahasiswa: Optional[str] = None
    nim: Optional[str] = None
    program_studi: Optional[str] = None
    alamat: Optional[str] = None  # 🔐 Encrypted address

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class TiketCreate(BaseModel):
    id_layanan: str
    kategori: str
    subjek: str
    data_request: Dict[str, Any]
    file_lampiran: Optional[str] = None
    nim: Optional[str] = None
    program_studi: Optional[str] = None
    alamat: Optional[str] = None 
    
    departemen: Optional[str] = None
    fakultas: Optional[str] = None
    deskripsi: Optional[str] = None

    @model_validator(mode='after')
    def validate_persuratan_data(self) -> 'TiketCreate':
        # PERBAIKAN: Menggunakan dot notation karena 'self'/'values' adalah object, bukan dict
        kategori = self.kategori
        data_request = self.data_request

        if kategori == "Persuratan":
            if not data_request:
                raise ValueError("data_request wajib diisi untuk kategori Persuratan")
            
            # Validasi field dasar di dalam data_request JSONB
            if not data_request.get("jenis_surat"):
                raise ValueError("jenis_surat wajib diisi di dalam data_request")
            if not data_request.get("nama"):
                raise ValueError("nama wajib diisi di dalam data_request")
            if not data_request.get("nim"):
                raise ValueError("nim wajib diisi di dalam data_request")
                
        return self

class TanggapanResponse(BaseModel):
    """Schema response tanggapan staff."""
    id_tanggapan: str
    id_tiket: str
    email_staff: str
    pesan: str
    file_output: Optional[str] = None
    hash_lampiran: Optional[str] = None
    digital_signature: Optional[str] = None
    waktu: datetime

    class Config:
        from_attributes = True


class TiketResponse(TiketBase):
    id_tiket: str
    status: str
    waktu_submit: datetime
    email_staff: Optional[str] = None
    nim_pengaju: Optional[str] = None
    program_studi_pengaju: Optional[str] = None
    # Tanggapan staff yang terkait (jika ada)
    tanggapan: Optional[TanggapanResponse] = None

    class Config:
        from_attributes = True

class TiketUpdate(BaseModel):
    """Schema untuk staff update status tiket (PUT /tiket/{id_tiket})."""
    status: str  # Contoh: "In Progress", "Selesai", "Ditolak"

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
    # semester removed
    alamat: Optional[str] = None  # 🔐 Encrypted address
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
