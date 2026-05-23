import os
import uuid
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from backend.database import get_db
from backend import models
from backend.security import sec_helper

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

# Schema
class ChatRequest(BaseModel):
    pesan: str

class ChatResponse(BaseModel):
    pengguna: str
    jawaban: str

# Class OOP
class SAPABotEngine:
    def __init__(self):
        """Constructor: Menyalakan mesin AI dan meload database vektor"""
        print("🤖 Menginisialisasi Mesin SAPA Bot...")
        
        # 1. Load Model Embedding
        self.embedding_model = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001", 
            google_api_key=API_KEY
        )
        
        # 2. Load FAISS DB
        self.db = FAISS.load_local(
            folder_path="./faiss_db", 
            embeddings=self.embedding_model, 
            allow_dangerous_deserialization=True # Wajib True agar bisa dibaca Python
        )
        
        # 3. Setup Gemini 1.5 Flash sebagai otak utama
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=API_KEY,
            temperature=0.3 # Suhu rendah agar AI menjawab sesuai fakta dokumen IPB
        )
        
        # 4. Merancang Prompt (Instruksi Bot)
        template = """Kamu adalah asisten virtual bernama SAPA Bot untuk layanan akademik IPB University. 
        Gunakan konteks di bawah ini untuk menjawab pertanyaan mahasiswa.
        Jika kamu tidak tahu jawabannya berdasarkan konteks, katakan saja dengan sopan bahwa kamu tidak tahu, 
        dan arahkan mahasiswa untuk membuat tiket layanan di website.
        
        Konteks: {context}
        
        Pertanyaan Mahasiswa: {question}
        Jawaban (Gunakan Bahasa Indonesia yang ramah):"""
        
        self.prompt = ChatPromptTemplate.from_template(template)
        
        # 5. Merakit Rantai RAG (Retrieval-Augmented Generation)
        self.rag_chain = (
            {"context": self.db.as_retriever(search_kwargs={"k": 6}), "question": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

    def jawab_pertanyaan(self, pesan_user: str) -> str:
        """Method 1: Menerima pesan dan mengeluarkan teks jawaban dari AI"""
        try:
            return self.rag_chain.invoke(pesan_user)
        except Exception as e:
            return f"Waduh, SAPA Bot sedang mengalami gangguan server nih. Detail error: {str(e)}"

    def simpan_riwayat_chat(self, db: Session, email: str, pesan_user: str, jawaban_bot: str):
        """Method 2: Menyimpan memori percakapan permanen ke tabel PostgreSQL"""
        sesi_baru = models.ChatbotSession(
            id_chat=str(uuid.uuid4()),
            email_mahasiswa=email,
            pesan_user=pesan_user,
            jawaban_bot=jawaban_bot
        )
        db.add(sesi_baru)
        # Tidak perlu db.commit() di sini, digabung dengan router agar aman

# instansiasi objek SAPA Bot
bot_kampus = SAPABotEngine()

# Router
router = APIRouter(
    prefix="/chatbot",
    tags=["Chatbot"]
)

@router.post("/tanya", response_model=ChatResponse)
def tanya_bot(request_data: ChatRequest, request: Request, db: Session = Depends(get_db)):
    
    # 1. SATPAM: Pastikan yang nanya punya tiket/token JWT yang valid
    user_info = sec_helper.ekstrak_token(request)
    email_user = user_info["email"]
    nama_user = user_info["nama_lengkap"]
    
    # 2. AI ENGINE: Minta bot merumuskan jawaban
    jawaban_ai = bot_kampus.jawab_pertanyaan(request_data.pesan)
    
    # 3. ACCOUNTING: Catat aktivitas bahwa user membuka chatbot
    sec_helper.log_aktivitas(
        db=db,
        email=email_user,
        role=user_info["role"],
        aksi="Menggunakan fitur Chatbot SAPA",
        status_log="Success",
        ip_address=request.client.host
    )
    
    # 4. DATABASE: Simpan riwayat obrolan (Tinggal hapus tanda # kalau database Mutica sudah siap)
    # bot_kampus.simpan_riwayat_chat(db, email_user, request_data.pesan, jawaban_ai)
    
    # 5. COMMIT TRANSAKSI: Simpan log dan chat ke dalam database sekaligus
    db.commit() 
    
    return ChatResponse(
        pengguna=nama_user,
        jawaban=jawaban_ai
    )