import os
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader # Perhatikan: Kita pakai PyPDFLoader (tanpa Directory)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

folder_pdf = "./data" 
db_folder = "./faiss_db"
progress_file = "./processed_files.txt"

def knowledge_base(file_path=None):
    print("1. Mengecek daftar dokumen PDF...")

    # Baca buku catatan untuk melihat PDF mana yang sudah selesai diproses
    processed_files = []
    if os.path.exists(progress_file):
        with open(progress_file, "r") as f:
            processed_files = f.read().splitlines()

    if file_path:
        file_path = os.path.abspath(file_path)
        if not os.path.exists(file_path):
            print(f"❌ File tidak ditemukan: {file_path}")
            return
        filename = os.path.basename(file_path)
        if filename in processed_files:
            print(f"✅ File {filename} sudah pernah diproses. Tidak ada tugas baru.")
            return
        files_to_process = [file_path]
    else:
        # Ambil semua nama file PDF di folder data
        all_files = [f for f in os.listdir(folder_pdf) if f.endswith('.pdf')]
        # Saring hanya file yang BELUM diproses
        files_to_process = [os.path.join(folder_pdf, f) for f in all_files if f not in processed_files]

        if not files_to_process:
            print("✅ Semua PDF sudah tersimpan di otak bot! Tidak ada tugas baru.")
            return

        print(f"   -> Ditemukan {len(files_to_process)} PDF baru yang belum dipelajari.")

    embedding_model = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001", 
        google_api_key=API_KEY
    )

    # Load laci FAISS yang sudah ada (jika ada), supaya tidak menimpa ingatan lama
    db = None
    index_path = os.path.join(db_folder, "index.faiss")
    if os.path.exists(db_folder) and os.path.exists(index_path):
        print("2. Membuka laci FAISS lama untuk ditambahkan ingatan baru...")
        db = FAISS.load_local(db_folder, embedding_model, allow_dangerous_deserialization=True)
    else:
        if os.path.exists(db_folder):
            print("2. Folder FAISS ada, tapi indeks tidak ditemukan. Membuat laci FAISS baru...")
        else:
            print("2. Membuat laci FAISS baru dari nol...")
        os.makedirs(db_folder, exist_ok=True)

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    # Proses satu per satu file yang belum dipelajari
    for path in files_to_process:
        filename = os.path.basename(path)
        print(f"\n📄 Membaca dan mempelajari file: {filename}")
        
        loader = PyPDFLoader(path)
        dokumen = loader.load()
        chunks = text_splitter.split_documents(dokumen)
        
        print(f"   -> Terpecah menjadi {len(chunks)} paragraf. Mulai menelan...")
        
        batch_size = 15
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            if db is None:
                db = FAISS.from_documents(batch, embedding_model)
            else:
                db.add_documents(batch)
                
            print(f"      ✅ Batch {i} hingga {i + len(batch)} tertelan.")
            time.sleep(15) # Jeda untuk menghormati limit Google per menit
            
        # Simpan ke laci secara permanen SETIAP KALI SATU PDF SELESAI (Ini Checkpoint-nya)
        db.save_local(db_folder)
        
        # Catat nama PDF ke buku catatan bahwa file ini sudah beres 100%
        with open(progress_file, "a") as f:
            f.write(filename + "\n")
            
        print(f"✅ File {filename} berhasil dikunci permanen di ingatan!")

    print("\n🎉 SEMUA PROSES UPDATE KNOWLEDGE BASE SELESAI!")

if __name__ == "__main__":
    knowledge_base()