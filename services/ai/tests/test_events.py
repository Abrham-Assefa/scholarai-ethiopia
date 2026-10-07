from datetime import date

from scholarai_ai.collector import collect_events
from scholarai_ai.collector.events import event_dates, event_title, is_event
from scholarai_ai.llm import LLMRouter

TODAY = date(2026, 10, 7)
FEED = "https://feeds.example/conferences/feed/"

RSS = """<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Africa Climate Youth Summit 2026 in Nairobi, Kenya (Fully Funded)</title>
<link>https://news.example/climate-summit</link><category>Conferences</category>
<description>Application Deadline: 15 November 2026</description></item>
<item><title>Global Paid Business Conference 2026 in Dubai</title>
<link>https://news.example/paid</link><category>Conferences</category>
<description>Deadline: 20 November 2026. Registration fee is USD 900. Open to participants from all over the world.</description></item>
<item><title>ECOWAS Youth Forum 2026 for West African youth</title>
<link>https://news.example/ecowas</link><category>Conferences</category>
<description>Deadline: 1 December 2026. Open only to citizens of ECOWAS member states. Travel grant available.</description></item>
<item><title>Program Officer Jobs at the African Union</title>
<link>https://news.example/jobs</link><category>Jobs</category><description>Deadline: 1 December 2026</description></item>
<item><title>Mandela Washington Fellowship for Young African Leaders 2027 – Fully Funded Opportunity</title>
<link>https://news.example/mwf</link><category>Conferences</category>
<description>Application Deadline: 13 October 2026. The fellowship will take place from 20 June 2027.</description></item>
</channel></rss>"""

ARTICLE = """<html><body><div class="entry-content">
<p>Application Deadline: 15 November 2026</p>
<p>Applications are open for the Africa Climate Youth Summit, gathering young climate leaders from across Africa.
The summit will take place 3–6 February 2027 in Nairobi, Kenya.</p>
<h2>Eligibility</h2><li>Citizens of any African country, including Ethiopia</li><li>Aged 18 to 30 years</li>
<h2>Benefits</h2><li>Return airfare to Nairobi</li><li>Accommodation and meals</li>
<h2>How to apply</h2><li>Fill in the online form</li><li>Upload a 300-word motivation</li>
<p><a href="https://climatesummit.example.org/apply">Apply here</a></p>
</div></body></html>"""


class FakeFetcher:
    def __init__(self, pages):
        self.pages = pages

    def get(self, url):
        return self.pages.get(url)


def _existing():
    return [
        {"id": "mandela-washington-fellowship", "title": "Mandela Washington Fellowship (YALI)",
         "url": "https://mwf.example", "startDate": "2027-06-20", "when": "Jun–Jul 2027"},
        {"id": "past-forum", "title": "Annual Youth Forum", "url": "https://forum.example",
         "startDate": "2026-04-10", "when": "10 Apr 2026", "deadline": "2026-02-01"},
        {"id": "old-discovered", "title": "Some One-off Summit", "url": "https://gone.example",
         "origin": "discovered", "deadline": "2026-09-01", "startDate": "2026-12-01", "status": "open"},
    ]


def _run():
    f = FakeFetcher({FEED: RSS, "https://news.example/climate-summit": ARTICLE, "https://mwf.example": "<p>ok</p>"})
    return collect_events(_existing(), fetcher=f, router=LLMRouter(), today=TODAY, feeds=[FEED])


def test_discovers_funded_africa_eligible_events_only():
    res = _run()
    assert res.discovered == ["africa-climate-youth-summit-in-nairobi-kenya"]
    ev = next(r for r in res.records if r["id"] == res.discovered[0])
    assert ev["origin"] == "discovered" and ev["status"] == "open"
    assert ev["deadline"] == "2026-11-15"
    assert ev["startDate"] == "2027-02-03" and ev["when"] == "3–6 Feb 2027" and ev["dateConfirmed"]
    assert ev["location"] == "Kenya" or ev["location"].endswith("Kenya")
    assert ev["fundingType"] == "full"
    assert ev["url"] == "https://climatesummit.example.org/apply"
    assert ev["details"]["benefits"][:2] == ["Return airfare to Nairobi", "Accommodation and meals"]
    assert ev["details"]["howToApply"][0] == "Fill in the online form"
    assert "_text" not in ev and "_src" not in ev


def test_known_event_is_not_duplicated():
    res = _run()
    assert not any("mandela" in d for d in res.discovered)


def test_expiry_rolls_curated_and_closes_discovered():
    res = _run()
    by = {r["id"]: r for r in res.records}
    assert by["past-forum"]["startDate"] == "2027-04-10"
    assert by["past-forum"]["when"] == "10 Apr 2027"
    assert by["past-forum"]["deadline"] is None and by["past-forum"]["dateConfirmed"] is False
    assert by["old-discovered"]["status"] == "closed"
    assert res.stats["rolled"] == 1 and res.stats["closed"] == 1


def test_verify_marks_reachability():
    res = _run()
    by = {r["id"]: r for r in res.records}
    assert by["mandela-washington-fellowship"]["checkStatus"] == "reachable"
    assert by["past-forum"]["checkStatus"] == "unreachable"
    assert by["mandela-washington-fellowship"]["lastChecked"] == TODAY.isoformat()


def test_helpers():
    assert is_event("World Youth Summit 2026", [])
    assert not is_event("Program Officer Jobs at the AU", ["Conferences"])
    assert not is_event("Masters Scholarship in Germany", [])
    assert event_title("Rise to Lead: Girl Up 2026 Global Leadership Summit – Join Young Leaders Worldwide") == \
        "Girl Up Global Leadership Summit"
    assert event_dates("The forum will be held on 12-14 May 2027 in Geneva.", TODAY)[0] == date(2027, 5, 12)
    assert event_dates("Conference dates: November 3–6, 2026", TODAY) == (date(2026, 11, 3), "3–6 Nov 2026")
