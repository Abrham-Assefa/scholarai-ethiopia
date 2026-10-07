from __future__ import annotations

import copy
import json
import re
import xml.etree.ElementTree as ET
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any
from urllib.parse import urlparse

from ..llm import LLMRequest, LLMRouter
from . import extract as X
from .fetch import Fetcher, HttpFetcher
from .html import parse_html, strip_tags

DEFAULT_FEEDS = [
    "https://www.opportunitiesforafricans.com/category/scholarships/feed/",
    "https://www.opportunitiesforafricans.com/feed/",
    "https://www.opportunitiesforyouth.org/category/scholarships/feed/",
    "https://www.opportunitiesforyouth.org/feed/",
    "https://www.afterschoolafrica.com/category/scholarships/feed/",
    "https://www.scholars4dev.com/feed/",
]
SOCIAL = re.compile(r"facebook|twitter|x\.com|whatsapp|linkedin|t\.me|telegram|instagram|youtube|pinterest|mailto:|"
                    r"wa\.me|reddit|tumblr|addtoany|share", re.I)
NOT_OFFICIAL = re.compile(r"teams\.microsoft|zoom\.us|eventbrite|bit\.ly|tinyurl|google\.com/maps|amazon\.|"
                          r"wikipedia|opportunitiesfor|afterschoolafrica|scholars4dev|scholarship-positions", re.I)
CONTENT_NS = "{http://purl.org/rss/1.0/modules/content/}encoded"


@dataclass
class FeedItem:
    title: str
    link: str
    categories: list[str]
    summary: str
    content: str
    feed: str


@dataclass
class CollectionResult:
    records: list[dict[str, Any]]
    changes: list[dict[str, str]] = field(default_factory=list)
    discovered: list[str] = field(default_factory=list)
    touched: set[str] = field(default_factory=set)
    errors: list[str] = field(default_factory=list)
    stats: dict[str, int] = field(default_factory=dict)
    provider: str = "mock"

    def summary(self) -> dict[str, Any]:
        return {
            **self.stats,
            "discovered": len(self.discovered),
            "updated": len({c["id"] for c in self.changes if c["kind"] != "discovered"}),
            "provider": self.provider,
        }


def host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


# --------------------------------------------------------------------------- #
# Feeds
# --------------------------------------------------------------------------- #
def parse_feed(xml: str, feed: str) -> list[FeedItem]:
    items: list[FeedItem] = []
    try:
        root = ET.fromstring(xml.encode("utf-8") if isinstance(xml, str) else xml)
        for it in root.iter("item"):
            items.append(
                FeedItem(
                    title=strip_tags(it.findtext("title") or ""),
                    link=(it.findtext("link") or "").strip(),
                    categories=[strip_tags(c.text or "") for c in it.findall("category")],
                    summary=it.findtext("description") or "",
                    content=it.findtext(CONTENT_NS) or "",
                    feed=feed,
                )
            )
        return items
    except ET.ParseError:
        pass
    # Lenient fallback for feeds with stray entities / invalid bytes.
    for block in re.findall(r"<item\b.*?</item>", xml, re.S):
        def tag(name: str, b: str = block) -> str:
            m = re.search(rf"<{name}[^>]*>(.*?)</{name}>", b, re.S)
            return re.sub(r"^<!\[CDATA\[|\]\]>$", "", m.group(1).strip()) if m else ""

        items.append(
            FeedItem(
                title=strip_tags(tag("title")),
                link=strip_tags(tag("link")),
                categories=[strip_tags(re.sub(r"^<!\[CDATA\[|\]\]>$", "", c)) for c in re.findall(r"<category[^>]*>(.*?)</category>", block, re.S)],
                summary=tag("description"),
                content=tag("content:encoded"),
                feed=feed,
            )
        )
    return items


# --------------------------------------------------------------------------- #
# Discovery
# --------------------------------------------------------------------------- #
def _official_link(links: list[tuple[str, str]], article: str) -> str | None:
    art_host = host(article)
    best: tuple[int, str] | None = None
    for href, text in links:
        if not href.startswith("http") or host(href) == art_host or SOCIAL.search(href) or NOT_OFFICIAL.search(href):
            continue
        t = text.lower()
        score = (3 if re.search(r"official|apply|application|portal", t) else 0) + (
            1 if re.search(r"here|website|visit|more|link|details", t) else 0
        )
        if score and (best is None or score > best[0]):
            best = (score, href)
    return best[1] if best else None


def _one_line(s: str, n: int = 160) -> str:
    s = re.split(r"(?<=[.!?])\s", s.strip())[0].rstrip(".")
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"


