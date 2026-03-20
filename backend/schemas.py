from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class TiketBase(BaseModel):
    id_layanan: str
    data_request: Dict[str, Any]
    file_lampiran: Optional[str] = None

class TiketCreate(TiketBase):
    pass

class TiketResponse(TiketBase):
    id_tiket: str
    waktu_submit: datetime
    status: str
    email_mahasiswa: str

    class Config:
        from_attributes = True