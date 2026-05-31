"""The 5–7 milestone rule on create and on add/delete."""
from tests.conftest import make_task_payload


def test_create_rejects_too_few_milestones(client):
    r = client.post("/api/tasks", json=make_task_payload(n_milestones=4))
    assert r.status_code == 422


def test_create_rejects_too_many_milestones(client):
    r = client.post("/api/tasks", json=make_task_payload(n_milestones=8))
    assert r.status_code == 422


def test_create_accepts_5_to_7(client):
    for n in (5, 6, 7):
        r = client.post("/api/tasks", json=make_task_payload(n_milestones=n))
        assert r.status_code == 201
        assert len(r.json()["milestones"]) == n


def test_cannot_add_beyond_7(client):
    task = client.post("/api/tasks", json=make_task_payload(n_milestones=7)).json()
    r = client.post(
        f"/api/tasks/{task['id']}/milestones",
        json={"title": "extra", "relevance": "", "order": 7},
    )
    assert r.status_code == 409


def test_cannot_delete_below_5(client):
    task = client.post("/api/tasks", json=make_task_payload(n_milestones=5)).json()
    m_id = task["milestones"][0]["id"]
    r = client.delete(f"/api/tasks/{task['id']}/milestones/{m_id}")
    assert r.status_code == 409


def test_toggle_milestone_done(client):
    task = client.post("/api/tasks", json=make_task_payload(n_milestones=5)).json()
    m_id = task["milestones"][0]["id"]
    r = client.patch(f"/api/tasks/{task['id']}/milestones/{m_id}", json={"done": True})
    assert r.status_code == 200
    assert r.json()["done"] is True
