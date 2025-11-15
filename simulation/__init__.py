"""Polydros simulation package.

Expose high-level API here for convenience.
"""

from .engine import SimulationConfig, run_simulation

__all__ = ["run_simulation", "SimulationConfig"]
