"""The card loader accepts the real card file and refuses broken ones.

Milestone 1 promises that a mistake in the card file fails loudly, naming the
card and the field. Each test below breaks one thing and checks the message.
"""

import json
from pathlib import Path

import pytest

from polydros.cards import CardSetError, load_cards, parse_cards


def good_card(**changes: object) -> dict:
    card = {
        "id": "T001",
        "name": "Test Card",
        "rarity": "COMMON",
        "color": "Ruby",
        "type": "Creature",
        "labels": ["Ruby", "Creature"],
        "gem_colored": 1,
        "gem_colorless": 0,
        "power": 1,
        "health": 3,
        "pack_weight": 18.37,
        "holo_chance": 0.018,
        "flavor_text": "",
    }
    card.update(changes)
    return card


def problems_for(raw: object) -> str:
    with pytest.raises(CardSetError) as err:
        parse_cards(raw)
    return str(err.value)


def test_real_card_file_loads_all_120_cards() -> None:
    cards = load_cards()
    assert len(cards) == 120
    assert cards["C001"].name == "Ashmarch Footsoldier"
    assert cards["C001"].labels == ("Ruby", "Creature")
    assert cards["C001"].cost == 1


def test_a_good_card_loads() -> None:
    cards = parse_cards([good_card()])
    assert "T001" in cards
    assert cards["T001"].to_dict()["labels"] == ["Ruby", "Creature"]


@pytest.mark.parametrize(
    ("card", "expected"),
    [
        (good_card(rarity="RAER"), "T001: rarity 'RAER' is not one of COMMON"),
        (good_card(power=-1), "T001: power is negative (-1)"),
        (good_card(power="3"), "T001: power has the wrong type ('3')"),
        (good_card(power=True), "T001: power has the wrong type (True)"),
        (good_card(name=" "), "T001: name is empty"),
        (good_card(name="Tiravel�s Flutist"), "T001: name contains a broken"),
        (good_card(pack_weight=0), "T001: pack_weight must be above 0"),
        (good_card(holo_chance=2), "T001: holo_chance must be between 0 and 1"),
        (good_card(labels=["Ruby", "Ruby"]), "T001: labels contain duplicates"),
        (good_card(labels=["Ruby", ""]), "T001: labels must be non-empty strings"),
        (good_card(rarty="COMMON"), "T001: unknown field 'rarty'"),
    ],
)
def test_a_broken_field_is_reported_with_card_and_field(
    card: dict, expected: str
) -> None:
    assert expected in problems_for([card])


def test_a_missing_field_is_reported() -> None:
    card = good_card()
    del card["health"]
    assert "T001: missing field 'health'" in problems_for([card])


def test_a_card_without_id_is_reported_by_position() -> None:
    card = good_card()
    del card["id"]
    assert "card #2: missing field 'id'" in problems_for([good_card(id="T000"), card])


def test_duplicate_ids_are_reported() -> None:
    assert "T001: ID is used by more than one card" in problems_for(
        [good_card(), good_card()]
    )


def test_every_problem_is_listed_not_just_the_first() -> None:
    message = problems_for([good_card(id="A", power=-1), good_card(id="B", rarity="X")])
    assert "2 problem(s)" in message
    assert "A: power is negative" in message
    assert "B: rarity 'X'" in message


def test_file_that_is_not_json_is_reported(tmp_path: Path) -> None:
    path = tmp_path / "cards.json"
    path.write_text("[{", encoding="utf-8")
    with pytest.raises(CardSetError, match="not valid JSON"):
        load_cards(path)


def test_missing_file_is_reported(tmp_path: Path) -> None:
    with pytest.raises(CardSetError, match="file not found"):
        load_cards(tmp_path / "nope.json")


def test_file_that_is_not_a_list_is_reported(tmp_path: Path) -> None:
    path = tmp_path / "cards.json"
    path.write_text(json.dumps({"cards": []}), encoding="utf-8")
    with pytest.raises(CardSetError, match="expected a list of cards"):
        load_cards(path)
