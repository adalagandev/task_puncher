"""Task model: a thing to accomplish, scored on impact/effort/urgency and
breakable into 5–7 milestones."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")

    # Scoring inputs, each 1–5 (validated at the schema layer).
    impact: Mapped[int] = mapped_column(Integer, nullable=False)
    effort: Mapped[int] = mapped_column(Integer, nullable=False)
    urgency: Mapped[int] = mapped_column(Integer, nullable=False)

    # Computed and stored on every create/update via services.scoring.
    priority_score: Mapped[float] = mapped_column(Float, default=0.0, index=True)

    status: Mapped[str] = mapped_column(String(20), default="active")

    # Weekly selection (the "3 things this week"). Capped at 3 in services.weekly.
    is_selected_this_week: Mapped[bool] = mapped_column(default=False)
    selected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    owner: Mapped["User"] = relationship(back_populates="tasks")  # noqa: F821
    milestones: Mapped[list["Milestone"]] = relationship(  # noqa: F821
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Milestone.order",
    )
