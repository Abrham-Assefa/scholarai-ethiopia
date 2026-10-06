PROFILE = {
    "name": "Dawit",
    "degreeLevelSought": "master",
    "field": "Engineering",
    "gpa": 3.6,
    "workYears": 2,
    "englishTest": "IELTS",
    "englishScore": 6.5,
    "preferredCountries": ["Germany", "UK"],
    "interests": ["energy"],
}

CV_DATA = {
    "name": "Dawit Bekele",
    "email": "d@example.com",
    "phone": "+251911",
    "city": "Bahir Dar",
    "education": [
        {"institution": "Bahir Dar University", "degree": "BSc", "field": "Electrical Engineering", "gpa": 3.6}
    ],
    "experience": [
        {"org": "EEP", "role": "Junior Engineer", "bullets": ["I was responsible for maintenance of 12 substations"]}
    ],
    "skills": "MATLAB, Python, Leadership",
}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"
    assert r.json()["llmProvider"] == "mock"


def test_openapi(client):
    assert client.get("/openapi.json").status_code == 200


def test_bad_otp(client):
    assert client.post("/v1/auth/otp/verify", json={"phone": "+2519", "code": "000000"}).status_code == 400


def test_scholarships_seeded_and_filters(client):
    r = client.get("/v1/scholarships")
    assert r.status_code == 200
    assert r.json()["total"] >= 35
    r = client.get("/v1/scholarships", params={"level": "phd", "country": "Germany"})
    ids = [s["id"] for s in r.json()["items"]]
    assert "daad-epos" in ids and "chevening-scholarships" not in ids
    r = client.get("/v1/scholarships", params={"q": "chevening"})
    assert r.json()["total"] == 1
    r = client.get("/v1/scholarships", params={"deadlineAfter": "2027-06-01"})
    assert all(s["deadline"] is None or s["deadline"] >= "2027-06-01" for s in r.json()["items"])


def test_scholarship_detail_and_404(client):
    r = client.get("/v1/scholarships/chevening-scholarships")
    assert r.status_code == 200 and r.json()["country"] == "UK" and r.json()["requiredDocuments"]
    assert client.get("/v1/scholarships/nope").status_code == 404


def test_stats_and_conferences(client):
    assert client.get("/v1/scholarships/stats").json()["total"] >= 35
    r = client.get("/v1/conferences")
    assert r.status_code == 200 and r.json()["total"] >= 20


def test_matches_require_auth_and_profile(client, auth):
    assert client.get("/v1/matches").status_code == 401
    assert client.get("/v1/matches", headers=auth).status_code == 400
    r = client.put("/v1/me/profile", json=PROFILE, headers=auth)
    assert r.status_code == 200 and r.json()["gpa"] == 3.6
    r = client.get("/v1/matches", headers=auth)
    assert r.status_code == 200
    items = r.json()["items"]
    assert items and items[0]["probability"] >= items[-1]["probability"]
    assert items[0]["why"]
    r = client.get("/v1/deadlines", headers=auth)
    assert r.status_code == 200


def test_cv_flow(client, auth):
    r = client.post("/v1/cv", json={"data": CV_DATA, "template": "modern"}, headers=auth)
    assert r.status_code == 201, r.text
    cv = r.json()
    assert 0 <= cv["atsScore"] <= 100 and cv["ats"]["suggestions"]
    cid = cv["id"]
    assert client.get(f"/v1/cv/{cid}", headers=auth).json()["id"] == cid
    r = client.post(f"/v1/cv/{cid}/enhance", json={"section": "all"}, headers=auth)
    assert r.status_code == 200
    bullets = r.json()["data"]["experience"][0]["bullets"]
    assert not bullets[0].lower().startswith("i was") and "12" in bullets[0]
    assert r.json()["enhancement"]["scoreAfter"] >= r.json()["enhancement"]["scoreBefore"]
    for t in ("europass", "modern"):
        r = client.post(f"/v1/cv/{cid}/export", json={"format": "pdf", "template": t}, headers=auth)
        assert r.status_code == 200 and r.headers["content-type"] == "application/pdf"
        assert r.content.startswith(b"%PDF")
    r = client.put(f"/v1/cv/{cid}", json={"template": "europass"}, headers=auth)
    assert r.json()["template"] == "europass" and r.json()["version"] >= 3


def test_cv_ownership(client):
    other = client.post("/v1/auth/otp/verify", json={"phone": "+251922000000", "code": "123456"}).json()["accessToken"]
    hdr = {"Authorization": f"Bearer {other}"}
    cvs = client.get("/v1/cv", headers=hdr).json()["items"]
    assert cvs == []


def test_chat_en_am(client):
    r = client.post("/v1/chat", json={"message": "scholarships for master's in Germany", "lang": "en"})
    assert r.status_code == 200 and "DAAD" in r.json()["reply"]
    r = client.post("/v1/chat", json={"message": "ሰላም", "lang": "am"})
    assert "ስኮላር" in r.json()["reply"]


def test_essay_and_gpa(client):
    r = client.post("/v1/essays/feedback", json={"content": "I want to study. " * 20, "wordLimit": 200})
    assert r.status_code == 200 and "rubric" in r.json()
    r = client.post("/v1/tools/gpa", json={"gpa": 3.5})
    assert r.status_code == 200 and r.json()["german"] == 1.8


def test_root_and_favicon(client):
    r = client.get("/")
    assert r.status_code == 200 and r.json()["docs"] == "/docs"
    assert client.get("/favicon.ico").status_code == 204
