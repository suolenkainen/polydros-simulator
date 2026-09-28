# Scripts

## `export_cards_from_excel.py`

Reads `polydros_master_set_v1.xlsx` from the repo root and writes
`simulation/data/cards.json`, the card list the simulation loads.

**Don't run it right now.** The JSON has fields the script doesn't write
(`flavor_text`, `base_price`, `attractiveness`) and an `ALTERNATE_ART` rarity
the script doesn't know, so running it would wipe those and turn Alternate Art
cards into Commons. Issue #33 tracks fixing that.

### Running it

It needs `openpyxl`, which is in `requirements-dev.txt`. From the repo root:

```
.venv\Scripts\python.exe scripts\export_cards_from_excel.py
```

Restart the backend afterwards so it loads the new file.

If you get `PermissionError`, the spreadsheet is open in Excel or OneDrive is
syncing it. Close it or pause the sync and try again.

### What it reads

Row 1 is the header; data starts on row 2. It reads these columns by name:
`#`, `Name`, `Color/Faction`, `Type`, `Rarity` (C, U, R, M or P), `Gem colored`,
`Gem Colorless`, `Power`, `Health`, `Per-Pack Appearance %` and `Holo %`.

### What it writes

One object per card with `id`, `name`, `color`, `type`, `rarity`,
`gem_colored`, `gem_colorless`, `power`, `health`, `per_pack_appearance`,
`holo_chance` (Holo % as a fraction), `pack_weight` (same as the per-pack %)
and `quality_score` (`(power + health) / 2`). Player cards are included.
