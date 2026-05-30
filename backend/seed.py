from backend.database import db_manager
from backend import models

def seed_data():
    db = db_manager.SessionLocal()
    
    try:
        # --- 1. SEEDING DATA LAYANAN (Yang tadi) ---
        layanan_exists = db.query(models.Layanan).filter(models.Layanan.id_layanan == "LYN-INFO").first()
        if not layanan_exists:
            print("Memulai proses seeding data Layanan...")
            data_layanan = [
                models.Layanan(id_layanan="LYN-INFO", nama_layanan="Layanan Informasi Akademik"),
                models.Layanan(id_layanan="LYN-SURAT", nama_layanan="Layanan Administrasi Persuratan")
            ]
            db.add_all(data_layanan)
            print("✅ Data seed Layanan berhasil ditambahkan!")
        else:
            print("⚡ Data Layanan sudah ada di database.")

        # --- 2. SEEDING DATA PENGGUNA (Admin & Staff) ---
        print("Memulai proses seeding data Pengguna...")
        
        # Daftar pengguna pertama aplikasi SAPA IPB
        initial_users = [
            {"email": "ccmuthia@apps.ipb.ac.id", "role": "admin"},
            {"email": "indikhairan@apps.ipb.ac.id", "role": "staff"}
        ]

        for user_data in initial_users:
            # Sesuaikan 'models.Pengguna' dengan nama class tabel usermu
            existing_user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
            
            if not existing_user:
                new_user = models.User(
                    email=user_data["email"],
                    role=user_data["role"]
                )
                db.add(new_user)
                print(f"✅ Akun {user_data['email']} berhasil ditambahkan sebagai {user_data['role']}.")
            else:
                print(f"⚡ Akun {user_data['email']} sudah terdaftar.")

        # Simpan semua perubahan ke database
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()