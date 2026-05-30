# 📋 SAPA System - Dokumentasi Detail

**Last Updated:** May 29, 2026

---

## 📌 Ringkasan Sistem

**SAPA** (Sistem Pengajuan dan Pengelolaan Tiket Layanan Akademik) adalah platform full-stack terintegrasi untuk:
- Mahasiswa: mengajukan permintaan layanan (surat, informasi)
- Staff Akademik: memproses dan merespons tiket
- Admin: mengelola users dan security

---

## 🔄 ALUR SISTEM (User Journey)

### 1️⃣ **ALUR MAHASISWA**

```
┌─────────────┐
│   LOGIN     │ → Email + Password (Bcrypt verification)
└──────┬──────┘
       ↓
┌─────────────────────────────┐
│ DASHBOARD MAHASISWA         │ → View notifikasi & tiket riwayat
└──────┬──────────────────────┘
       ↓
   [Pilihan User]
   ├─ Ajukan Tiket Baru → Kategori (Persuratan/Informasi)
   ├─ Lihat Riwayat Tiket → Status tracking
   ├─ Chat dengan Chatbot → AI Q&A
   └─ Lihat Knowledge Base → FAQ

[ALUR AJUKAN TIKET]
       ↓
┌─────────────────────────────┐
│ FORM PENGAJUAN TIKET        │
├─────────────────────────────┤
│ • Pilih Kategori:           │
│   - Persuratan: Surat       │
│   - Informasi: Pertanyaan   │
│                             │
│ • Untuk PERSURATAN:         │
│   - Pilih jenis surat       │
│   - Isi data akademik       │
│   - Upload dokumen (+KTM)   │
│                             │
│ • Untuk INFORMASI:          │
│   - Isi subjek & deskripsi  │
│   - Upload file (optional)  │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│ VALIDASI & SUBMIT           │
│ - Cek field required        │
│ - Encrypt data sensitif     │
│ - Simpan ke database        │
│ - Generate ID_TIKET (UUID)  │
│ - Create notifikasi         │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│ ✅ TIKET CREATED            │
│ Status: OPEN                │
│ Notif dikirim ke Mahasiswa  │
└─────────────────────────────┘
```

### 2️⃣ **ALUR STAFF AKADEMIK**

```
┌──────────────┐
│    LOGIN     │ → Email + Password (Bcrypt verification)
└───────┬──────┘
        ↓
┌──────────────────────────────┐
│ DASHBOARD STAFF              │ → View tiket assigned
└───────┬──────────────────────┘
        ↓
┌──────────────────────────────┐
│ LIST TIKET YANG MASUK        │
│ Status: OPEN (belum diproses)│
└───────┬──────────────────────┘
        ↓
┌──────────────────────────────┐
│ DETAIL TIKET                 │
│ - View data mahasiswa        │
│ - View persyaratan/lampiran  │
│ - View history aktivitas     │
└───────┬──────────────────────┘
        ↓
   [PROSES TIKET]
   ├─ Ubah Status → "Diproses"
   ├─ Isi Tanggapan → Pesan response
   ├─ Upload File Output → Output surat/dokumen
   └─ Simpan & Kirim → Status "Selesai"
        ↓
┌──────────────────────────────┐
│ ✅ TIKET SELESAI             │
│ - Notifikasi dikirim ke      │
│   mahasiswa                  │
│ - Status berubah: SELESAI    │
│ - Mahasiswa bisa download    │
│   file output                │
└──────────────────────────────┘
```

### 3️⃣ **ALUR CHATBOT MAHASISWA**

```
┌─────────────┐
│ CHAT PAGE   │
└──────┬──────┘
       ↓
┌──────────────────────────────┐
│ Mahasiswa ketik pertanyaan    │
└──────┬───────────────────────┘
       ↓
┌──────────────────────────────┐
│ SIMILARITY SEARCH (FAISS)    │
│ - Cari di Knowledge Base     │
│ - Match dengan kata kunci    │
└──────┬───────────────────────┘
       ↓
   [ADA KESAMAAN?]
   ├─ YA: Ambil jawaban + RAG
   │       └─ Feed ke Gemini API
   │         └─ Generate response
   │         └─ Simpan di chat_history
   │
   └─ TIDAK: Gemini Q&A langsung
              └─ Generate response
              └─ Simpan di chat_history
       ↓
┌──────────────────────────────┐
│ ✅ JAWABAN DITAMPILKAN        │
│ - Real-time di chat UI       │
│ - Disimpan di database       │
└──────────────────────────────┘
```

