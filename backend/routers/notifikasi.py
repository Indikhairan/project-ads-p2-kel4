import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend import models
from backend.security import sec_helper 

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
    tipe: Optional[str] = None
    judul: Optional[str] = None

    class Config:
        from_attributes = True


# ─── SERVICE CLASS (OOP LOGIC) ────────────────────────────────────────────────

class NotifikasiService:
    def __init__(self, db: Session):
        """Constructor untuk menyimpan state/dependency database ke dalam objek."""
        self.db = db

    def _enrich(self, n: models.Notifikasi) -> dict:
        """Instance Method untuk memformat dan memperkaya data data objek."""
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

    def _get_mahasiswa_tiket_ids(self, email_mahasiswa: str) -> List[str]:
        """Encapsulation: Method internal khusus mengambil daftar ID tiket."""
        return [
            t.id_tiket for t in self.db.query(models.TiketLayanan.id_tiket).filter(
                models.TiketLayanan.email_mahasiswa == email_mahasiswa
            ).all()
        ]

    def dapatkan_semua_notifikasi(self, email_mahasiswa: str) -> List[dict]:
        """Mengambil dan memformat semua notifikasi."""
        tiket_ids = self._get_mahasiswa_tiket_ids(email_mahasiswa)
        notifikasi = self.db.query(models.Notifikasi).filter(
            models.Notifikasi.id_tiket.in_(tiket_ids)
        ).order_by(models.Notifikasi.waktu.desc()).all()

        return [self._enrich(n) for n in notifikasi]

    def dapatkan_jumlah_unread(self, email_mahasiswa: str) -> int:
        """Menghitung total notifikasi yang belum dibaca."""
        tiket_ids = self._get_mahasiswa_tiket_ids(email_mahasiswa)
        return self.db.query(models.Notifikasi).filter(
            models.Notifikasi.id_tiket.in_(tiket_ids),
            models.Notifikasi.is_read == False
        ).count()

    def tandai_semua_baca(self, email_mahasiswa: str) -> int:
        """Mengubah status semua notifikasi mahasiswa menjadi sudah dibaca."""
        tiket_ids = self._get_mahasiswa_tiket_ids(email_mahasiswa)
        updated = self.db.query(models.Notifikasi).filter(
            models.Notifikasi.id_tiket.in_(tiket_ids),
            models.Notifikasi.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        
        self.db.commit()
        return updated

    def tandai_satu_baca(self, id_notifikasi: str, email_mahasiswa: str) -> dict:
        """Memvalidasi kepemilikan dan menandai satu notifikasi tertentu."""
        notif = self.db.query(models.Notifikasi).filter(
            models.Notifikasi.id_notifikasi == id_notifikasi
        ).first()

        if not notif:
            raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan.")

        tiket = self.db.query(models.TiketLayanan).filter(
            models.TiketLayanan.id_tiket == notif.id_tiket,
            models.TiketLayanan.email_mahasiswa == email_mahasiswa
        ).first()

        if not tiket:
            raise HTTPException(status_code=403, detail="Akses ditolak.")

        notif.is_read = True
        self.db.commit()
        self.db.refresh(notif)
        return self._enrich(notif)

    @staticmethod
    def buat_notifikasi_otomatis(db: Session, id_tiket: str, pesan: str):
        """Static Method: Tidak butuh instansiasi objek, bisa langsung dipanggil file lain."""
        notif = models.Notifikasi(
            id_notifikasi=str(uuid.uuid4()),
            pesan=pesan,
            id_tiket=id_tiket,
            is_read=False
        )
        db.add(notif)


# ─── ROUTER ENDPOINTS (HTTP CONTROLLER LAYER) ─────────────────────────────────

@router.get("/", response_model=List[NotifikasiResponse])
def lihat_notifikasi(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "mahasiswa")

    # Instansiasi Objek Service
    service = NotifikasiService(db)
    return service.dapatkan_semua_notifikasi(user_data["email"])


@router.get("/unread-count")
def unread_count(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "mahasiswa")

    service = NotifikasiService(db)
    count = service.dapatkan_jumlah_unread(user_data["email"])
    return {"unread_count": count}


@router.patch("/read-all")
def tandai_semua_dibaca(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "mahasiswa")

    service = NotifikasiService(db)
    updated = service.tandai_semua_baca(user_data["email"])
    return {"updated_count": updated, "message": "Semua notifikasi ditandai sudah dibaca."}


@router.patch("/{id_notifikasi}/read", response_model=NotifikasiResponse)
def tandai_satu_dibaca(id_notifikasi: str, request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "mahasiswa")

    service = NotifikasiService(db)
    return service.tandai_satu_baca(id_notifikasi, user_data["email"])