from fastapi import FastAPI
from backend.routers import tiket
from backend.database import engine
from backend import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Menghubungkan router ke main app
app.include_router(tiket.router)
