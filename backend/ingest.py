from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma
import os

folder_pdf = "./data" 

def knowledge_base():
    print(f"1. Membaca SEMUA dokumen PDF di dalam folder '{folder_pdf}'...")
    loader = PyPDFDirectoryLoader(folder_pdf)
    dokumen = loader.load()
    
    print(f"   -> Berhasil memuat total {len(dokumen)} halaman dari seluruh PDF.")

    print("2. Memecah halaman menjadi paragraf-paragraf kecil...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_documents(dokumen)
    print(f"   -> Berhasil dipecah menjadi {len(chunks)} potongan teks.")

    print("3. Mengubah teks menjadi vektor dan menyimpan ke ChromaDB...")
    embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    
    db = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory="./chroma_db"
    )
    
    print("✅ Selesai! Knowledge base massal sudah siap digunakan.")

if __name__ == "__main__":
    knowledge_base()