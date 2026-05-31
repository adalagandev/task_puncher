"""Ensure a single default local user exists. This is the multi-user seam: when
real auth arrives, users are created via signup instead of seeded here."""
from sqlalchemy.orm import Session

from app.models.user import User

DEFAULT_USER_NAME = "Local User"


def ensure_default_user(db: Session) -> User:
    user = db.query(User).order_by(User.id).first()
    if user is None:
        user = User(name=DEFAULT_USER_NAME)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
