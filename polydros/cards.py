"""The card set: which cards exist, loaded from a JSON file and checked.

This is the only place that defines cards. Everything else gets them from
`load_cards()`. The loader refuses a bad file and lists every problem it
found, so a typo in the card data can't quietly reach a simulation run.
"""

import json
from collections.abc import Iterator
from dataclasses import asdict, dataclass
from pathlib import Path

DEFAULT_PATH = Path(__file__).resolve().parent / "data" / "cards.json"

RARITIES = ("COMMON", "UNCOMMON", "RARE", "MYTHIC", "PLAYER", "ALTERNATE_ART")

# Field name -> expected Python type in the JSON. bool is rejected
# separately, because JSON true/false would otherwise pass as int.
_FIELDS: dict[str, type | tuple[type, ...]] = {
    "id": str,
    "name": str,
    "rarity": str,
    "color": str,
    "type": str,
    "labels": list,
    "gem_colored": int,
    "gem_colorless": int,
    "power": int,
    "health": int,
    "pack_weight": (int, float),
    "holo_chance": (int, float),
    "flavor_text": str,
}

# What a broken text encoding leaves behind (U+FFFD). Real cards never
# contain it.
_REPLACEMENT_CHAR = "�"


class CardSetError(ValueError):
    """The card file can't be used. The message lists every problem."""


@dataclass(frozen=True)
class Card:
    id: str
    name: str
    rarity: str
    color: str
    type: str
    labels: tuple[str, ...]
    gem_colored: int
    gem_colorless: int
    power: int
    health: int
    pack_weight: float
    holo_chance: float
    flavor_text: str

    @property
    def cost(self) -> int:
        return self.gem_colored + self.gem_colorless

    def to_dict(self) -> dict:
        data = asdict(self)
        data["labels"] = list(self.labels)
        return data


class CardSet:
    """A checked, read-only collection of cards, looked up by ID."""

    def __init__(self, cards: list[Card]) -> None:
        self._cards = tuple(cards)
        self._by_id = {card.id: card for card in cards}

    def __len__(self) -> int:
        return len(self._cards)

    def __iter__(self) -> Iterator[Card]:
        return iter(self._cards)

    def __contains__(self, card_id: object) -> bool:
        return card_id in self._by_id

    def __getitem__(self, card_id: str) -> Card:
        return self._by_id[card_id]


def load_cards(path: Path = DEFAULT_PATH) -> CardSet:
    """Read and check a card file. Raises CardSetError if anything is wrong."""
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise CardSetError(f"{path}: file not found") from None
    except json.JSONDecodeError as err:
        raise CardSetError(f"{path}: not valid JSON ({err})") from None
    return parse_cards(raw, source=str(path))


def parse_cards(raw: object, source: str = "card data") -> CardSet:
    """Check already-parsed card data and build a CardSet from it."""
    if not isinstance(raw, list):
        raise CardSetError(f"{source}: expected a list of cards")

    problems: list[str] = []
    cards: list[Card] = []
    seen_ids: set[str] = set()

    for index, entry in enumerate(raw):
        # Name problems by card ID when there is one, so they're easy to find
        # in the file.
        name = entry.get("id") if isinstance(entry, dict) else None
        where = name if isinstance(name, str) and name else f"card #{index + 1}"
        card_problems = _check_card(entry)
        if card_problems:
            problems.extend(f"{where}: {p}" for p in card_problems)
            continue
        if entry["id"] in seen_ids:
            problems.append(f"{where}: ID is used by more than one card")
            continue
        seen_ids.add(entry["id"])
        cards.append(Card(**{**entry, "labels": tuple(entry["labels"])}))

    if problems:
        raise CardSetError(
            f"{source}: {len(problems)} problem(s)\n  " + "\n  ".join(problems)
        )
    return CardSet(cards)


def _check_card(entry: object) -> list[str]:
    if not isinstance(entry, dict):
        return ["not an object"]

    problems = []
    for field in sorted(set(entry) - set(_FIELDS)):
        problems.append(f"unknown field {field!r}")
    for field, expected in _FIELDS.items():
        if field not in entry:
            problems.append(f"missing field {field!r}")
            continue
        value = entry[field]
        if isinstance(value, bool) or not isinstance(value, expected):
            problems.append(f"{field} has the wrong type ({value!r})")
            continue
        problems.extend(_check_value(field, value))
    return problems


def _check_value(field: str, value: object) -> list[str]:
    if isinstance(value, str):
        return _check_text(field, value)
    if isinstance(value, list):
        return _check_labels(value)
    if isinstance(value, (int, float)):
        return _check_number(field, value)
    return []


def _check_text(field: str, value: str) -> list[str]:
    if _REPLACEMENT_CHAR in value:
        return [f"{field} contains a broken character (U+FFFD)"]
    if field != "flavor_text" and not value.strip():
        return [f"{field} is empty"]
    if field == "rarity" and value not in RARITIES:
        return [f"rarity {value!r} is not one of {', '.join(RARITIES)}"]
    return []


def _check_labels(labels: list) -> list[str]:
    if not all(isinstance(label, str) and label.strip() for label in labels):
        return ["labels must be non-empty strings"]
    if len(set(labels)) != len(labels):
        return ["labels contain duplicates"]
    return []


def _check_number(field: str, value: float) -> list[str]:
    if value < 0:
        return [f"{field} is negative ({value})"]
    if field == "pack_weight" and value == 0:
        return ["pack_weight must be above 0"]
    if field == "holo_chance" and value > 1:
        return [f"holo_chance must be between 0 and 1 ({value})"]
    return []
