"""FastAPI backend skeleton exposing a simple simulation run endpoint.

This is intentionally minimal: it demonstrates an HTTP API to run the
simulation and return JSON. In production you'd add pagination, auth, and
background task execution.
"""

from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulation import SimulationConfig, run_simulation

app = FastAPI(title="Polydros Simulation API")

# In-memory storage for the last simulation run. Lightweight and reset on
# server restart. Persist to disk or DB later if needed.
LAST_RUN = None

# Development CORS settings: allow frontend dev server to call the API.
# In production narrow this down to the actual origin(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    # Use concrete int types so downstream callers (mypy) see int and not
    # Optional[int]. Pydantic will still accept values via the HTTP payload.
    seed: int = 42
    agents: int = 500
    packs_per_agent: int = 15
    ticks: int = 1


@app.post("/run")
def run(req: RunRequest) -> dict:
    cfg = SimulationConfig(
        seed=req.seed,
        initial_agents=req.agents,
        initial_packs_per_agent=req.packs_per_agent,
        ticks=req.ticks,
    )
    result = run_simulation(cfg)
    # store last run in memory for inspection via agents endpoints
    global LAST_RUN
    LAST_RUN = result
    return result


@app.get("/agents")
def list_agents() -> dict:
    """Return a list of agents from the last run.

    Returns minimal metadata: id, prism, collection_count.
    """
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    return {"agents": LAST_RUN.get("agents", [])}


@app.get("/agents/{agent_id}")
def get_agent(agent_id: int) -> dict:
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    agents = LAST_RUN.get("agents", [])
    for agent in agents:
        if int(agent["id"]) == int(agent_id):
            return {"agent": agent}
    return {"error": "Agent not found"}


@app.get("/agents/{agent_id}/traits")
def get_agent_traits(agent_id: int) -> dict:
    """Return trait profile for an agent."""
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    agents = LAST_RUN.get("agents", [])
    for agent in agents:
        if int(agent["id"]) == int(agent_id):
            return {"traits": agent.get("traits", {})}
    return {"error": "Agent not found"}


@app.get("/agents/{agent_id}/collection")
def get_agent_collection(agent_id: int) -> dict:
    """Return collection summary by rarity for an agent."""
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    agents = LAST_RUN.get("agents", [])
    for agent in agents:
        if int(agent["id"]) == int(agent_id):
            return {
                "id": agent.get("id"),
                "collection_count": agent.get("collection_count"),
                "rarity_breakdown": agent.get("rarity_breakdown", {}),
                "sample_cards": agent.get("sample_cards", []),
            }
    return {"error": "Agent not found"}


@app.get("/agents/{agent_id}/cards")
def get_agent_cards(agent_id: int) -> dict:
    """Return all cards in an agent's collection (full inventory).
    
    This endpoint returns the complete card database for an agent, including
    all card details (rarity, holo status, quality score, etc.).
    """
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    agents = LAST_RUN.get("agents", [])
    for agent in agents:
        if int(agent["id"]) == int(agent_id):
            return {
                "id": agent.get("id"),
                "name": agent.get("name"),
                "collection_count": agent.get("collection_count"),
                "cards": agent.get("full_collection", []),
            }
    return {"error": "Agent not found"}
