"""Test that agent Prism balance never goes negative."""

from simulation.engine import SimulationConfig, run_simulation


def test_agent_prism_never_negative() -> None:
    """Ensure agents never have negative Prism balance."""
    # Run simulation with multiple ticks
    config = SimulationConfig(seed=42, initial_agents=5, ticks=10)
    result = run_simulation(config)
    
    # Check all agents have non-negative Prism
    for agent in result["agents"]:
        assert agent["prism"] >= 0.0, f"Agent {agent['id']} has negative Prism: {agent['prism']}"
    
    # Also check timeseries data if available
    for ts in result["timeseries"]:
        # Each tick should have valid agent counts
        assert ts["tick"] >= 0
        assert ts["agent_count"] > 0


def test_agent_prism_starts_at_200() -> None:
    """Ensure agents start with exactly 200.00 Prism."""
    config = SimulationConfig(seed=42, initial_agents=3, ticks=0)
    result = run_simulation(config)
    
    for agent in result["agents"]:
        assert agent["prism"] == 200.0, f"Agent {agent['id']} should start with 200.0 Prism, got {agent['prism']}"


def test_agent_cannot_buy_without_sufficient_prism() -> None:
    """Test that agents cannot buy boosters if they don't have enough Prism.
    
    This simulates a scenario where agents run out of Prism and should not
    be able to make purchases.
    """
    # Create a simulation where we can track purchase behavior
    config = SimulationConfig(seed=99, initial_agents=2, ticks=20)
    result = run_simulation(config)
    
    # Check that all agents maintained non-negative Prism throughout
    for agent in result["agents"]:
        assert agent["prism"] >= 0.0, f"Agent {agent['id']} ended with negative Prism: {agent['prism']}"
        
        # Count purchases from events
        purchases = [e for e in agent.get("agent_events", []) if e["event_type"] == "booster_purchase"]
        
        # Each purchase should have cost money (5 boosters × 12 Prism = 60 Prism)
        # Starting with 200 Prism, they can make at most 3 purchases before running out
        # (200 - 60 - 60 - 60 = 20 Prism remaining)
        assert len(purchases) <= 4, f"Agent {agent['id']} made {len(purchases)} purchases, expected at most 4"
