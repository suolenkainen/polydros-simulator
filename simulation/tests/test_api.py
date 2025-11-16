"""API tests for the Polydros backend.

These tests use FastAPI's TestClient to call the endpoints in-process. They
focus on the contract between the frontend and backend: `/run`, `/agents`,
`/agents/{id}` and determinism for identical seeds.
"""

import json
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_run_endpoint_returns_expected_structure():
    payload = {"seed": 999, "agents": 10, "packs_per_agent": 2, "ticks": 1}
    r = client.post("/run", json=payload)
    assert r.status_code == 200
    data = r.json()
    # Basic keys
    assert "timeseries" in data
    assert "agents" in data
    assert "final" in data
    assert data["config"]["initial_agents"] == 10
    assert isinstance(data["agents"], list)
    # agents length should match requested players
    assert len(data["agents"]) == 10


def test_agents_endpoints_reflect_last_run():
    # Ensure there's a known run
    payload = {"seed": 123456, "agents": 5, "packs_per_agent": 1, "ticks": 1}
    r = client.post("/run", json=payload)
    assert r.status_code == 200

    # /agents should list 5 agents
    r2 = client.get("/agents")
    assert r2.status_code == 200
    body = r2.json()
    assert "agents" in body
    assert len(body["agents"]) == 5

    # individual agent
    agent0 = body["agents"][0]
    aid = agent0["id"]
    r3 = client.get(f"/agents/{aid}")
    assert r3.status_code == 200
    pbody = r3.json()
    assert "agent" in pbody
    assert int(pbody["agent"]["id"]) == int(aid)


def test_run_deterministic_for_same_seed():
    cfg = {"seed": 42, "agents": 8, "packs_per_agent": 2, "ticks": 2}
    r1 = client.post("/run", json=cfg)
    r2 = client.post("/run", json=cfg)
    assert r1.status_code == 200
    assert r2.status_code == 200

    # deep comparison
    d1 = r1.json()
    d2 = r2.json()
    # exact equality expected for deterministic seed
    assert json.dumps(d1, sort_keys=True) == json.dumps(d2, sort_keys=True)


def test_negative_players_handled_gracefully():
    # the backend currently doesn't aggressively validate; it should not crash
    cfg = {"seed": 7, "agents": -5, "packs_per_agent": 1, "ticks": 1}
    r = client.post("/run", json=cfg)
    # expect 200 but agents list length should be 0 or handled
    assert r.status_code == 200
    body = r.json()
    assert "agents" in body
    assert isinstance(body["agents"], list)
    assert len(body["agents"]) >= 0


def test_agents_before_run_return_error():
    # Ensure LAST_RUN is cleared and endpoints handle missing runs
    from backend import main as bm

    bm.LAST_RUN = None
    r = client.get("/agents")
    assert r.status_code == 200
    body = r.json()
    assert "error" in body


def test_get_agent_before_run_return_error():
    from backend import main as bm

    bm.LAST_RUN = None
    r = client.get("/agents/1")
    assert r.status_code == 200
    body = r.json()
    assert "error" in body


def test_get_agent_not_found_after_run():
    # run a small simulation then query a non-existing agent id
    payload = {"seed": 123, "agents": 2, "packs_per_agent": 1, "ticks": 1}
    r = client.post("/run", json=payload)
    assert r.status_code == 200
    r2 = client.get("/agents/9999")
    assert r2.status_code == 200
    assert "error" in r2.json()
