"""Heuristic extractors used offline (and as a safety net under the LLM)."""

from __future__ import annotations

import re
from datetime import date

from .html import Doc

MONTHS = {
    m: i + 1
    for i, names in enumerate(
        [
            ("january", "jan"), ("february", "feb"), ("march", "mar"), ("april", "apr"), ("may",),
            ("june", "jun"), ("july", "jul"), ("august", "aug"), ("september", "sep", "sept"),
            ("october", "oct"), ("november", "nov"), ("december", "dec"),
        ]
    )
    for m in names
}
_MON = r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
DATE_PATTERNS = [
    re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+(?:of\s+)?{_MON}\.?,?\s+(20\d\d)\b", re.I),  # 25 October 2026
    re.compile(rf"\b{_MON}\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(20\d\d)\b", re.I),  # October 25, 2026
    re.compile(r"\b(20\d\d)-(\d{2})-(\d{2})\b"),  # 2026-10-25
]
DEADLINE_CUES = re.compile(
    r"deadline|closing date|closes on|close on|apply by|applications? (?:close|due|must be (?:submitted|received))|"
    r"submission date|last date|due date|until",
    re.I,
)
CLOSED_CUES = re.compile(
    r"applications? (?:are|is) (?:now )?closed|call (?:is|has) (?:now )?closed|no longer accepting|"
    r"application (?:period|window) (?:has )?(?:ended|closed)|currently closed",
    re.I,
)


def _mk(y: int, m: int, d: int) -> date | None:
    try:
        return date(y, m, d)
    except ValueError:
        return None


def find_dates(text: str) -> list[tuple[int, date]]:
    out: list[tuple[int, date]] = []
    for i, pat in enumerate(DATE_PATTERNS):
        for m in pat.finditer(text):
            g = m.groups()
            if i == 0:
                d = _mk(int(g[2]), MONTHS[g[1].lower()], int(g[0]))
            elif i == 1:
                d = _mk(int(g[2]), MONTHS[g[0].lower()], int(g[1]))
            else:
                d = _mk(int(g[0]), int(g[1]), int(g[2]))
            if d:
                out.append((m.start(), d))
    return sorted(out, key=lambda x: x[0])


def find_deadline(text: str, today: date, horizon_days: int = 550) -> date | None:
    """Earliest plausible *future* date that appears right after a deadline cue."""
    found: list[date] = []
    for cue in DEADLINE_CUES.finditer(text):
        window = text[cue.start() : cue.end() + 140]
        for _, d in find_dates(window):
            if today < d <= date.fromordinal(today.toordinal() + horizon_days):
                found.append(d)
                break
    return min(found) if found else None


SECONDARY = re.compile(r"offer|degree program|programme application|program application|result|interview|notif|"
                       r"nominat|decision|enrol|registration|visa|arrival|start|begin|commence|webinar|info session", re.I)


def find_official_deadline(text: str, today: date, horizon_days: int = 550) -> date | None:
    """Strict variant for official pages: one unambiguous application deadline or nothing.

    Official pages list many dates (offer deadlines, other programmes, results); a wrong
    update is worse than none, so we only accept a single distinct date whose context
    is clearly about submitting the application.
    """
    found: set[date] = set()
    for cue in re.finditer(r"application deadline|deadline for applications?|applications? (?:close|must be submitted|"
                           r"are due|deadline)|apply by|closing date", text, re.I):
        lo, hi = max(0, cue.start() - 60), cue.end() + 90
        before = text[lo : cue.start()]
        cut = max(before.rfind(". "), before.rfind("\n"))
        lo = lo + cut + 1 if cut >= 0 else lo
        after = text[cue.end() : hi]
        stop = min([i for i in (after.find(". "), after.find("\n")) if i >= 0], default=len(after))
        window = text[lo : cue.end() + stop]
        if SECONDARY.search(window):
            continue
        for _, d in find_dates(window):
            if today < d <= date.fromordinal(today.toordinal() + horizon_days):
                found.add(d)
    return found.pop() if len(found) == 1 else None


