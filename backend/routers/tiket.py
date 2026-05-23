from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from backend.database import get_db
from backend import models, schemas
from backend.security import sec_helper

router = APIRouter(
    prefix="/tiket",
    tags=["Tiket"]
)


class TiketService:
    VALID_STATUSES = {"Open", "In Progress", "Selesai", "Ditolak"}

    def __init__(self, db: Session, user_data: dict, ip_address: str):
        self.db = db
        self.user_data = user_data
        self.ip_address = ip_address

    def _get_layanan(self, id_layanan: str) -> models.Layanan:
        layanan = self.db.query(models.Layanan).filter(
            models.Layanan.id_layanan == id_layanan
        ).first()
        if not layanan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Layanan '{id_layanan}' tidak ditemukan."
            )
        return layanan

    def _get_mahasiswa(self, email: str) -> models.Mahasiswa:
        mahasiswa = self.db.query(models.Mahasiswa).filter(models.Mahasiswa.email == email).first()
        if not mahasiswa:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data mahasiswa tidak ditemukan di sistem.")
        return mahasiswa

    def _generate_tiket_id(self, id_layanan: str) -> str:
        return f"{id_layanan}-{int(datetime.now(timezone.utc).timestamp())}"

    def _update_profil_mahasiswa(self, mahasiswa: models.Mahasiswa, payload: schemas.TiketCreate):
        if not mahasiswa.nim:
            mahasiswa.nim = payload.nim
        if not mahasiswa.program_studi:
            mahasiswa.program_studi = payload.program_studi
        if not mahasiswa.departemen and payload.departemen:
            mahasiswa.departemen = payload.departemen
        if not mahasiswa.fakultas and payload.fakultas:
            mahasiswa.fakultas = payload.fakultas
        if not mahasiswa.semester and payload.semester:
            mahasiswa.semester = payload.semester

    def _log_aktivitas(self, aksi: str):
        sec_helper.log_aktivitas(
            db=self.db,
            email=self.user_data["email"],
            role=self.user_data["role"],
            aksi=aksi,
            status_log="Success",
            ip_address=self.ip_address
        )

    def buat_tiket(self, payload: schemas.TiketCreate) -> models.TiketLayanan:
        layanan = self._get_layanan(payload.id_layanan)
        mahasiswa = self._get_mahasiswa(self.user_data["email"])
        self._update_profil_mahasiswa(mahasiswa, payload)

        generated_id = self._generate_tiket_id(payload.id_layanan)
        new_tiket = models.TiketLayanan(
            id_tiket=generated_id,
            email_mahasiswa=self.user_data["email"],
            id_layanan=payload.id_layanan,
            data_request=payload.data_request,
            file_lampiran=payload.file_lampiran,
            status="Open"
        )

        self.db.add(new_tiket)
        self.db.commit()
        self.db.refresh(new_tiket)

        self._log_aktivitas(f"Submit tiket baru: {generated_id} & Update Profil")
        return new_tiket

    def lihat_daftar_tiket(self) -> List[models.TiketLayanan]:
        role = self.user_data["role"]
        if role == "mahasiswa":
            return self.db.query(models.TiketLayanan).filter(
                models.TiketLayanan.email_mahasiswa == self.user_data["email"]
            ).order_by(models.TiketLayanan.waktu_submit.desc()).all()
        if role in ["staff", "admin"]:
            return self.db.query(models.TiketLayanan).order_by(
                models.TiketLayanan.waktu_submit.desc()
            ).all()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role tidak dikenali."
        )

    def detail_tiket(self, id_tiket: str) -> models.TiketLayanan:
        tiket = self.db.query(models.TiketLayanan).filter(
            models.TiketLayanan.id_tiket == id_tiket
        ).first()

        if not tiket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tiket tidak ditemukan.")

        sec_helper.cek_kepemilikan_tiket(
            user_email=self.user_data["email"],
            ticket_owner_email=tiket.email_mahasiswa,
            user_role=self.user_data["role"]
        )
        return tiket

    def update_status_tiket(self, id_tiket: str, payload: schemas.TiketUpdate) -> models.TiketLayanan:
        if payload.status not in self.VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Status tidak valid. Pilihan: {', '.join(self.VALID_STATUSES)}"
            )

        tiket = self.db.query(models.TiketLayanan).filter(
            models.TiketLayanan.id_tiket == id_tiket
        ).first()

        if not tiket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tiket tidak ditemukan.")

        if tiket.status in ("Selesai", "Ditolak"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tiket sudah berstatus '{tiket.status}' dan tidak dapat diubah lagi."
            )

        tiket.status = payload.status
        tiket.email_staff = self.user_data["email"]
        self.db.commit()
        self.db.refresh(tiket)

        self._log_aktivitas(f"Update status tiket {id_tiket} → {payload.status}")
        return tiket


@router.post("/", response_model=schemas.TiketResponse, status_code=status.HTTP_201_CREATED)
def buat_tiket(payload: schemas.TiketCreate, request: Request, db: Session = Depends(get_db)):
    """
    Submit pengajuan tiket layanan baru.
    - **Hak akses**: Mahasiswa
    """
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "mahasiswa")

    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.buat_tiket(payload)


@router.get("/", response_model=List[schemas.TiketResponse])
def lihat_daftar_tiket(request: Request, db: Session = Depends(get_db)):
    """
    Ambil daftar tiket.
    - Mahasiswa: hanya miliknya | Staff/Admin: semua
    """
    user_data = sec_helper.ekstrak_token(request)
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.lihat_daftar_tiket()


@router.get("/{id_tiket}", response_model=schemas.TiketResponse)
def detail_tiket(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    """Ambil detail tiket. Mahasiswa hanya bisa akses tiket miliknya."""
    user_data = sec_helper.ekstrak_token(request)
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.detail_tiket(id_tiket)


@router.put("/{id_tiket}", response_model=schemas.TiketResponse)
def update_status_tiket(
    id_tiket: str,
    payload: schemas.TiketUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update status tiket oleh staff akademik.
    - **Hak akses**: Staff / Admin
    """
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "staff", "admin")

    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.update_status_tiket(id_tiket, payload)
