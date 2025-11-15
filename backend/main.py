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
    seed: Optional[int] = 42
    players: Optional[int] = 500
    packs_per_player: Optional[int] = 15
    ticks: Optional[int] = 1


@app.post("/run")
def run(req: RunRequest) -> dict:
    cfg = SimulationConfig(
        seed=req.seed,
        initial_players=req.players,
        initial_packs_per_player=req.packs_per_player,
        ticks=req.ticks,
    )
    result = run_simulation(cfg)
    # store last run in memory for inspection via agents endpoints
    global LAST_RUN
    LAST_RUN = result
    return result


@app.get("/agents")
def list_agents() -> dict:
    """Return a list of agents (players) from the last run.

    Returns minimal metadata: id, prism, collection_count.
    """
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    return {"players": LAST_RUN.get("players", [])}


@app.get("/agents/{agent_id}")
def get_agent(agent_id: int) -> dict:
    if LAST_RUN is None:
        return {"error": "No simulation run available"}
    players = LAST_RUN.get("players", [])
    for p in players:
        if int(p["id"]) == int(agent_id):
            return {"player": p}
    return {"error": "Player not found"}
