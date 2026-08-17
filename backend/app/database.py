from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

# engine is None until DATABASE_URL is set — lets the app still start (and
# /health respond) even before Supabase is wired up, instead of crashing.
engine = create_engine(settings.database_url, pool_pre_ping=True) if settings.database_url else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

Base = declarative_base()


def get_db():
    if SessionLocal is None:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
            "and fill in your Supabase connection string."
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
