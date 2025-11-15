from simulation.cards import sample_card_pool
from simulation.booster import open_booster


def test_open_booster_mythic_upgrade() -> None:
    pool = sample_card_pool()

    class FakeRNG:
        def choices(self, candidates, weights, k):
            # pick the first candidate always
            return [candidates[0] for _ in range(k)]

        def random(self):
            # Force hologram flags and mythic-upgrade branch
            return 0.01

        def randrange(self, n):
            return 0

        def choice(self, seq):
            return seq[0]

    rng = FakeRNG()
    inst = open_booster(pool, rng)
    # ensure we return a list of CardInstance-like objects and that at least
    # one card was opened
    assert isinstance(inst, list)
    assert len(inst) > 0


def test_cardinstance_effective_quality() -> None:
    from simulation.types import CardRef, CardInstance, Rarity

    ref = CardRef("X001", "Test", Rarity.COMMON, quality_score=1.5)
    ci = CardInstance(ref=ref, quality_score=None)
    assert ci.effective_quality() == 1.5
    ci2 = CardInstance(ref=ref, quality_score=2.2)
    assert ci2.effective_quality() == 2.2


def test_open_booster_replaces_rare_with_mythic() -> None:
    from simulation.types import CardRef, Rarity

    # small custom pool with at least one common, one rare and one mythic
    pool = [
        CardRef("C1", "Common", Rarity.COMMON, quality_score=0.5, pack_weight=1.0),
        CardRef("R1", "Rare", Rarity.RARE, quality_score=2.0, pack_weight=1.0),
        CardRef("M1", "Mythic", Rarity.MYTHIC, quality_score=5.0, pack_weight=0.1),
    ]

    class FakeRNG2:
        def choices(self, candidates, weights, k):
            # always pick the first candidate available
            return [candidates[0] for _ in range(k)]

        def random(self):
            # trigger mythic-upgrade branch
            return 0.01

        def randrange(self, n):
            return 0

        def choice(self, seq):
            return seq[0]

    inst = open_booster(pool, FakeRNG2())
    # at least one card should be mythic when replacement happens
    assert any(i.ref.rarity == Rarity.MYTHIC for i in inst)
