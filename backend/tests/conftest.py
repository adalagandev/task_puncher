"""Test fixtures: a fresh in-memory SQLite DB and a TestClient per test."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.db import Base
from app.main import app


@pytest.fixture()
def client():
    # In-memory SQLite shared across connections within the test.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_milestones(n: int) -> list[dict]:
    return [{"title": f"Milestone {i}", "relevance": f"why {i}", "order": i} for i in range(n)]


def make_task_payload(impact=5, effort=1, urgency=5, n_milestones=5, title="Test task") -> dict:
    return {
        "title": title,
        "description": "",
        "impact": impact,
        "effort": effort,
        "urgency": urgency,
        "milestones": make_milestones(n_milestones),
    }
