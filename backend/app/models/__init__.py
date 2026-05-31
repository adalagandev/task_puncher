"""Import all models so SQLAlchemy's metadata is fully populated on import."""
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.user import User

__all__ = ["User", "Task", "Milestone"]
