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
            {"email": "ccmuthia@apps.ipb.ac.id", "nama_lengkap": "Muthia Khansa", "role": "admin", "nip": "19970000000000001"},
            {"email": "indikhairan@apps.ipb.ac.id", "nama_lengkap": "Indriyani Khairan Nisa", "role": "staff", "nip": "19980000000000002"}
        ]

        for user_data in initial_users:
            existing_user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
            
            if not existing_user:
                # ── CREATE USER DENGAN CLASS YANG SESUAI (bukan generic User) ──
                if user_data["role"] == "admin":
                    new_user = models.AdminSistem(
                        email=user_data["email"],
                        nama_lengkap=user_data["nama_lengkap"],
                        role="admin",
                        nip=user_data.get("nip", "00000000")
                    )
                elif user_data["role"] == "staff":
                    new_user = models.StaffAkademik(
                        email=user_data["email"],
                        nama_lengkap=user_data["nama_lengkap"],
                        role="staff",
                        nip=user_data.get("nip", "11111111")
                    )
                else:
                    new_user = models.Mahasiswa(
                        email=user_data["email"],
                        nama_lengkap=user_data["nama_lengkap"],
                        role="mahasiswa"
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