"""Card pool helpers.

Card definitions are stored in JSON under `simulation/data/cards.json`, exported
from the Excel master set (polydros_master_set_v1.xlsx) using the script in
scripts/export_cards_from_excel.py.

This module provides helpers to load the full card pool or filtered subsets.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict

from .types import CardRef, Rarity


_CARDS_PATH = Path(__file__).resolve().parent / "data" / "cards.json"


def _load_raw_cards() -> List[Dict]:
    """Load raw card dicts from the JSON data file.

    Raises FileNotFoundError if the data file is missing so callers can handle
    the error early in tests or runtime.
    """
    with _CARDS_PATH.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data


def _make_cardref(d: Dict) -> CardRef:
    """Convert a raw card dict from JSON into a CardRef instance."""
    rarity = Rarity[d["rarity"].upper()]
    return CardRef(
        d["id"],
        d["name"],
        rarity,
        quality_score=float(d.get("quality_score", 1.0)),
        pack_weight=float(d.get("pack_weight", 1.0)),
    )


def load_all_cards() -> List[CardRef]:
    """Return all cards from the master set JSON."""
    raw = _load_raw_cards()
    return [_make_cardref(d) for d in raw]


def sample_card_pool() -> List[CardRef]:
    """Return a small sample pool for quick tests.
    
    Filters to cards with high pack_weight (>= 5.0) to get a manageable subset.
    """
    raw = _load_raw_cards()
    return [_make_cardref(d) for d in raw if d.get("pack_weight", 0) >= 5.0]


def large_card_pool() -> List[CardRef]:
    """Return the full card pool for integration tests and production runs.
    
    This is now equivalent to load_all_cards() but kept for API compatibility.
    """
    return load_all_cards()