def _tips(text: str, deadline: date, src: str) -> list[str]:
    tips = [
        f"Start early: authenticate your degree and transcripts with the Ethiopian Ministry of Education / ETA well "
        f"before {deadline:%d %B %Y}.",
    ]
    if re.search(r"ielts|toefl|english proficiency|duolingo", text, re.I):
        tips.append("Book IELTS/TOEFL in Addis Ababa early — test dates fill up weeks ahead.")
    if re.search(r"recommendation|referee|reference letter", text, re.I):
        tips.append("Ask your lecturers or employer for recommendation letters at least four weeks before the deadline.")
    if re.search(r"essay|motivation|personal statement|statement of purpose", text, re.I):
        tips.append("Tailor your motivation letter to Ethiopian development priorities and your concrete plans after study.")
    if re.search(r"passport", text, re.I):
        tips.append("Apply for or renew your Ethiopian passport now — processing can take several weeks.")
    tips.append(f"This entry was collected automatically from {src}; always confirm details on the official website.")
    return tips[:5]


def build_candidate(item: FeedItem, raw_html: str | None, today: date) -> dict[str, Any] | None:
    content = item.content if len(item.content) > 1500 else (raw_html or item.content or item.summary)
    doc = parse_html(content, article=not (len(item.content) > 1500))
    text = doc.text or strip_tags(item.summary)
    full = item.title + "\n" + strip_tags(item.summary) + "\n" + text
    deadline = X.find_deadline(full, today)
    if not deadline or X.looks_closed(text[:1500]):
        return None
    if not X.ethiopians_eligible(item.title, text):
        return None
    lvls = X.levels(item.title, text)
    if not lvls:
        return None
    if re.search(r"fellowship", item.title, re.I) and not re.search(r"scholarship|studentship|\bphd\b|master|degree|study",
                                                                     item.title + text[:3000], re.I):
        return None

    title = X.clean_title(item.title)
    official = _official_link(doc.links, item.link) or item.link
    secs = X.sections(doc)
    full_f = X.full_funding(item.title, text)
    benefits = secs.get("benefits", [])
    src_host = host(item.link)
    how = secs.get("howToApply") or [
        f"Read the full call on the official page ({host(official)})",
        "Check every eligibility rule and prepare the listed documents",
        f"Submit the online application before {deadline:%d %B %Y}",
        "Monitor your email for shortlisting or interview invitations",
    ]
    eligibility: dict[str, Any] = {"nationalities": ["ET"], "ethiopiansEligible": True}
    if (a := X.age_limit(text)) is not None:
        eligibility["ageLimit"] = a
    if (w := X.work_years(text)):
        eligibility["workYearsMin"] = w
    if (e := X.english_test(text)):
        eligibility["englishTest"] = e
    country = X.host_country(item.title, text, official)
    ov = X.overview(doc) or strip_tags(item.summary)[:600]
    return {
        "id": X.slugify(title),
        "title": title,
        "provider": host(official) if official != item.link else None,
        "country": country,
        "countries": [country],
        "level": lvls,
        "fields": X.fields(item.title, text),
        "fundingType": "full" if full_f else "partial",
        "covers": _one_line(benefits[0]) if benefits else ("Fully funded" if full_f else "Partial funding"),
        "eligibility": eligibility,
        "deadline": deadline.isoformat(),
        "deadlineText": f"Application deadline: {deadline:%d %B %Y} (published on {src_host})",
        "url": official,
        "source": "web-collector",
        "tags": ["fully-funded" if full_f else "partial-funding", "auto-collected"],
        "description": ov,
        "status": "open",
        "deadlineConfirmed": True,
        "details": {
            "overview": ov,
            "whoCanApply": secs.get("whoCanApply", [])[:7],
            "benefits": benefits[:7],
            "howToApply": how[:7],
            "documents": secs.get("documents", [])[:8],
            "selection": " ".join(secs.get("selection", [])[:3])[:600] or None,
            "ethiopiaTips": _tips(text, deadline, src_host),
            "applicationOpens": "Open now",
            "generatedBy": "heuristic",
        },
        "sources": list(dict.fromkeys([official, item.link])),
        "lastVerified": today.isoformat(),
        "lastChecked": today.isoformat(),
        "discoveredAt": today.isoformat(),
        "origin": "discovered",
        "_text": text[:8000],
    }


LLM_SYSTEM = (
    "You summarise scholarship calls for Ethiopian students. Use ONLY facts in the text; never invent amounts, "
    "dates or rules. Reply with JSON: {overview: string (3-5 sentences), whoCanApply: string[], benefits: string[], "
    "howToApply: string[] (ordered steps), documents: string[], selection: string, ethiopiaTips: string[] (practical, "
    "Ethiopia-specific), ethiopiansEligible: boolean, covers: string (one line)}."
)


