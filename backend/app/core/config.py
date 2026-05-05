from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    FIREBASE_DATABASE_URL: str = ""
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_ADMIN_SDK_JSON: Optional[str] = None

    REDIS_URL: str = "redis://localhost:6379"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-pro"

    ATLAS_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    ATLAS_CONFIDENCE_STAGE_1: float = 99.0
    ATLAS_CONFIDENCE_STAGE_2: float = 95.0
    ATLAS_CONFIDENCE_STAGE_3: float = 88.0
    ATLAS_CONFIDENCE_STAGE_4: float = 78.0
    ATLAS_FORCE_GUESS_AT_ITEMS: int = 2

    class Config:
        env_file = ".env"

settings = Settings()