---

## 💾 DATABASE SCHEMA

### **Tabel User (Inheritance Pattern)**

```
┌─ users (Base)
│  ├─ id (PK)
│  ├─ email (UNIQUE)
│  ├─ nama_lengkap
│  ├─ role (polymorphic: 'mahasiswa'|'staff'|'admin')
│  └─ is_active
│
├─ mahasiswa (FK → users.id)
│  ├─ id
│  ├─ nim (ENCRYPTED)
│  ├─ program_studi (ENCRYPTED)
│  ├─ departemen (ENCRYPTED)
│  ├─ fakultas (ENCRYPTED)
│  └─ semester
│
├─ staff_akademik (FK → users.id)
│  ├─ id
│  ├─ nip (UNIQUE)
│  └─ unit_kerja
│
└─ admin_sistem (FK → users.id)
   └─ id
```

### **Tabel Tiket & Layanan**

```
layanan
├─ id_layanan (PK: "Persuratan"/"Layanan")
├─ nama_layanan
├─ tipe_output
└─ unit_penanggung_jawab

tiket_layanan
├─ id_tiket (PK: UUID)
├─ waktu_submit (DATETIME)
├─ status ("Open" → "Diproses" → "Selesai"/"Ditolak")
├─ subjek
├─ kategori ("Persuratan" / "Informasi" / "Lainnya")
├─ deskripsi (ENCRYPTED)
├─ data_request (JSONB) ← Flexible: jenis_surat, tujuan, alamat, dll
├─ file_lampiran
├─ mahasiswa_id (FK → mahasiswa.id)
├─ staff_id (FK → staff_akademik.id, nullable)
├─ email_mahasiswa
├─ email_staff (nullable)
└─ id_layanan (FK → layanan.id_layanan)

tanggapan_staff
├─ id_tanggapan (PK: UUID)
├─ id_tiket (FK → tiket_layanan.id_tiket, UNIQUE)
├─ staff_id (FK → staff_akademik.id)
├─ email_staff
├─ pesan
├─ file_output (nama file output)
└─ waktu (DATETIME)
```

### **Tabel Chatbot & Knowledge Base**

```
knowledge_base
├─ id_keyword (PK: "KB001", dll)
├─ kata_kunci
├─ jawaban (TEXT)
└─ kategori

chatbot_sessions
├─ id_chat (PK: UUID)
├─ mahasiswa_id (FK → mahasiswa.id)
├─ email_mahasiswa
├─ pesan_user
├─ jawaban_bot (nullable)
├─ waktu_kirim (DATETIME)
└─ id_keyword_terdeteksi (FK → knowledge_base.id_keyword, nullable)
```

### **Tabel Notifikasi & Audit**

```
notifikasi
├─ id_notifikasi (PK: UUID)
├─ pesan
├─ waktu (DATETIME)
├─ is_read (BOOLEAN)
└─ id_tiket (FK → tiket_layanan.id_tiket, indexed)

audit_logs
├─ id_log (PK: auto-increment)
├─ waktu (DATETIME)
├─ user_id (FK → users.id, nullable)
├─ email_aktor
├─ role_aktor
├─ aksi
├─ status
└─ ip_address
```

---

## 🏗️ BACKEND ARCHITECTURE

### **Router List (10 routers)**

| Router | Endpoint | Fungsi |
|--------|----------|--------|
| `auth.py` | `/auth` | Login, register, JWT validation |
| `tiket.py` | `/api/v1/tiket` | CRUD tiket, submit, list riwayat |
| `staff.py` | `/api/v1/staff` | Staff process ticket, ubah status |
| `notifikasi.py` | `/api/v1/notifikasi` | Get notifikasi, mark read |
| `chatbot.py` | `/api/v1/chatbot` | Chat, chat history |
| `knowledge_base.py` | `/api/v1/knowledge_base` | Get KB, search |
| `kelola_pengguna.py` | `/api/v1/users` | Manage users (admin) |
| `admin_security.py` | `/api/v1/admin/security` | Security dashboard |
| `admin_sync.py` | `/api/v1/admin/sync` | Sync operations |
| `update.py` | `/api/v1/update` | System updates |

