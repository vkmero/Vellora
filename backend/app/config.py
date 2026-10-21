from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve the backend directory independently of the terminal's location.
BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Vellora"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    DATABASE_URL: str = ""

    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    MAX_UPLOAD_SIZE_MB: int = 50

    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    BOOTSTRAP_ADMIN_NAME: str = "Vellora Admin"
    BOOTSTRAP_ADMIN_EMAIL: str = ""
    BOOTSTRAP_ADMIN_PASSWORD: str = ""

    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    OAUTH_REDIRECT_URI: str = ""

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def cors_origins(self) -> List[str]:
        origins = [
            item.strip()
            for item in self.ALLOWED_ORIGINS.split(",")
            if item.strip()
        ]

        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)

        return origins

    @property
    def sqlalchemy_url(self) -> str:
        url = self.DATABASE_URL.strip()

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        if (
            url.startswith("postgresql://")
            and "+psycopg" not in url
            and "+psycopg2" not in url
        ):
            url = url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return url

    @field_validator("APP_DEBUG", mode="before")
    @classmethod
    def debug_from_env(cls, value, info):
        return value

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.is_production:
            secret = self.JWT_SECRET.strip()
            normalized_secret = secret.lower()
            placeholder_markers = (
                "change-me",
                "replace",
                "placeholder",
                "your-secret",
                "example",
                "<set-",
            )
            if (
                len(secret) < 32
                or normalized_secret in {"secret", "password"}
                or any(marker in normalized_secret for marker in placeholder_markers)
            ):
                raise ValueError(
                    "Insecure or placeholder JWT_SECRET configured in production. "
                    "Set a unique random secret of at least 32 characters."
                )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()