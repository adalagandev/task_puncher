"""Milestone routes: add, edit (incl. reorder + toggle done), and delete, while
keeping each task within the 5–7 milestone bounds."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.user import User
from app.schemas.milestone import MilestoneCreate, MilestoneOut, MilestoneUpdate
from app.services.completion import sync_completion_from_milestones

router = APIRouter(prefix="/api/tasks/{task_id}/milestones", tags=["milestones"])


def _get_owned_task(db: Session, task_id: int, user: User) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == user.id).first()
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _get_milestone(db: Session, task: Task, milestone_id: int) -> Milestone:
    m = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.task_id == task.id)
        .first()
    )
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return m


@router.post("", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def add_milestone(
    task_id: int,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    if len(task.milestones) >= settings.max_milestones:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"A task can have at most {settings.max_milestones} milestones.",
        )
    order = payload.order or len(task.milestones)
    milestone = Milestone(order=order, title=payload.title, relevance=payload.relevance)
    # Append via the relationship so task.milestones is current for the sync below
    # (a fresh undone milestone reopens a previously completed task).
    task.milestones.append(milestone)
    sync_completion_from_milestones(task)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.patch("/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    task_id: int,
    milestone_id: int,
    payload: MilestoneUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    milestone = _get_milestone(db, task, milestone_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(milestone, field, value)
    # Toggling done may have checked the last milestone (complete) or unchecked one (reopen).
    sync_completion_from_milestones(task)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    task_id: int,
    milestone_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    if len(task.milestones) <= settings.min_milestones:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"A task must keep at least {settings.min_milestones} milestones.",
        )
    milestone = _get_milestone(db, task, milestone_id)
    # Remove via the relationship (cascade delete-orphan) so task.milestones is current;
    # dropping an unfinished milestone can leave the rest all-done and complete the task.
    task.milestones.remove(milestone)
    sync_completion_from_milestones(task)
    db.commit()
