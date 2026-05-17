from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Membuat Router khusus untuk Chatbot
router = APIRouter(
    prefix="/api/v1/chatbot",
    tags=["Chatbot SAPA"]
)

# 1. Schema Request (Bentuk data yang dikirim React ke FastAPI)
class ChatRequest(BaseModel):
    pesan: str

# 2. Schema Response (Bentuk balasan dari FastAPI ke React)
class ChatResponse(BaseModel):
    status: str
    jawaban: str

# 3. Endpoint utama Chatbot
@router.post("/ask", response_model=ChatResponse)
def tanya_chatbot(request: ChatRequest):
    # Validasi LKP 11 (TC_CHAT_002): Tolak jika pesan kosong
    if not request.pesan or request.pesan.strip() == "":
        raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong!")

    user_message = request.pesan.lower()

    # TODO: Integrasi model AI Langchain dan Vector DB (ChromaDB) akan masuk di baris ini nanti.
    # Untuk sementara, kita pakai logika dummy agar endpoint bisa dites di Swagger UI.

    if "krs" in user_message:
        jawaban_ai = "Untuk membatalkan atau mengisi KRS, silakan login ke SIMAK IPB, pilih menu Akademik, lalu klik Pengisian KRS."
    elif "beasiswa" in user_message:
        jawaban_ai = "Informasi beasiswa terbaru untuk mahasiswa IPB dapat diakses melalui portal ditmawa.ipb.ac.id atau tanyakan langsung ke loket kemahasiswaan."
    elif "cuti" in user_message:
        jawaban_ai = "Pengajuan cuti akademik dapat dilakukan dengan mengisi form cuti yang disetujui oleh Dosen Pembimbing Akademik dan Departemen."
    else:
        jawaban_ai = "Maaf, SAPA belum memiliki informasi spesifik mengenai hal tersebut. Anda bisa mengajukan tiket untuk bertanya langsung kepada Staff Akademik!"

    return ChatResponse(
        status="success",
        jawaban=jawaban_ai
    )