from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, read from environment variables / .env file.

    See .env.example for what each of these means and where to get the
    values from your Supabase project.
    """

    database_url: str = ""
    environment: str = "development"

    # Comma-separated list of frontend origins allowed to call this API
    # (see app/main.py's CORSMiddleware setup). localhost:5173 (the Vite
    # dev server default) is always allowed regardless of this setting, so
    # local development never breaks if it's unset -- set this in
    # production to your real deployed frontend URL(s), e.g.
    # "https://thewayofgenius.app,https://www.thewayofgenius.app".
    allowed_origins: str = ""

    @property
    def cors_origins(self) -> list[str]:
        extra = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        return ["http://localhost:5173", *extra]

    # Supabase project URL + anon/publishable key. This backend talks to
    # Postgres directly (see app/database.py), not through PostgREST, so
    # these are used only to verify a caller's session token against
    # Supabase's Auth API (see app/auth.py) -- never to bypass RLS. This is
    # the public anon key, never the service_role key.
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # Which provider is primary. The other provider, if configured, is
    # used as an automatic backup when the primary fails -- see
    # app/edin_ai.py.
    ai_provider: str = "gemini"

    gemini_api_key: str = ""
    gemini_model: str = ""

    anthropic_api_key: str = ""
    anthropic_model: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
