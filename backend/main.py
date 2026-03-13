from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from security import create_access_token, verify_token

# Inisialisasi Aplikasi SAPA IPB
app = FastAPI(title="SAPA IPB API")

# Mengaktifkan fitur Satpam Resmi FastAPI (Munculin tombol Gembok di Swagger)
security = HTTPBearer()

class LoginData(BaseModel):
    nim: str
    role: str = "mahasiswa"

# ==========================================
# 🚪 ROUTE 1: PINTU MASUK (LOGIN)
# ==========================================
@app.post("/login")
def login(data: LoginData):
    token = create_access_token({"nim": data.nim, "role": data.role})
    return {"message": "Login sukses!", "access_token": token, "type": "Bearer"}

# ==========================================
# 🔒 ROUTE 2: RUANGAN RAHASIA (CEK TIKET)
# ==========================================
# Perhatikan tulisan Depends(security) di bawah ini!
@app.get("/tiket")
def get_tiket(credentials: HTTPAuthorizationCredentials = Depends(security)):
    
    # Otomatis ngambil token tanpa tulisan "Bearer " (Udah dibersihin sama FastAPI)
    token_asli = credentials.credentials
    
    # Verifikasi token ke fungsi buatanmu
    hasil_cek = verify_token(token_asli)
    
    if hasil_cek["status"] == "error":
        raise HTTPException(status_code=401, detail=hasil_cek["message"])
    
    return {
        "message": "Selamat datang di area tiket SAPA IPB!", 
        "data_pengguna": hasil_cek["data"]
    }