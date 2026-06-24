import base64
import hashlib
import json
import jwt
import os
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.types import TypeDecorator, String as SAString
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from backend import models 

load_dotenv()

class EncryptedString(TypeDecorator):
    impl = SAString
    cache_ok = True

    def __init__(self, length=255, **kwargs):
        secret = os.getenv("FERNET_KEY") or os.getenv("SECRET_KEY")
        if not secret:
            raise ValueError("FERNET_KEY atau SECRET_KEY harus disetel untuk EncryptedString")

        key_material = secret.encode() if isinstance(secret, str) else secret
        key = base64.urlsafe_b64encode(hashlib.sha256(key_material).digest())
        self.fernet = Fernet(key)
        super().__init__(length=length, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, str):
            raise ValueError("EncryptedString hanya mendukung nilai string")
        return self.fernet.encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return self.fernet.decrypt(value.encode()).decode()

class SecurityService:
    def __init__(self):
        """Constructor: Menyiapkan amunisi keamanan saat server baru menyala"""
        self.secret_key = os.getenv("SECRET_KEY")
        self.algorithm = "HS256"
        self.expire_minutes = 180

        if not self.secret_key:
            raise ValueError("SECRET_KEY tidak ditemukan. Pastikan file .env sudah ada")

    # Authentication
    def buat_token_akses(self, data: dict) -> str:
        """Buat JWT access token dengan expiry."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.expire_minutes)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verifikasi_token(self, token: str) -> dict:
        """Verifikasi JWT — kembalikan payload atau error."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return {"status": "success", "data": payload}

        except jwt.ExpiredSignatureError:
            return {"status": "error", "message": "Session timeout, silakan login ulang."}

        except jwt.InvalidTokenError:
            return {"status": "error", "message": "Token tidak valid. Unauthorized."}

    def ekstrak_token(self, request: Request) -> dict:
        """Helper: ambil dan verifikasi token dari header Authorization."""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak ditemukan. Harap login terlebih dahulu."
            )
        
        token = auth_header.split(" ")[1]
        user_info = self.verifikasi_token(token) 
        
        if user_info["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=user_info["message"]
            )
        return user_info["data"]
    
    # Authorization
    def cek_role(self, user_data: dict, db, request, *roles_diizinkan):
        """
        Mengecek apakah role user ada di dalam daftar roles_diizinkan.
        Jika tidak, tolak akses dan catat aktivitas ilegal tersebut (RBAC Failed).
        """
        role_user = user_data.get("role", "Guest")
        
        if role_user not in roles_diizinkan:
            # 1. Ambil path URL yang dicoba diakses (misal: /api/v1/tiket/123/tanggapan)
            url_target = request.url.path
            
            # 2. Catat Log Pelanggaran RBAC
            self.log_aktivitas(
                db=db,
                aksi=f"Akses terlarang ke {url_target} (Butuh: {', '.join(roles_diizinkan)})",
                request=request,
                status_log="Failed (RBAC - Forbidden)"
            )
            
            # 3. Tendang user-nya
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak. Fitur ini hanya untuk {', '.join(roles_diizinkan)}."
            )

    def cek_kepemilikan_tiket(self, user_email: str, ticket_owner_email: str, user_role: str, id_tiket: str, request: Request, db):
        """
        Staff dan admin boleh akses semua tiket.
        Mahasiswa hanya boleh akses tiket miliknya sendiri.
        """
        if user_role in ["staff", "admin"]:
            self.log_aktivitas(
                db=db,
                aksi=f"Akses tiket {id_tiket} oleh {user_role}",
                request=request,
                status_log="Success (OBAC)"
            )
            return True
            
        if user_email != ticket_owner_email:
            self.log_aktivitas(
                db=db,
                aksi=f"Akses Ilegal: {user_email} mencoba membuka tiket {id_tiket} milik {ticket_owner_email}",
                request=request,
                status_log="Failed (OBAC - Unauthorized)"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak! Ini bukan tiket milik Anda."
            )
            
        # Jika mahasiswa mengakses tiketnya sendiri
        self.log_aktivitas(
            db=db,
            aksi=f"Akses tiket {id_tiket} miliknya sendiri",
            request=request,
            status_log="Success (OBAC)"
        )
        return True

    # Accounting
    def log_aktivitas(
        self,
        db, 
        aksi: str, 
        request=None, 
        email: str = None, 
        role: str = None, 
        status_log: str = "Success", 
        ip_address: str = None
    ):
        """
        Fungsi cerdas untuk mencatat log.
        Bisa mengekstrak data otomatis dari 'request', atau menerima input manual.
        """
        # 1. Cari IP Address (Otomatis dari request jika tidak diisi manual)
        if not ip_address and request:
            ip_address = request.client.host
        elif not ip_address:
            ip_address = "Unknown IP"

        # 2. Cari Email dan Role (Jika tidak diisi manual, ambil dari token request)
        if not email or not role:
            try:
                if request:
                    # ekstrak_token ini memanggil fungsi ekstrak token milikmu
                    user_data = self.ekstrak_token(request) 
                    email = email or user_data.get("email", "Unknown")
                    role = role or user_data.get("role", "Guest")
            except Exception:
                # Jika token expired/tidak valid/tidak ada
                email = email or "Unknown"
                role = role or "Guest"

        # 3. Tulis ke Database
        waktu_jkt = datetime.now(ZoneInfo("Asia/Jakarta"))
        new_log = models.AuditLog(
            waktu=waktu_jkt,
            email_aktor=email,
            role_aktor=role,
            aksi=aksi,
            status=status_log,
            ip_address=ip_address
        )
        db.add(new_log)
        db.commit()

    @staticmethod
    def buat_pasangan_kunci():
        """Menghasilkan pasangan Private Key dan Public Key RSA 2048-bit."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        public_key = private_key.public_key()

        pem_private = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )

        pem_public = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        return pem_private.decode('utf-8'), pem_public.decode('utf-8')

    @staticmethod
    def _get_fernet_from_passphrase(passphrase: str) -> Fernet:
        """Helper: Mengubah string Passphrase menjadi kunci gembok Fernet (AES)."""
        salt = b'sapa_ipb_secret_salt_2026' 
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        return Fernet(key)

    def bungkus_kunci_privat(self, pem_privat: str, passphrase: str) -> str:
        """Membungkus (enkripsi AES) Private Key RSA menggunakan Passphrase."""
        f = self._get_fernet_from_passphrase(passphrase)
        return f.encrypt(pem_privat.encode()).decode()

    def buka_bungkus_kunci_privat(self, kunci_terenkripsi: str, passphrase: str) -> bytes:
        """Membuka (dekripsi AES) Private Key RSA menggunakan Passphrase."""
        try:
            f = self._get_fernet_from_passphrase(passphrase)
            return f.decrypt(kunci_terenkripsi.encode())
        except Exception:
            raise ValueError("Passphrase salah! Gagal membuka kunci.")

    def buat_digital_signature(self, payload: str, private_key_pem: bytes) -> str:
        """Menandatangani payload menggunakan Private Key RSA yang sudah terbuka."""
        private_key = serialization.load_pem_private_key(
            private_key_pem,
            password=None,
        )
        signature = private_key.sign(
            payload.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        # Return dalam bentuk Base64 agar bisa disimpan ke database sebagai Text
        return base64.b64encode(signature).decode('utf-8')
    
    def verifikasi_digital_signature(self, payload: str, signature_b64: str, public_key_pem: str) -> bool:
        """Memverifikasi Tanda Tangan Digital menggunakan Public Key."""
        try:
            # 1. Ubah teks PEM menjadi objek Public Key
            public_key = serialization.load_pem_public_key(public_key_pem.encode('utf-8'))
            
            # 2. Ubah Signature dari Base64 kembali ke format bytes asli
            signature_bytes = base64.b64decode(signature_b64)
            
            # 3. Proses Verifikasi RSA
            public_key.verify(
                signature_bytes,
                payload.encode('utf-8'),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True # Kalau tidak ada error, berarti VALID!
        except Exception:
            return False # Kalau gagal diverifikasi, berarti PALSU/BERUBAH!

# objek sec_helper yang akan di import ke file router
sec_helper = SecurityService()