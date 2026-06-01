"""Task completion: auto-complete/reopen from milestone toggles, plus the manual
complete/reopen endpoints (TP-011)."""
from tests.conftest import make_task_payload


def _create_task(client, n_milestones=5):
    return client.post("/api/tasks", json=make_task_payload(n_milestones=n_milestones)).json()


def _set_done(client, task_id, milestone_id, done):
    return client.patch(f"/api/tasks/{task_id}/milestones/{milestone_id}", json={"done": done})


def test_new_task_is_active_and_uncompleted(client):
    task = _create_task(client)
    assert task["status"] == "active"
    assert task["completed_at"] is None


def test_completes_when_last_milestone_checked(client):
    task = _create_task(client)
    for m in task["milestones"]:
        _set_done(client, task["id"], m["id"], True)
    after = client.get(f"/api/tasks/{task['id']}").json()
    assert after["status"] == "completed"
    assert after["completed_at"] is not None


def test_not_complete_until_last_milestone(client):
    task = _create_task(client)
    # Check all but one — still active.
    for m in task["milestones"][:-1]:
        _set_done(client, task["id"], m["id"], True)
    after = client.get(f"/api/tasks/{task['id']}").json()
    assert after["status"] == "active"
    assert after["completed_at"] is None


def test_reopens_when_a_milestone_is_unchecked(client):
    task = _create_task(client)
    for m in task["milestones"]:
        _set_done(client, task["id"], m["id"], True)
    # Uncheck one — task reopens and the stamp is cleared.
    _set_done(client, task["id"], task["milestones"][0]["id"], False)
    after = client.get(f"/api/tasks/{task['id']}").json()
    assert after["status"] == "active"
    assert after["completed_at"] is None


def test_manual_complete_and_reopen(client):
    task = _create_task(client)
    completed = client.post(f"/api/tasks/{task['id']}/complete").json()
    assert completed["status"] == "completed"
    assert completed["completed_at"] is not None

    reopened = client.post(f"/api/tasks/{task['id']}/reopen").json()
    assert reopened["status"] == "active"
    assert reopened["completed_at"] is None


def test_completed_at_stable_across_redundant_completes(client):
    task = _create_task(client)
    first = client.post(f"/api/tasks/{task['id']}/complete").json()
    second = client.post(f"/api/tasks/{task['id']}/complete").json()
    # Idempotent: a second complete must not move the timestamp.
    assert first["completed_at"] == second["completed_at"]
