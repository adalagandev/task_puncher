"""The 3-tasks-per-week cap."""
from tests.conftest import make_task_payload


def _new_task(client, title):
    return client.post("/api/tasks", json=make_task_payload(title=title)).json()


def test_can_select_up_to_three(client):
    ids = [_new_task(client, f"t{i}")["id"] for i in range(3)]
    for tid in ids:
        r = client.put(f"/api/weekly/{tid}", json={"selected": True})
        assert r.status_code == 200
    assert len(client.get("/api/weekly").json()) == 3


def test_fourth_selection_rejected(client):
    ids = [_new_task(client, f"t{i}")["id"] for i in range(4)]
    for tid in ids[:3]:
        assert client.put(f"/api/weekly/{tid}", json={"selected": True}).status_code == 200
    r = client.put(f"/api/weekly/{ids[3]}", json={"selected": True})
    assert r.status_code == 409


def test_deselect_frees_a_slot(client):
    ids = [_new_task(client, f"t{i}")["id"] for i in range(4)]
    for tid in ids[:3]:
        client.put(f"/api/weekly/{tid}", json={"selected": True})
    # Deselect one, then the fourth fits.
    client.put(f"/api/weekly/{ids[0]}", json={"selected": False})
    assert client.put(f"/api/weekly/{ids[3]}", json={"selected": True}).status_code == 200
