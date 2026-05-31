"""Milestone model: an ordered step toward a task, with a note explaining its
relevance to the task."""
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    relevance: Mapped[str] = mapped_column(Text, default="")
    done: Mapped[bool] = mapped_column(Boolean, default=False)

    task: Mapped["Task"] = relationship(back_populates="milestones")  # noqa: F821
