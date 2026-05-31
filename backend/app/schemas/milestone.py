"""Pydantic schemas for milestones."""
from pydantic import BaseModel, ConfigDict, Field


class MilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    relevance: str = Field(default="", description="Why this milestone matters to the task")
    order: int = Field(default=0, ge=0)


class MilestoneUpdate(BaseModel):
    """All fields optional — used for editing, reordering, or toggling done."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    relevance: str | None = None
    order: int | None = Field(default=None, ge=0)
    done: bool | None = None


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    order: int
    title: str
    relevance: str
    done: bool