### **Core Services**

```
backend/
├─ main.py → FastAPI app setup + CORS
├─ database.py → SQLAlchemy session factory
├─ models.py → All ORM models
├─ schemas.py → Pydantic validators
├─ security.py → EncryptedString, JWT, Bcrypt
├─ ingest.py → Load KB, init FAISS
└─ routers/ → 10 endpoint routers
```

### **Security Features**

✅ **Encryption**
- Data sensitif (NIM, alamat) encrypted dengan `EncryptedString`
- Password hashing dengan Bcrypt
- JWT token untuk auth

✅ **Access Control**
- Role-based: Mahasiswa, Staff, Admin
- Endpoint-level authorization

✅ **Audit**
- Semua aksi dicatat di `audit_logs`
- IP tracking untuk security

---

## 🎨 FRONTEND STRUCTURE

### **Pages**

```
pages/
├─ login.jsx → Authentication page
├─ HomepageMahasiswa.jsx → Dashboard mahasiswa
├─ HomepageStaff.jsx → Dashboard staff
├─ DashboardKeamanan.jsx → Admin security dashboard
├─ FormPengajuanTiket.jsx → Submit ticket form
├─ DetailTiketPage.jsx → Detail tiket (mahasiswa view)
├─ DetailTiketStaff.jsx → Detail tiket (staff view)
├─ RiwayatTiketPage.jsx → Ticket history
├─ ChatbotSAPA.jsx → Chatbot interface
├─ KnowledgeBasePage.jsx → KB display
├─ NotifikasiPage.jsx → Notifications
├─ PusatPersetujuanPage.jsx → Approval center
└─ TambahUserPage.jsx → Add user (admin)
```

### **Components**

```
components/
├─ FormPengajuanTiket.jsx → Ticket form (includes PersyaratanDinamis)
├─ ChatbotSAPA.jsx → Chat interface
├─ TopNavigationAdmin.jsx → Admin navbar
├─ TopNavigationStaff.jsx → Staff navbar
├─ TopNavigationSection.jsx → General navbar
├─ WelcomeBannerSection.jsx → Header banner
└─ AcademicServicesDashboardSection.jsx → Services overview
```

### **Tech Stack**

- Framework: React 18 + Vite
- Styling: Tailwind CSS
- Routing: React Router v6
- HTTP: Fetch API / Axios
- State: useState hooks

---

## 🚨 ERROR & CONFLICTS YANG DITEMUKAN

### **Error 1: Duplikasi `handleSubmit` di FormPengajuanTiket.jsx** ✅ FIXED

**Masalah:**
- Line 300-330 ada 2 deklarasi `handleSubmit`
- Yang pertama `const handleSubmit = async () => {...}` tidak ditutup
- Yang kedua `const handleSubmit = () => {...}` menimpa yang pertama
- Menyebabkan syntax error "'}' expected"

**Solusi:** Hapus deklarasi pertama yang incomplete, gunakan hanya yang kedua

### **Error 2: Tailwind CSS Warnings** ⚠️ MINOR

**Masalah:**
- Penggunaan arbitrary values: `z-[60]`, `max-w-[680px]`, `w-[220px]`
- ESLint suggests: gunakan standardized values: `z-60`, `max-w-170`, `w-55`

**Impact:** Warnings saja, functionality tidak terganggu
**Solusi:** Bisa optional untuk refactor ke standardized Tailwind classes

---

## ❌ YANG KURANG DARI SISTEM

### 🔴 **CRITICAL (Harus Segera)**

1. **Email Notification System**
   - ❌ Tidak ada integrasi email
   - ❌ Mahasiswa tidak dapat notifikasi via email saat status tiket berubah
   - **Solusi:** Integrasikan SMTP/SendGrid/AWS SES
   - **Priority:** HIGH

2. **Comprehensive Error Handling & Logging**
   - ❌ Error handling tidak konsisten di semua router
   - ❌ Belum ada structured logging
   - **Solusi:** Implement Python `logging` module + middleware
   - **Priority:** HIGH

