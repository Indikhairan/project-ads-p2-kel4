from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend import models
from backend.security import sec_helper 

router = APIRouter(
    prefix="/api/v1/admin/kelola-pengguna",
    tags=["Admin Kelola Pengguna"]
)

# Schema untuk Tambah Pengguna Baru (POST)
class UserCreate(BaseModel):
    email: EmailStr
    nama_lengkap: str
    role: str # admin, staff, mahasiswa
    
    # Field opsional, divalidasi ketat secara kondisional di bawah
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None

    @model_validator(mode='after')
    def validasi_role_spesifik(self):
        role_user = self.role.lower()
        
        if role_user == "staff":
            if not self.nip or not self.nip.strip():
                raise ValueError("NIP wajib diisi untuk Staff Akademik!")
            if not self.unit_kerja or not self.unit_kerja.strip():
                raise ValueError("Unit kerja wajib diisi untuk Staff Akademik!")
                
        elif role_user == "admin":
            if not self.nip or not self.nip.strip():
                raise ValueError("NIP wajib diisi untuk Admin Sistem!")
                
        return self

# Schema untuk Edit Pengguna (PUT)
class UserUpdate(BaseModel):
    nama_lengkap: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Field spesifik yang bisa diubah oleh Admin
    nip: Optional[str] = None
    unit_kerja: Optional[str] = None
    nim: Optional[str] = None
    program_studi: Optional[str] = None
    departemen: Optional[str] = None
    fakultas: Optional[str] = None

@router.get("/")
def lihat_semua_pengguna(request: Request, db: Session = Depends(get_db), user_info: dict = Depends(sec_helper.require_roles("admin"))):
    pengguna = db.query(models.User).all()
    
    hasil = [
        {
            "nama_lengkap": p.nama_lengkap,
            "email": p.email,
            "role": p.role,
            "tanggal_terdaftar": p.tanggal_terdaftar,
            "is_active": p.is_active
        } for p in pengguna
    ]
        
    return {"status": "success", "data": hasil}

@router.post("/", status_code=201)
def tambah_pengguna(data: UserCreate, request: Request, db: Session = Depends(get_db), user_info: dict = Depends(sec_helper.require_roles("admin"))):

    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")

    role_user = data.role.lower()

    if role_user == "staff":
        user_baru = models.StaffAkademik(
            email=data.email, 
            nama_lengkap=data.nama_lengkap, 
            nip=data.nip, 
            unit_kerja=data.unit_kerja
        )
    elif role_user == "admin":
        user_baru = models.AdminSistem(
            email=data.email, 
            nama_lengkap=data.nama_lengkap, 
            nip=data.nip
        )
    elif role_user == "mahasiswa":
        user_baru = models.Mahasiswa(
            email=data.email, 
            nama_lengkap=data.nama_lengkap
        )
    else:
        raise HTTPException(status_code=400, detail="Role tidak valid!")

    db.add(user_baru)
    
    # TANAM LOG AKTIVITAS (Sudah termasuk db.commit)
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Mendaftarkan pengguna baru: {data.email} ({role_user})",
        request=request
    )
    
    return {"status": "success", "message": f"Pengguna {data.nama_lengkap} ({role_user}) berhasil ditambahkan."}

@router.put("/{email}")
def edit_pengguna(email: str, data: UserUpdate, request: Request, db: Session = Depends(get_db), user_info: dict = Depends(sec_helper.require_roles("admin"))):

    # Cari user di base table
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    # 1. Update data umum yang ada di kelas User
    if data.nama_lengkap is not None:
        user.nama_lengkap = data.nama_lengkap
    if data.is_active is not None:
        user.is_active = data.is_active

    # 2. Update data spesifik menggunakan isinstance() untuk mendeteksi tipe tabel anak
    if isinstance(user, models.StaffAkademik):
        if data.nip is not None:
            user.nip = data.nip
        if data.unit_kerja is not None:
            user.unit_kerja = data.unit_kerja
            
        # Validasi akhir agar data Staff tidak dikosongkan menjadi null/string kosong
        if not user.nip or not user.nip.strip() or not user.unit_kerja or not user.unit_kerja.strip():
            raise HTTPException(status_code=400, detail="Untuk Staff, NIP dan Unit Kerja tidak boleh kosong!")

    elif isinstance(user, models.AdminSistem):
        if data.nip is not None:
            user.nip = data.nip
        if not user.nip or not user.nip.strip():
            raise HTTPException(status_code=400, detail="Untuk Admin, NIP tidak boleh kosong!")

    elif isinstance(user, models.Mahasiswa):
        # Menyediakan akses jika Admin sewaktu-waktu perlu membenarkan NIM/Fakultas Mahasiswa
        if data.nim is not None:
            user.nim = data.nim
        if data.program_studi is not None:
            user.program_studi = data.program_studi
        if data.departemen is not None:
            user.departemen = data.departemen
        if data.fakultas is not None:
            user.fakultas = data.fakultas

    # TANAM LOG AKTIVITAS (Sudah termasuk db.commit)
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Memperbarui profil pengguna: {email}",
        request=request
    )
    
    return {"status": "success", "message": f"Data pengguna {email} berhasil diperbarui."}

@router.delete("/{email}")
def nonaktifkan_pengguna(email: str, request: Request, db: Session = Depends(get_db), user_info: dict = Depends(sec_helper.require_roles("admin"))):

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    if not user.is_active:
        return {"status": "info", "message": f"Akun {email} memang sudah dalam status tidak aktif."}

    # Ubah flag status aktif menjadi False
    user.is_active = False 
    
    # TANAM LOG AKTIVITAS (Sudah termasuk db.commit)
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Menonaktifkan (Disable) akun: {email}",
        request=request,
        status_log="Success (Disabled)"
    )

    return {"status": "success", "message": f"Pengguna {email} berhasil dinonaktifkan dari sistem."}

@router.post("/{email}/reset-kunci")
def reset_kunci_staff(email: str, request: Request, db: Session = Depends(get_db), user_info: dict = Depends(sec_helper.require_roles("admin"))):

    # 2. Cari user di database
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    # 3. Pastikan objek yang ditemukan benar-benar merupakan instansiasi StaffAkademik
    if not isinstance(user, models.StaffAkademik):
        raise HTTPException(
            status_code=400, 
            detail="Tindakan ilegal! Reset kunci keamanan hanya dapat dilakukan pada pengguna dengan peran Staff."
        )

    # 4. Cek apakah memang kuncinya sudah kosong atau belum
    if user.public_key is None and user.encrypted_private_key is None:
        return {"status": "info", "message": f"Akun staff {email} memang belum memiliki atau sudah di-reset kunci keamanannya."}

    # 5. Eksekusi penghapusan kunci publik dan privat (Reset Total)
    user.public_key = None
    user.encrypted_private_key = None # <--- TAMBAHKAN BARIS INI
    
    # TANAM LOG AKTIVITAS (Sudah termasuk db.commit)
    sec_helper.log_aktivitas(
        db=db,
        aksi=f"Mereset Kunci Publik & Privat milik Staff: {email}",
        request=request,
        status_log="Success (Key Revoked)"
    )

    return {
        "status": "success", 
        "message": f"Kunci keamanan milik {user.nama_lengkap} ({email}) berhasil di-reset total. Staff dapat melakukan generate ulang sepasang kunci baru pada portal mereka."
    }