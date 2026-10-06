from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")

    app_name: str = "ScholarAI Ethiopia API"
    env: str = "dev"
    database_url: str = f"sqlite:///{ROOT / 'services' / 'api' / 'data' / 'scholarai.db'}"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    demo_otp_code: str = "123456"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    seed_dir: Path = ROOT / "data" / "seed"
    storage_dir: Path = ROOT / "services" / "api" / "storage"
    openai_api_key: str | None = None
    llm_provider: str = "auto"
    # Web collector: re-reads official pages + scholarship feeds every N hours.
    collector_enabled: bool = True
    collector_interval_hours: float = 48
    collector_max_new: int = 40
    admin_token: str | None = None  # if set, POST /v1/collector/run requires X-Admin-Token

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
