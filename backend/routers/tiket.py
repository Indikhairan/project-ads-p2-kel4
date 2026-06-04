from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json
import hashlib
import uuid
import os
import mimetypes
from pydantic import ValidationError

from backend.database import get_db
from backend import models, schemas
from backend.security import sec_helper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/tiket",
    tags=["Kelola Tiket Layanan"]
)

# ─── Konfigurasi direktori upload ─────────────────────────────────────────────
UPLOAD_DIR = "uploads"
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/jpg",
    "application/pdf",
}
MAX_FILE_SIZE_MB = 5
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# ─── Helper: simpan UploadFile ke disk ────────────────────────────────────────

async def _simpan_file(upload_file: UploadFile, subfolder: str = "") -> str:
    """
    Baca UploadFile, validasi ukuran & tipe, lalu simpan ke disk.
    """
    if upload_file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Tipe file '{upload_file.content_type}' tidak diizinkan untuk '{upload_file.filename}'. "
                f"Hanya menerima: {', '.join(sorted(ALLOWED_MIME_TYPES))}."
            )
        )

    isi = await upload_file.read()

    if len(isi) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ukuran file '{upload_file.filename}' melebihi batas {MAX_FILE_SIZE_MB} MB."
        )

    target_dir = os.path.join(UPLOAD_DIR, subfolder) if subfolder else UPLOAD_DIR
    os.makedirs(target_dir, exist_ok=True)

    ext = os.path.splitext(upload_file.filename or "file")[1]
    nama_tersimpan = f"{uuid.uuid4().hex}{ext}"
    path_tersimpan = os.path.join(target_dir, nama_tersimpan)

    with open(path_tersimpan, "wb") as f:
        f.write(isi)

    return path_tersimpan


