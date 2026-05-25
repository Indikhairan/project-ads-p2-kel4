from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import tiket, notifikasi, auth, update, chatbot, knowledge_base, admin_security, admin_sync, pengguna
from .database import engine
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SAPA API",
    description="API Sistem Pengajuan dan Pengelolaan Tiket Layanan Akademik",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Menghubungkan semua router ke main app
app.include_router(auth.router)
app.include_router(tiket.router)
app.include_router(notifikasi.router)
app.include_router(update.router)
app.include_router(chatbot.router)
app.include_router(knowledge_base.router)
app.include_router(admin_security.router)
app.include_router(admin_sync.router)
app.include_router(pengguna.router)

@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "SAPA API is running ✓"}
