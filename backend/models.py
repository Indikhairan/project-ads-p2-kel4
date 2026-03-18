from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime

# --- 1. USER INHERITANCE ---
class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    nama_lengkap = Column(String, nullable=False)
    role = Column(String)  # 'mahasiswa', 'staff', 'admin'
    
    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': role
    }
    
    activities = relationship("AuditLog", back_populates="aktor")

class Mahasiswa(User):
    __tablename__ = "mahasiswa"
    email = Column(String, ForeignKey('users.email'), primary_key=True)
    nim = Column(String, unique=True)
    program_studi = Column(String)
    departemen = Column(String)
    fakultas = Column(String)
    semester = Column(Integer)

    __mapper_args__ = {'polymorphic_identity': 'mahasiswa'}
    
    tikets = relationship("TiketLayanan", back_populates="pengaju")
    sessions = relationship("ChatbotSession", back_populates="mahasiswa")

class StaffAkademik(User):
    __tablename__ = "staff_akademik"
    email = Column(String, ForeignKey('users.email'), primary_key=True)
    nip = Column(String, unique=True)
    unit_kerja = Column(String)

    __mapper_args__ = {'polymorphic_identity': 'staff'}
    
    tikets_diproses = relationship("TiketLayanan", back_populates="pemroses")

class AdminSistem(User):
    __mapper_args__ = {'polymorphic_identity': 'admin'}

# --- 2. LAYANAN & TIKET ---
class Layanan(Base):
    __tablename__ = "layanan"
    id_layanan = Column(String, primary_key=True)
    nama_layanan = Column(String)
    tipe_output = Column(String)
    unit_penanggung_jawab = Column(String)
    
    tikets = relationship("TiketLayanan", back_populates="layanan")

class TiketLayanan(Base):
    __tablename__ = "tiket_layanan"
    id_tiket = Column(String, primary_key=True)
    waktu_submit = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Open")
    data_request = Column(JSON)
    file_lampiran = Column(String, nullable=True)

    # Foreign Keys
    email_mahasiswa = Column(String, ForeignKey('mahasiswa.email'))
    email_staff = Column(String, ForeignKey('staff_akademik.email'), nullable=True)
    id_layanan = Column(String, ForeignKey('layanan.id_layanan'))

    # Relasi
    pengaju = relationship("Mahasiswa", back_populates="tikets")
    pemroses = relationship("StaffAkademik", back_populates="tikets_diproses")
    layanan = relationship("Layanan", back_populates="tikets")
    notifikasi = relationship("Notifikasi", back_populates="tiket", cascade="all, delete-orphan")

# --- 3. FITUR PENDUKUNG ---
class Notifikasi(Base):
    __tablename__ = "notifikasi"
    id_notifikasi = Column(String, primary_key=True)
    pesan = Column(String)
    waktu = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    id_tiket = Column(String, ForeignKey('tiket_layanan.id_tiket'))

    tiket = relationship("TiketLayanan", back_populates="notifikasi")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id_keyword = Column(String, primary_key=True)
    kata_kunci = Column(String)
    jawaban = Column(String)

class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"
    id_chat = Column(String, primary_key=True)
    email_mahasiswa = Column(String, ForeignKey('mahasiswa.email'))
    pesan_user = Column(String)
    waktu_kirim = Column(DateTime, default=datetime.utcnow)
    id_keyword_terdeteksi = Column(String, ForeignKey('knowledge_base.id_keyword'), nullable=True)
    
    mahasiswa = relationship("Mahasiswa", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id_log = Column(Integer, primary_key=True, autoincrement=True)
    waktu = Column(DateTime, default=datetime.utcnow)
    email_aktor = Column(String, ForeignKey('users.email'))
    role_aktor = Column(String)
    aksi = Column(String)
    status = Column(String)
    ip_address = Column(String)

    aktor = relationship("User", back_populates="activities")