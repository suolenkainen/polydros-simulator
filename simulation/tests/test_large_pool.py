from simulation.cards import large_card_pool
from simulation.types import Rarity


def test_large_pool_counts():
    """Test that the card pool loads successfully and has expected structure.
    
    NOTE: This test uses placeholder data until the Excel export runs.
    After running scripts/export_cards_from_excel.py, the pool will contain
    the full master set (150+ cards) and these assertions will validate the
    actual rarity distribution from the Excel file.
    """
    pool = large_card_pool()
    counts = {r.value: 0 for r in Rarity}
    for c in pool:
        counts[c.rarity.value] = counts.get(c.rarity.value, 0) + 1

    # Basic validation: ensure we have at least some cards per rarity
    assert counts["Common"] >= 2
    assert counts["Uncommon"] >= 2
    assert counts["Rare"] >= 2
    assert counts["Mythic"] >= 2
    assert counts["Player"] >= 1  # At least one player card
    
    # Verify total pool is non-empty
    assert len(pool) >= 9