def looks_closed(text: str) -> bool:
    return bool(CLOSED_CUES.search(text))


# --------------------------------------------------------------------------- #
# Ethiopia eligibility
# --------------------------------------------------------------------------- #
_AFR = r"(?<!south )(?<!west )(?<!north )(?<!southern )"
POSITIVE = [
    re.compile(r"\bethiopia", re.I),
    re.compile(_AFR + r"\bafrican?\s+(?:countr|citizen|national|applicant|student|youth|professional|scholar|women|leader|researcher)", re.I),
    re.compile(_AFR + r"\b(?:across|in|from|throughout) africa\b", re.I),
    re.compile(r"sub-saharan|east(?:ern)? africa|developing countr|low[- ]and[- ]middle[- ]income|\blmics?\b|global south", re.I),
    re.compile(r"all (?:countries|nationalities)|any (?:country|nationality)|international (?:students|applicants|candidates)|"
               r"overseas (?:students|applicants)|worldwide|open to all", re.I),
]
NEGATIVE = re.compile(
    r"west africa|ecowas|\bsadc\b|francophone|south african (?:citizens?|nationals?|residents?)|"
    r"(?:nigerian|kenyan|ghanaian|ugandan|zimbabwean|egyptian|moroccan) (?:citizens?|nationals?|students?) only|"
    r"home (?:students|applicants) only|uk (?:students|applicants|residents) only|eu/eea|"
    r"(?:us|u\.s\.|american|canadian|australian) citizens|permanent residents? of|newcomer|indigenous",
    re.I,
)


RESIDENCY = re.compile(
    r"(?:must|should) (?:currently )?(?:be|have been) (?:affiliated|based|enrolled|registered|resident|residing|living|"
    r"employed)\b[^.;]{0,140}",
    re.I,
)


def ethiopians_eligible(title: str, text: str) -> bool:
    if re.search(r"\bethiopia", title + " " + text, re.I) and not re.search(r"except(?:ing)? ethiopia", text, re.I):
        return True
    # Ethiopia is not a Commonwealth member — Commonwealth-only calls are excluded unless they name Ethiopia.
    if re.search(r"commonwealth", title, re.I) or re.search(r"commonwealth (?:countr|citizen|nation)", text, re.I):
        return False
    if NEGATIVE.search(title):
        return False
    # "You must be based at a university in Sweden…" — residency/affiliation rules that exclude applicants in Ethiopia.
    for m in RESIDENCY.finditer(text):
        if not re.search(r"africa|ethiopia|any |anywhere|developing|home country", m.group(0), re.I):
            return False
    pos = any(p.search(title + "\n" + text) for p in POSITIVE)
    if NEGATIVE.search(text) and not any(p.search(text) for p in POSITIVE[3:]):
        return False
    return pos


# --------------------------------------------------------------------------- #
# Classification
# --------------------------------------------------------------------------- #
STUDY_WORDS = re.compile(r"scholarship|studentship|bursary|fully[- ]funded|tuition|\bphd\b|master'?s|\bmsc\b|\bmba\b|degree", re.I)
NOT_STUDY = re.compile(
    r"internship|\bjobs?\b|vacanc|hiring|competition|contest|hackathon|prize|challenge|accelerator|"
    r"incubat|startup|entrepreneur|talent investor|venture|grant for (?:businesses|startups)|conference|summit|"
    r"webinar|volunteer|teaching programme|exchange and teaching|youth action|bootcamp",
    re.I,
)

LEVEL_PATTERNS = {
    "bachelor": re.compile(r"undergraduate|bachelor'?s?|\bb\.?sc\b|first degree", re.I),
    "master": re.compile(r"master'?s?|\bm\.?sc\b|\bmba\b|\bllm\b|\bmph\b|\bma\b|postgraduate|graduate (?:school|programme|program)", re.I),
    "phd": re.compile(r"\bph\.?d\b|doctoral|doctorate", re.I),
    "postdoc": re.compile(r"post-?doc|post-?doctoral", re.I),
}
LEVEL_IN_TEXT = re.compile(
    r"(undergraduate|bachelor'?s?|master'?s?|ph\.?d|doctoral|postdoctoral)\s+(?:degree\s+)?"
    r"(?:programmes?|programs?|studies|scholarships?|studentships?|courses?|students|candidates|positions?|fellowships?)",
    re.I,
)


