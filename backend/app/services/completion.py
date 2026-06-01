"""The single source of truth for task completion: flipping `status` between
"active" and "completed" while keeping `completed_at` in sync. Used by both the
milestone routes (auto-complete) and the manual complete/reopen endpoints."""
from datetime import datetime, timezone

from app.models.task import Task


def all_milestones_done(task: Task) -> bool:
    """True only when a task has milestones and every one is done."""
    return bool(task.milestones) and all(m.done for m in task.milestones)


def set_completed(task: Task, completed: bool) -> None:
    """Move the task to completed/active, stamping or clearing `completed_at`.
    Idempotent: only acts on a real transition so re-completing keeps the
    original timestamp."""
    if completed and task.status != "completed":
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
    elif not completed and task.status == "completed":
        task.status = "active"
        task.completed_at = None


def sync_completion_from_milestones(task: Task) -> None:
    """Make completion follow milestone state — complete when the last milestone
    is checked, reopen when one is later unchecked (or a new one is added)."""
    set_completed(task, all_milestones_done(task))
