"""Pydantic schemas for tasks, including the 5–7 milestone rule on creation."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import settings
from app.schemas.milestone import MilestoneCreate, MilestoneOut


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    impact: int = Field(ge=1, le=5)
    effort: int = Field(ge=1, le=5)
    urgency: int = Field(ge=1, le=5)
    milestones: list[MilestoneCreate]

    @field_validator("milestones")
    @classmethod
    def _check_milestone_count(cls, v: list[MilestoneCreate]) -> list[MilestoneCreate]:
        lo, hi = settings.min_milestones, settings.max_milestones
        if not (lo <= len(v) <= hi):
            raise ValueError(f"A task must have between {lo} and {hi} milestones (got {len(v)}).")
        return v


class TaskUpdate(BaseModel):
    """Edit task fields. Milestones are managed via the milestone endpoints."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    impact: int | None = Field(default=None, ge=1, le=5)
    effort: int | None = Field(default=None, ge=1, le=5)
    urgency: int | None = Field(default=None, ge=1, le=5)
    status: str | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str
    description: str
    impact: int
    effort: int
    urgency: int
    priority_score: float
    status: str
    is_selected_this_week: bool
    selected_at: datetime | None
    created_at: datetime
    updated_at: datetime
    milestones: list[MilestoneOut]