3. **Real-time Updates (WebSocket)**
   - ❌ Status tiket hanya update via polling
   - ❌ Chatbot responses tidak real-time
   - **Solusi:** Implement FastAPI WebSocket
   - **Priority:** MEDIUM-HIGH

4. **Search & Filter untuk Tiket**
   - ❌ Mahasiswa tidak bisa search tiket lama
   - ❌ Tidak ada filter by status, date, kategori
   - **Solusi:** Tambah search endpoint dengan SQL queries

5. **Unit & Integration Tests**
   - ❌ Tidak ada test suite sama sekali
   - ❌ Risiko bug regression tinggi saat development
   - **Solusi:** Setup pytest + create test cases

### 🟠 **IMPORTANT (Penting untuk Production)**

6. **API Rate Limiting & Throttling**
   - ❌ Tidak ada protection terhadap spam/brute force
   - **Solusi:** Implement rate limiter middleware

7. **Enhanced Input Validation**
   - ❌ XSS/SQL injection risk belum fully mitigated
   - **Solusi:** Enhanced Pydantic validators + input escaping

8. **Caching Strategy**
   - ❌ Setiap request hit database
   - ❌ Knowledge base queries tidak di-cache
   - **Solusi:** Implement Redis caching

9. **Pagination untuk List Endpoints**
   - ❌ Tidak ada pagination support
   - ❌ Large dataset queries akan slow
   - **Solusi:** Add offset/limit params

10. **API Documentation**
    - ❌ Swagger UI belum fully documented
    - **Solusi:** Tambah docstrings & OpenAPI schemas

### 🟡 **INFRASTRUCTURE (DevOps)**

11. **Docker & Docker Compose**
    - ❌ Tidak ada containerization
    - **Solusi:** Create Dockerfile + docker-compose.yml

12. **Environment Configuration**
    - ❌ .env tidak di-version control
    - **Solusi:** Create .env.example + setup docs

13. **CI/CD Pipeline**
    - ❌ Tidak ada automated testing/deployment
    - **Solusi:** GitHub Actions / GitLab CI

14. **Database Backup Strategy**
    - ❌ Tidak ada backup automation
    - **Solusi:** Setup automated backups

### 💡 **NICE TO HAVE (Enhancement)**

15. **Analytics & Reporting Dashboard**
16. **Performance Monitoring (APM)**
17. **Advanced Frontend Features** (Dark mode, PDF export, print)
18. **Multi-language Support** (i18n)
19. **API Versioning Strategy**
20. **Frontend Form Validation** (Zod/Yup schemas)

---

## 📊 IMPLEMENTATION PRIORITY

### **Phase 1: Critical (Week 1-2)** 🔴
1. Fix email notification system
2. Add structured logging & error handling
3. Implement search & filter
4. Enhance input validation

### **Phase 2: Production Ready (Week 3-4)** 🟠
5. Add unit & integration tests
6. Implement rate limiting
7. Add caching strategy
8. Setup Docker & CI/CD

### **Phase 3: Polish (Week 5+)** 🟡
9. API documentation
10. Analytics dashboard
11. WebSocket real-time updates
12. Advanced features

---

## 🚀 QUICK REFERENCE

### **Database Koneksi**
- Engine: PostgreSQL
- ORM: SQLAlchemy
- Migrations: Alembic

### **Key Endpoints**
- Auth: `POST /auth/login`
- Submit Tiket: `POST /api/v1/tiket`
- Get Tiket: `GET /api/v1/tiket/{id}`
- Process Tiket: `PUT /api/v1/staff/tiket/{id}`
- Chat: `POST /api/v1/chatbot/chat`

### **CORS Configuration**
```
allow_origins: [
  "http://localhost:5173",  ← Frontend dev
  "http://localhost:3000"   ← Alternative port
]
```

### **Required Setup**
```bash
# Backend
pip install -r requirements.txt
alembic upgrade head
uvicorn backend.main:app --reload

# Frontend
npm install
npm run dev

# Access: http://localhost:5173
```

---

*Dokumentasi ini akan diperbarui seiring development berlanjut.*