def enrich_with_llm(cand: dict[str, Any], router: LLMRouter) -> None:
    text = cand.pop("_text", "")
    if router.active_provider == "mock" or not text:
        return
    try:
        res = router.complete(
            LLMRequest(system=LLM_SYSTEM, user=f"Title: {cand['title']}\nDeadline: {cand['deadline']}\n\n{text[:7000]}",
                       task="extract", json_mode=True)
        )
        if res.provider == "mock":
            return
        data = res.json()
    except Exception:  # noqa: BLE001
        return
    if data.get("ethiopiansEligible") is False:
        cand["_reject"] = True
        return
    d = cand["details"]
    for k in ("overview", "whoCanApply", "benefits", "howToApply", "documents", "selection", "ethiopiaTips"):
        v = data.get(k)
        if v and (isinstance(v, str) or (isinstance(v, list) and all(isinstance(x, str) for x in v))):
            d[k] = v
    if isinstance(data.get("covers"), str) and data["covers"]:
        cand["covers"] = data["covers"][:220]
    cand["description"] = d["overview"]
    d["generatedBy"] = res.provider


# --------------------------------------------------------------------------- #
# Verification of tracked programmes
# --------------------------------------------------------------------------- #
def verify_record(rec: dict[str, Any], pages: list[str | None], today: date) -> list[dict[str, str]]:
    changes: list[dict[str, str]] = []
    texts = [parse_html(p).text for p in pages if p]
    rec["lastChecked"] = today.isoformat()
    rec["checkStatus"] = "reachable" if texts else "unreachable"
    if not texts:
        return changes
    blob = "\n".join(texts)
    found = X.find_official_deadline(blob, today)
    cur = date.fromisoformat(rec["deadline"]) if rec.get("deadline") else None
    if found and cur == found and not rec.get("deadlineConfirmed"):
        rec["deadlineConfirmed"] = True
        rec["tags"] = [t for t in rec.get("tags", []) if t != "estimated-deadline"]
        changes.append({"id": rec["id"], "kind": "confirmed", "detail": f"deadline {found} confirmed on official page"})
    elif found and found != cur and (not rec.get("deadlineConfirmed") or cur is None or cur <= today):
        rec["deadline"] = found.isoformat()
        rec["deadlineConfirmed"] = True
        rec["deadlineText"] = f"Deadline {found:%d %B %Y} (read from the official page on {today:%d %b %Y})"
        rec["tags"] = [t for t in rec.get("tags", []) if t != "estimated-deadline"]
        changes.append({"id": rec["id"], "kind": "deadline_updated", "detail": f"{cur} → {found}"})
    if found or changes:
        rec["lastVerified"] = today.isoformat()
    if not found and X.looks_closed(blob) and (cur is None or cur <= today) and rec.get("status") != "closed":
        rec["status"] = "closed"
        changes.append({"id": rec["id"], "kind": "closed", "detail": "official page says applications are closed"})
    return changes


def expire(rec: dict[str, Any], today: date) -> dict[str, str] | None:
    if not rec.get("deadline") or rec.get("status") == "closed":
        return None
    d = date.fromisoformat(rec["deadline"])
    if d >= today:
        return None
    if rec.get("origin") == "discovered":
        rec["status"] = "closed"
        return {"id": rec["id"], "kind": "closed", "detail": f"deadline {d} passed"}
    nxt = d
    while nxt < today:
        try:
            nxt = nxt.replace(year=nxt.year + 1)
        except ValueError:  # 29 Feb
            nxt = (nxt + timedelta(days=365))
    rec["deadline"] = nxt.isoformat()
    rec["deadlineConfirmed"] = False
    rec["tags"] = list(dict.fromkeys([*rec.get("tags", []), "estimated-deadline"]))
    return {"id": rec["id"], "kind": "rolled", "detail": f"{d} passed → next cycle estimated {nxt}"}


