from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, read from environment variables / .env file.

    See .env.example for what each of these means and where to get the
    values from your Supabase project.
    """

    database_url: str = ""
    environment: str = "development"
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
