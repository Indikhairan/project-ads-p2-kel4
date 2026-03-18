import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base # <-- Ini yang buat Base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Alamat database
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sapa_ipb.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# INI YANG PENTING: Harus bernama 'Base' (huruf B besar)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()