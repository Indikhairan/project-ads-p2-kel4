from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def tanya_bot_chains():
    print("1. Menyiapkan Otak & Model...")
    embedding_model = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    db = Chroma(persist_directory="./chroma_db", embedding_function=embedding_model)
    llm = Ollama(model="llama3")

    # template RAG
    template = """Kamu adalah asisten SAPA IPB. Jawab pertanyaan berdasarkan dokumen berikut:
    {context}
    
    Pertanyaan: {question}
    Jawaban (Bahasa Indonesia):"""
    
    prompt = ChatPromptTemplate.from_template(template)

    # Ambil Dokumen -> Masukkan ke Prompt -> Kirim ke AI -> Rapikan Teks
    rag_chain = (
        {"context": db.as_retriever(), "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    pertanyaan = "Apa saja syarat cuti?"
    print(f"\n👤 Mahasiswa: {pertanyaan}")
    print("🤖 SAPA IPB sedang menjawab...")

    jawaban = rag_chain.invoke(pertanyaan)
    print(f"\n🤖 Jawaban:\n{jawaban}")

if __name__ == "__main__":
    tanya_bot_chains()