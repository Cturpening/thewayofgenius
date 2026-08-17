from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine

app = FastAPI(title="Edin API", version="0.1.0")

# The frontend dev server runs on 5173 by default (see frontend/vite.config.js).
# Add your deployed frontend's URL here too once you have one.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness check: is the API process up at all? Doesn't touch the database."""
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    """Readiness check: can the API actually reach the Supabase database?"""
    if engine is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {exc}") from exc
    return {"status": "ok", "database": "connected"}
