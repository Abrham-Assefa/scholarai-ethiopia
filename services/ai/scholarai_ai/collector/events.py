"""Conference / summit / youth-forum collector — the event counterpart of the scholarship pipeline.

Discovers funded events Ethiopians can attend from opportunity feeds, re-checks the official pages of tracked
events, rolls annual events forward and closes one-off calls once their application deadline has passed.
"""

from __future__ import annotations

import copy
import re
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from typing import Any

from ..llm import LLMRequest, LLMRouter
from . import extract as X
from .fetch import Fetcher, HttpFetcher
from .html import parse_html, strip_tags
from .pipeline import CollectionResult, FeedItem, _official_link, _one_line, gather_items, host

CONFERENCE_FEEDS = [
    "https://opportunitiesforyouth.org/category/conferences/feed/",
    "https://www.opportunitiesforafricans.com/category/training-and-conferences/feed/",
    "https://www.opportunitiesforafricans.com/category/conference/feed/",
    "https://www.opportunitiescircle.com/category/conferences/feed/",
    "https://www.opportunitiesforafricans.com/feed/",
    "https://www.opportunitiesforyouth.org/feed/",
]

EVENT_WORDS = re.compile(
    r"conference|summit|forum|symposium|congress|convention|workshop|summer school|winter school|spring school|"
    r"youth assembly|model united nations|\bmun\b|leadership (?:programme|program|challenge|training)|"
    r"exchange programme|exchange program|travel (?:grant|fellowship|award)|festival|seminar|bootcamp|retreat|"
    r"\bindaba\b|\blab\b|dialogue|young leaders|fellows? (?:week|summit)",
    re.I,
)
NOT_EVENT = re.compile(
    r"\bjobs?\b|vacanc|hiring|internship|\bmaster'?s\b|\bphd\b|undergraduate|postgraduate|degree|tuition|"
    r"postdoc|studentship|webinar|online course|mooc|loan|essay (?:competition|contest)",
    re.I,
)
FUNDING_HINT = re.compile(
    r"travel (?:grant|support|costs?|expenses|bursar)|airfare|flights?|accommodation|lodging|per diem|stipend|"
    r"bursar(?:y|ies)|sponsor(?:ed|ship)|scholarship|fee waiver|free (?:of charge|registration|to attend)|"
    r"no (?:registration|participation) fee|partially funded|partial funding|covers?|covered",
    re.I,
)
STRONG_FUNDING = re.compile(
    r"travel (?:grant|support|costs?|expenses|bursar)|airfare|flights?|accommodation|per diem|stipend|bursar|"
    r"fee waiver|free (?:of charge|registration|to attend)|no (?:registration|participation) fee",
    re.I,
)
GLOBAL = re.compile(r"(?:from|across|all over|around) the (?:world|globe)|all over the world|globally|any background|"
                    r"young people (?:aged|between)|youth from all|all young people", re.I)
_RANGE = [
    # 3–6 November 2026 · 3 - 6 Nov, 2026
    re.compile(rf"\b(\d{{1,2}})\s*(?:–|-|—|to|and)\s*(\d{{1,2}})(?:st|nd|rd|th)?\s+{X._MON}\.?,?\s+(20\d\d)\b", re.I),
    # November 3–6, 2026
    re.compile(rf"\b{X._MON}\.?\s+(\d{{1,2}})\s*(?:–|-|—|to)\s*(\d{{1,2}}),?\s+(20\d\d)\b", re.I),
]
EVENT_CUES = re.compile(
    r"take place|taking place|will be held|be held|held (?:on|from|in|at)|event dates?|conference dates?|"
    r"summit dates?|programme dates?|program dates?|dates?:|scheduled (?:for|to)|runs? from|happening",
    re.I,
)


_PITCH = re.compile(r"\s+[–—|-]\s+(?=[^–—|]*\b(?:fully funded|funded|opportunity|apply|call|deadline|register|join)\b).*$", re.I)


def event_title(raw: str) -> str:
    """Clean an event headline; keep the event name when the part before ':' is just a slogan."""
    raw = _PITCH.sub("", raw)
    t = X.clean_title(raw)
    if ":" in raw and not EVENT_WORDS.search(t) and EVENT_WORDS.search(raw.split(":", 1)[1]):
        t = X.clean_title(raw.split(":", 1)[1])
    return t


def match_key(title: str) -> str:
    return re.sub(r"\([^)]*\)", " ", title)


def _audience(who: list[str], age: int | None) -> str:
    if age:
        return f"Up to {age} years"
    for w in who:
        w = w.strip()
        if w and not w.endswith(":") and w[0].isalnum():
            return _one_line(w, 120)
    return "Students & young professionals"


