from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models, schemas
from datetime import datetime, timezone

router = APIRouter(
    prefix="/tiket",
    tags=["Tiket"]
)

@router.post("/", response_model=schemas.TiketResponse)
def buat_tiket(payload: schemas.TiketCreate, db: Session = Depends(get_db)):
    # Logika pembuatan ID sederhana (Misal: LAYANAN-TIMESTAMP)
    generated_id = f"{payload.id_layanan}-{int(datetime.utcnow().timestamp())}"

    new_tiket = models.TiketLayanan(
        id_tiket=generated_id,
        email_mahasiswa=payload.email_mahasiswa,
        id_layanan=payload.id_layanan,
        data_request=payload.data_request,
        file_lampiran=payload.file_lampiran,
        status="Open"
    )
    
    db.add(new_tiket)
    db.commit()
    db.refresh(new_tiket)
    return new_tiket