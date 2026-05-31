"""Weekly selection rules: a user may select at most N tasks (default 3) as their
focus 'this week'."""
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.task import Task


def count_selected(db: Session, owner_id: int) -> int:
    return (
        db.query(Task)
        .filter(Task.owner_id == owner_id, Task.is_selected_this_week.is_(True))
        .count()
    )


def set_weekly_selection(db: Session, task: Task, selected: bool) -> Task:
    """Select or deselect a task for the week, enforcing the max-N cap."""
    if selected and not task.is_selected_this_week:
        if count_selected(db, task.owner_id) >= settings.max_weekly_tasks:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"You can only select {settings.max_weekly_tasks} tasks for the week. "
                    "Deselect one first."
                ),
            )
        task.is_selected_this_week = True
        task.selected_at = datetime.now(timezone.utc)
    elif not selected:
        task.is_selected_this_week = False
        task.selected_at = None

    db.commit()
    db.refresh(task)
    return task
