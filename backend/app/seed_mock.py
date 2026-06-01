"""Populate the database with mock tasks for local development / demos.

Each task gets random impact/effort/urgency (1–5), a matching stored
``priority_score``, and a valid 5–7 milestones. Run as a module:

    .venv\\Scripts\\python -m app.seed_mock              # seed only if DB is empty
    .venv\\Scripts\\python -m app.seed_mock --force      # add a fresh batch anyway
    .venv\\Scripts\\python -m app.seed_mock --reset      # wipe tasks first, then seed
    .venv\\Scripts\\python -m app.seed_mock --count 10   # add N tasks (random titles)

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
    "Refactor the auth module",
    "Plan the Q3 product roadmap",
    "Set up the CI/CD pipeline",
    "Read two books this month",
    "Organize the garage",
    "Prepare the conference talk",
    "Negotiate the vendor contract",
    "Build a personal budget tracker",
    "Train for a 10k race",
    "Redesign the landing page",
    "Audit the cloud spending",
    "Write the end-of-year review",
    "Learn to cook five new dishes",
    "Fix the leaky kitchen faucet",
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


def _pick_titles(count: int | None) -> list[str]:
    """Titles to seed: the whole pool by default, or `count` random picks (sampled
    without repeats when the pool is big enough, otherwise with repeats)."""
    if count is None:
        return list(MOCK_TASKS)
    if count <= len(MOCK_TASKS):
        return random.sample(MOCK_TASKS, count)
    return [random.choice(MOCK_TASKS) for _ in range(count)]


def seed_mock_data(
    db: Session, *, force: bool = False, reset: bool = False, count: int | None = None
) -> int:
    """Insert mock tasks for the default user. Returns the number created.
    `count` overrides the default (one task per pool title) with N random tasks."""
    user = ensure_default_user(db)

    if reset:
        # Milestones cascade-delete with their task, so deleting tasks is enough.
        db.query(Task).filter(Task.owner_id == user.id).delete()
        db.commit()

    # An explicit count is itself a request to add, so it bypasses the empty-DB guard.
    if (
        not force
        and not reset
        and count is None
        and db.query(Task).filter(Task.owner_id == user.id).count() > 0
    ):
        print("Tasks already exist — skipping (use --force to add anyway, --reset to replace).")
        return 0

    created = 0
    for title in _pick_titles(count):
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


def _parse_count(argv: list[str]) -> int | None:
    """Read `--count N` (positive int) from argv; None if absent."""
    if "--count" not in argv:
        return None
    i = argv.index("--count")
    if i + 1 >= len(argv):
        sys.exit("--count requires a number, e.g. --count 10")
    try:
        n = int(argv[i + 1])
    except ValueError:
        sys.exit(f"--count must be an integer, got {argv[i + 1]!r}")
    if n <= 0:
        sys.exit("--count must be a positive integer")
    return n


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_mock_data(
            db,
            force="--force" in sys.argv,
            reset="--reset" in sys.argv,
            count=_parse_count(sys.argv),
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
