from scholarai_ai.cv_maker import CVSchema, ats_score, enhance_bullets, enhance_cv, parse_form, render_pdf

RAW = {
    "name": "Hanna Tesfaye",
    "email": "hanna@example.com",
    "phone": "+251911000000",
    "city": "Addis Ababa",
    "summary": "Final-year computer science student passionate about using data to improve rural health access "
    "in Ethiopia. Led a 12-person student club and built two open-source tools used by 300 students.",
    "education": [{"institution": "Addis Ababa University", "degree": "BSc", "field": "Computer Science", "gpa": 3.7}],
    "experience": [
        {
            "org": "Ethio Telecom",
            "role": "Intern",
            "bullets": "I was a tutor for students, helped build a dashboard for 40 users",
        }
    ],
    "skills": "Python, SQL, Leadership, Research, Excel",
    "languages": "Amharic, English",
    "volunteering": ["Red Cross volunteer"],
}


def test_parse_form_flattened_payload():
    cv = parse_form(RAW)
    assert cv.personal.fullName == "Hanna Tesfaye"
    assert cv.experience[0].bullets == ["I was a tutor for students", "helped build a dashboard for 40 users"]
    assert "Python" in cv.skills.technical
    assert len(cv.languages) == 2


def test_enhancer_uses_action_verbs_and_never_invents_numbers(router):
    res = enhance_bullets(["I was a tutor for students", "helped build a dashboard for 40 users"], router=router)
    assert len(res["bullets"]) == 2
    assert not res["bullets"][0].lower().startswith("i was")
    assert "40" in res["bullets"][1]
    assert res["flagged"] == []
    assert res["questions"]  # asks for a number for bullet 1


def test_honesty_guard_rejects_hallucinated_numbers(router):
    class Liar:
        name = "liar"
        model = "x"

        def complete(self, req):
            from scholarai_ai.llm import LLMResponse

            return LLMResponse(
                text='{"bullets": ["Tutored 500 students"], "questions": []}', provider="liar", model="x"
            )

        def embed(self, texts):
            return [[0.0]]

    from scholarai_ai.llm import LLMRouter

    r = LLMRouter({"liar": Liar()}, default="liar")
    res = enhance_bullets(["Tutored students"], router=r)
    assert res["bullets"] == ["Tutored students"]
    assert res["flagged"] == [0]


def test_ats_score_range_and_improves_after_enhance(router):
    cv = parse_form(RAW)
    before = ats_score(cv)
    assert 0 <= before["score"] <= 100
    assert before["suggestions"]
    enhanced, _ = enhance_cv(cv, router=router)
    after = ats_score(enhanced)
    assert after["score"] >= before["score"]


def test_empty_cv_scores_low():
    assert ats_score(CVSchema())["score"] < 30


def test_render_pdf_both_templates():
    cv = parse_form(RAW)
    for t in ("europass", "modern", "academic", "minimal"):
        pdf = render_pdf(cv, template=t)
        assert pdf.startswith(b"%PDF")
        assert len(pdf) > 1500