class TiketService:
    VALID_STATUSES = {"Open", "Diproses", "Selesai", "Ditolak"}
    VALID_KATEGORIS = {"Informasi", "Persuratan"}

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

    def _generate_tiket_id(self, id_layanan: str, nomor_urut: int) -> str:
        return f"{id_layanan}-{nomor_urut:03d}"

    def _update_profil_mahasiswa(self, mahasiswa: models.Mahasiswa, payload: schemas.TiketCreate):
        if not mahasiswa.nim:
            mahasiswa.nim = payload.nim
        if not mahasiswa.program_studi:
            mahasiswa.program_studi = payload.program_studi
        if not mahasiswa.departemen and payload.departemen:
            mahasiswa.departemen = payload.departemen
        if not mahasiswa.fakultas and payload.fakultas:
            mahasiswa.fakultas = payload.fakultas
        if not mahasiswa.alamat and payload.alamat:
            mahasiswa.alamat = payload.alamat  # 🔐 Auto-encrypted by EncryptedString

    def _log_aktivitas(self, aksi: str):
        sec_helper.log_aktivitas(
            db=self.db,
            aksi=aksi,
            email=self.user_data["email"],
            role=self.user_data["role"],
            status_log="Success",
            ip_address=self.ip_address,
        )

    def buat_tiket(self, payload: schemas.TiketCreate, file_lampiran_db: Optional[str] = None) -> models.TiketLayanan:
        if payload.kategori not in self.VALID_KATEGORIS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Kategori tiket tidak valid. Pilihan: {', '.join(self.VALID_KATEGORIS)}"
            )

        layanan = self._get_layanan(payload.id_layanan)
        mahasiswa = self._get_mahasiswa(self.user_data["email"])
        self._update_profil_mahasiswa(mahasiswa, payload)

        total_tiket = self.db.query(models.TiketLayanan).count()
        nomor_urut_berikutnya = total_tiket + 1
        generated_id = self._generate_tiket_id(payload.id_layanan, nomor_urut_berikutnya)
    
        new_tiket = models.TiketLayanan(
            id_tiket=generated_id,
            email_mahasiswa=self.user_data["email"],
            id_layanan=payload.id_layanan,
            kategori=payload.kategori,
            subjek=payload.subjek,
            data_request=payload.data_request,
            # Menggunakan path file_lampiran_tambahan jika ada untuk kolom DB utama
            file_lampiran=file_lampiran_db,
            # Simpan metadata pengaju agar mudah diquery tanpa perlu JOIN ke Mahasiswa
            nim_pengaju=payload.nim,
            program_studi_pengaju=payload.program_studi,
            status="Open"
        )

        self.db.add(new_tiket)
        self.db.commit()
        self.db.refresh(new_tiket)

        self._log_aktivitas(f"Submit tiket baru: {generated_id} & Update Profil")
        return new_tiket

    def lihat_daftar_tiket(self) -> List[models.TiketLayanan]:
        role = self.user_data["role"]
        try:
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
        except HTTPException:
            raise
        except Exception as e:
            # Log error dan rollback untuk menghindari transaction aborted state
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching tiket list: {str(e)}", exc_info=True)
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching tiket: {str(e)}"
            )

    def detail_tiket(self, id_tiket: str) -> models.TiketLayanan:
        tiket = self.db.query(models.TiketLayanan).filter(
            models.TiketLayanan.id_tiket == id_tiket
        ).first()

        if not tiket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tiket tidak ditemukan.")

        try:
            # Pengecekan OBAC
            sec_helper.cek_kepemilikan_tiket(
                user_email=self.user_data["email"],
                ticket_owner_email=tiket.email_mahasiswa,
                user_role=self.user_data["role"]
            )
        except HTTPException as e:
            # 1. TANGKAP ERROR: Jika masuk sini, berarti akses ditolak.
            # 2. CATAT KE LOG: Kita masukkan ke database sebelum program berhenti.
            log_penolakan = models.AuditLog(
                email_aktor=self.user_data["email"],
                role_aktor=self.user_data["role"],
                aksi=f"Akses Ilegal Terdeteksi: Mencoba membuka tiket {id_tiket} milik {tiket.email_mahasiswa}",
                status="Failed",
                # waktu=get_waktu_wib() # Sesuaikan jika kamu pakai default=get_waktu_wib di models.py
            )
            self.db.add(log_penolakan)
            self.db.commit()
            
            # 3. LEMPAR KEMBALI ERROR-NYA: Agar frontend tetap menampilkan "Akses Ditolak"
            raise e
            # Bangun response serializable secara eksplisit sebelum DB session ditutup
        tanggapan_obj = None
        if getattr(tiket, 'tanggapan', None):
            t = tiket.tanggapan
            tanggapan_obj = {
                "id_tanggapan": t.id_tanggapan,
                "id_tiket": t.id_tiket,
                "email_staff": t.email_staff,
                "pesan": t.pesan,
                "file_output": t.file_output,
                "hash_lampiran": getattr(t, 'hash_lampiran', None),
                "digital_signature": t.digital_signature,
                "waktu": t.waktu,
            }

        hasil = {
            "id_tiket": tiket.id_tiket,
            "id": tiket.id_tiket,
            "id_layanan": tiket.id_layanan,
            "kategori": tiket.kategori,
            "subjek": tiket.subjek,
            "deskripsi": tiket.deskripsi,
            "data_request": tiket.data_request,
            "file_lampiran": tiket.file_lampiran,
            "email_mahasiswa": tiket.email_mahasiswa,
            "nim_pengaju": tiket.nim_pengaju,
            "program_studi_pengaju": tiket.program_studi_pengaju,
            "status": tiket.status,
            "waktu_submit": tiket.waktu_submit,
            "email_staff": tiket.email_staff,
            "tanggapan": tanggapan_obj,
        }

        return hasil

    def get_ticket_logs(self, id_tiket: str) -> list[dict]:
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

        logs_db = self.db.query(models.AuditLog).filter(
            models.AuditLog.aksi.ilike(f"%{id_tiket}%")
        ).order_by(models.AuditLog.waktu.desc()).all()

        tz_jkt = ZoneInfo("Asia/Jakarta")
        formatted_logs = []
        for log in logs_db:
            waktu_wib = log.waktu.astimezone(tz_jkt)
            formatted_logs.append({
                "time": waktu_wib.strftime("%Y-%m-%d %H:%M"),
                "email": log.email_aktor,
                "role": log.role_aktor,
                "activity": log.aksi,
                "status": log.status,
                "ip_address": log.ip_address or "Unknown"
            })

        return formatted_logs

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

        # ── BUAT NOTIFIKASI UNTUK MAHASISWA ──
        notifikasi_pesan = f"Status tiket Anda {tiket.id_tiket} telah diperbarui menjadi: {payload.status}"
        notifikasi_baru = models.Notifikasi(
            id_notifikasi=str(uuid.uuid4()),
            pesan=notifikasi_pesan,
            id_tiket=id_tiket,
            is_read=False
        )
        self.db.add(notifikasi_baru)
        self.db.commit()

        return tiket

    def tanggapi_tiket(self, id_tiket: str, pesan: str, isi_lampiran: bytes | None, nama_lampiran: str | None, passphrase: str) -> dict:
        logger = logging.getLogger(__name__)
        logger.info(f"Mulai proses tanggapan untuk tiket={id_tiket} oleh {self.user_data.get('email')}")
        tiket = self.db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
        if not tiket:
            raise HTTPException(status_code=404, detail="Tiket tidak ditemukan.")
        if tiket.tanggapan:
            raise HTTPException(status_code=400, detail="Tiket ini sudah memiliki tanggapan.")

        staff = self.db.query(models.StaffAkademik).filter(models.StaffAkademik.email == self.user_data["email"]).first()
        if not getattr(staff, 'encrypted_private_key', None):
            # Catat usaha menanggapi tanpa kunci
            sec_helper.log_aktivitas(
                db=self.db,
                aksi=f"Percobaan menanggapi tiket {id_tiket} tanpa kunci publik/private",
                email=self.user_data.get("email"),
                role=self.user_data.get("role"),
                status_log="Failed (No Key)",
                ip_address=self.ip_address
            )
            raise HTTPException(status_code=403, detail="Anda belum mengaktifkan Kunci Keamanan. Harap buat Profil Keamanan terlebih dahulu.")

        try:
            logger.info("Mencoba membuka private key terenkripsi menggunakan passphrase")
            isi_pem_terbuka = sec_helper.buka_bungkus_kunci_privat(staff.encrypted_private_key, passphrase)
            logger.info("Berhasil membuka private key")
        except ValueError:
            sec_helper.log_aktivitas(
                db=self.db,
                aksi=f"Gagal membuka private key saat menanggapi tiket {id_tiket}",
                email=self.user_data.get("email"),
                role=self.user_data.get("role"),
                status_log="Failed (Bad Passphrase)",
                ip_address=self.ip_address
            )
            raise HTTPException(status_code=401, detail="Passphrase Anda salah! Tanda tangan gagal.")

        hash_lampiran = None
        nama_file_tersimpan = None

        if isi_lampiran and nama_lampiran:
            upload_dir = "uploads"
            os.makedirs(upload_dir, exist_ok=True)
            hash_lampiran = hashlib.sha256(isi_lampiran).hexdigest()
            nama_file_tersimpan = f"{upload_dir}/{uuid.uuid4()}_{nama_lampiran}"
            logger.info(f"Menyimpan lampiran ke {nama_file_tersimpan} dengan hash {hash_lampiran}")
            with open(nama_file_tersimpan, "wb") as f:
                f.write(isi_lampiran)
            sec_helper.log_aktivitas(
                db=self.db,
                aksi=f"Simpan lampiran tanggapan untuk tiket {id_tiket} -> {nama_file_tersimpan}",
                email=self.user_data.get("email"),
                role=self.user_data.get("role"),
                status_log="Success (File Saved)",
                ip_address=self.ip_address
            )

        paket_data = {
            "pesan": pesan,
            "hash_lampiran": hash_lampiran
        }
        string_paket = json.dumps(paket_data, sort_keys=True)

        try:
            logger.info("Membuat digital signature untuk paket tanggapan")
            signature = sec_helper.buat_digital_signature(string_paket, isi_pem_terbuka)
            logger.info("Digital signature berhasil dibuat")
        except Exception as e:
            logger.exception("Gagal membuat digital signature: %s", e)
            sec_helper.log_aktivitas(
                db=self.db,
                aksi=f"Gagal membuat digital signature untuk tiket {id_tiket}",
                email=self.user_data.get("email"),
                role=self.user_data.get("role"),
                status_log="Failed (Signature Error)",
                ip_address=self.ip_address
            )
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal saat membuat tanda tangan digital.")

        tanggapan_baru = models.TanggapanStaff(
            id_tanggapan=str(uuid.uuid4()),
            id_tiket=id_tiket,
            email_staff=self.user_data["email"],
            pesan=pesan,
            file_output=nama_file_tersimpan,
            hash_lampiran=hash_lampiran,
            waktu=datetime.now(timezone.utc),
            digital_signature=signature
        )

        tiket.status = "Selesai"
        tiket.email_staff = self.user_data["email"]

        self.db.add(tanggapan_baru)
        self.db.commit()
        logger.info(f"Tanggapan untuk tiket {id_tiket} berhasil disimpan ke DB (id_tanggapan={tanggapan_baru.id_tanggapan})")
        sec_helper.log_aktivitas(
            db=self.db,
            aksi=f"Membalas tiket {id_tiket} dengan Digital Signature",
            email=self.user_data.get("email"),
            role=self.user_data.get("role"),
            status_log="Success (Tanggapan Stored)",
            ip_address=self.ip_address
        )

        return {
            "status": "success",
            "message": "Tiket berhasil ditanggapi dan diamankan dengan Cloud Digital Signature."
        }

