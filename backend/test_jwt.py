from security import create_access_token, verify_token

print("==================================================")
print("🛡️ SIMULASI KEAMANAN SAPA IPB 🛡️")
print("==================================================\n")

# --- SKENARIO 1: MAHASISWA LOGIN ---
print("[SKENARIO 1] Kira login pakai SSO IPB...")
data_kira = {"nim": "G6401231005", "role": "mahasiswa"}
token_asli = create_access_token(data_kira)

print(f"✅ Server berhasil membuat JWT untuk Kira!")
print(f"🎫 Wujud Token (Ini yang dikirim ke React Indi):\n{token_asli}\n")


# --- SKENARIO 2: KIRA AKSES DATA TIKET ---
print("[SKENARIO 2] Kira mencoba membuka halaman detail tiketnya...")
print("⏳ Server Python mengecek gembok tokennya...")

hasil_cek = verify_token(token_asli)
print(f"✅ Hasil Verifikasi Server: {hasil_cek}\n")


# --- SKENARIO 3: HACKER MENCOBA MASUK ---
print("[SKENARIO 3] Ada hacker menyadap token Kira dan mengubah isinya!")
# Hacker iseng mengubah beberapa huruf di bagian belakang token (merusak signature)
token_hacker = token_asli[:-5] + "h4ck3" 

print("⏳ Server Python mengecek token dari hacker...")
hasil_hacker = verify_token(token_hacker)
print(f"🚨 Hasil Verifikasi Server: {hasil_hacker}\n")

print("==================================================")