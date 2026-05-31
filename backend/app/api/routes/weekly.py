"""Weekly selection routes: choose the (max 3) tasks to focus on this week."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskOut
from app.services.weekly import set_weekly_selection

router = APIRouter(prefix="/api/weekly", tags=["weekly"])


class SelectionPayload(BaseModel):
    selected: bool


@router.get("", response_model=list[TaskOut])
def list_weekly(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """The tasks selected for this week, highest priority first."""
    return (
        db.query(Task)
        .filter(Task.owner_id == user.id, Task.is_selected_this_week.is_(True))
        .order_by(Task.priority_score.desc())
        .all()
    )


@router.put("/{task_id}", response_model=TaskOut)
def set_selection(
    task_id: int,
    payload: SelectionPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == user.id).first()
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Task not found")
    return set_weekly_selection(db, task, payload.selected)
