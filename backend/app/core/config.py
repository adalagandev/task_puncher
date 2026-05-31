"""Application settings, including the tunable scoring weights.

Keeping the scoring weights here means the ranking behaviour can be changed
without touching the scoring logic in ``services/scoring.py``.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TASK_PUNCHER_", env_file=".env")

    # Storage
    database_url: str = "sqlite:///./task_puncher.db"

    # CORS — the Vite dev server origin
    frontend_origin: str = "http://localhost:5173"

    # Scoring weights:  priority = impact*w_impact + urgency*w_urgency - effort*w_effort
    w_impact: float = 2.0
    w_urgency: float = 2.0
    w_effort: float = 1.0

    # Domain rules
    min_milestones: int = 5
    max_milestones: int = 7
    max_weekly_tasks: int = 3


settings = Settings()
