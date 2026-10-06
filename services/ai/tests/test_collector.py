from datetime import date

from scholarai_ai.collector import collect
from scholarai_ai.collector import extract as X
from scholarai_ai.collector.pipeline import expire, parse_feed
from scholarai_ai.llm import LLMRouter

TODAY = date(2026, 10, 7)
FEED = "https://feeds.example/scholarships/feed/"

RSS = """<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<item><title>Example University Masters Scholarships 2027 for African Students (Fully Funded)</title>
<link>https://news.example/example-masters</link><category>Scholarships</category>
<description>Application Deadline: 30 November 2026</description></item>
<item><title>ECOWAS Bank Young Professionals Programme 2027 for West African graduates</title>
<link>https://news.example/ecowas</link><category>Internships</category><description>Deadline: 1 December 2026</description></item>
<item><title>Commonwealth Master's Scholarships 2027 for study in the UK</title>
<link>https://news.example/commonwealth</link><category>Scholarships</category>
<description>Application Deadline: 20 October 2026. Open to citizens of low and middle income Commonwealth countries.</description></item>
<item><title>Gates Cambridge Scholarship Programme 2027 for study at the University of Cambridge</title>
<link>https://news.example/gates</link><category>Scholarships</category><description>Application Deadline: 8 December 2026</description></item>
<item><title>Old Scholarship 2026 for African Students</title>
<link>https://news.example/old</link><category>Scholarships</category><description>Application Deadline: 1 March 2026</description></item>
</channel></rss>"""

ARTICLE = """<html><body><nav><li>Menu item</li></nav><div class="entry-content">
<p>Application Deadline: <strong>30 November 2026</strong></p>
<p>Applications are now open for the Example University Masters Scholarships. The programme funds outstanding students
from African countries to pursue a fully funded master's degree programme in engineering in Germany.</p>
<h2>Eligibility criteria:</h2><li>Citizens of an African country, including Ethiopia</li><li>Bachelor's degree with good grades</li>
<li>IELTS 6.5 is required</li>
<h2>Benefits</h2><li>Full tuition waiver</li><li>Monthly stipend of EUR 934</li>
<h2>How to apply</h2><li>Create an account on the portal</li><li>Upload your documents</li>
<h2>Required documents</h2><li>Passport</li><li>Transcripts</li>
<p>Click <a href="https://apply.example-uni.de/portal">here to apply</a> or share on <a href="https://facebook.com/x">Facebook</a></p>
</div><div class="sharedaddy"><li>Share</li></div></body></html>"""

OFFICIAL = """<html><body><h1>DAAD EPOS</h1><p>Application deadline: 15 September 2027 for all courses.</p>
<p>Results are announced in March 2028.</p></body></html>"""


class FakeFetcher:
    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def get(self, url):
        self.calls.append(url)
        return self.pages.get(url)


def _existing():
    return [
        {"id": "daad-epos", "title": "DAAD EPOS", "url": "https://daad.example/epos", "sources": ["https://daad.example/epos"],
         "deadline": "2027-10-31", "deadlineConfirmed": False, "tags": ["estimated-deadline"], "status": "open"},
        {"id": "gates-cambridge-scholarship", "title": "Gates Cambridge Scholarship", "url": "https://gates.example",
         "sources": [], "deadline": "2027-01-07", "deadlineConfirmed": False, "tags": [], "status": "open"},
        {"id": "old-curated", "title": "Old Curated Programme", "url": "https://old.example", "sources": [],
         "deadline": "2026-03-01", "deadlineConfirmed": True, "tags": [], "status": "open"},
    ]


def _run(**kw):
    f = FakeFetcher({FEED: RSS, "https://news.example/example-masters": ARTICLE, "https://daad.example/epos": OFFICIAL})
    return collect(_existing(), fetcher=f, router=LLMRouter(), today=TODAY, feeds=[FEED], **kw), f