def _update_from_post(match: dict[str, Any], it: FeedItem, page: str | None, today: date,
                      note: Callable[[dict[str, str]], None]) -> None:
    if match.get("origin") == "discovered":
        return
    text = strip_tags(it.summary) + "\n" + parse_html(it.content or page or "", article=True).text
    found = X.find_deadline(it.title + "\n" + text, today)
    stale = not match.get("deadlineConfirmed") or (match.get("deadline") or "") < today.isoformat()
    if not found or not stale or match.get("deadline") == found.isoformat():
        return
    old = match.get("deadline")
    match.update(deadline=found.isoformat(), deadlineConfirmed=True, status="open", lastVerified=today.isoformat(),
                 deadlineText=f"Application deadline: {found:%d %B %Y} (published on {host(it.link)})")
    match["tags"] = [t for t in match.get("tags", []) if t != "estimated-deadline"]
    match["sources"] = list(dict.fromkeys([*(match.get("sources") or []), it.link]))
    note({"id": match["id"], "kind": "deadline_updated", "detail": f"{old} → {found} via {host(it.link)}"})


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
def gather_items(
    pool: ThreadPoolExecutor,
    fetcher: Fetcher,
    feeds: list[str],
    res: CollectionResult,
    predicate: Callable[[str, list[str]], bool],
) -> list[FeedItem]:
    """Fetch feeds in parallel and return unique items accepted by ``predicate``."""
    seen: set[str] = set()
    items: list[FeedItem] = []
    for feed, xml in zip(feeds, pool.map(fetcher.get, feeds), strict=True):
        if not xml:
            res.errors.append(f"feed unreachable: {feed}")
            continue
        for it in parse_feed(xml, feed):
            if it.link and it.link not in seen and predicate(it.title, it.categories):
                seen.add(it.link)
                items.append(it)
    return items


def collect(
    records: list[dict[str, Any]],
    *,
    fetcher: Fetcher | None = None,
    router: LLMRouter | None = None,
    today: date | None = None,
    feeds: list[str] | None = None,
    verify: bool = True,
    discover: bool = True,
    max_articles: int = 60,
    max_new: int = 40,
    workers: int = 6,
    log: Callable[[str], None] | None = None,
) -> CollectionResult:
    today = today or date.today()
    own_fetcher = fetcher is None
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
            # 1) verify tracked programmes against their official pages
            if verify:
                targets = [r for r in recs if r.get("origin") != "discovered" and r.get("status") != "closed"]

                def pages_for(r: dict[str, Any]) -> list[str | None]:
                    urls = [u for u in [*(r.get("sources") or []), r.get("url", "")] if u.startswith("http")]
                    return [fetcher.get(u) for u in list(dict.fromkeys(urls))[:2]]

                for r, pages in zip(targets, pool.map(pages_for, targets), strict=True):
                    stats["checked"] += 1
                    for ch in verify_record(r, pages, today):
                        note(ch)
                    res.touched.add(r["id"])
                    stats["reachable"] += r.get("checkStatus") == "reachable"
                log(f"verified {stats['checked']} programmes ({stats['reachable']} reachable)")

            # 2) expire past deadlines
            for r in recs:
                if (ch := expire(r, today)):
                    note(ch)

            # 3) discover new opportunities from feeds
            if discover:
                items = gather_items(pool, fetcher, feeds or DEFAULT_FEEDS, res, X.is_study_opportunity)
                stats["feedItems"] = len(items)
                items = items[:max_articles]
                pages = list(pool.map(lambda it: None if len(it.content) > 1500 else fetcher.get(it.link), items))
                titles = [(r["title"], r) for r in recs]
                for it, page in zip(items, pages, strict=True):
                    # Known programme? Use the post as fresh deadline evidence instead of adding a duplicate.
                    clean = X.clean_title(it.title)
                    match = next((r for t, r in titles if X.similar(t, clean)), None)
                    if match:
                        # Only a near-identical title is evidence for that programme; "UGHE Mastercard Foundation
                        # Scholars" is a separate partner call, not the umbrella "Mastercard Foundation Scholars".
                        if len(X.tokens(clean) - X.tokens(match["title"])) <= 1:
                            _update_from_post(match, it, page, today, note)
                        continue
                    try:
                        cand = build_candidate(it, page, today)
                    except Exception as e:  # noqa: BLE001 — one bad article must not stop the run
                        res.errors.append(f"parse failed: {it.link}: {e}")
                        continue
                    if not cand:
                        continue
                    stats["candidates"] += 1
                    if len(res.discovered) >= max_new:
                        continue
                    base, n = cand["id"], 2
                    while cand["id"] in by_id:
                        cand["id"] = f"{base[:66]}-{n}"
                        n += 1
                    enrich_with_llm(cand, router)
                    cand.pop("_text", None)
                    if cand.pop("_reject", False):
                        continue
                    recs.append(cand)
                    by_id[cand["id"]] = cand
                    titles.append((cand["title"], cand))
                    res.discovered.append(cand["id"])
                    note({"id": cand["id"], "kind": "discovered", "detail": f"{cand['title']} — deadline {cand['deadline']}"})
                log(f"feeds: {stats['feedItems']} study items, {stats['candidates']} eligible, {len(res.discovered)} new")
    finally:
        if own_fetcher and isinstance(fetcher, HttpFetcher):
            fetcher.close()
    return res


def dumps(records: list[dict[str, Any]]) -> str:
    return json.dumps(records, ensure_ascii=False, indent=2) + "\n"
