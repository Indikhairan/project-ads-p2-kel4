from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import json
import hashlib
import uuid
import os

from backend.database import get_db
from backend import models, schemas
from backend.security import sec_helper

router = APIRouter(
    prefix="/api/v1/tiket",
    tags=["Kelola Tiket Layanan"]
)

class TiketService:
    VALID_STATUSES = {"Open", "Diproses", "Selesai", "Ditolak"}
    VALID_KATEGORIS = {"Layanan", "Persuratan"}

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
        if payload.kategori not in self.VALID_KATEGORIS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Kategori tiket tidak valid. Pilihan: {', '.join(self.VALID_KATEGORIS)}"
            )

        layanan = self._get_layanan(payload.id_layanan)
        mahasiswa = self._get_mahasiswa(self.user_data["email"])
        self._update_profil_mahasiswa(mahasiswa, payload)

        generated_id = self._generate_tiket_id(payload.id_layanan)
        new_tiket = models.TiketLayanan(
            id_tiket=generated_id,
            email_mahasiswa=self.user_data["email"],
            id_layanan=payload.id_layanan,
            kategori=payload.kategori,
            subjek=payload.subjek,
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

    def tanggapi_tiket(self, id_tiket: str, pesan: str, isi_lampiran: bytes | None, nama_lampiran: str | None, passphrase: str) -> dict:
        tiket = self.db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
        if not tiket:
            raise HTTPException(status_code=404, detail="Tiket tidak ditemukan.")
        if tiket.tanggapan:
            raise HTTPException(status_code=400, detail="Tiket ini sudah memiliki tanggapan.")

        # AMBIL KUNCI STAFF DARI DATABASE
        staff = self.db.query(models.StaffAkademik).filter(models.StaffAkademik.email == self.user_data["email"]).first()
        if not getattr(staff, 'encrypted_private_key', None):
            raise HTTPException(status_code=403, detail="Anda belum mengaktifkan Kunci Keamanan. Harap buat Profil Keamanan terlebih dahulu.")

        # BUKA BUNGKUS KUNCI MENGGUNAKAN PASSPHRASE
        try:
            isi_pem_terbuka = sec_helper.buka_bungkus_kunci_privat(staff.encrypted_private_key, passphrase)
        except ValueError:
            raise HTTPException(status_code=401, detail="Passphrase Anda salah! Tanda tangan gagal.")

        hash_lampiran = None
        nama_file_tersimpan = None

        # URUS FILE LAMPIRAN
        if isi_lampiran and nama_lampiran:
            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)
            hash_lampiran = hashlib.sha256(isi_lampiran).hexdigest()
            nama_file_tersimpan = f"{upload_dir}/{uuid.uuid4()}_{nama_lampiran}"
            
            with open(nama_file_tersimpan, "wb") as f:
                f.write(isi_lampiran)

        # RANGKAI PAKET DATA
        paket_data = {
            "pesan": pesan,
            "hash_lampiran": hash_lampiran
        }
        string_paket = json.dumps(paket_data, sort_keys=True)

        # KUNCI PAYLOAD MENGGUNAKAN PRIVATE KEY YANG SUDAH TERBUKA
        try:
            signature = sec_helper.buat_digital_signature(string_paket, isi_pem_terbuka)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal saat membuat tanda tangan digital.")

        # SIMPAN TANGGAPAN
        tanggapan_baru = models.TanggapanStaff(
            id_tanggapan=str(uuid.uuid4()),
            id_tiket=id_tiket,
            email_staff=self.user_data["email"],
            pesan=pesan,
            file_output=nama_file_tersimpan,
            waktu=datetime.now(timezone.utc),
            digital_signature=signature
        )

        tiket.status = "Selesai"
        tiket.email_staff = self.user_data["email"]

        self.db.add(tanggapan_baru)
        self.db.commit()

        self._log_aktivitas(f"Membalas tiket {id_tiket} menggunakan Cloud Signature")

        return {
            "status": "success",
            "message": "Tiket berhasil ditanggapi dan diamankan dengan Cloud Digital Signature."
        }

@router.post("/", response_model=schemas.TiketResponse, status_code=status.HTTP_201_CREATED)
def buat_tiket(payload: schemas.TiketCreate, request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "mahasiswa")
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.buat_tiket(payload)

@router.get("/", response_model=List[schemas.TiketResponse])
def lihat_daftar_tiket(request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.lihat_daftar_tiket()

@router.get("/{id_tiket}", response_model=schemas.TiketResponse)
def detail_tiket(id_tiket: str, request: Request, db: Session = Depends(get_db)):
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
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "staff", "admin")
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.update_status_tiket(id_tiket, payload)

@router.post("/{id_tiket}/tanggapan")
async def tanggapi_tiket(
    id_tiket: str,
    request: Request,
    pesan: str = Form(...),   
    passphrase: str = Form(...),                      
    file_lampiran: UploadFile = File(None),        
    db: Session = Depends(get_db)
):
    """
    Staff menanggapi tiket dengan mengunggah dokumen dan menguncinya menggunakan Passphrase (Sistem Cloud Signature).
    """
    # 1. Ekstrak user dan validasi Role
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, "staff")
    
    # 2. Baca isi file yang di-upload secara Asynchronous (agar server tidak hang)
    isi_lampiran = await file_lampiran.read() if file_lampiran else None
    nama_lampiran = file_lampiran.filename if file_lampiran else None

    # 3. Oper ke dalam Service
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.tanggapi_tiket(
        id_tiket=id_tiket, 
        pesan=pesan, 
        isi_lampiran=isi_lampiran, 
        nama_lampiran=nama_lampiran, 
        passphrase=passphrase
    )

@router.get("/{id_tiket}/verifikasi")
def verifikasi_dokumen(id_tiket: str, db: Session = Depends(get_db)):
    """Mahasiswa mengecek keaslian dokumen balasan dari Staff"""
    # 1. Cari tiket dan tanggapannya
    tiket = db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
    if not tiket or not tiket.tanggapan:
        raise HTTPException(status_code=404, detail="Tiket atau tanggapan tidak ditemukan.")

    tanggapan = tiket.tanggapan

    # 2. Cari Public Key milik Staf yang membalas
    staff = db.query(models.StaffAkademik).filter(models.StaffAkademik.email == tanggapan.email_staff).first()
    if not staff or not staff.public_key:
        raise HTTPException(status_code=400, detail="Kunci Publik Staff tidak ditemukan.")

    # 3. Rangkai kembali paket data persis seperti saat dikunci
    paket_data = {
        "pesan": tanggapan.pesan,
        "hash_lampiran": tanggapan.hash_lampiran
    }
    string_paket = json.dumps(paket_data, sort_keys=True)

    # 4. Lempar ke mesin verifikasi
    is_valid = sec_helper.verifikasi_digital_signature(
        payload=string_paket,
        signature_b64=tanggapan.digital_signature,
        public_key_pem=staff.public_key
    )

    return {
        "status": "success",
        "is_valid": is_valid,
        "penandatangan": staff.email
    }