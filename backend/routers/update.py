import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.security import sec_helper   # ← OOP

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

class FileStorageService:
    """Mengelola upload dan download file lampiran tiket."""

    ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
    MAX_SIZE_MB = 5

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    @property
    def max_size_bytes(self) -> int:
        return self.MAX_SIZE_MB * 1024 * 1024

    def validasi_tipe(self, content_type: str):
        if content_type not in self.ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Tipe file tidak didukung. Hanya PDF, JPG, dan PNG."
            )

    def validasi_ukuran(self, contents: bytes):
        if len(contents) > self.max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Ukuran file melebihi batas maksimal {self.MAX_SIZE_MB} MB."
            )

    def simpan_file(self, contents: bytes, original_filename: str) -> dict:
        """Simpan bytes ke disk dengan nama unik, kembalikan metadata."""
        ext = os.path.splitext(original_filename)[1] if original_filename else ".bin"
        file_id = str(uuid.uuid4())
        filename_saved = f"{file_id}{ext}"
        filepath = os.path.join(self.upload_dir, filename_saved)

        with open(filepath, "wb") as f:
            f.write(contents)

        return {
            "file_id": file_id,
            "filename_original": original_filename,
            "filename_saved": filename_saved,
            "url": f"/files/{file_id}",
            "size_kb": round(len(contents) / 1024, 2)
        }

    def cari_filepath(self, file_id: str) -> str:
        """Cari path file di folder upload berdasarkan file_id."""
        for fname in os.listdir(self.upload_dir):
            if fname.startswith(file_id):
                return os.path.join(self.upload_dir, fname)
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")


# Singleton — satu instance untuk seluruh app
file_service = FileStorageService()


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
    - **Format**: PDF, JPG, PNG | **Maks**: 5 MB
    """
    sec_helper.ekstrak_token(request)   # wajib login

    file_service.validasi_tipe(file.content_type)

    contents = await file.read()
    file_service.validasi_ukuran(contents)

    return file_service.simpan_file(contents, file.filename)


# ─── GET /files/{file_id} ─────────────────────────────────────────────────────

@router.get("/{file_id}")
def download_file(file_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Unduh file berdasarkan file_id.
    - **Hak akses**: Wajib login (file tidak boleh diakses publik)
    """
    sec_helper.ekstrak_token(request)

    filepath = file_service.cari_filepath(file_id)
    fname = os.path.basename(filepath)

    return FileResponse(
        path=filepath,
        filename=fname,
        media_type="application/octet-stream"
    )
