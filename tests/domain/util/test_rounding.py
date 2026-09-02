from colony_manager.domain.util.rounding import round_half_up


def test_round_half_up_positive_cases():
    assert round_half_up(1.5) == 2
    assert round_half_up(2.5) == 3
    assert round_half_up(0.5) == 1


def test_round_half_up_negative_cases():
    assert round_half_up(-1.5) == -2
    assert round_half_up(-2.5) == -3