def _benefit_lines(text: str) -> list[str]:
    out: list[str] = []
    for sent in re.split(r"(?<=[.!?])\s+|\n+", text[:8000]):
        sent = sent.strip(" •-–*")
        if 25 <= len(sent) <= 220 and FUNDING_HINT.search(sent) and not X.looks_closed(sent):
            out.append(sent)
        if len(out) >= 4:
            break
    return list(dict.fromkeys(out))


def is_event(title: str, categories: list[str]) -> bool:
    cats = " ".join(categories).lower()
    if NOT_EVENT.search(title):
        return False
    return bool(EVENT_WORDS.search(title) or re.search(r"conference|summit|training", cats))


def eligible(title: str, text: str) -> bool:
    if X.ethiopians_eligible(title, text):
        return True
    # Global youth events rarely list nationalities ("young people from around the world"): accept them unless a
    # regional / residency rule excludes Ethiopians.
    return bool(GLOBAL.search(text[:6000])) and X.ethiopians_eligible(title, text + "\nOpen to all nationalities.")


def event_dates(text: str, after: date) -> tuple[date | None, str | None]:
    """(start date, human 'when') of the event itself — first date after an event cue that is on/after `after`."""
    for cue in EVENT_CUES.finditer(text):
        window = text[cue.start() : cue.end() + 120]
        for rx in _RANGE:
            if (m := rx.search(window)):
                g = m.groups()
                d1, d2, mon, y = (g[0], g[1], g[2], g[3]) if g[0].isdigit() else (g[1], g[2], g[0], g[3])
                start = X._mk(int(y), X.MONTHS[mon.lower()[:3]], int(d1))
                if start and start >= after:
                    return start, f"{int(d1)}–{int(d2)} {start:%b %Y}"
        for _, d in X.find_dates(window):
            if d >= after:
                return d, f"{d:%d %b %Y}".lstrip("0")
    return None, None


CITIES = {
    "Johannesburg": "South Africa", "Cape Town": "South Africa", "Nairobi": "Kenya", "Kigali": "Rwanda",
    "Addis Ababa": "Ethiopia", "Accra": "Ghana", "Lagos": "Nigeria", "Dakar": "Senegal", "Cairo": "Egypt",
    "Geneva": "Switzerland", "St. Gallen": "Switzerland", "Berlin": "Germany", "London": "UK", "Paris": "France",
    "New York": "USA", "Washington": "USA", "Vienna": "Austria", "Tokyo": "Japan", "Seoul": "South Korea",
    "Doha": "Qatar", "Dubai": "UAE", "Istanbul": "Turkey", "Strasbourg": "France", "Lindau": "Germany",
}


def location(title: str, text: str, official: str) -> str:
    if re.search(r"\b(?:virtual|online|hybrid)\b", title, re.I):
        return "Online"
    country = X.host_country(title, text[:4000], official)
    if country == "Multiple":
        head = title + "\n" + text[:5000]
        for city, c in CITIES.items():
            if re.search(rf"\b(?:in|to|at) {re.escape(city)}\b", head):
                return f"{city}, {c}"
        return "Online" if re.search(r"\bvirtual(?:ly)?\b|\bonline event\b|via zoom", text[:4000], re.I) else "See official site"
    m = re.search(rf"\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?),\s*{re.escape(country)}", title + "\n" + text[:3000])
    return f"{m.group(1)}, {country}" if m and m.group(1).lower() not in {"in", "the", "at"} else country


