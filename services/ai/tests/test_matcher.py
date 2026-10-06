from datetime import date

from scholarai_ai.matcher import Profile, match_all, match_one

TODAY = date(2026, 10, 6)


def test_hard_filter_level(scholarships):
    chevening = next(s for s in scholarships if s["id"] == "chevening-scholarships")
    assert match_one(Profile(degreeLevelSought="phd"), chevening, today=TODAY) is None
    assert match_one(Profile(degreeLevelSought="master"), chevening, today=TODAY) is not None


def test_hard_filter_deadline(scholarships):
    s = dict(scholarships[0], deadline="2020-01-01")
    assert match_one(Profile(degreeLevelSought="master"), s, today=TODAY) is None


def test_match_all_ranked_with_explanations(scholarships):
    p = Profile(
        degreeLevelSought="master",
        field="Engineering",
        gpa=3.6,
        workYears=2,
        englishTest="IELTS",
        englishScore=6.5,
        preferredCountries=["Germany"],
        interests=["development", "energy"],
    )
    res = match_all(p, scholarships, today=TODAY)
    assert res
    probs = [m["probability"] for m in res]
    assert probs == sorted(probs, reverse=True)
    assert all(0 <= x <= 100 for x in probs)
    top = res[0]
    assert top["why"] and isinstance(top["missing"], list)
    daad = next(m for m in res if m["scholarshipId"] == "daad-epos")
    assert daad["probability"] >= 70
    assert any("work experience" in w for w in daad["why"])


def test_missing_explanations_for_weak_profile(scholarships):
    p = Profile(degreeLevelSought="master", gpa=2.4, workYears=0)
    daad = next(s for s in scholarships if s["id"] == "daad-epos")
    m = match_one(p, daad, today=TODAY)
    assert m is not None
    assert any("work experience" in x for x in m["missing"])
    assert any("GPA" in x for x in m["missing"])
    assert any("English" in x for x in m["missing"])
