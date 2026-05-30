# Frontend-Backend Integration Guide untuk Sistem Pengajuan Tiket

## Ringkasan Perubahan

Telah dilakukan integrasi penuh antara frontend form pengajuan tiket dan backend untuk mendukung pengajuan tiket layanan dan persuratan dengan file upload.

## Backend Changes

### 1. **File Upload Support** (`backend/routers/tiket.py`)
- ✅ Endpoint POST `/api/v1/tiket/` sekarang menerima `multipart/form-data`
- ✅ Mendukung file types: `.pdf`, `.jpg`, `.jpeg`, `.png`
- ✅ File size limit: 5 MB per file
- ✅ File disimpan di folder `uploads/` dengan subfolder:
  - `uploads/ktm/` - File KTM/Kartu Identitas
  - `uploads/ukt/` - Bukti Pembayaran UKT
  - `uploads/lampiran/` - File lampiran lainnya

### 2. **Schema Updates** (`backend/schemas.py`)
- ✅ Tambahan field di `TiketCreate`:
  - `departemen: Optional[str]`
  - `fakultas: Optional[str]`
  - `semester: Optional[str]`
  - `deskripsi: Optional[str]`
- ✅ Field `data_request` menerima JSON dengan path file otomatis

### 3. **Database Updates** (`backend/models.py`)
- ✅ Tambahan kolom `semester` di table `mahasiswa`
- ⚠️ Perlu run migration: `alembic upgrade head`

### 4. **Helper Functions**
- `_simpan_file()` - Simpan file dengan validasi MIME type dan ukuran
- Automatic file path storage di `data_request` JSON

## Frontend Integration

### Form Fields Submission

Frontend (`FormPengajuanTiket.jsx`) mengirim data dalam format:

```javascript
FormData {
  // Form fields
  id_layanan: "LYN-SURAT" atau "LYN-INFO"
  kategori: "Persuratan" atau "Layanan"
  subjek: string
  deskripsi: string
  
  // Student data
  nim: string
  program_studi: string
  departemen: string
  fakultas: string
  semester: string (optional)
  
  // JSON data
  data_request: JSON.stringify({
    jenis_surat: "Surat Keterangan Mahasiswa Aktif" (for persuratan),
    nama: string,
    ttl: string (for certain letter types),
    alamat: string,
    prodi: string,
    departemen: string,
    fakultas: string,
    keperluan: string,
    bahasa_surat: "Bahasa Indonesia" atau "Bahasa Inggris",
    alasan_izin: string (for "Surat Izin Akademik"),
    instansi: string (for "Permohonan Surat Magang"),
    tanggal_magang: string,
    // File paths akan ditambahkan oleh backend
  })
  
  // Files
  file_ktm: File (optional)
  file_ukt: File (optional)  
  file_lampiran_tambahan: File (optional)
}
```

### Endpoint Mapping

| Frontend | Backend | File Params |
|----------|---------|------------|
| Persuratan - Surat Keterangan | `LYN-SURAT` | `file_ktm`, `file_ukt` |
| Persuratan - Surat Izin Akademik | `LYN-SURAT` | `file_ktm`, `file_lampiran_tambahan` |
| Persuratan - Surat Perubahan KRS | `LYN-SURAT` | `file_ktm`, `file_lampiran_tambahan` |
| Persuratan - Surat Rekomendasi Beasiswa | `LYN-SURAT` | `file_ktm`, `file_lampiran_tambahan` |
| Persuratan - Permohonan Surat Magang | `LYN-SURAT` | `file_ktm`, `file_lampiran_tambahan` |
| Layanan - Informasi | `LYN-INFO` | `file_lampiran_tambahan` |

## File Storage Structure

```
project-root/
├── uploads/
│   ├── ktm/
│   │   └── {uuid}.jpg / {uuid}.pdf
│   ├── ukt/
│   │   └── {uuid}.jpg / {uuid}.pdf
│   └── lampiran/
│       └── {uuid}.jpg / {uuid}.pdf
```

## Database Schema