# --- ROUTERS DENGAN PENANAMAN LOG ---

@router.post("/", response_model=schemas.TiketResponse, status_code=status.HTTP_201_CREATED,
             summary="Buat Tiket Baru (multipart/form-data)")
async def buat_tiket(
    request: Request,
    db: Session = Depends(get_db),
    id_layanan: str = Form(..., description="ID layanan yang dituju"),
    kategori: str = Form(..., description="Kategori tiket: 'Persuratan' atau 'Layanan'"),
    subjek: Optional[str] = Form(None, description="Subjek/judul tiket"),
    deskripsi: Optional[str] = Form(None, description="Deskripsi tiket"),
    
    # Terima sebagai string, akan di-parse manual
    data_request: str = Form(..., description="Data spesifik tiket dalam format JSON string."),
    
    nim: Optional[str] = Form(None, description="NIM mahasiswa"),
    program_studi: Optional[str] = Form(None, description="Program studi mahasiswa"),
    departemen: Optional[str] = Form(None, description="Departemen"),
    fakultas: Optional[str] = Form(None, description="Fakultas/Sekolah"),
    alamat: Optional[str] = Form(None, description="Alamat lengkap mahasiswa (🔐 encrypted)"),
    ktm_file: Optional[UploadFile] = File(None, description="File KTM"),
    ukt_file: Optional[UploadFile] = File(None, description="Bukti Pembayaran UKT"),
    lampiran_file: Optional[UploadFile] = File(None, description="File lampiran tambahan untuk persuratan"),
    file_lampiran: Optional[UploadFile] = File(None, description="File lampiran untuk kategori informasi"),
):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "mahasiswa")

    # ── 0. Parse JSON string menjadi dict ──
    try:
        data_request_dict = json.loads(data_request)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"data_request harus berupa JSON string yang valid. Error: {str(e)}"
        )

    # ── 1. Mengambil jenis_surat dari data_request yang sudah di-parse ──
    jenis_surat = data_request_dict.get("jenis_surat", "")
    path_tambahan_db = None

    # ── 1b. Tambahkan nim ke data_request_dict agar validator tidak error ──
    # (Validator mengharapkan nim ada di dalam data_request)
    if nim and not data_request_dict.get("nim"):
        data_request_dict["nim"] = nim

    # ── 2. Simpan file ke disk jika diunggah frontend ───
    if ktm_file and ktm_file.filename and ktm_file.filename.strip():
        path_ktm = await _simpan_file(ktm_file, subfolder="ktm")
        data_request_dict["file_ktm"] = path_ktm

    if ukt_file and ukt_file.filename and ukt_file.filename.strip():
        path_ukt = await _simpan_file(ukt_file, subfolder="ukt")
        data_request_dict["file_ukt"] = path_ukt

    if lampiran_file and lampiran_file.filename and lampiran_file.filename.strip():
        path_tambahan = await _simpan_file(lampiran_file, subfolder="lampiran")
        path_tambahan_db = path_tambahan
        
        field_mapping = {
            "Surat Izin Akademik":         "file_form_izin",
            "Surat Perubahan KRS":         "file_form_krs",
            "Surat Rekomendasi Beasiswa":  "file_form_rekomendasi",
            "Permohonan Surat Magang":     "file_form_persetujuan_dsb",
        }
        target_field = field_mapping.get(jenis_surat, "file_lampiran_tambahan")
        data_request_dict[target_field] = path_tambahan

    # Handle file_lampiran untuk kategori Informasi
    if file_lampiran and file_lampiran.filename and file_lampiran.filename.strip():
        path_info = await _simpan_file(file_lampiran, subfolder="lampiran")
        path_tambahan_db = path_info

    # ── 3. Validasi skema via Pydantic tanpa bentrok field file_lampiran ─────
    try:
        payload = schemas.TiketCreate(
            id_layanan=id_layanan,
            kategori=kategori,
            subjek=subjek or "Tiket " + jenis_surat if jenis_surat else "Tiket Layanan",
            data_request=data_request_dict,
            file_lampiran=path_tambahan_db, 
            nim=nim,
            program_studi=program_studi,
            departemen=departemen,
            fakultas=fakultas,
            # semester removed
            alamat=alamat,  # 🔐 Encrypted address from form
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail=f"Validasi data tiket gagal: {exc.errors()}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(exc)
        )

    # ── 4. Jalankan Service ───────────────────────────────────────────────────
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.buat_tiket(payload, file_lampiran_db=path_tambahan_db)

