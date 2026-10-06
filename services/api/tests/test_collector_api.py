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
    assert [i["title"] for i in items] == ["Example Masters Scholarships for African Students"]
    assert items[0]["origin"] == "discovered" and items[0]["discoveredAt"] == "2026-10-07"
    st = client.get("/v1/collector/status").json()
    assert st["lastRun"]["status"] == "ok" and st["totals"]["discovered"] == 1 and st["nextRunAt"] is None
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
