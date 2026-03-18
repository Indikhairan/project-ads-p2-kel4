from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime

# --- 1. USER INHERITANCE HIERARCHY ---
class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    namaLengkap = Column(String, nullable=False)
    role = Column(String) # 'mahasiswa', 'staff', 'admin'
    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': role
    }
    
    # Semua user punya log aktivitas
    activities = relationship("AuditLog", back_populates="aktor")

class Mahasiswa(User):
    __tablename__ = "mahasiswa"
    email = Column(String, ForeignKey('users.email'), primary_key=True)
    nim = Column(String, unique=True)
    programStudi = Column(String)
    departemen = Column(String)
    fakultas = Column(String)
    semester = Column(Integer)

    __mapper_args__ = {'polymorphic_identity': 'mahasiswa'}
    
    # Relasi Association: Mahasiswa mengajukan banyak Tiket
    tikets = relationship("TiketLayanan", back_populates="pengaju")
    # Relasi Association: Mahasiswa memiliki banyak ChatbotSession
    sessions = relationship("ChatbotSession", back_populates="mahasiswa")

class StaffAkademik(User):
    __tablename__ = "staff_akademik"
    email = Column(String, ForeignKey('users.email'), primary_key=True)
    nip = Column(String, unique=True)
    unitKerja = Column(String)

    __mapper_args__ = {'polymorphic_identity': 'staff'}
    
    # Relasi Association: Staff memproses banyak Tiket
    tikets_diproses = relationship("TiketLayanan", back_populates="pemroses")

class AdminSistem(User):
    __mapper_args__ = {
        'polymorphic_identity': 'admin',
    }

    def can_monitor_logs(self):
        return True

# --- 2. LAYANAN & TIKET (Aggregation & Composition) ---
class Layanan(Base):
    __tablename__ = "layanan"
    idLayanan = Column(String, primary_key=True)
    namaLayanan = Column(String)
    tipeOutput = Column(String)
    unitPenanggungJawab = Column(String)
    
    # Relasi Aggregation: Layanan memiliki banyak Tiket
    tikets = relationship("TiketLayanan", back_populates="layanan")

class TiketLayanan(Base):
    __tablename__ = "tiket_layanan"
    id_tiket = Column(String, primary_key=True) # Sebelumnya idTiket
    waktu_submit = Column(DateTime, default=datetime.utcnow) # Sebelumnya waktuSubmit
    status = Column(String, default="Pending")
    data_request = Column(JSON) # Sebelumnya dataRequest
    file_lampiran = Column(String, nullable=True)

    # Foreign Keys untuk Relasi
    email_mahasiswa = Column(String, ForeignKey('mahasiswa.email'))
    email_staff = Column(String, ForeignKey('staff_akademik.email'), nullable=True)
    id_layanan = Column(String, ForeignKey('layanan.idLayanan'))

    # Relasi balik
    pengaju = relationship("Mahasiswa", back_populates="tikets")
    pemroses = relationship("StaffAkademik", back_populates="tikets_diproses")
    layanan = relationship("Layanan", back_populates="tikets")
    
    # Relasi Composition: Tiket menghasilkan banyak Notifikasi (cascade delete)
    notifikasi = relationship("Notifikasi", back_populates="tiket", cascade="all, delete-orphan")

# --- 3. FITUR PENDUKUNG ---
class Notifikasi(Base):
    __tablename__ = "notifikasi"
    idNotifikasi = Column(String, primary_key=True)
    pesan = Column(String)
    waktu = Column(DateTime, default=datetime.utcnow)
    isRead = Column(Boolean, default=False)
    id_tiket = Column(String, ForeignKey('tiket_layanan.idTiket'))

    tiket = relationship("TiketLayanan", back_populates="notifikasi")

class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"
    idChat = Column(String, primary_key=True)
    email_mahasiswa = Column(String, ForeignKey('mahasiswa.email'))
    pesanUser = Column(String)
    waktuKirim = Column(DateTime, default=datetime.utcnow)
    id_keyword_terdeteksi = Column(String, ForeignKey('knowledge_base.idKeyword'), nullable=True)
    mahasiswa = relationship("Mahasiswa", back_populates="sessions")
    knowledge = relationship("KnowledgeBase") # Untuk mempermudah join data jawaban

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    idKeyword = Column(String, primary_key=True)
    kataKunci = Column(String)
    jawaban = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    idLog = Column(Integer, primary_key=True, autoincrement=True)
    waktu = Column(DateTime, default=datetime.utcnow)
    emailAktor = Column(String, ForeignKey('users.email'))
    roleAktor = Column(String)
    aksi = Column(String)
    status = Column(String)
    ipAddress = Column(String)