def test_discovers_only_open_ethiopia_eligible_study_opportunities():
    res, _ = _run()
    assert len(res.discovered) == 1
    new = next(r for r in res.records if r["id"] == res.discovered[0])
    assert new["title"] == "Example University Masters Scholarships for African Students"
    assert new["origin"] == "discovered" and new["deadline"] == "2026-11-30" and new["deadlineConfirmed"]
    assert new["level"] == ["master"] and new["fundingType"] == "full" and new["country"] == "Germany"
    assert new["url"] == "https://apply.example-uni.de/portal"
    d = new["details"]
    assert "Citizens of an African country, including Ethiopia" in d["whoCanApply"]
    assert d["benefits"][:2] == ["Full tuition waiver", "Monthly stipend of EUR 934"]
    assert d["howToApply"][0] == "Create an account on the portal"
    assert d["documents"] == ["Passport", "Transcripts"]
    assert new["eligibility"]["englishTest"] == "required"
    assert all("Menu item" not in x and "Share" != x for v in d.values() if isinstance(v, list) for x in v)


def test_existing_programme_matched_from_feed_gets_deadline_not_duplicated():
    res, _ = _run()
    gates = next(r for r in res.records if r["id"] == "gates-cambridge-scholarship")
    assert gates["deadline"] == "2026-12-08" and gates["deadlineConfirmed"]
    assert sum("gates" in r["id"] for r in res.records) == 1


def test_verifies_official_page_and_rolls_past_deadlines():
    res, _ = _run(discover=False)
    epos = next(r for r in res.records if r["id"] == "daad-epos")
    assert epos["deadline"] == "2027-09-15" and epos["deadlineConfirmed"] and "estimated-deadline" not in epos["tags"]
    assert epos["checkStatus"] == "reachable" and epos["lastChecked"] == TODAY.isoformat()
    old = next(r for r in res.records if r["id"] == "old-curated")
    assert old["deadline"] == "2027-03-01" and not old["deadlineConfirmed"]
    kinds = {c["kind"] for c in res.changes}
    assert {"deadline_updated", "rolled"} <= kinds


def test_original_records_are_not_mutated_and_offline_failures_are_soft():
    recs = _existing()
    res = collect(recs, fetcher=FakeFetcher({}), router=LLMRouter(), today=TODAY, feeds=[FEED])
    assert recs[0]["deadline"] == "2027-10-31"
    assert res.errors == [f"feed unreachable: {FEED}"]
    assert next(r for r in res.records if r["id"] == "daad-epos")["checkStatus"] == "unreachable"


def test_strict_official_deadline_ignores_secondary_dates():
    text = "The deadline to submit your unconditional university offer is 8 July 2027. Interviews from 1 March 2027."
    assert X.find_official_deadline(text, TODAY) is None
    assert X.find_official_deadline("Application deadline: 5 November 2026", TODAY) == date(2026, 11, 5)
    two = "Application deadline: 5 November 2026. Applications close 9 December 2026 for track B."
    assert X.find_official_deadline(two, TODAY) is None


def test_eligibility_rules():
    assert X.ethiopians_eligible("Scholarships for African students", "Open to citizens of African countries")
    assert not X.ethiopians_eligible("Programme for West African graduates", "ECOWAS member states only")
    assert not X.ethiopians_eligible("Commonwealth Scholarships", "low and middle income Commonwealth countries")
    assert not X.ethiopians_eligible("Nordic scholarship", "international students welcome. You must be based at a university in Sweden.")
    assert X.ethiopians_eligible("Any", "Open to Ethiopian nationals")


def test_expire_closes_discovered_one_off_calls():
    rec = {"id": "x", "deadline": "2026-09-01", "origin": "discovered", "status": "open"}
    assert expire(rec, TODAY)["kind"] == "closed" and rec["status"] == "closed"


def test_lenient_feed_parser_handles_malformed_xml():
    bad = RSS.replace("Scholarships for African Students", "Scholarships & Grants for African Students")
    items = parse_feed(bad, FEED)
    assert len(items) == 5 and items[0].link == "https://news.example/example-masters"
