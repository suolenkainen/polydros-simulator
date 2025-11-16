"""Test deterministic behavior of the simulation engine."""

from simulation import SimulationConfig, run_simulation


def test_same_seed_produces_same_output():
    cfg1 = SimulationConfig(
        seed=12345, initial_agents=10, initial_packs_per_agent=2, ticks=1
    )
    cfg2 = SimulationConfig(
        seed=12345, initial_agents=10, initial_packs_per_agent=2, ticks=1
    )

    r1 = run_simulation(cfg1)
    r2 = run_simulation(cfg2)

    assert r1 == r2
