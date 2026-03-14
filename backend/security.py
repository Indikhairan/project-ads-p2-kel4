import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import HTTPException, status
from database import db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Authentication: login & session timeout
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try: #sukses
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"status": "success", "data": payload}
    
    except jwt.ExpiredSignatureError: #timeout
        return {"status": "error", "message": "Session Timeout..."}
    
    except jwt.InvalidTokenError: #beda token
        return {"status": "error", "message": "Unauthorized..."}
    
# Authorization: role-based access control (RBAC)
def check_role(user_data: dict, required_role: str):
    if user_data.get("role") != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Akses ditolak! Anda bukan {required_role}"
        )

# Authorization: ownership-based access control (OBAC)
def check_ticket_ownership(user_email: str, ticket_owner_email: str, user_role: str):
    if user_role in ["admin_sistem", "staff_akademik"]:
        return True

    if user_email != ticket_owner_email:
        raise HTTPException(
            status_code=403, 
            detail="Ini bukan tiket Anda! Dilarang mengintip."
        )
    
# Accounting: audit logging
def log_activity(email: str, role: str, aksi: str, status: str, ip_address: str):
    new_log = {
        "waktu": datetime.utcnow(),
        "email_aktor": email,
        "role_aktor": role,
        "aksi": aksi, 
        "status": status, 
        "ip_address": ip_address
    }