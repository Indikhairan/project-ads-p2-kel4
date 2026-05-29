import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    """Mengelola koneksi dan sesi SQLAlchemy ke PostgreSQL."""
    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/sapa_ipb"
        )
        # SQLAlchemy otomatis mendeteksi dialek dari URL.
        self.engine = create_engine(self.database_url)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )
        self.Base = declarative_base()

    def get_session(self):
        """Dependency FastAPI: yield sesi DB lalu tutup otomatis."""
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def create_all_tables(self):
        """Buat semua tabel yang sudah didefinisikan di models."""
        self.Base.metadata.create_all(bind=self.engine)


db_manager = DatabaseManager()

Base = db_manager.Base
engine = db_manager.engine
get_db = db_manager.get_session
