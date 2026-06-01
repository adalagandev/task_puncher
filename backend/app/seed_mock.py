"""Populate the database with mock tasks for local development / demos.

Each task gets random impact/effort/urgency (1–5), a matching stored
``priority_score``, and a valid 5–7 milestones. Run as a module:

    .venv\\Scripts\\python -m app.seed_mock            # seed only if DB is empty
    .venv\\Scripts\\python -m app.seed_mock --force    # add a fresh batch anyway
    .venv\\Scripts\\python -m app.seed_mock --reset    # wipe tasks first, then seed

Mirrors the create-time behaviour of routes/tasks.py (score is computed and
stored, never derived on read) so seeded rows look exactly like real ones.
"""
import random
import sys

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import SessionLocal, init_db
from app.models.task import Task
from app.models.milestone import Milestone
from app.seed import ensure_default_user
from app.services.scoring import compute_priority

# Mock titles + a pool of milestone phrasings so generated tasks read plausibly
# rather than "Task 1 / Milestone 1".
MOCK_TASKS = [
    "Launch personal portfolio site",
    "Run a half marathon",
    "Ship the v2 API",
    "Learn conversational Spanish",
    "Migrate database to Postgres",
    "Write a technical blog series",
    "Automate the weekly report",
    "Declutter and sell old gear",
]

MILESTONE_PHRASES = [
    ("Outline the scope", "Defines done so the rest of the work has a target."),
    ("Draft the first cut", "Turns the idea into something concrete to react to."),
    ("Get early feedback", "Catches wrong assumptions before they're expensive."),
    ("Build the core piece", "The part everything else depends on."),
    ("Polish the rough edges", "Separates a demo from something usable."),
    ("Write the tests/checks", "Locks in behaviour so changes stay safe."),
    ("Ship and announce", "Closes the loop and makes the work count."),
    ("Review and reflect", "Captures lessons for the next round."),
]


def seed_mock_data(db: Session, *, force: bool = False, reset: bool = False) -> int:
    """Insert mock tasks for the default user. Returns the number created."""
    user = ensure_default_user(db)

    if reset:
        # Milestones cascade-delete with their task, so deleting tasks is enough.
        db.query(Task).filter(Task.owner_id == user.id).delete()
        db.commit()

    if not force and not reset and db.query(Task).filter(Task.owner_id == user.id).count() > 0:
        print("Tasks already exist — skipping (use --force to add anyway, --reset to replace).")
        return 0

    created = 0
    for title in MOCK_TASKS:
        impact = random.randint(1, 5)
        effort = random.randint(1, 5)
        urgency = random.randint(1, 5)
        task = Task(
            owner_id=user.id,
            title=title,
            description=f"Mock task seeded for local development: {title.lower()}.",
            impact=impact,
            effort=effort,
            urgency=urgency,
            # Compute + store the score exactly like the create route does.
            priority_score=compute_priority(impact, urgency, effort),
        )
        # Random valid milestone count keeps every task inside the 5–7 invariant.
        count = random.randint(settings.min_milestones, settings.max_milestones)
        for order, (m_title, relevance) in enumerate(MILESTONE_PHRASES[:count]):
            task.milestones.append(
                Milestone(order=order, title=m_title, relevance=relevance, done=False)
            )
        db.add(task)
        created += 1

    db.commit()
    print(f"Seeded {created} mock tasks for user '{user.name}'.")
    return created


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_mock_data(db, force="--force" in sys.argv, reset="--reset" in sys.argv)
    finally:
        db.close()


if __name__ == "__main__":
    main()
