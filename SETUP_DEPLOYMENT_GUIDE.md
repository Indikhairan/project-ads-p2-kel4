# Setup dan Deployment Guide - Integrasi Form Tiket

## Checklist Persiapan

### 1. Backend Setup

#### a. Pastikan Dependencies Terinstall
```bash
cd project-root
.\.venv\Scripts\Activate.ps1
pip install fastapi sqlalchemy pydantic python-multipart
pip install -r backend/requirements.txt
```

#### b. Update Database Schema (Semester Field)
```bash
# Option 1: Manual update (jika Alembic ada masalah)
# Connect ke PostgreSQL dan jalankan:
ALTER TABLE mahasiswa ADD COLUMN semester VARCHAR NULLABLE;

# Option 2: Jalankan Alembic (jika bisa)
alembic upgrade head
```

#### c. Test Backend Start
```bash
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8000
```

Output yang diharapkan:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 2. Frontend Setup

#### a. Pastikan node_modules terinstall
```bash
cd frontend
npm install
```

#### b. Pastikan VITE_API_URL dikonfigurasi (.env atau vite.config.js)
```
VITE_API_URL=http://localhost:8000
```

#### c. Start Frontend Dev Server
```bash
npm run dev
```

Output yang diharapkan:
```
  VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3. Test Integration

#### a. Test via Postman/cURL

**Setup Bearer Token:**
- Login terlebih dahulu atau gunakan token yang valid
- Copy ke variable `TOKEN`

**Test Ticket Creation (Persuratan):**
```bash
$TOKEN = "your_bearer_token"
$FILES = @{
    id_layanan = "LYN-SURAT"
    kategori = "Persuratan"
    subjek = "Test Surat Aktif"
    deskripsi = "Test deskripsi"
    data_request = '{"jenis_surat":"Surat Keterangan Mahasiswa Aktif","nama":"Test User","nim":"12345678"}'
    nim = "12345678"
    program_studi = "Informatika"
    departemen = "ILMU KOMPUTER"
    fakultas = "FMIPA"
}

$FilePaths = @{
    ktm_file = "C:\path\to\ktm.pdf"
    ukt_file = "C:\path\to\ukt.pdf"
    lampiran_file = "C:\path\to\lampiran.pdf"
}

$Form = @{}
$FILES.GetEnumerator() | ForEach-Object { $Form[$_.Key] = $_.Value }
$FilePaths.GetEnumerator() | ForEach-Object { $Form[$_.Key] = Get-Item $_.Value }

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/tiket/" `
    -Method Post `
    -Headers @{ Authorization = "Bearer $TOKEN" } `
    -Form $Form
```

**Atau gunakan cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/tiket/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "id_layanan=LYN-SURAT" \
  -F "kategori=Persuratan" \
  -F "subjek=Test Tiket" \
  -F 'data_request={"jenis_surat":"Surat Keterangan Mahasiswa Aktif","nama":"John","nim":"123"}' \
  -F "nim=123" \
  -F "program_studi=Informatika" \
  -F "departemen=Ilmu Komputer" \
  -F "fakultas=FMIPA" \
  -F "ktm_file=@/path/to/file.pdf"
```

#### b. Test via Frontend Form

1. Open http://localhost:5173
2. Login dengan akun mahasiswa
3. Buka form "Pengajuan Tiket"
4. Isi form dengan data:
   - Kategori: "Persuratan"
   - Jenis Surat: "Surat Keterangan Mahasiswa Aktif"
   - Nama, NIM, Prodi, dll
   - Upload KTM dan Bukti UKT
5. Click Submit
6. Verifikasi Response:
   - ✅ Success modal muncul
   - ✅ Token dikirim di header Authorization
   - ✅ File tersimpan di `uploads/` folder

### 4. Verify Database

#### Check Tiket Created
```sql
SELECT * FROM tiket_layanan ORDER BY waktu_submit DESC LIMIT 1;
```

Expected output:
```
id_tiket | email_mahasiswa | kategori | data_request | file_lampiran | status
LYN-SURAT-1685099400 | user@ipb.ac.id | Persuratan | {...} | uploads/lampiran/abc123.pdf | Open
```

