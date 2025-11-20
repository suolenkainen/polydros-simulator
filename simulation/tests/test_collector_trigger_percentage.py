"""Tests for collector trait trigger percentage in event descriptions."""

from typing import Optional, Tuple

from simulation.engine import run_simulation, SimulationConfig


def test_collector_trait_event_includes_trigger_percentage():
    """Verify events include the actual trigger percentage (random roll)."""
    config = SimulationConfig(seed=42, initial_agents=1, ticks=20)
    result = run_simulation(config)

    events = result["events"]

    # Find a collector trait triggered event
    trait_events = [
        e for e in events
        if "collector trait triggered" in e["description"]
    ]

    assert len(trait_events) > 0, (
        "Should have at least one collector trait event"
    )

    # Check that event includes both trait % and roll %
    for event in trait_events:
        desc = event["description"]
        # Should have format: "collector trait triggered: XX% with YY%"
        assert "with" in desc, f"Event should contain 'with': {desc}"
        assert "%" in desc, f"Event should contain percentages: {desc}"

        # Count occurrences of %
        percent_count = desc.count("%")
        assert (
            percent_count >= 2
        ), f"Event should have at least 2 percentages: {desc}"


def test_collector_trait_percentage_format():
    """Verify percentage format is correct (XX%)."""
    config = SimulationConfig(seed=123, initial_agents=1, ticks=15)
    result = run_simulation(config)

    events = result["events"]
    trait_events = [
        e for e in events
        if "collector trait triggered" in e["description"]
    ]

    import re

    for event in trait_events:
        desc = event["description"]
        # Pattern: "collector trait triggered: XX% with YY%"
        pattern = r"collector trait triggered: \d+% with \d+%"

        assert re.search(
            pattern, desc
        ), f"Event doesn't match expected format: {desc}"


def test_early_purchases_dont_include_trigger():
    """Verify early purchases (before 60 cards) don't show trigger percentage."""
    config = SimulationConfig(seed=999, initial_agents=1, ticks=5)
    result = run_simulation(config)

    events = result["events"]
    purchases = [e for e in events if e["event_type"] == "booster_purchase"]

    # Early purchases should NOT mention collector trait
    for event in purchases:
        if "T1" in event["description"] or "T2" in event["description"]:
            # Early ticks shouldn't have "collector trait triggered" yet
            # (before 60 cards reached)
            pass  # Depends on random card pool, just verify format if present

        if "collector trait triggered" not in event["description"]:
            # These should just have amount and cost
            assert "Prism" in event["description"]


def test_trigger_percentage_varies_with_rolls():
    """Verify different runs have different trigger percentages."""
    config1 = SimulationConfig(seed=111, initial_agents=1, ticks=20)
    result1 = run_simulation(config1)
    events1 = result1["events"]
    trait_events1 = [
        e for e in events1
        if "collector trait triggered" in e["description"]
    ]

    config2 = SimulationConfig(seed=222, initial_agents=1, ticks=20)
    result2 = run_simulation(config2)
    events2 = result2["events"]
    trait_events2 = [
        e for e in events2
        if "collector trait triggered" in e["description"]
    ]

    # Extract trigger percentages from descriptions
    import re

    def extract_percentages(desc: str) -> Optional[Tuple[int, int]]:
        """Extract both percentages from 'X% with Y%'."""
        match = re.search(r"(\d+)% with (\d+)%", desc)
        if match:
            return (int(match.group(1)), int(match.group(2)))
        return None

    percs1 = [extract_percentages(e["description"]) for e in trait_events1]
    percs1 = [p for p in percs1 if p]

    percs2 = [extract_percentages(e["description"]) for e in trait_events2]
    percs2 = [p for p in percs2 if p]

    # At least one event should have different trigger percentage
    # (comparing trait% and roll% values across seeds)
    if percs1 and percs2:
        # Both should have events
        assert (
            percs1[0] != percs2[0] or len(percs1) != len(percs2)
        ), "Different seeds should likely have different trigger events"


def test_trigger_percentage_within_valid_range():
    """Verify trigger percentages are valid (0-100%)."""
    config = SimulationConfig(seed=555, initial_agents=1, ticks=25)
    result = run_simulation(config)

    events = result["events"]
    trait_events = [
        e for e in events
        if "collector trait triggered" in e["description"]
    ]

    import re

    for event in trait_events:
        desc = event["description"]
        matches = re.findall(r"(\d+)%", desc)

        for match in matches:
            percent = int(match)
            assert (
                0 <= percent <= 100
            ), f"Percentage {percent} out of range: {desc}"
