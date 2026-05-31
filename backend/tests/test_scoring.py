"""Scoring math with the default weights (w_impact=2, w_urgency=2, w_effort=1)."""
import pytest

from app.services.scoring import compute_priority


@pytest.mark.parametrize(
    "impact,urgency,effort,expected",
    [
        (5, 5, 1, 19),   # best case
        (1, 1, 5, -1),   # worst case
        (3, 3, 3, 9),    # neutral middle
        (5, 4, 5, 13),   # big-but-costly
    ],
)
def test_compute_priority(impact, urgency, effort, expected):
    assert compute_priority(impact, urgency, effort) == expected


def test_score_persisted_and_sorted(client):
    from tests.conftest import make_task_payload

    # Low-priority task first, then a high-priority one.
    client.post("/api/tasks", json=make_task_payload(impact=1, urgency=1, effort=5, title="low"))
    client.post("/api/tasks", json=make_task_payload(impact=5, urgency=5, effort=1, title="high"))

    tasks = client.get("/api/tasks").json()
    assert [t["title"] for t in tasks] == ["high", "low"]
    assert tasks[0]["priority_score"] == 19
    assert tasks[1]["priority_score"] == -1
