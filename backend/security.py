import jwt # Alat untuk bikin dan bongkar token
import os # Alat untuk baca sistem laptop
from datetime import datetime, timedelta # Jam weker untuk ngitung waktu basi
from dotenv import load_dotenv # Alat pembuka file .env

load_dotenv() # Menyuruh Python: "Tolong buka file .env dong!"
SECRET_KEY = os.getenv("SECRET_KEY") # Mengambil teks kunci rahasiamu
ALGORITHM = "HS256" # Jenis mesin gembok kriptografinya
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Aturan: Gelang VIP cuma berlaku 30 menit

def create_access_token(data: dict):
    to_encode = data.copy() # Bikin salinan data (misal: nim, role) biar data aslinya nggak rusak.
    
    # Bikin stempel waktu (Waktu saat ini di London/UTC + 30 Menit)
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire}) # Memasukkan stempel waktu basi itu ke dalam data
    
    # MESIN BEKERJA: Data + Kunci Rahasia + HS256 diaduk jadi satu string panjang!
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt # Ngirim balik string panjang itu.

def verify_token(token: str):
    try: # Pos Pemeriksaan Utama (Satpam)
        # Mencoba membuka token pakai kunci rahasia yang sama
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"status": "success", "data": payload} # Kalau kunci cocok & waktu belum habis -> LOLOS!
    
    except jwt.ExpiredSignatureError: # Satpam ngecek jam
        # Kalau waktu di stempel "exp" udah lewat dari jam sekarang
        return {"status": "error", "message": "Session Timeout..."}
    
    except jwt.InvalidTokenError: # Satpam ngecek stempel asli/palsu
        # Kalau ada hacker yang ngubah isinya (stempelnya jadi rusak/beda)
        return {"status": "error", "message": "Unauthorized..."}