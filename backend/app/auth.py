"""Real auth: verifies a caller's Supabase session token and resolves it to
a trustworthy user_id.

This backend talks to Postgres directly via SQLAlchemy (see app/database.py),
using the DATABASE_URL connection's own privileges -- it does NOT go through
Supabase's PostgREST layer, so Row-Level Security is not in play here the
way it is for a REST-proxied backend. That makes this dependency the real
access-control boundary for every route that reads or writes user data:
nothing downstream re-checks "does this row belong to this caller."

Verification works by asking Supabase's own Auth API whose token this is
(GET {SUPABASE_URL}/auth/v1/user), rather than validating the JWT locally.
That means signature verification, expiry, and revocation are all Supabase's
problem, not this file's -- same trust-boundary philosophy the rest of this
project uses ("the Authorization header IS the trust boundary, verified by
Supabase, not decided by our own code"). The cost is one extra network call
per request; at this app's scale that's the right tradeoff over reimplementing
JWT verification (and its key-rotation edge cases) by hand.
"""

import uuid

import httpx
from fastapi import Header, HTTPException

from app.config import get_settings

settings = get_settings()


async def get_current_user_id(authorization: str | None = Header(default=None)) -> uuid.UUID:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]

    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=503, detail="SUPABASE_URL / SUPABASE_ANON_KEY not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user_id = resp.json().get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return uuid.UUID(user_id)
