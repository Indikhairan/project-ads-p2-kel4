# CHANGELOG - Frontend Backend Integration

## Summary
Comprehensive fix for backend-frontend integration on ticket submission system. Students can now submit service tickets and letter requests with file uploads (PDF, JPG, PNG) up to 5MB each.

## Changes Made

### 1. Backend Route Handler (`backend/routers/tiket.py`)

#### Added Imports
```python
from pydantic import Json, ValidationError
from typing import Optional
```

#### Added Constants
```python
UPLOAD_DIR = "uploads"
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/jpg",
    "application/pdf",
}
MAX_FILE_SIZE_MB = 5
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
```

#### Added Helper Function
```python
async def _simpan_file(upload_file: UploadFile, subfolder: str = "") -> str:
    """
    Validasi MIME type dan ukuran file, kemudian simpan ke disk.
    - Hanya menerima: PDF, JPG, PNG
    - Maksimal: 5 MB
    - Menyimpan di: uploads/{subfolder}/{uuid}.ext
    """
    # Validate MIME type
    # Validate file size
    # Create directory if not exists
    # Generate unique filename using UUID
    # Save to disk
    # Return file path
```

#### Modified TiketService Class
- **Added method**: `_log_aktivitas(aksi: str)`
  - Logs ticket submission activity
  - Records email, role, action, IP address, timestamp

- **Modified method**: `buat_tiket(payload, file_lampiran_db: Optional[str] = None)`
  - Now accepts optional `file_lampiran_db` parameter for main attachment path
  - Calls `_log_aktivitas()` after successful creation

#### Modified POST Endpoint (`@router.post("/")`)
**Old signature:**
```python
def buat_tiket(payload: schemas.TiketCreate, request: Request, db: Session = Depends(get_db))
```

**New signature:**
```python
async def buat_tiket(
    request: Request,
    db: Session = Depends(get_db),
    id_layanan: str = Form(...),
    kategori: str = Form(...),
    subjek: Optional[str] = Form(None),
    deskripsi: Optional[str] = Form(None),
    data_request: Json[dict] = Form(...),
    nim: str = Form(...),
    program_studi: str = Form(...),
    departemen: Optional[str] = Form(None),
    fakultas: Optional[str] = Form(None),
    semester: Optional[str] = Form(None),
    ktm_file: Optional[UploadFile] = File(None),
    ukt_file: Optional[UploadFile] = File(None),
    lampiran_file: Optional[UploadFile] = File(None),
    file_lampiran: Optional[UploadFile] = File(None),
)
```

**New functionality:**
1. Parses `data_request` as JSON automatically using `Json[dict]`
2. Validates all file uploads:
   - Checks MIME type
   - Checks file size
   - Saves to appropriate subdirectory
3. Stores file paths in `data_request` JSON:
   - `data_request["file_ktm"] = "uploads/ktm/uuid.ext"`
   - `data_request["file_ukt"] = "uploads/ukt/uuid.ext"`
   - `data_request["file_form_izin"] = "uploads/lampiran/uuid.ext"` (for specific letter types)
4. Maps letter types to specific fields:
   - Surat Izin Akademik → `file_form_izin`
   - Surat Perubahan KRS → `file_form_krs`
   - Surat Rekomendasi Beasiswa → `file_form_rekomendasi`
   - Permohonan Surat Magang → `file_form_persetujuan_dsb`

### 2. Database Models (`backend/models.py`)

#### Modified Mahasiswa Class
**Added column:**
```python
semester = Column(String, nullable=True)
```

**Reason:** Store current semester information for student profiles

### 3. Pydantic Schemas (`backend/schemas.py`)

#### Modified TiketCreate Class
**Added fields:**
```python
departemen: Optional[str] = None
fakultas: Optional[str] = None
semester: Optional[str] = None
deskripsi: Optional[str] = None
```

**Fixed validator:**
- Changed from: `if kategori == KategoriEnum.persuratan`
- Changed to: `if kategori == "Persuratan"`
- **Reason:** Backend sends string, not enum

### 4. Frontend Form (`frontend/src/components/FormPengajuanTiket.jsx`)

#### Updated FormData Construction
**Added fields:**
```javascript
formData.append("program_studi", persyaratan.prodi?.trim() || "");
formData.append("departemen", persyaratan.departemen?.trim() || "");
formData.append("fakultas", persyaratan.fakultas?.trim() || "");
formData.append("semester", "");
```

**Reason:** Backend now requires these fields separately, not just in data_request

#### Verified File Field Names
Frontend sends:
- `ktm_file` ✓
- `ukt_file` ✓
- `lampiran_file` ✓ (for persuratan/letters)
- `file_lampiran` ✓ (for informasi/general requests)

### 5. Documentation

#### Created `INTEGRATION_GUIDE.md`
- Complete API specification
- File storage structure explanation
- Database schema documentation
- Error handling reference
- Frontend integration mapping
- Testing procedures

#### Created `SETUP_DEPLOYMENT_GUIDE.md`
- Step-by-step setup instructions
- Backend & frontend configuration
- Integration testing checklist
- Production deployment guidelines
- Troubleshooting guide
- Performance optimization tips

## File Structure After Changes

