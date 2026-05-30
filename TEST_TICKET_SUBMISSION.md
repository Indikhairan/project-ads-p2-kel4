# Testing Ticket Submission - Panduan Debugging

## Error yang Terjadi
```
422 Unprocessable Entity
body → data_request: Input should be a valid dictionary
```

## Penyebab & Solusi

### ❌ Masalah Lama
Pydantic `Json[dict]` tidak bekerja dengan FastAPI `Form()` untuk JSON string.

### ✅ Solusi yang Diterapkan
- Ubah parameter `data_request` dari `Json[dict]` menjadi `str`
- Parse JSON string secara manual menggunakan `json.loads()`
- Error handling yang lebih jelas jika JSON tidak valid

## Backend Fix Applied
```python
# SEBELUM (tidak bekerja):
data_request: Json[dict] = Form(...)

# SESUDAH (bekerja):
data_request: str = Form(...)
try:
    data_request_dict = json.loads(data_request)
except json.JSONDecodeError as e:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"data_request harus berupa JSON string yang valid. Error: {str(e)}"
    )
```

## Testing Steps

### 1. Start Backend
```bash
cd project-root
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8000
```

Verifikasi output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 2. Start Frontend (Terminal Baru)
```bash
cd project-root/frontend
npm run dev
```

Verifikasi output:
```
VITE v4.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 3. Test Form Submission
1. Open http://localhost:5173
2. Login as student/mahasiswa
3. Klik "Pengajuan Tiket" atau buka form
4. Isi form:
   - **Kategori**: Persuratan
   - **Jenis Surat**: Surat Keterangan Mahasiswa Aktif
   - **Subjek**: Test Submission
   - **Nama**: John Doe
   - **NIM**: 12345678
   - **Program Studi**: Informatika
   - **Departemen**: Ilmu Komputer
   - **Fakultas**: FMIPA
   - **Upload KTM**: Any PDF/JPG file
   - **Upload UKT**: Any PDF/JPG file
5. Click "Submit Tiket"

### 4. Expected Results

**Success (200 Created):**
```json
{
  "id_tiket": "LYN-SURAT-1685099400",
  "status": "Open",
  "kategori": "Persuratan",
  "subjek": "Test Submission",
  "email_mahasiswa": "user@ipb.ac.id",
  "id_layanan": "LYN-SURAT",
  "waktu_submit": "2024-05-30T10:30:00Z",
  "data_request": {
    "jenis_surat": "Surat Keterangan Mahasiswa Aktif",
    "nama": "John Doe",
    "nim": "12345678",
    "file_ktm": "uploads/ktm/abc123.pdf",
    "file_ukt": "uploads/ukt/def456.pdf"
  },
  "file_lampiran": null
}
```

**Frontend Display:**
- ✅ Success modal muncul
- ✅ Message: "Tiket Berhasil Diajukan!"
- ✅ Button "Kembali ke Beranda"

**Files Created:**
```
uploads/
├── ktm/
│   └── {uuid}.pdf (or .jpg)
└── ukt/
    └── {uuid}.pdf (or .jpg)
