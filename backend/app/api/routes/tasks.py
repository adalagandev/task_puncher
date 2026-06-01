"""Task CRUD. List is sorted by priority_score (highest first)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.services.completion import set_completed
from app.services.scoring import compute_priority

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _get_owned_task(db: Session, task_id: int, user: User) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == user.id).first()
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Task)
        .filter(Task.owner_id == user.id)
        .order_by(Task.priority_score.desc(), Task.created_at.desc())
        .all()
    )


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = Task(
        owner_id=user.id,
        title=payload.title,
        description=payload.description,
        impact=payload.impact,
        effort=payload.effort,
        urgency=payload.urgency,
        priority_score=compute_priority(payload.impact, payload.urgency, payload.effort),
    )
    # Milestone count (5–7) already validated by the TaskCreate schema.
    for i, m in enumerate(payload.milestones):
        task.milestones.append(
            Milestone(order=m.order or i, title=m.title, relevance=m.relevance)
        )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _get_owned_task(db, task_id, user)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(task, field, value)
    # Recompute the score whenever any scoring input changed.
    task.priority_score = compute_priority(task.impact, task.urgency, task.effort)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Manually mark a task complete (stamps completed_at), regardless of milestones."""
    task = _get_owned_task(db, task_id, user)
    set_completed(task, True)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/reopen", response_model=TaskOut)
def reopen_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Reopen a completed task (clears completed_at, back to active)."""
    task = _get_owned_task(db, task_id, user)
    set_completed(task, False)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = _get_owned_task(db, task_id, user)
    db.delete(task)
    db.commit()
