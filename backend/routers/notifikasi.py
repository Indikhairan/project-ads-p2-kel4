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
    id_tiket: Optional[str] = None  
    id_kb: Optional[int] = None     
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
        """Instance Method (Encapsulation): Memformat dan memperkaya data objek."""
        pesan = n.pesan or ""
        
        if "knowledge base" in pesan.lower() or "artikel" in pesan.lower():
            tipe = "knowledge_base"
            judul = "PEMBARUAN KNOWLEDGE BASE (STAFF INFO)"
        elif "dibuat" in pesan.lower() or "berhasil" in pesan.lower():
            tipe = "created"
            judul = f"TIKET #{n.id_tiket.upper()} BERHASIL DIBUAT" if n.id_tiket else "TIKET BERHASIL DIBUAT"
        elif "komentar" in pesan.lower() or "tanggapan" in pesan.lower():
            tipe = "comment"
            judul = f"KOMENTAR BARU PADA TIKET #{n.id_tiket.upper()}" if n.id_tiket else "KOMENTAR BARU"
        else:
            tipe = "status"
            judul = f"STATUS TIKET #{n.id_tiket.upper()} TELAH DIPERBARUI" if n.id_tiket else "STATUS TIKET DIPERBARUI"

        return {
            "id_notifikasi": n.id_notifikasi,
            "pesan": n.pesan,
            "waktu": n.waktu,
            "is_read": n.is_read,
            "id_tiket": n.id_tiket,
            "id_kb": getattr(n, "id_kb", None), 
            "tipe": tipe,
            "judul": judul,
        }

    def _get_user_notifikasi_query(self, email: str, role: str):
        """Instance Method (Abstraction): Mengisolasi logic filtering query berdasarkan role."""
        if role == "mahasiswa":
            tiket_ids = [
                t.id_tiket for t in self.db.query(models.TiketLayanan.id_tiket).filter(
                    models.TiketLayanan.email_mahasiswa == email
                ).all()
            ]
            return self.db.query(models.Notifikasi).filter(models.Notifikasi.id_tiket.in_(tiket_ids))
        
        elif role in ["staff", "admin"]:
            return self.db.query(models.Notifikasi).filter(models.Notifikasi.id_kb.isnot(None))
        
        return None

    def dapatkan_semua_notifikasi(self, email: str, role: str) -> List[dict]:
        """Polymorphic-like behavior untuk menarik notifikasi sesuai role."""
        query = self._get_user_notifikasi_query(email, role)
        if not query:
            return []
        
        notifikasi = query.order_by(models.Notifikasi.waktu.desc()).all()
        return [self._enrich(n) for n in notifikasi]

    def dapatkan_jumlah_unread(self, email: str, role: str) -> int:
        query = self._get_user_notifikasi_query(email, role)
        if not query:
            return 0
        return query.filter(models.Notifikasi.is_read == False).count()

    def tandai_semua_baca(self, email: str, role: str) -> int:
        query = self._get_user_notifikasi_query(email, role)
        if not query:
            return 0
        
        updated = query.filter(models.Notifikasi.is_read == False).update(
            {"is_read": True}, synchronize_session=False
        )
        self.db.commit()
        return updated

    def tandai_satu_baca(self, id_notifikasi: str, email: str, role: str) -> dict:
        notif = self.db.query(models.Notifikasi).filter(
            models.Notifikasi.id_notifikasi == id_notifikasi
        ).first()

        if not notif:
            raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan.")

        if role == "mahasiswa":
            tiket = self.db.query(models.TiketLayanan).filter(
                models.TiketLayanan.id_tiket == notif.id_tiket,
                models.TiketLayanan.email_mahasiswa == email
            ).first()
            if not tiket:
                raise HTTPException(status_code=403, detail="Akses ditolak.")
        elif role == "staff" and not notif.id_kb:
            raise HTTPException(status_code=403, detail="Akses ditolak.")

        notif.is_read = True
        self.db.commit()
        self.db.refresh(notif)
        return self._enrich(notif)

    @staticmethod
    def buat_notifikasi_otomatis(db: Session, id_tiket: str, pesan: str):
        """Static Method untuk membuat notifikasi otomatis terkait tiket."""
        notif = models.Notifikasi(
            id_notifikasi=str(uuid.uuid4()),
            pesan=pesan,
            id_tiket=id_tiket,
            is_read=False
        )
        db.add(notif)
        db.commit()

    @classmethod
    def kirim_notif_admin_worker(cls, id_kb: int, judul_kb: str, aksi: str):
        """
        Class Method (OOP Background Worker): 
        Fungsi ini dipanggil oleh BackgroundTasks. Menangani lifecycle database
        secara mandiri dan membuat record baru menggunakan OOP style.
        """
        db_gen = get_db()
        db = next(db_gen)
        try:
            pesan_notif = f"Admin melakukan {aksi} pada artikel Knowledge Base: '{judul_kb}'."
            notif = models.Notifikasi(
                id_notifikasi=str(uuid.uuid4()),
                pesan=pesan_notif,
                id_kb=id_kb,
                id_tiket=None,
                is_read=False
            )
            db.add(notif)
            db.commit()
        finally:
            db_gen.close()


# ─── ROUTER ENDPOINTS (HTTP CONTROLLER LAYER) ─────────────────────────────────

@router.get("/", response_model=List[NotifikasiResponse])
def lihat_notifikasi(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR BARU
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    service = NotifikasiService(db)
    return service.dapatkan_semua_notifikasi(user_data["email"], user_data["role"])


@router.get("/unread-count")
def unread_count(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR BARU
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    service = NotifikasiService(db)
    count = service.dapatkan_jumlah_unread(user_data["email"], user_data["role"])
    return {"unread_count": count}


@router.patch("/read-all")
def tandai_semua_dibaca(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR BARU
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    service = NotifikasiService(db)
    updated = service.tandai_semua_baca(user_data["email"], user_data["role"])
    return {"updated_count": updated, "message": "Semua notifikasi ditandai sudah dibaca."}


@router.patch("/{id_notifikasi}/read", response_model=NotifikasiResponse)
def tandai_satu_dibaca(id_notifikasi: str, request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    
    # GUNAKAN SATPAM PINTAR BARU
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    service = NotifikasiService(db)
    
    # Logika OBAC sudah tertanam dengan sangat baik di dalam service.tandai_satu_baca
    # Jika mahasiswa mencoba membaca notif mahasiswa lain, akan di-raise 403.
    # (Opsional: Kalau kamu mau catat pelanggaran ini, kamu bisa masukkan try-except di sini seperti di tiket.py)
    return service.tandai_satu_baca(id_notifikasi, user_data["email"], user_data["role"])