import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    """
    Application Settings configured via environment variables and .env file.
    Follows 12-Factor App principles.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Core Application Settings
    APP_NAME: str = "AI Student Growth Engine"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = "default_dev_secret_change_in_production"
    ADMIN_API_KEY: str = "growth_admin_secret_2026"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./growth_engine.db"

    # Campaign Parameters
    CAMPAIGN_TARGET_REGISTRATIONS: int = 500
    CAMPAIGN_BUDGET_INR: float = 2000.0
    CAMPAIGN_DURATION_DAYS: int = 7
    WORKSHOP_TITLE: str = "Build Your First AI Project in 60 Minutes"

    # AI Configuration
    AI_PROVIDER: str = "deterministic_fallback"  # openai | gemini | deterministic_fallback
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    AI_MODEL_NAME: str = "gpt-4o-mini"
    AI_TEMPERATURE: float = 0.7

    # Referral & Gamification
    REFERRAL_CODE_PREFIX: str = "NXT-"
    TIER_1_REFERRAL_THRESHOLD: int = 1
    TIER_2_REFERRAL_THRESHOLD: int = 3
    FRONTEND_URL: str = "http://localhost:5173"


# Global singleton settings instance
settings = Settings()