def is_study_opportunity(title: str, categories: list[str]) -> bool:
    blob = title + " " + " ".join(categories)
    if NOT_STUDY.search(title) and not re.search(r"scholarship|studentship", title, re.I):
        return False
    if NOT_STUDY.search(title):
        return False
    if re.search(r"fellowship", title, re.I) and not re.search(
        r"scholarship|studentship|\bph\.?d|master|degree|post-?doc|doctoral|research|study|studies", title, re.I
    ):
        return False
    return bool(STUDY_WORDS.search(blob) or re.search(r"fellowship", title, re.I))


def levels(title: str, text: str) -> list[str]:
    found = [lvl for lvl, p in LEVEL_PATTERNS.items() if p.search(title)]
    if found:
        if "postdoc" in found and "phd" in found:
            found.remove("phd")
        return found
    hits = {_norm_level(m.group(1)) for m in LEVEL_IN_TEXT.finditer(text[:6000])}
    return [lvl for lvl in LEVEL_PATTERNS if lvl in hits]


def _norm_level(s: str) -> str:
    s = s.lower()
    if s.startswith(("under", "bach")):
        return "bachelor"
    if s.startswith("mast"):
        return "master"
    if s.startswith("post"):
        return "postdoc"
    return "phd"


COUNTRIES = {
    "Germany": ["germany", "german"], "UK": ["united kingdom", r"\buk\b", "england", "scotland", "wales", "british"],
    "USA": ["united states", r"\busa\b", r"\bu\.s\.", "america"], "Canada": ["canada"], "Australia": ["australia"],
    "Netherlands": ["netherlands", "dutch", "holland"], "Sweden": ["sweden", "swedish"], "Norway": ["norway"],
    "Denmark": ["denmark"], "Finland": ["finland"], "Belgium": ["belgium"], "France": ["france", "french government"],
    "Italy": ["italy", "italian"], "Spain": ["spain"], "Switzerland": ["switzerland", "swiss"], "Austria": ["austria"],
    "Ireland": ["ireland", "irish"], "Hungary": ["hungary", "hungarian"], "Czech Republic": ["czech"],
    "Poland": ["poland"], "Romania": ["romania"], "Russia": ["russia"], "Turkey": ["turkey", "türkiye", "turkiye"],
    "China": ["china", "chinese"], "Japan": ["japan"], "South Korea": ["korea"], "Taiwan": ["taiwan"],
    "India": ["india"], "Thailand": ["thailand"], "Malaysia": ["malaysia"], "Singapore": ["singapore"],
    "New Zealand": ["new zealand"], "Israel": ["israel"], "Saudi Arabia": ["saudi"], "Qatar": ["qatar"],
    "UAE": ["united arab emirates", r"\buae\b", "dubai", "abu dhabi"], "Morocco": ["morocco"], "Egypt": ["egypt"],
    "Rwanda": ["rwanda"], "Kenya": ["kenya"], "Ghana": ["ghana"], "South Africa": ["south africa"],
    "Uganda": ["uganda"], "Tanzania": ["tanzania"], "Nigeria": ["nigeria"], "Ethiopia": ["ethiopia"],
}
_COUNTRY_RE = {c: re.compile("|".join(a), re.I) for c, a in COUNTRIES.items()}


