"""Shared FastAPI dependencies.

``get_current_user`` returns the single seeded local user today. When real
authentication is added, only this function changes — routes stay the same.
"""
from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.user import User
from app.seed import ensure_default_user


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Resolve the acting user. Stub for single-user mode."""
    return ensure_default_user(db)
