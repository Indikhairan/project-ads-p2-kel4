import base64
import hashlib
import json
import jwt
import os
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
    def cek_role(self, user_data: dict, *required_roles: str):
        """Pastikan user memiliki salah satu dari role yang diperbolehkan."""
        if user_data.get("role") not in required_roles:
            allowed = " / ".join(required_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak! Hanya {allowed} yang diperbolehkan."
            )

    def cek_kepemilikan_tiket(self, user_email: str, ticket_owner_email: str, user_role: str):
        """
        Staff dan admin boleh akses semua tiket.
        Mahasiswa hanya boleh akses tiket miliknya sendiri.
        """
        if user_role in ["staff", "admin"]:
            return True
            
        if user_email != ticket_owner_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akses ditolak! Ini bukan tiket milik Anda."
            )

    # Accounting
    def log_aktivitas(self, db: Session, email: str, role: str, aksi: str, status_log: str, ip_address: str):
        """Simpan audit log ke database tanpa di-commit otomatis."""
        new_log = models.AuditLog(
            waktu=datetime.utcnow(),
            email_aktor=email,
            role_aktor=role,
            aksi=aksi,
            status=status_log,
            ip_address=ip_address
        )
        db.add(new_log)

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

# objek sec_helper yang akan di import ke file router
sec_helper = SecurityService()