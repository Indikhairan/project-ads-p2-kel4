import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import security

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

# Folder penyimpanan file di server
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


# ─── POST /files/upload ───────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload file lampiran (KTM, UKT, dokumen pendukung) atau output surat dari staff.

    - **Hak akses**: Mahasiswa & Staff
    - **Format**: PDF, JPG, PNG
    - **Maks**: 5 MB
    - **Return**: file_id dan URL untuk disimpan ke kolom file_lampiran / tanggapan_file tiket
    """
    user_data = security.extract_token(request)

    # Validasi tipe file
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipe file tidak didukung. Hanya PDF, JPG, dan PNG."
        )

    # Baca dan validasi ukuran
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file melebihi batas maksimal {MAX_SIZE_MB} MB."
        )

    # Simpan dengan nama unik
    ext = os.path.splitext(file.filename)[1] if file.filename else ".bin"
    file_id = str(uuid.uuid4())
    filename_saved = f"{file_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename_saved)

    with open(filepath, "wb") as f:
        f.write(contents)

    return {
        "file_id": file_id,
        "filename_original": file.filename,
        "filename_saved": filename_saved,
        "url": f"/files/{file_id}",
        "size_kb": round(len(contents) / 1024, 2)
    }


# ─── GET /files/{file_id} ─────────────────────────────────────────────────────

@router.get("/{file_id}")
def download_file(file_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Unduh file berdasarkan file_id.
    Digunakan tombol 'Unduh' di DetailTiketPage dan DetailTiketStaff.
    """
    # Auth wajib (file tidak boleh diakses publik)
    security.extract_token(request)

    # Cari file di folder upload
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(file_id):
            filepath = os.path.join(UPLOAD_DIR, fname)
            return FileResponse(
                path=filepath,
                filename=fname,
                media_type="application/octet-stream"
            )

    raise HTTPException(status_code=404, detail="File tidak ditemukan.")