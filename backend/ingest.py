import os
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS # <-- Ganti Chroma ke FAISS

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
folder_pdf = "./data" 

def knowledge_base():
    print("1. Membaca PDF...")
    loader = PyPDFDirectoryLoader(folder_pdf)
    dokumen = loader.load()

    print("2. Memecah teks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(dokumen)
    print(f"   -> Total potongan teks: {len(chunks)}")

    print("3. Mengubah ke vektor dan menyimpan ke FAISS...")
    embedding_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001", 
        google_api_key=API_KEY
    )

    db = None
    batch_size = 15
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        print(f"   -> Menelan data ke {i} sampai {i + len(batch)}...")
        
        # FAISS memproses di memori, dijamin tidak akan mati diam-diam!
        if db is None:
            db = FAISS.from_documents(batch, embedding_model)
        else:
            db.add_documents(batch)
            
        if i + batch_size < len(chunks):
            print("   ⏳ Jeda 15 detik untuk API Google...")
            time.sleep(15)

    # Save permanen ke folder setelah semua selesai
    db.save_local("faiss_db")
    print("✅ Selesai! Knowledge base FAISS sudah siap!")

if __name__ == "__main__":
    knowledge_base()