def build_event(item: FeedItem, raw_html: str | None, today: date) -> dict[str, Any] | None:
    content = item.content if len(item.content) > 1500 else (raw_html or item.content or item.summary)
    doc = parse_html(content, article=not (len(item.content) > 1500))
    text = doc.text or strip_tags(item.summary)
    full = item.title + "\n" + strip_tags(item.summary) + "\n" + text
    deadline = X.find_deadline(full, today)
    if not deadline or X.looks_closed(text[:1500]) or not eligible(item.title, text):
        return None
    full_f = X.full_funding(item.title, text)
    if not full_f and not FUNDING_HINT.search(item.title + " " + text[:6000]):
        return None  # unfunded paid events are not useful for most Ethiopian students

    title = event_title(item.title)
    official = _official_link(doc.links, item.link) or item.link
    secs = X.sections(doc)
    benefits = secs.get("benefits") or _benefit_lines(text)
    start, when = event_dates(full, deadline)
    if start and start <= deadline:
        start, when = None, None
    age = X.age_limit(text)
    who = secs.get("whoCanApply", [])
    ov = X.overview(doc) or strip_tags(item.summary)[:600]
    src_host = host(item.link)
    where = location(item.title, text, official)
    if full_f:
        funding = "Fully funded"
    else:
        hint = next((b for b in benefits if STRONG_FUNDING.search(b)), None)
        funding = (_one_line(hint, 90) if hint else "Free to attend (online)" if where == "Online"
                   else "Partial funding — see official page")
    return {
        "id": X.slugify(title),
        "title": title,
        "location": where,
        "when": when or f"Apply by {deadline:%d %b %Y}",
        "startDate": start.isoformat() if start else None,
        "deadline": deadline.isoformat(),
        "funding": funding,
        "fundingType": "full" if full_f else "partial",
        "audience": _audience(who, age),
        "age": {"min": None, "max": age},
        "url": official,
        "ethiopiansEligible": True,
        "description": ov,
        "status": "open",
        "details": {
            "overview": ov,
            "whoCanApply": [w for w in who if w.strip() and w.strip()[0].isalnum()][:7],
            "benefits": benefits[:7],
            "howToApply": (secs.get("howToApply") or [
                f"Read the full call on the official page ({host(official)})",
                "Prepare a short CV and a motivation statement",
                f"Submit the application before {deadline:%d %B %Y}",
                "Start your visa appointment early once accepted — Ethiopian passports need visas for most hosts",
            ])[:7],
            "generatedBy": "heuristic",
        },
        "sources": list(dict.fromkeys([official, item.link])),
        "lastVerified": today.isoformat(),
        "lastChecked": today.isoformat(),
        "discoveredAt": today.isoformat(),
        "origin": "discovered",
        "dateConfirmed": bool(start),
        "_src": src_host,
        "_text": text[:8000],
    }


LLM_SYSTEM = (
    "You summarise conference/summit calls for Ethiopian students. Use ONLY facts in the text; never invent dates, "
    "amounts or rules. Reply with JSON: {overview: string (3-4 sentences), whoCanApply: string[], benefits: string[], "
    "howToApply: string[], funding: string (one line), ethiopiansEligible: boolean}."
)


def enrich_event(ev: dict[str, Any], router: LLMRouter) -> None:
    text = ev.pop("_text", "")
    if router.active_provider == "mock" or not text:
        return
    try:
        res = router.complete(LLMRequest(system=LLM_SYSTEM, user=f"Title: {ev['title']}\n\n{text[:7000]}",
                                         task="extract", json_mode=True))
        if res.provider == "mock":
            return
        data = res.json()
    except Exception:  # noqa: BLE001
        return
    if data.get("ethiopiansEligible") is False:
        ev["_reject"] = True
        return
    d = ev["details"]
    for k in ("overview", "whoCanApply", "benefits", "howToApply"):
        v = data.get(k)
        if v and (isinstance(v, str) or (isinstance(v, list) and all(isinstance(x, str) for x in v))):
            d[k] = v
    if isinstance(data.get("funding"), str) and data["funding"]:
        ev["funding"] = data["funding"][:200]
    ev["description"] = d["overview"]
    d["generatedBy"] = res.provider


def _shift_year(s: str | None) -> str | None:
    return re.sub(r"\b(20\d\d)\b", lambda m: str(int(m.group(1)) + 1), s) if s else s


def expire_event(ev: dict[str, Any], today: date) -> dict[str, str] | None:
    if ev.get("status") == "closed":
        return None
    deadline = ev.get("deadline")
    start = ev.get("startDate")
    if ev.get("origin") == "discovered":
        if (deadline and deadline < today.isoformat()) or (start and start < today.isoformat()):
            ev["status"] = "closed"
            return {"id": ev["id"], "kind": "closed", "detail": f"application window ended ({deadline or start})"}
        return None
    # Curated events recur yearly: move past editions forward and flag the date as an estimate.
    if start and start < today.isoformat():
        old = start
        while start < today.isoformat():
            y, rest = start.split("-", 1)
            start = f"{int(y) + 1}-{rest.replace('02-29', '02-28')}"
        ev["startDate"] = start
        ev["when"] = _shift_year(ev.get("when"))
        if deadline and deadline < today.isoformat():
            ev["deadline"] = None
        ev["dateConfirmed"] = False
        return {"id": ev["id"], "kind": "rolled", "detail": f"{old} → {start} (next edition, estimated)"}
    return None


