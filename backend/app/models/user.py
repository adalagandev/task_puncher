"""User model. Single-user today, but every Task hangs off a user so that real
authentication can be added later without a schema rewrite."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan"
    )
