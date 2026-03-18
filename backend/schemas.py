from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class TiketBase(BaseModel):
    id_layanan: str
    data_request: Dict[str, Any] # Disamakan dengan model
    file_lampiran: Optional[str] = None

class TiketCreate(TiketBase):
    email_mahasiswa: EmailStr

class TiketResponse(TiketBase):
    id_tiket: str # Mengikuti model
    waktu_submit: datetime # Mengikuti model
    status: str
    email_mahasiswa: str

    class Config:
        from_attributes = True