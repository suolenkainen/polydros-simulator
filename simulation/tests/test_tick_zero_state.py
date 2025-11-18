"""Test that initial tick 0 shows agents with correct starting state."""

def test_tick_zero_initialization():
    """Test that running simulation with ticks=0 shows agents at initial state."""
    from simulation.engine import SimulationConfig, run_simulation

    config = SimulationConfig(seed=42, initial_agents=3, ticks=0)
    result = run_simulation(config)

    # Check that agents are present in the result
    assert len(result["agents"]) == 3, "Should have 3 agents"

    # Check that agents have the correct initial state
    for agent in result["agents"]:
        # At tick 0, no purchases have been made yet
        prism_msg = f"Agent should start with 200 Prism, got {agent['prism']}"
        assert agent["prism"] == 200.0, prism_msg

        coll_msg = (
            f"Agent should have 0 cards at tick 0, "
            f"got {agent['collection_count']}"
        )
        assert agent["collection_count"] == 0, coll_msg

        boost_msg = (
            f"Agent should have 0 boosters at tick 0, "
            f"got {agent['booster_count']}"
        )
        assert agent["booster_count"] == 0, boost_msg

    # Check timeseries has only initial state
    ts_msg = "Should have only tick 0 (initial state)"
    assert len(result["timeseries"]) == 1, ts_msg
    assert result["timeseries"][0]["tick"] == 0
    assert result["timeseries"][0]["agent_count"] == 3


def test_agents_visible_at_all_ticks():
    """Test that agents are visible at tick 0 and after progression."""
    from simulation.engine import SimulationConfig, run_simulation

    # Run to tick 2
    config = SimulationConfig(seed=42, initial_agents=2, ticks=2)
    result = run_simulation(config)

    # Agents should always be present
    assert len(result["agents"]) == 2, "Should have 2 agents"

    # All timeseries points should show correct agent count
    for ts in result["timeseries"]:
        assert ts["agent_count"] == 2

    # At tick 2, agents should have cards (from opening boosters)
    for agent in result["agents"]:
        assert agent["collection_count"] > 0, "Agent should have cards after ticks"


def test_reset_returns_to_tick_zero_state():
    """Test that resetting brings agents back to initial state."""
    from simulation.engine import SimulationConfig, run_simulation

    # Get tick 0 state
    config_zero = SimulationConfig(seed=42, initial_agents=2, ticks=0)
    result_zero = run_simulation(config_zero)

    # Get tick 3 state
    config_three = SimulationConfig(seed=42, initial_agents=2, ticks=3)
    result_three = run_simulation(config_three)

    # Verify they differ
    agent_zero = result_zero["agents"][0]
    agent_three = result_three["agents"][0]

    assert agent_zero["prism"] == 200.0
    assert agent_three["prism"] < 200.0, "Agent should have spent Prism"
    assert agent_zero["collection_count"] == 0
    assert agent_three["collection_count"] > 0, "Agent should have cards"

    # If we reset from tick 3 (simulated), we should get back to tick 0 state
    # by running ticks=0 with same seed and agents
    config_reset = SimulationConfig(seed=42, initial_agents=2, ticks=0)
    result_reset = run_simulation(config_reset)

    agent_reset = result_reset["agents"][0]
    assert agent_reset["prism"] == agent_zero["prism"]
    assert agent_reset["collection_count"] == agent_zero["collection_count"]
