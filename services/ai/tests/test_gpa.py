import pytest

from scholarai_ai.cv_maker.gpa import convert_gpa


def test_perfect_gpa_is_german_1_0():
    c = convert_gpa(4.0)
    assert c.german == 1.0
    assert c.uk.startswith("First")
    assert c.us_letter == "A"


def test_mid_gpa():
    c = convert_gpa(3.4)
    assert c.german == 1.9
    assert "2:1" in c.uk
    assert c.percentage == 85.0


def test_pass_threshold_is_german_4_0():
    assert convert_gpa(2.0).german == 4.0


def test_other_scale_normalizes():
    assert convert_gpa(85, scale=100).us_gpa == 3.4


def test_invalid():
    with pytest.raises(ValueError):
        convert_gpa(4.5)