def collect_events(
    records: list[dict[str, Any]],
    *,
    fetcher: Fetcher | None = None,
    router: LLMRouter | None = None,
    today: date | None = None,
    feeds: list[str] | None = None,
    verify: bool = True,
    discover: bool = True,
    max_articles: int = 60,
    max_new: int = 30,
    workers: int = 6,
    log: Callable[[str], None] | None = None,
) -> CollectionResult:
    today = today or date.today()
    own = fetcher is None
    fetcher = fetcher or HttpFetcher()
    router = router or LLMRouter.from_env()
    log = log or (lambda _m: None)
    recs = copy.deepcopy(records)
    by_id = {r["id"]: r for r in recs}
    res = CollectionResult(records=recs, provider=router.active_provider)
    stats = res.stats = {"checked": 0, "reachable": 0, "feedItems": 0, "candidates": 0, "closed": 0, "rolled": 0}

    def note(ch: dict[str, str]) -> None:
        res.changes.append(ch)
        res.touched.add(ch["id"])
        if ch["kind"] in ("closed", "rolled"):
            stats[ch["kind"]] += 1

    try:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            if verify:
                targets = [r for r in recs if r.get("status") != "closed" and (r.get("url") or "").startswith("http")]
                for r, page in zip(targets, pool.map(lambda r: fetcher.get(r["url"]), targets), strict=True):
                    stats["checked"] += 1
                    r["lastChecked"] = today.isoformat()
                    r["checkStatus"] = "reachable" if page else "unreachable"
                    stats["reachable"] += bool(page)
                    if page and r.get("origin") == "discovered" and X.looks_closed(parse_html(page).text[:3000]):
                        r["status"] = "closed"
                        note({"id": r["id"], "kind": "closed", "detail": "official page says applications are closed"})
                    res.touched.add(r["id"])
                log(f"verified {stats['checked']} events ({stats['reachable']} reachable)")

            for r in recs:
                if (ch := expire_event(r, today)):
                    note(ch)

            if discover:
                items = gather_items(pool, fetcher, feeds or CONFERENCE_FEEDS, res, is_event)
                stats["feedItems"] = len(items)
                items = items[:max_articles]
                pages = list(pool.map(lambda it: None if len(it.content) > 1500 else fetcher.get(it.link), items))
                titles = [(match_key(r["title"]), r) for r in recs]
                for it, page in zip(items, pages, strict=True):
                    clean = event_title(it.title)
                    match = next((r for t, r in titles if X.similar(t, clean)), None)
                    if match:
                        if match.get("origin") != "discovered" and len(X.tokens(clean) - X.tokens(match_key(match["title"]))) <= 1:
                            _refresh_from_post(match, it, page, today, note)
                        continue
                    try:
                        ev = build_event(it, page, today)
                    except Exception as e:  # noqa: BLE001
                        res.errors.append(f"parse failed: {it.link}: {e}")
                        continue
                    if not ev:
                        continue
                    stats["candidates"] += 1
                    if len(res.discovered) >= max_new:
                        continue
                    base, n = ev["id"], 2
                    while ev["id"] in by_id:
                        ev["id"] = f"{base[:66]}-{n}"
                        n += 1
                    ev.pop("_src", None)
                    enrich_event(ev, router)
                    ev.pop("_text", None)
                    if ev.pop("_reject", False):
                        continue
                    recs.append(ev)
                    by_id[ev["id"]] = ev
                    titles.append((match_key(ev["title"]), ev))
                    res.discovered.append(ev["id"])
                    note({"id": ev["id"], "kind": "discovered", "detail": f"{ev['title']} — apply by {ev['deadline']}"})
                log(f"event feeds: {stats['feedItems']} event items, {stats['candidates']} eligible, "
                    f"{len(res.discovered)} new")
    finally:
        if own and isinstance(fetcher, HttpFetcher):
            fetcher.close()
    return res


def _refresh_from_post(match: dict[str, Any], it: FeedItem, page: str | None, today: date,
                       note: Callable[[dict[str, str]], None]) -> None:
    text = strip_tags(it.summary) + "\n" + parse_html(it.content or page or "", article=True).text
    deadline = X.find_deadline(it.title + "\n" + text, today)
    if not deadline or match.get("deadline") == deadline.isoformat():
        return
    start, when = event_dates(it.title + "\n" + text, deadline)
    if start and start <= deadline:
        start = None
    old = match.get("deadline")
    match["deadline"] = deadline.isoformat()
    if start:
        match["startDate"], match["when"], match["dateConfirmed"] = start.isoformat(), when, True
    match["status"] = "open"
    match["lastVerified"] = today.isoformat()
    match["sources"] = list(dict.fromkeys([*(match.get("sources") or []), it.link]))
    note({"id": match["id"], "kind": "deadline_updated", "detail": f"{old} → {deadline} via {host(it.link)}"})
