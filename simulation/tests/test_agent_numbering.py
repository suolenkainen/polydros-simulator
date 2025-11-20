"""Tests for agent numbering starting from 1, not 0."""

from simulation.engine import run_simulation, SimulationConfig


def test_agents_start_from_id_1():
    """Verify agents are numbered starting from 1, not 0."""
    config = SimulationConfig(seed=42, initial_agents=5, ticks=1)
    result = run_simulation(config)

    agents = result["agents"]
    agent_ids = sorted([a["id"] for a in agents])

    # Should be [1, 2, 3, 4, 5], not [0, 1, 2, 3, 4]
    assert agent_ids == [1, 2, 3, 4, 5], f"Expected [1,2,3,4,5], got {agent_ids}"


def test_agents_have_correct_names():
    """Verify agent names reflect correct IDs (Agent-1, not Agent-0)."""
    config = SimulationConfig(seed=99, initial_agents=3, ticks=0)
    result = run_simulation(config)

    agents = result["agents"]
    for agent in agents:
        agent_id = agent["id"]
        agent_name = agent["name"]

        # Name should be Agent-{id} where id >= 1
        expected_name = f"Agent-{agent_id}"
        assert agent_name == expected_name, (
            f"Agent with id {agent_id} has name '{agent_name}', "
            f"expected '{expected_name}'"
        )
        assert agent_id >= 1, f"Agent ID {agent_id} should be >= 1"


def test_no_agent_zero_exists():
    """Verify agent 0 doesn't exist in simulation."""
    config = SimulationConfig(seed=42, initial_agents=10, ticks=2)
    result = run_simulation(config)

    agents = result["agents"]
    agent_ids = [a["id"] for a in agents]

    assert 0 not in agent_ids, "Agent 0 should not exist"
    assert min(agent_ids) == 1, f"Minimum agent ID should be 1, got {min(agent_ids)}"


def test_agent_numbering_consistent_across_ticks():
    """Verify agent IDs remain consistent across ticks."""
    config1 = SimulationConfig(seed=777, initial_agents=4, ticks=1)
    result1 = run_simulation(config1)
    ids_tick_1 = sorted([a["id"] for a in result1["agents"]])

    config2 = SimulationConfig(seed=777, initial_agents=4, ticks=5)
    result2 = run_simulation(config2)
    ids_tick_5 = sorted([a["id"] for a in result2["agents"]])

    # Same initial_agents should produce same agent IDs
    assert ids_tick_1 == ids_tick_5 == [1, 2, 3, 4]


def test_large_agent_count_numbering():
    """Verify numbering works for large agent counts."""
    config = SimulationConfig(seed=55, initial_agents=100, ticks=0)
    result = run_simulation(config)

    agents = result["agents"]
    assert len(agents) == 100

    agent_ids = sorted([a["id"] for a in agents])
    expected_ids = list(range(1, 101))

    assert agent_ids == expected_ids, \
        f"Expected IDs 1-100, got {agent_ids[0]}-{agent_ids[-1]}"
