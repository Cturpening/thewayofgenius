from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

# Supabase's own connection strings (and most examples/docs) start with
# plain "postgresql://" -- but that scheme tells SQLAlchemy to use the
# legacy psycopg2 driver by default, which isn't installed here
# (requirements.txt installs psycopg[binary], i.e. psycopg 3). Rewriting
# to "postgresql+psycopg://" explicitly selects the psycopg 3 dialect that
# actually IS installed, so a connection string copy-pasted straight from
# Supabase just works without anyone needing to hand-edit it.
_database_url = settings.database_url
if _database_url.startswith("postgresql://"):
    _database_url = "postgresql+psycopg://" + _database_url[len("postgresql://") :]

# engine is None until DATABASE_URL is set — lets the app still start (and
# /health respond) even before Supabase is wired up, instead of crashing.
engine = create_engine(_database_url, pool_pre_ping=True) if settings.database_url else None
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