@router.get("/", response_model=List[schemas.TiketResponse])
def lihat_daftar_tiket(request: Request, db: Session = Depends(get_db)):
    try:
        user_data = sec_helper.ekstrak_token(request)
        
        # Mengizinkan semua role untuk melihat daftar, filter data di-handle oleh Service
        sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")
        
        service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
        return service.lihat_daftar_tiket()
    except Exception as e:
        # Rollback transaction jika ada error untuk menghindari "transaction aborted" state
        db.rollback()
        raise

@router.get("/{id_tiket}/logs", response_model=List[schemas.AuditLogResponse])
def get_ticket_logs(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    return service.get_ticket_logs(id_tiket)


@router.get("/{id_tiket}", response_model=schemas.TiketResponse)
def detail_tiket(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    try:
        user_data = sec_helper.ekstrak_token(request)
        
        # Semua role bisa akses endpoint ini, tapi akan dihadang oleh OBAC di dalam service
        sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")
        
        tiket = db.query(models.TiketLayanan).filter(
            models.TiketLayanan.id_tiket == id_tiket
        ).first()

        if not tiket:
            raise HTTPException(status_code=404, detail="Tiket tidak ditemukan.")

        # Pengecekan OBAC
        sec_helper.cek_kepemilikan_tiket(
            user_email=user_data["email"],
            ticket_owner_email=tiket.email_mahasiswa,
            user_role=user_data["role"]
        )
        
        # Return raw tiket object — Pydantic akan serialize via from_attributes=True
        return tiket
    except HTTPException:
        raise
    except Exception as e:
        # Rollback transaction jika ada error
        db.rollback()
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching tiket detail: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching tiket: {str(e)}")

@router.put("/{id_tiket}", response_model=schemas.TiketResponse)
def update_status_tiket(
    id_tiket: str,
    payload: schemas.TiketUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    user_data = sec_helper.ekstrak_token(request)
    
    # 1. SATPAM PINTAR: Validasi Role
    sec_helper.cek_role(user_data, db, request, "staff", "admin")
    
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    hasil_tiket = service.update_status_tiket(id_tiket, payload)
    
    # LOG: Update Status Tiket
    sec_helper.log_aktivitas(db, aksi=f"Update status tiket {id_tiket} → {payload.status}", request=request)
    
    return hasil_tiket

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
    sec_helper.cek_role(user_data, db, request, "staff")
    
    # 2. Baca isi file yang di-upload secara Asynchronous (agar server tidak hang)
    isi_lampiran = await file_lampiran.read() if file_lampiran else None
    nama_lampiran = file_lampiran.filename if file_lampiran else None

    # 3. Oper ke dalam Service
    service = TiketService(db=db, user_data=user_data, ip_address=request.client.host)
    hasil = service.tanggapi_tiket(
        id_tiket=id_tiket, 
        pesan=pesan, 
        isi_lampiran=isi_lampiran, 
        nama_lampiran=nama_lampiran, 
        passphrase=passphrase
    )
    
    # LOG: Menanggapi tiket
    sec_helper.log_aktivitas(db, aksi=f"Membalas tiket {id_tiket} dengan Digital Signature", request=request)
    
    return hasil

@router.get("/{id_tiket}/verifikasi")
def verifikasi_dokumen(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    """Mahasiswa mengecek keaslian dokumen balasan dari Staff"""
    
    # Pastikan user sudah login
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    tiket = db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
    if not tiket or not tiket.tanggapan:
        raise HTTPException(status_code=404, detail="Tiket atau tanggapan tidak ditemukan.")

    tanggapan = tiket.tanggapan

    staff = db.query(models.StaffAkademik).filter(models.StaffAkademik.email == tanggapan.email_staff).first()
    if not staff or not staff.public_key:
        raise HTTPException(status_code=400, detail="Kunci Publik Staff tidak ditemukan.")

    paket_data = {
        "pesan": tanggapan.pesan,
        "hash_lampiran": tanggapan.hash_lampiran
    }
    string_paket = json.dumps(paket_data, sort_keys=True)

    is_valid = sec_helper.verifikasi_digital_signature(
        payload=string_paket,
        signature_b64=tanggapan.digital_signature,
        public_key_pem=staff.public_key
    )

    # LOG: Hasil Verifikasi Dokumen
    status_verifikasi = "Success" if is_valid else "Failed (Manipulasi Terdeteksi)"
    sec_helper.log_aktivitas(
        db=db, 
        aksi=f"Verifikasi dokumen tiket {id_tiket}", 
        request=request, 
        status_log=status_verifikasi
    )

    return {
        "status": "success",
        "is_valid": is_valid,
        "penandatangan": staff.email
    }


def _resolve_ticket_file_path(path: str) -> str:
    if not path:
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    abs_path = os.path.abspath(path)
    base_upload = os.path.abspath("uploads")

    if not abs_path.startswith(base_upload + os.sep) and abs_path != base_upload:
        raise HTTPException(status_code=400, detail="File path tidak valid.")

    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    return abs_path


def _build_file_response(filepath: str):
    media_type = mimetypes.guess_type(filepath)[0] or "application/octet-stream"
    filename = os.path.basename(filepath)
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type=media_type,
        headers={"Content-Disposition": f"inline; filename=\"{filename}\""}
    )


@router.get("/{id_tiket}/download-request")
def download_request_file(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    tiket = db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
    if not tiket or not tiket.file_lampiran:
        raise HTTPException(status_code=404, detail="Lampiran tiket tidak ditemukan.")

    sec_helper.cek_kepemilikan_tiket(
        user_email=user_data["email"],
        ticket_owner_email=tiket.email_mahasiswa,
        user_role=user_data["role"]
    )

    filepath = _resolve_ticket_file_path(tiket.file_lampiran)
    return _build_file_response(filepath)


@router.get("/{id_tiket}/download-response")
def download_response_file(id_tiket: str, request: Request, db: Session = Depends(get_db)):
    user_data = sec_helper.ekstrak_token(request)
    sec_helper.cek_role(user_data, db, request, "mahasiswa", "staff", "admin")

    tiket = db.query(models.TiketLayanan).filter(models.TiketLayanan.id_tiket == id_tiket).first()
    if not tiket or not getattr(tiket, 'tanggapan', None) or not tiket.tanggapan.file_output:
        raise HTTPException(status_code=404, detail="Berkas tanggapan tidak ditemukan.")

    sec_helper.cek_kepemilikan_tiket(
        user_email=user_data["email"],
        ticket_owner_email=tiket.email_mahasiswa,
        user_role=user_data["role"]
    )

    filepath = _resolve_ticket_file_path(tiket.tanggapan.file_output)
    return _build_file_response(filepath)