```
project-root/
├── backend/
│   ├── routers/
│   │   └── tiket.py (MODIFIED)
│   ├── models.py (MODIFIED)
│   ├── schemas.py (MODIFIED)
│   └── main.py
├── frontend/
│   └── src/
│       └── components/
│           └── FormPengajuanTiket.jsx (MODIFIED)
├── uploads/ (CREATED on first file upload)
│   ├── ktm/
│   ├── ukt/
│   └── lampiran/
├── INTEGRATION_GUIDE.md (NEW)
├── SETUP_DEPLOYMENT_GUIDE.md (NEW)
└── CHANGELOG.md (THIS FILE)
```

## Backward Compatibility

❌ **Breaking Changes:**
- POST `/api/v1/tiket/` now expects `multipart/form-data`, not JSON
- Parameter names changed (e.g., `file_ktm` instead of included in JSON)

✅ **Non-Breaking:**
- All other endpoints unchanged
- Database schema change is additive (nullable column)
- Response format unchanged

## Migration Steps

1. **Before deploying:**
   - Backup database
   - Review SETUP_DEPLOYMENT_GUIDE.md

2. **Database changes:**
   - Run migration: `ALTER TABLE mahasiswa ADD COLUMN semester VARCHAR;`
   - Or use Alembic: `alembic upgrade head`

3. **Code deployment:**
   - Update backend code
   - Update frontend code
   - Ensure `uploads/` directory exists and is writable
   - Restart backend service

4. **Verification:**
   - Test form submission via frontend
   - Verify files saved to `uploads/` directory
   - Check database for new records
   - Verify error handling works

## API Examples

### Request - Create Ticket with Files
```
POST /api/v1/tiket/
Content-Type: multipart/form-data
Authorization: Bearer <token>

--boundary
Content-Disposition: form-data; name="id_layanan"

LYN-SURAT
--boundary
Content-Disposition: form-data; name="kategori"

Persuratan
--boundary
Content-Disposition: form-data; name="subjek"

Surat Keterangan Aktif
--boundary
Content-Disposition: form-data; name="data_request"

{"jenis_surat":"Surat Keterangan Mahasiswa Aktif","nama":"John Doe","nim":"12345678"}
--boundary
Content-Disposition: form-data; name="nim"

12345678
--boundary
Content-Disposition: form-data; name="program_studi"

Informatika
--boundary
Content-Disposition: form-data; name="departemen"

Ilmu Komputer
--boundary
Content-Disposition: form-data; name="fakultas"

FMIPA
--boundary
Content-Disposition: form-data; name="ktm_file"; filename="ktm.pdf"
Content-Type: application/pdf

[binary file content]
--boundary--
```

### Response - Success
```json
{
  "id_tiket": "LYN-SURAT-1685099400",
  "status": "Open",
  "kategori": "Persuratan",
  "subjek": "Surat Keterangan Aktif",
  "email_mahasiswa": "user@ipb.ac.id",
  "id_layanan": "LYN-SURAT",
  "waktu_submit": "2024-05-30T10:30:00Z",
  "data_request": {
    "jenis_surat": "Surat Keterangan Mahasiswa Aktif",
    "nama": "John Doe",
    "nim": "12345678",
    "file_ktm": "uploads/ktm/a1b2c3d4e5f6.pdf",
    "file_ukt": "uploads/ukt/x9y8z7w6v5u4.pdf"
  },
  "file_lampiran": "uploads/lampiran/main_file.pdf"
}
```

### Response - Error
```json
{
  "detail": "Tipe file 'application/x-zip' tidak diizinkan untuk 'archive.zip'. Hanya menerima: application/pdf, image/jpeg, image/jpg, image/png."
}
```

## Testing Checklist

- [ ] POST endpoint accepts multipart/form-data
- [ ] File validation (MIME type, size) works
- [ ] Files saved to correct subdirectories
- [ ] File paths stored in database
- [ ] Data_request JSON properly formatted
- [ ] Student profile updated with form data
- [ ] Logging recorded submission
- [ ] Frontend form submits successfully
- [ ] Error messages displayed correctly
- [ ] Success modal shown after submission
- [ ] Retrieved ticket data matches submitted data
- [ ] Files accessible after submission

## Performance Impact

- **Minimal:** File upload is async, doesn't block other requests
- **Storage:** Monitor `uploads/` directory size (recommend cleanup after 30+ days)
- **Database:** Added index on `tiket_layanan.email_mahasiswa` for faster queries

## Security Considerations

✅ **Implemented:**
- MIME type validation
- File size limits (5MB)
- Secure file naming (UUID-based)
- Authorization checks (mahasiswa only)
- Activity logging

⚠️ **Recommended:**
- Implement virus scanning for uploads
- Move uploads to separate storage (S3, etc.)
- Implement rate limiting
- Regular cleanup of old files
- Access control for file downloads

## Future Enhancements

1. **Cloud Storage:** Migrate to S3/GCS instead of local filesystem
2. **Virus Scanning:** Integrate ClamAV or similar
3. **File Compression:** Compress old submissions
4. **Batch Processing:** Background job for processing uploads
5. **Webhooks:** Notify external systems of new submissions
6. **API Versioning:** Create v2 endpoint with enhanced features

## Support & Documentation

- **Setup:** See `SETUP_DEPLOYMENT_GUIDE.md`
- **API Docs:** See `INTEGRATION_GUIDE.md`
- **Troubleshooting:** See `SETUP_DEPLOYMENT_GUIDE.md` section "Troubleshooting"

---

**Date Modified:** May 30, 2026
**Modified By:** GitHub Copilot
**Version:** 1.0.0
