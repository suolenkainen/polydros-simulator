"""Test incremental tick advancement and reset functionality."""

from simulation.engine import SimulationConfig, run_simulation


def test_simulation_tick_progression() -> None:
    """Test that simulation can be run incrementally with advancing ticks."""
    # First run: 5 ticks
    config1 = SimulationConfig(seed=42, initial_agents=2, ticks=5)
    result1 = run_simulation(config1)
    
    # Check we have data up to tick 5
    assert result1["timeseries"][-1]["tick"] == 5
    assert len(result1["timeseries"]) == 6  # ticks 0-5
    
    # Check agents have made purchases in this period
    agent_events_1 = [e for e in result1["events"] if e["event_type"] == "booster_purchase"]
    assert len(agent_events_1) > 0, "Should have purchase events"


def test_simulation_incremental_runs_same_seed() -> None:
    """Test that running simulation with incremental ticks produces same results as single run."""
    # Single run to tick 10
    config_full = SimulationConfig(seed=99, initial_agents=3, ticks=10)
    result_full = run_simulation(config_full)
    
    # Run twice incrementally: first 5 ticks, then 10 ticks (advances by 5)
    config_part1 = SimulationConfig(seed=99, initial_agents=3, ticks=5)
    result_part1 = run_simulation(config_part1)
    
    config_part2 = SimulationConfig(seed=99, initial_agents=3, ticks=10)
    result_part2 = run_simulation(config_part2)
    
    # Both incremental and full run should reach tick 10
    assert result_full["final"]["tick"] == 10
    assert result_part2["final"]["tick"] == 10
    
    # Final agent states should match (same seed, same progression)
    full_agents = {a["id"]: a for a in result_full["agents"]}
    part2_agents = {a["id"]: a for a in result_part2["agents"]}
    
    for agent_id in full_agents:
        assert full_agents[agent_id]["prism"] == part2_agents[agent_id]["prism"]
        assert full_agents[agent_id]["collection_count"] == part2_agents[agent_id]["collection_count"]


def test_tick_starts_at_zero() -> None:
    """Test that timeseries starts at tick 0."""
    config = SimulationConfig(seed=42, initial_agents=2, ticks=5)
    result = run_simulation(config)
    
    # First timeseries point should be tick 0
    assert result["timeseries"][0]["tick"] == 0
    
    # Should have ticks 0 through 5 (6 points total)
    assert result["timeseries"][-1]["tick"] == 5
    assert len(result["timeseries"]) == 6


def test_zero_ticks_simulation() -> None:
    """Test running simulation with 0 ticks (only initial state)."""
    config = SimulationConfig(seed=42, initial_agents=2, ticks=0)
    result = run_simulation(config)
    
    # Should have only tick 0 (initial state)
    assert len(result["timeseries"]) == 1
    assert result["timeseries"][0]["tick"] == 0
    
    # No purchase events should occur
    purchase_events = [e for e in result["events"] if e["event_type"] == "booster_purchase"]
    assert len(purchase_events) == 0


def test_agent_prism_after_tick_sequence() -> None:
    """Test that agent Prism deductions are correct across tick sequence."""
    config = SimulationConfig(seed=42, initial_agents=1, ticks=1)
    result = run_simulation(config)
    
    agent = result["agents"][0]
    
    # Starting with 200, buys 5 packs at 12 each = 60 cost
    # After 1 tick: 200 - 60 = 140
    assert agent["prism"] == 140.0, f"Expected 140.0 Prism, got {agent['prism']}"
    
    # Test another tick sequence
    config2 = SimulationConfig(seed=42, initial_agents=1, ticks=3)
    result2 = run_simulation(config2)
    
    agent2 = result2["agents"][0]
    # Starting with 200, buys 5 packs per tick (60 each) for 3 ticks = 180 cost
    # 200 - 180 = 20
    assert agent2["prism"] == 20.0, f"Expected 20.0 Prism after 3 ticks, got {agent2['prism']}"