```

### 5. Backend Console Output (Success)
```
INFO:     127.0.0.1:62164 - "POST /api/v1/tiket/ HTTP/1.1" 201 Created
```

### 6. Backend Console Output (Error)
Jika masih ada error, akan terlihat seperti:
```
INFO:     127.0.0.1:63296 - "POST /api/v1/tiket/ HTTP/1.1" 422 Unprocessable Entity
```

## Troubleshooting

### Error: "data_request harus berupa JSON string yang valid"
**Cause:** Frontend mengirim data_request yang bukan JSON valid
**Fix:** Cek di browser DevTools → Network tab → Form Data

**Contoh yang valid:**
```
data_request: {"jenis_surat":"Surat Keterangan Mahasiswa Aktif","nama":"John"}
```

**Contoh yang TIDAK valid:**
```
data_request: Surat Keterangan Mahasiswa Aktif  (bukan JSON)
data_request: {jenis_surat: "Surat..."}  (single quotes, bukan double quotes)
```

### Error: "Tipe file 'application/x-zip' tidak diizinkan"
**Cause:** File type bukan PDF, JPG, PNG
**Fix:** Upload file dengan format yang benar

### Error: "Ukuran file melebihi batas 5 MB"
**Cause:** File terlalu besar
**Fix:** Gunakan file yang lebih kecil atau ubah MAX_FILE_SIZE_MB di backend

### Error: "Data mahasiswa tidak ditemukan"
**Cause:** User belum terdaftar atau email tidak cocok
**Fix:** Pastikan sudah login dengan akun yang benar

### Error: "403 Forbidden - Role tidak dikenali"
**Cause:** User bukan mahasiswa
**Fix:** Login dengan akun mahasiswa

## Debug Checklist

- [ ] Backend berjalan tanpa error
- [ ] Frontend berjalan tanpa error
- [ ] CORS tidak memblokir request
- [ ] Token valid dan dikirim di header Authorization
- [ ] Form data dikirim sebagai multipart/form-data
- [ ] JSON string di-parse dengan benar
- [ ] Database dapat diakses
- [ ] Upload folder writable
- [ ] File berhasil tersimpan ke disk
- [ ] Database record berhasil diciptakan

## Advanced Debug

### Check Request di Browser DevTools

1. Buka DevTools (F12)
2. Tab "Network"
3. Submit form
4. Cari request POST ke `/api/v1/tiket/`
5. Lihat tab "Request" untuk Form Data:
   ```
   FormData
   ├── id_layanan: LYN-SURAT
   ├── kategori: Persuratan
   ├── subjek: Test
   ├── data_request: {"jenis_surat":"...","nama":"..."}
   ├── nim: 12345678
   ├── program_studi: Informatika
   ├── departemen: Ilmu Komputer
   ├── fakultas: FMIPA
   ├── semester: 
   ├── ktm_file: (binary)
   └── ukt_file: (binary)
   ```

### Check Response Error Detail
Jika error 422, response akan berisi:
```json
{
  "detail": "body → data_request: Input should be a valid dictionary"
}
```

Jika parse error:
```json
{
  "detail": "data_request harus berupa JSON string yang valid. Error: Expecting value: line 1 column 1 (char 0)"
}
```

### Check Database
```sql
SELECT * FROM tiket_layanan ORDER BY waktu_submit DESC LIMIT 1;
```

### Check Logs
```bash
# Tail backend logs
# Look for submission records
# Check for errors or warnings
```

## Quick Fix Summary

| Problem | Solution |
|---------|----------|
| 422 data_request error | Fixed - now accepts string and parses JSON |
| CORS blocking | Check backend/main.py CORSMiddleware |
| Token invalid | Re-login atau refresh token |
| File not saving | Check uploads/ folder permissions |
| Database error | Check PostgreSQL connection string |

## Next Steps if Still Failing

1. **Check Backend Logs:**
   - Copy full error message dari backend console
   - Include stack trace

2. **Check Frontend Console:**
   - Open DevTools → Console tab
   - Look for JavaScript errors

3. **Check Network Request:**
   - DevTools → Network tab
   - Check request Headers, Body, Response

4. **Manual Test dengan cURL:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/tiket/ \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "id_layanan=LYN-SURAT" \
     -F "kategori=Persuratan" \
     -F "subjek=Test" \
     -F 'data_request={"jenis_surat":"Surat Keterangan Mahasiswa Aktif","nama":"John"}' \
     -F "nim=12345678" \
     -F "program_studi=Informatika" \
     -F "departemen=Ilmu Komputer" \
     -F "fakultas=FMIPA"
   ```

## Expected Success Flow

```
User Fill Form
    ↓
Click Submit
    ↓
Frontend Validate
    ↓
Frontend Create FormData
    ↓
Frontend Send POST /api/v1/tiket/
    ↓
Backend Extract Token
    ↓
Backend Check Role
    ↓
Backend Parse JSON data_request ✓ (FIXED)
    ↓
Backend Save Files
    ↓
Backend Create Tiket
    ↓
Backend Return 201 + Tiket Data
    ↓
Frontend Show Success Modal ✓
```

---

**Update:** Fixed 422 error dengan mengganti `Json[dict]` → `str` dan manual JSON parsing.
Semua error harus teratasi sekarang.