#### Check Files Stored
```bash
# Check upload directory
dir uploads/
# outputs:
# Directory: C:\...\uploads
#   ktm/
#   ukt/
#   lampiran/

ls -R uploads/
```

### 5. Troubleshooting

#### Error: "CORS policy"
**Solution:** Pastikan backend CORSMiddleware dikonfigurasi:
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Error: "File type not allowed"
**Solution:** Pastikan file yang diupload adalah PDF atau JPG:
```python
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/jpg",
    "application/pdf",
}
```

#### Error: "Data mahasiswa tidak ditemukan"
**Solution:** Mahasiswa harus sudah terdaftar di database:
```sql
SELECT * FROM mahasiswa WHERE email = 'user@ipb.ac.id';
```

#### Error: "Alembic revision failed"
**Solution:** Manual update database
```sql
-- Connect as superuser
ALTER TABLE mahasiswa ADD COLUMN IF NOT EXISTS semester VARCHAR;
```

#### Files not saving to disk
**Checklist:**
- [ ] `uploads/` folder exists dan writable
- [ ] `UPLOAD_DIR = "uploads"` path correct
- [ ] File size < 5 MB
- [ ] Server memiliki disk space

### 6. Production Deployment

#### a. Database Migration (Production)
```bash
# Backup database terlebih dahulu
pg_dump -U postgres sapa_db > backup_$(date +%Y%m%d).sql

# Run migration
alembic upgrade head
```

#### b. Environment Variables
Create `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/sapa_db
UPLOAD_DIR=/var/uploads/sapa
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png
```

#### c. Static Files & Upload Directory
```bash
# Create upload directory with proper permissions
mkdir -p /var/uploads/sapa/{ktm,ukt,lampiran}
chmod 755 /var/uploads/sapa
chmod 755 /var/uploads/sapa/*
```

#### d. Nginx Configuration (Optional)
```nginx
location /uploads {
    alias /var/uploads/sapa;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location /api {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### e. Run Backend with Gunicorn
```bash
gunicorn backend.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### 7. Monitoring

#### Check Upload Directory Size
```bash
du -sh uploads/
```

#### Log Aktivitas Submission
```bash
# Backend logs (check console or log file)
tail -f backend.log | grep "Submit tiket"
```

#### Database Disk Usage
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 8. Performance Optimization

#### a. Add Database Indexes
```sql
CREATE INDEX idx_tiket_email ON tiket_layanan(email_mahasiswa);
CREATE INDEX idx_tiket_status ON tiket_layanan(status);
CREATE INDEX idx_tiket_waktu ON tiket_layanan(waktu_submit DESC);
```

#### b. Add File Size Limits (Nginx)
```nginx
client_max_body_size 10M;
```

#### c. Implement File Cleanup (Optional)
```python
# Cleanup old files after 30 days
import os
from datetime import datetime, timedelta

def cleanup_old_files(directory, days=30):
    cutoff_time = time.time() - (days * 86400)
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.getmtime(file_path) < cutoff_time:
                os.remove(file_path)
```

## Checklist Completion

- [ ] Backend dependencies installed
- [ ] Database schema updated with semester field
- [ ] Backend starts without errors
- [ ] Frontend dependencies installed
- [ ] Frontend starts without errors
- [ ] CORS configured
- [ ] Test form submission via Postman
- [ ] Test form submission via Frontend
- [ ] Files saved to upload directory
- [ ] Database records created
- [ ] Verify data persisted correctly
- [ ] Error handling working
- [ ] All tests passed
- [ ] Ready for production deployment

## Quick Start (TL;DR)

```bash
# Terminal 1: Backend
cd project-root
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd project-root/frontend
npm run dev

# Open http://localhost:5173 and test the form
```

## Support

Untuk troubleshooting lebih lanjut, cek:
- `INTEGRATION_GUIDE.md` - Detailed API specification
- Backend logs - Error messages dan stack traces
- Browser DevTools - Network tab untuk debug request/response
- Database logs - Query errors
