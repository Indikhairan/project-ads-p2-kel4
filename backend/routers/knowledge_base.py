from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(
    prefix="/api/v1/knowledge-base",
    tags=["Knowledge Base Staff (CRUD)"]
)

# Schema Data Model
class ArtikelKB(BaseModel):
    judul: str
    kategori: str
    konten: str

class ArtikelKBResponse(BaseModel):
    id: int
    judul: str
    kategori: str
    konten: str
    last_updated: str

# Dummy database sementara
dummy_kb = [
    {"id": 1, "judul": "Prosedur Pengajuan Cuti Akademik", "kategori": "Persuratan", "konten": "Cara mengajukan cuti adalah...", "last_updated": "15 April 2026"},
    {"id": 2, "judul": "Alur Pembatalan KRS ICE", "kategori": "Akademik", "konten": "Pembatalan KRS dilakukan melalui SIMAK...", "last_updated": "16 April 2026"}
]

# 1. GET ALL ARTIKEL (Dengan fitur pencarian/search)
@router.get("/", response_model=List[ArtikelKBResponse])
def get_all_artikel(search: Optional[str] = Query(None, description="Cari berdasarkan judul")):
    if search:
        filtered = [a for a in dummy_kb if search.lower() in a["judul"].lower()]
        return filtered
    return dummy_kb

# 2. POST / CREATE ARTIKEL
@router.post("/", status_code=201)
def tambah_artikel(artikel: ArtikelKB, background_tasks: BackgroundTasks):
    if not artikel.judul.strip() or not artikel.konten.strip():
        raise HTTPException(status_code=400, detail="Judul dan isi artikel tidak boleh kosong!")
    
    new_id = len(dummy_kb) + 1
    new_item = {
        "id": new_id,
        "judul": artikel.judul,
        "kategori": artikel.kategori,
        "konten": artikel.konten,
        "last_updated": "17 Mei 2026"
    }
    dummy_kb.append(new_item)
    background_tasks.add_task(kirim_notif_admin, artikel.judul, "PENAMBAHAN")

    return {"status": "success", "message": "Artikel tersimpan", "data": new_item}

# 3. PUT / UPDATE ARTIKEL
@router.put("/{id}")
def update_artikel(id: int, artikel: ArtikelKB, background_tasks: BackgroundTasks):
    for a in dummy_kb:
        if a["id"] == id:
            a["judul"] = artikel.judul
            a["kategori"] = artikel.kategori
            a["konten"] = artikel.konten
            a["last_updated"] = "17 Mei 2026"

            # Trigger notif jalan di background!
            background_tasks.add_task(kirim_notif_admin, artikel.judul, "PERUBAHAN")

            return {"status": "success", "message": "Artikel berhasil diperbarui"}
            
    raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

# 4. DELETE ARTIKEL
@router.delete("/{id}")
def hapus_artikel(id: int):
    global dummy_kb
    for a in dummy_kb:
        if a["id"] == id:
            dummy_kb = [item for item in dummy_kb if item["id"] != id]
            return {"status": "success", "message": "Artikel berhasil dihapus"}
    raise HTTPException(status_code=44, detail="Artikel tidak ditemukan")