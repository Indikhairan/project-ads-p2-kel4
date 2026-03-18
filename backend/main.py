from fastapi import FastAPI
from backend.routers import tiket
from backend.database import engine
from backend import models
# Jika kamu pakai folder 'routers'
# ATAU jika file tiket.py langsung di folder backend:
# import tiket 
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Menghubungkan router ke aplikasi utama
app.include_router(tiket.router)
