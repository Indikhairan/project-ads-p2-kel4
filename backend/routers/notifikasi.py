from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from backend.database import get_db
from backend import models, security

router = APIRouter(
    prefix="/notifikasi",
    tags=["Notifikasi"]
)


# ─── SCHEMAS ──────────────────────────────────────────────────────────────────

class NotifikasiResponse(BaseModel):
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


def _enrich(n: models.Notifikasi) -> dict:
    """Tambahkan field tipe & judul berdasarkan isi pesan."""
    pesan = n.pesan or ""
    if "dibuat" in pesan.lower() or "berhasil" in pesan.lower():
        tipe = "created"
        judul = f"TIKET #{n.id_tiket.upper()} BERHASIL DIBUAT"
    elif "komentar" in pesan.lower() or "tanggapan" in pesan.lower():
        tipe = "comment"
        judul = f"KOMENTAR BARU PADA TIKET #{n.id_tiket.upper()}"
    else:
        tipe = "status"
        judul = f"STATUS TIKET #{n.id_tiket.upper()} TELAH DIPERBARUI"

    return {
        "id_notifikasi": n.id_notifikasi,
        "pesan": n.pesan,
        "waktu": n.waktu,
        "is_read": n.is_read,
        "id_tiket": n.id_tiket,
        "tipe": tipe,
        "judul": judul,
    }


# ─── GET /notifikasi ──────────────────────────────────────────────────────────

@router.get("/", response_model=List[NotifikasiResponse])
def lihat_notifikasi(request: Request, db: Session = Depends(get_db)):
    """
    Ambil semua notifikasi milik mahasiswa yang sedang login.
    Diurutkan dari yang terbaru.
    Digunakan oleh NotifikasiPage dan badge unread count di TopNav.
    """
    user_data = security.extract_token(request)
    security.check_role(user_data, "mahasiswa")

    # Ambil semua tiket milik mahasiswa ini
    tiket_ids = [
        t.id_tiket for t in db.query(models.TiketLayanan.id_tiket).filter(
            models.TiketLayanan.email_mahasiswa == user_data["email"]
        ).all()
    ]

    notifikasi = db.query(models.Notifikasi).filter(
        models.Notifikasi.id_tiket.in_(tiket_ids)
    ).order_by(models.Notifikasi.waktu.desc()).all()

    return [_enrich(n) for n in notifikasi]


# ─── GET /notifikasi/unread-count ─────────────────────────────────────────────

@router.get("/unread-count")
def unread_count(request: Request, db: Session = Depends(get_db)):
    """
    Jumlah notifikasi yang belum dibaca.
    Digunakan badge di ikon lonceng TopNavigation.
    """
    user_data = security.extract_token(request)
    security.check_role(user_data, "mahasiswa")

    tiket_ids = [
        t.id_tiket for t in db.query(models.TiketLayanan.id_tiket).filter(
            models.TiketLayanan.email_mahasiswa == user_data["email"]
        ).all()
    ]

    count = db.query(models.Notifikasi).filter(
        models.Notifikasi.id_tiket.in_(tiket_ids),
        models.Notifikasi.is_read == False
    ).count()

    return {"unread_count": count}


# ─── PATCH /notifikasi/read-all ───────────────────────────────────────────────

@router.patch("/read-all")
def tandai_semua_dibaca(request: Request, db: Session = Depends(get_db)):
    """
    Tandai semua notifikasi milik user sebagai sudah dibaca.
    Dipanggil tombol 'Tandai Sudah Dibaca' di NotifikasiPage.
    """
    user_data = security.extract_token(request)
    security.check_role(user_data, "mahasiswa")

    tiket_ids = [
        t.id_tiket for t in db.query(models.TiketLayanan.id_tiket).filter(
            models.TiketLayanan.email_mahasiswa == user_data["email"]
        ).all()
    ]

    updated = db.query(models.Notifikasi).filter(
        models.Notifikasi.id_tiket.in_(tiket_ids),
        models.Notifikasi.is_read == False
    ).update({"is_read": True}, synchronize_session=False)

    db.commit()
    return {"updated_count": updated, "message": "Semua notifikasi ditandai sudah dibaca."}


# ─── PATCH /notifikasi/{id_notifikasi}/read ───────────────────────────────────

@router.patch("/{id_notifikasi}/read", response_model=NotifikasiResponse)
def tandai_satu_dibaca(id_notifikasi: str, request: Request, db: Session = Depends(get_db)):
    """
    Tandai satu notifikasi sebagai sudah dibaca.
    Dipanggil saat user mengklik notifikasi di NotifikasiPage.
    """
    user_data = security.extract_token(request)
    security.check_role(user_data, "mahasiswa")

    notif = db.query(models.Notifikasi).filter(
        models.Notifikasi.id_notifikasi == id_notifikasi
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan.")

    # Pastikan notifikasi ini milik tiket si mahasiswa
    tiket = db.query(models.TiketLayanan).filter(
        models.TiketLayanan.id_tiket == notif.id_tiket,
        models.TiketLayanan.email_mahasiswa == user_data["email"]
    ).first()

    if not tiket:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return _enrich(notif)


# ─── Helper: buat notifikasi otomatis ─────────────────────────────────────────
# Dipanggil dari router tiket saat status berubah atau komentar baru.

def buat_notifikasi(db: Session, id_tiket: str, pesan: str):
    """Buat notifikasi baru untuk tiket tertentu."""
    notif = models.Notifikasi(
        id_notifikasi=str(uuid.uuid4()),
        pesan=pesan,
        id_tiket=id_tiket,
        is_read=False
    )
    db.add(notif)
    # Caller yang commit