TLD_COUNTRY = {
    ".uk": "UK", ".de": "Germany", ".fr": "France", ".nl": "Netherlands", ".se": "Sweden", ".no": "Norway",
    ".dk": "Denmark", ".fi": "Finland", ".be": "Belgium", ".ch": "Switzerland", ".at": "Austria", ".it": "Italy",
    ".es": "Spain", ".ie": "Ireland", ".hu": "Hungary", ".cz": "Czech Republic", ".pl": "Poland", ".jp": "Japan",
    ".kr": "South Korea", ".cn": "China", ".tw": "Taiwan", ".sa": "Saudi Arabia", ".qa": "Qatar", ".ae": "UAE",
    ".ca": "Canada", ".au": "Australia", ".nz": "New Zealand", ".za": "South Africa", ".rw": "Rwanda", ".ke": "Kenya",
    ".gh": "Ghana", ".ug": "Uganda", ".tz": "Tanzania", ".in": "India", ".tr": "Turkey", ".ru": "Russia", ".edu": "USA",
}
UNIVERSITY_HINTS = {"UK": r"durham|oxford|cambridge|edinburgh|imperial college|ucl\b|king's college|manchester|"
                          r"warwick|bristol|glasgow|leeds|sheffield|nottingham|birmingham|sussex|lse\b",
                    "USA": r"harvard|stanford|yale|\bmit\b|princeton|columbia university|berkeley|cornell",
                    "Saudi Arabia": r"kaust|king abdullah university", "Switzerland": r"eth zurich|epfl|geneva"}


def host_country(title: str, text: str, url: str = "") -> str:
    for c, rx in UNIVERSITY_HINTS.items():
        if re.search(rx, title, re.I):
            return c
    c = _host_country(title, text)
    if c == "Multiple" and url:
        netloc = re.sub(r"^https?://([^/]+).*$", r"\1", url.lower())
        for tld, country in TLD_COUNTRY.items():
            if netloc.endswith(tld) or netloc.endswith(tld.replace(".", ".ac.")):
                return country
    return c


def _host_country(title: str, text: str) -> str:
    for c, rx in _COUNTRY_RE.items():
        if c != "Ethiopia" and rx.search(title):
            return c
    m = re.search(r"\b(?:study|studies|university|universities|institutions?|hosted|based)\s+in\s+([A-Z][\w ]{2,30})", text)
    if m:
        for c, rx in _COUNTRY_RE.items():
            if c != "Ethiopia" and rx.search(m.group(1)):
                return c
    return "Multiple"


FIELDS = {
    "health": r"health|medic|nursing|pharma|clinical",
    "engineering": r"engineer",
    "computer science": r"computer|\bict\b|data science|artificial intelligence|software|\bai\b",
    "agriculture": r"agricultur|food security|crop|livestock",
    "business": r"business|\bmba\b|management|finance|entrepreneur",
    "economics": r"economic",
    "law": r"\blaw\b|legal|human rights",
    "education": r"education|teaching",
    "environment": r"environment|climate|sustainab|energy|water",
    "public policy": r"public policy|governance|development studies",
    "social sciences": r"social science|humanities|sociology|international relations",
}


def fields(title: str, text: str) -> list[str]:
    hits = [f for f, rx in FIELDS.items() if re.search(rx, title, re.I)]
    if not hits:
        hits = [f for f, rx in FIELDS.items() if len(re.findall(rx, text[:5000], re.I)) >= 3]
    return hits[:4] or ["any"]


def full_funding(title: str, text: str) -> bool:
    return bool(re.search(r"fully[- ]funded|full scholarship|full tuition|full funding|all expenses|"
                          r"covers? (?:all|full)|full(?:y)? (?:covered|paid)", title + " " + text[:6000], re.I))


def age_limit(text: str) -> int | None:
    m = re.search(r"(?:aged?|be|under|not (?:be )?older than|maximum age(?: of)?)\s*(\d{2})\s*(?:years?)?\s*"
                  r"(?:or (?:under|younger|below)|and (?:under|below)|years? (?:old|of age))", text, re.I)
    if not m:
        m = re.search(r"(?:under|below) (?:the age of )?(\d{2})\b", text, re.I)
    if m and 18 <= int(m.group(1)) <= 60:
        return int(m.group(1))
    return None


def work_years(text: str) -> int:
    m = re.search(r"(?:at least|minimum(?: of)?|a minimum of)?\s*(\d{1,2})\+?\s*years?\s+of\s+"
                  r"(?:relevant\s+|professional\s+|work\s+|full-time\s+)*(?:work\s+)?experience", text, re.I)
    return int(m.group(1)) if m and int(m.group(1)) <= 15 else 0