### TiketLayanan Table
```sql
CREATE TABLE tiket_layanan (
  id_tiket VARCHAR,
  email_mahasiswa VARCHAR,
  id_layanan VARCHAR,
  kategori VARCHAR,
  subjek VARCHAR,
  data_request JSONB,
  file_lampiran VARCHAR,
  status VARCHAR,
  waktu_submit TIMESTAMP,
  ...
)
```

### Data Request JSON Example
```json
{
  "jenis_surat": "Surat Keterangan Mahasiswa Aktif",
  "nama": "John Doe",
  "nim": "12345678",
  "ttl": "Jakarta, 01-01-2000",
  "alamat": "Jl. Contoh No. 1",
  "prodi": "Informatika",
  "departemen": "Ilmu Komputer",
  "fakultas": "FMIPA",
  "keperluan": "Untuk melamar kerja",
  "bahasa_surat": "Bahasa Indonesia",
  "file_ktm": "uploads/ktm/a1b2c3d4e5f6.jpg",
  "file_ukt": "uploads/ukt/x9y8z7w6v5u4.pdf"
}
```

## Error Handling

### Common Errors

1. **400 Bad Request - Invalid MIME Type**
   ```json
   {
     "detail": "Tipe file 'application/x-zip' tidak diizinkan untuk 'archive.zip'. Hanya menerima: application/pdf, image/jpeg, image/jpg, image/png."
   }
   ```

2. **400 Bad Request - File Too Large**
   ```json
   {
     "detail": "Ukuran file 'document.pdf' melebihi batas 5 MB."
   }
   ```

3. **422 Unprocessable Entity - Validation Failed**
   ```json
   {
     "detail": "jenis_surat wajib diisi di dalam data_request"
   }
   ```

4. **404 Not Found**
   ```json
   {
     "detail": "Data mahasiswa tidak ditemukan di sistem."
   }
   ```

## API Response Success

### POST /api/v1/tiket/
```json
{
  "id_tiket": "LYN-SURAT-1234567890",
  "status": "Open",
  "kategori": "Persuratan",
  "subjek": "Tiket Surat Keterangan Mahasiswa Aktif",
  "email_mahasiswa": "user@ipb.ac.id",
  "id_layanan": "LYN-SURAT",
  "waktu_submit": "2024-05-30T10:30:00Z",
  "data_request": {
    "jenis_surat": "Surat Keterangan Mahasiswa Aktif",
    "nama": "John Doe",
    "file_ktm": "uploads/ktm/a1b2c3d4e5f6.jpg",
    "file_ukt": "uploads/ukt/x9y8z7w6v5u4.pdf"
  },
  "file_lampiran": "uploads/lampiran/main_attachment.pdf"
}
```

## Testing the Integration

### 1. Start Backend
```bash
cd project-root
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8000
```

### 2. Test with cURL
```bash
curl -X POST http://localhost:8000/api/v1/tiket/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "id_layanan=LYN-SURAT" \
  -F "kategori=Persuratan" \
  -F "subjek=Test Tiket" \
  -F 'data_request={"jenis_surat":"Surat Keterangan Mahasiswa Aktif","nama":"Test","nim":"12345"}' \
  -F "nim=12345" \
  -F "program_studi=Informatika" \
  -F "file_ktm=@path/to/file.pdf"
```

### 3. Frontend Test Points
- [ ] Form validation works for required fields
- [ ] File upload validation (type & size)
- [ ] Error modal displays backend error messages
- [ ] Success modal shows after successful submission
- [ ] Data persists to database (check with GET /api/v1/tiket/)

## Required Dependencies

Ensure these are in `backend/requirements.txt`:
```
fastapi>=0.104.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-multipart>=0.0.6
```

## Next Steps

1. ✅ Run Alembic migration for semester field
2. ✅ Test backend endpoints with Postman/cURL
3. ✅ Verify frontend form submits correctly
4. ⚠️ Set up file download endpoint for viewing/downloading tickets
5. ⚠️ Add file deletion endpoint when ticket is rejected
6. ⚠️ Set up virus scanning for uploaded files

## Notes

- File paths are relative to project root
- Use absolute paths in production
- Consider implementing S3/cloud storage for scalability
- Add rate limiting to prevent abuse
- Implement proper file access control
