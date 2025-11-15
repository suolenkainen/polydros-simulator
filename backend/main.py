"""FastAPI backend skeleton exposing a simple simulation run endpoint.

This is intentionally minimal: it demonstrates an HTTP API to run the
simulation and return JSON. In production you'd add pagination, auth, and
background task execution.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from simulation import run_simulation, SimulationConfig

app = FastAPI(title="Polydros Simulation API")

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
def run(req: RunRequest):
    cfg = SimulationConfig(seed=req.seed, initial_players=req.players, initial_packs_per_player=req.packs_per_player, ticks=req.ticks)
    result = run_simulation(cfg)
    return result
