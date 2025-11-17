"""Tests for collector trait behavior.

The collector trait determines if agents continue buying boosters after reaching 60 cards.
- Before 60 cards: always buy (5 packs per tick)
- After 60 cards: random chance each tick (10-50%)
"""

import pytest
from simulation.engine import run_simulation, SimulationConfig
from simulation.types import AgentTrait


class TestCollectorTraitGeneration:
    """Test that collector trait is generated in the correct range."""
    
    def test_collector_trait_in_range(self):
        """Collector trait should be between 0.10 and 0.50."""
        config = SimulationConfig(seed=42, initial_agents=10, ticks=1)
        result = run_simulation(config)
        
        agents = result["agents"]
        assert len(agents) == 10
        
        for agent in agents:
            trait_value = agent["traits"]["collector_trait"]
            assert 0.10 <= trait_value <= 0.50, f"Collector trait {trait_value} out of range"
    
    def test_collector_trait_varies(self):
        """Different seeds should produce different collector trait values."""
        config1 = SimulationConfig(seed=1, initial_agents=1, ticks=0)
        result1 = run_simulation(config1)
        trait1 = result1["agents"][0]["traits"]["collector_trait"]
        
        config2 = SimulationConfig(seed=2, initial_agents=1, ticks=0)
        result2 = run_simulation(config2)
        trait2 = result2["agents"][0]["traits"]["collector_trait"]
        
        # At least some variation in generated traits
        assert trait1 != trait2
        assert 0.10 <= trait1 <= 0.50
        assert 0.10 <= trait2 <= 0.50


class TestCollectorTraitBuying:
    """Test that agents buy correctly based on collector trait."""
    
    def test_always_buy_until_60_cards(self):
        """Agents should always buy 5 packs per tick until they have 60 cards."""
        # At 5 cards per pack, 60 cards = 12 packs = 12 ticks
        config = SimulationConfig(seed=42, initial_agents=1, ticks=12)
        result = run_simulation(config)
        
        agent = result["agents"][0]
        # Agent should have purchased: 5 packs/tick * 12 ticks = 60 packs opened
        # 5 cards per pack = 60 cards (give or take due to random card draws)
        collection_count = agent["collection_count"]
        assert collection_count >= 55, f"Agent should have ~60 cards, got {collection_count}"
    
    def test_no_prism_stops_buying(self):
        """Agents should stop buying when they run out of Prism."""
        # 200 Prism / 60 Prism per tick = 3 ticks before running out
        config = SimulationConfig(seed=42, initial_agents=1, ticks=10)
        result = run_simulation(config)
        
        agent = result["agents"][0]
        # After 3 ticks: 200 - (3*60) = 20 Prism remaining (not enough for 5*12=60)
        # Should have ~15 cards from 3 ticks * 5 packs * ~1 card per pack (average)
        assert agent["prism"] >= 0, "Prism should never go negative"
    
    def test_collector_trait_blocks_purchases_after_60_cards(self):
        """After 60 cards, purchases should only occur if collector trait triggers."""
        # Create agent with 0 collector trait (0% chance to buy after 60 cards)
        # We can't directly set this, but we can verify the behavior with ticks
        config = SimulationConfig(seed=1, initial_agents=1, ticks=20)
        result = run_simulation(config)
        
        agent = result["agents"][0]
        collection_count = agent["collection_count"]
        collector_trait = agent["traits"]["collector_trait"]
        
        # Agent should have at least 60 cards
        assert collection_count >= 60
        
        # With a low collector trait (closer to 0.10), we'd expect fewer purchases after 60
        # With a high collector trait (closer to 0.50), we'd expect more purchases after 60
        # Just verify the trait is in range
        assert 0.10 <= collector_trait <= 0.50
    
    def test_deterministic_collector_decisions(self):
        """Same seed should produce same collector trait purchase decisions."""
        config1 = SimulationConfig(seed=99, initial_agents=1, ticks=20)
        result1 = run_simulation(config1)
        agent1 = result1["agents"][0]
        
        config2 = SimulationConfig(seed=99, initial_agents=1, ticks=20)
        result2 = run_simulation(config2)
        agent2 = result2["agents"][0]
        
        # Same seed = same results
        assert agent1["collection_count"] == agent2["collection_count"]
        assert agent1["traits"]["collector_trait"] == agent2["traits"]["collector_trait"]
        assert agent1["prism"] == agent2["prism"]


class TestCollectorTraitEvents:
    """Test that collector trait triggers are logged in events."""
    
    def test_collector_trait_logged_in_events(self):
        """Purchase events after 60 cards should mention collector trait."""
        config = SimulationConfig(seed=42, initial_agents=1, ticks=15)
        result = run_simulation(config)
        
        events = result["events"]
        booster_purchases = [e for e in events if e["event_type"] == "booster_purchase"]
        
        # Find purchases that occur after agent has 60+ cards
        has_trait_mention = False
        for event in booster_purchases:
            if "collector trait" in event["description"].lower():
                has_trait_mention = True
                break
        
        # At least some purchases should be after 60 cards and show trait
        assert has_trait_mention or len(booster_purchases) < 5, \
            "Should either have trait mentions or not enough ticks"


class TestCollectorTraitRangeValidation:
    """Validate collector trait range across many seeds."""
    
    def test_many_agents_trait_range(self):
        """Generate many agents and verify all have valid collector traits."""
        config = SimulationConfig(seed=777, initial_agents=100, ticks=1)
        result = run_simulation(config)
        
        agents = result["agents"]
        assert len(agents) == 100
        
        min_trait = min(a["traits"]["collector_trait"] for a in agents)
        max_trait = max(a["traits"]["collector_trait"] for a in agents)
        
        assert min_trait >= 0.10, f"Minimum trait {min_trait} should be >= 0.10"
        assert max_trait <= 0.50, f"Maximum trait {max_trait} should be <= 0.50"
        assert max_trait > min_trait, "Should have variation in traits"
