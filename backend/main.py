from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import tiket, notifikasi, auth, update, chatbot, knowledge_base, admin_security, admin_sync, kelola_pengguna, staff
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
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://sapa-ipb.vercel.app"
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
from fastapi import Request

@app.middleware("http")
async def measure_total_time(request: Request, call_next):
    """Middleware Level 2: Mengukur Total Waktu Endpoint"""
    start_time = time.perf_counter()
    response = await call_next(request)
    elapsed_time = (time.perf_counter() - start_time) * 1000
    
    # Hanya log API request, abaikan preflight OPTIONS
    if request.method != "OPTIONS":
        print(f"⏱️ [LEVEL 2 - ENDPOINT] {request.method} {request.url.path} selesai (TOTAL: {elapsed_time:.2f} ms)")
        
    return response

# Menghubungkan semua router ke main app
app.include_router(auth.router)
app.include_router(tiket.router)
app.include_router(notifikasi.router)
app.include_router(update.router)
app.include_router(chatbot.router)
app.include_router(knowledge_base.router)
app.include_router(admin_security.router)
app.include_router(admin_sync.router)
app.include_router(kelola_pengguna.router)
app.include_router(staff.router)

@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "SAPA API is running ✓"}
