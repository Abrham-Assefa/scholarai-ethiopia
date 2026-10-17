from datetime import date

from sqlalchemy import select

from app import collector as svc
from app.db import SessionLocal
from app.models import Scholarship

FEED = "https://feeds.example/feed/"
RSS = """<rss><channel><item><title>Example Masters Scholarships 2027 for African Students (Fully Funded)</title>
<link>https://news.example/a</link><category>Scholarships</category>
<description>Application Deadline: 30 November 2026</description>
<content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/"><![CDATA[
<p>Application Deadline: 30 November 2026</p><p>Open to citizens of African countries for a fully funded master's
degree in engineering in Germany. Applications are now open, and the scholarship covers tuition and a stipend for
two years of study at the host university. Successful candidates also receive travel and insurance support.</p>
<h2>Benefits</h2><li>Full tuition</li><li>Monthly stipend</li>
<p><a href="https://apply.example.de/portal">Apply here</a></p>]]></content:encoded></item></channel></rss>"""


class Fake:
    def get(self, url):
        return RSS if url == FEED else None


def test_status_before_any_run(client):
    r = client.get("/v1/collector/status").json()
    assert r["enabled"] is False and r["intervalHours"] == 48 and r["running"] is False
    assert r["totals"]["scholarships"] >= 40


def test_due_when_never_run(client):
    with SessionLocal() as db:
        assert svc.is_due(db)


def test_run_discovers_and_persists(client):
    out = svc.run_collection(trigger="manual", fetcher=Fake(), today=date(2026, 10, 7), feeds=[FEED])
    assert out["status"] == "ok" and out["stats"]["discovered"] == 1
    items = client.get("/v1/scholarships", params={"origin": "discovered"}).json()["items"]
    example = next(i for i in items if i["id"] == "example-masters-scholarships-for-african-students")
    assert example["title"] == "Example Masters Scholarships for African Students"
    assert example["origin"] == "discovered" and example["discoveredAt"] == "2026-10-07"
    st = client.get("/v1/collector/status").json()
    assert st["lastRun"]["status"] == "ok" and st["totals"]["discovered"] == len(items) and st["nextRunAt"] is None
    assert client.get("/v1/collector/runs").json()["items"][0]["trigger"] == "manual"
    with SessionLocal() as db:
        assert not svc.is_due(db)  # next run only after the 48h interval


def test_closed_rows_hidden_by_default(client):
    with SessionLocal() as db:
        sid = db.scalars(select(Scholarship.id).limit(1)).first()
        db.get(Scholarship, sid).status = "closed"
        db.commit()
    ids = {i["id"] for i in client.get("/v1/scholarships", params={"limit": 200}).json()["items"]}
    assert sid not in ids
    ids = {i["id"] for i in client.get("/v1/scholarships", params={"limit": 200, "includeClosed": 1}).json()["items"]}
    assert sid in ids
    with SessionLocal() as db:
        db.get(Scholarship, sid).status = "open"
        db.commit()


def test_manual_trigger_conflict(client, monkeypatch):
    monkeypatch.setattr(svc, "run_collection", lambda *a, **k: None)
    first = client.post("/v1/collector/run")
    assert first.status_code == 202
    assert client.post("/v1/collector/run").status_code == 409  # previous run still marked running
    with SessionLocal() as db:
        run = svc.last_run(db)
        run.status = "ok"
        db.commit()


EVENT_FEED = "https://feeds.example/events/"
EVENT_RSS = """<rss><channel><item><title>Africa Climate Youth Summit 2026 in Nairobi, Kenya (Fully Funded)</title>
<link>https://news.example/summit</link><category>Conferences</category>
<description>Application Deadline: 15 November 2026</description>
<content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/"><![CDATA[
<p>Application Deadline: 15 November 2026</p><p>Applications are open for young climate leaders from across Africa,
including Ethiopia. The fully funded summit will take place 3–6 February 2027 in Nairobi, Kenya, and brings together
two hundred youth delegates for workshops, policy dialogue and mentoring with climate negotiators and researchers.</p>
<h2>Benefits</h2><li>Return airfare</li><li>Accommodation and meals</li>
<p><a href="https://climatesummit.example.org/apply">Apply here</a></p>]]></content:encoded></item></channel></rss>"""


class FakeBoth:
    def get(self, url):
        return {FEED: RSS, EVENT_FEED: EVENT_RSS}.get(url)


def test_run_discovers_conferences(client):
    out = svc.run_collection(
        trigger="manual", fetcher=FakeBoth(), today=date(2026, 10, 7), feeds=[FEED], event_feeds=[EVENT_FEED]
    )
    assert out["status"] == "ok" and out["stats"]["conferences"]["discovered"] == 1
    assert any(c.get("type") == "conference" for c in out["changes"])
    items = client.get("/v1/conferences", params={"origin": "discovered"}).json()["items"]
    event_id = "africa-climate-youth-summit-in-nairobi-kenya"
    assert event_id in {item["id"] for item in items}
    ev = client.get(f"/v1/conferences/{event_id}").json()
    assert ev["deadline"] == "2026-11-15" and ev["startDate"] == "2027-02-03" and ev["fundingType"] == "full"
    assert ev["details"]["benefits"][:2] == ["Return airfare", "Accommodation and meals"]
    assert "daysLeft" in ev and ev["origin"] == "discovered"
    assert client.get("/v1/collector/status").json()["totals"]["conferencesDiscovered"] == len(items)


def test_closed_conferences_hidden(client):
    from app.models import Conference

    with SessionLocal() as db:
        cid = db.scalars(select(Conference.id).limit(1)).first()
        db.get(Conference, cid).status = "closed"
        db.commit()
    assert cid not in {i["id"] for i in client.get("/v1/conferences").json()["items"]}
    assert cid in {i["id"] for i in client.get("/v1/conferences", params={"includeClosed": 1}).json()["items"]}
    assert client.get("/v1/conferences/nope").status_code == 404
    with SessionLocal() as db:
        db.get(Conference, cid).status = "open"
        db.commit()