def english_test(text: str) -> str | None:
    if not re.search(r"ielts|toefl|english (?:language )?proficiency|duolingo", text, re.I):
        return None
    return "required" if re.search(r"(?:must|required|requirement).{0,60}(?:ielts|toefl|english)|"
                                   r"(?:ielts|toefl).{0,40}(?:required|minimum)", text, re.I | re.S) else "recommended"


# --------------------------------------------------------------------------- #
# Sections → details
# --------------------------------------------------------------------------- #
SECTION_RULES = [
    ("documents", re.compile(r"document|what (?:you|to) (?:need|submit)|required materials|supporting", re.I)),
    ("whoCanApply", re.compile(r"eligib|who can apply|criteria|requirements|who (?:should|is eligible)|qualif", re.I)),
    ("benefits", re.compile(r"benefit|funding|what .*(?:get|cover|offer)|package|value|stipend|award|coverage|"
                            r"financial|program(?:me)? details|perks", re.I)),
    ("howToApply", re.compile(r"how to apply|application (?:process|procedure|instructions|steps)|to apply|apply", re.I)),
    ("selection", re.compile(r"selection|evaluation|assessment|shortlist|interview", re.I)),
]


def _is_heading(b) -> bool:
    if b.kind == "h":
        return len(b.text) < 120
    return b.kind == "p" and len(b.text) < 70 and (b.text.endswith(":") or not re.search(r"[.!?]$", b.text))


def sections(doc: Doc) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    current: str | None = None
    for b in doc.blocks:
        if _is_heading(b) and b.kind != "li":
            current = next((k for k, rx in SECTION_RULES if rx.search(b.text)), None)
            continue
        if current and b.kind in ("li", "p") and 3 <= len(b.text) < 400:
            items = out.setdefault(current, [])
            if b.text not in items and len(items) < 8:
                items.append(b.text.rstrip(";"))
    return out


def overview(doc: Doc, limit: int = 700) -> str:
    paras = [
        b.text for b in doc.blocks
        if b.kind == "p" and len(b.text) > 80 and not DEADLINE_CUES.match(b.text) and "the post " not in b.text.lower()
    ]
    out = ""
    for p in paras[:4]:
        if len(out) + len(p) > limit:
            sentences = re.split(r"(?<=[.!?])\s+", p)
            for s in sentences:
                if len(out) + len(s) > limit:
                    break
                out += s + " "
            break
        out += p + " "
    return out.strip()


def clean_title(raw: str) -> str:
    t = re.sub(r"\s*\([^)]*funded[^)]*\)", "", raw, flags=re.I)
    t = t.split(":")[0] if ":" in t and len(t.split(":")[0].strip()) > 10 else t
    t = re.sub(r"\b20\d\d(?:/20?\d\d)?\b|\b20\d\d[-–]\d{2,4}\b", "", t)
    t = re.sub(r"^\s*(?:the|apply (?:now )?for(?: the)?|call for applications:?)\s+", "", t, flags=re.I)
    t = re.sub(r"\s+(?:is )?(?:now )?open\b.*$", "", t, flags=re.I)
    t = re.sub(r"\s{2,}", " ", t).strip(" -–—.,|")
    return t[:1].upper() + t[1:] if t else raw.strip()


def slugify(s: str, n: int = 70) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:n].rstrip("-")


STOP = {"the", "of", "for", "and", "in", "at", "to", "a", "an", "program", "programme", "scholarship", "scholarships",
        "university", "fully", "funded", "students", "international", "african", "africans", "applicants"}


def tokens(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", s.lower()) if w not in STOP and not re.fullmatch(r"20\d\d|\d", w)}


def similar(a: str, b: str, threshold: float = 0.6) -> bool:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return False
    j = len(ta & tb) / len(ta | tb)
    return j >= threshold or (len(ta) >= 2 and ta <= tb) or (len(tb) >= 2 and tb <= ta)
