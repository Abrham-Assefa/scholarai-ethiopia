"""Parse docs/OPPORTUNITIES.md into normalized seed JSON.

Usage: python data/seed/build_seed.py
Writes data/seed/scholarships.json and data/seed/conferences.json.
"""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "OPPORTUNITIES.md"
OUT = Path(__file__).resolve().parent

# Cycle anchor: deadlines are resolved to the next occurrence after this date.
ANCHOR = date(2026, 10, 6)

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7,
    "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}
MONTH_END = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}

LEVEL_MAP = {
    "ug": "bachelor", "msc": "master", "phd": "phd", "dphil": "phd", "postdoc": "postdoc",
    "research": "phd", "professional": "master", "short courses": "short-course",
    "non-degree tech": "short-course",
}

FIELD_HINTS = [
    (r"public policy|governance", ["public policy", "governance", "political science"]),
    (r"math", ["mathematics", "statistics", "data science"]),
    (r"development", ["development studies", "economics", "public health"]),
    (r"global affairs", ["international relations", "public policy"]),
    (r"peace", ["peace studies", "international relations", "conflict resolution"]),
    (r"tech fellowship|alx|andela|altschool", ["computer science", "software engineering"]),
    (r"knight-hennessy|rhodes|schwarzman|fulbright|chevening", ["any", "leadership"]),
]


def strip_md(s: str) -> str:
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = s.replace("✅", "").replace("→", "->")
    return re.sub(r"\s+", " ", s).strip()


def slugify(s: str) -> str:
    s = s.lower().translate(str.maketrans("üıöçşğé", "uiocsge"))
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60]


def parse_tables(md: str) -> dict[str, list[list[str]]]:
    """Return tables keyed by the nearest preceding heading."""
    tables: dict[str, list[list[str]]] = {}
    heading = ""
    rows: list[list[str]] = []
    for line in md.splitlines():
        if line.startswith("#"):
            if rows:
                tables[heading] = rows
                rows = []
            heading = line.strip("# ").strip()
        elif line.startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(re.fullmatch(r":?-+:?", c) for c in cells):
                continue
            rows.append(cells)
        elif rows:
            tables[heading] = rows
            rows = []
    if rows:
        tables[heading] = rows
    return tables


def parse_levels(text: str) -> list[str]:
    out: list[str] = []
    for token in re.split(r"[,/]| and ", text.lower()):
        token = re.sub(r"\(.*?\)", "", token).strip()
        for key, val in LEVEL_MAP.items():
            if key in token and val not in out:
                out.append(val)
    if not out:
        out.append("master")
    return out


def resolve_deadline(text: str) -> tuple[str | None, str]:
    """Infer a concrete ISO deadline from free text like 'Dec – Mar' or 'Jan 15'."""
    raw = strip_md(text)
    low = raw.lower()
    if "rolling" in low or "varies" in low and "(" not in low:
        return None, raw
    # Prefer the "closes"/"due" part if present
    seg = low
    m = re.search(r"(closes?|due)\s*([^·,;]+)", low)
    if m:
        seg = m.group(2)
    elif "(" in low and re.search(r"\(([^)]*)\)", low):
        inner = re.search(r"\(([^)]*)\)", low).group(1)  # type: ignore[union-attr]
        if re.search(r"[a-z]{3}", inner) and any(mo in inner for mo in MONTHS):
            seg = inner
    # Day-first forms: "3–6 Nov 2026", "31 Oct – 4 Nov 2026", "11–14 Jan 2027"
    dm = re.search(r"(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s+([a-z]{3,9})\s+(\d{4})", seg)
    if dm:
        month = MONTHS.get(dm.group(2)[:4] if dm.group(2).startswith("sept") else dm.group(2)[:3])
        if month:
            return date(int(dm.group(3)), month, int(dm.group(1))).isoformat(), raw
    tokens = re.findall(r"([a-z]{3,9})\.?\s*(\d{1,2})?", seg)
    cands: list[tuple[int, int | None]] = []
    for name, day in tokens:
        key = name[:4] if name.startswith("sept") else name[:3]
        if key in MONTHS:
            cands.append((MONTHS[key], int(day) if day else None))
    if not cands:
        return None, raw
    def to_date(month: int, day: int | None) -> date:
        if day is None:
            day = 5 if "early" in seg else (15 if "~" in raw or "mid" in seg else MONTH_END[month])
        year = ANCHOR.year if (month, day) >= (ANCHOR.month, ANCHOR.day) else ANCHOR.year + 1
        return date(year, month, min(day, MONTH_END[month]))

    # Range "X – Y": the closing month is the last token. Comma-separated
    # alternatives ("Oct (spring), May (fall)"): earliest upcoming option.
    if "," in seg and not re.search(r"[–-]", seg):
        return min(to_date(m, d) for m, d in cands).isoformat(), raw
    month, day = cands[-1]
    return to_date(month, day).isoformat(), raw


def infer_fields(title: str) -> list[str]:
    low = title.lower()
    for pat, fields in FIELD_HINTS:
        if re.search(pat, low):
            return fields
    return ["any"]


def build_scholarships(tables: dict[str, list[list[str]]]) -> list[dict]:
    out: list[dict] = []
    for heading, rows in tables.items():
        if not heading.startswith("🎓"):
            continue
        header, body = rows[0], rows[1:]
        assert header[1].startswith("Scholarship"), header
        for r in body:
            num, title, country, level, covers, deadline, link = r[:7]
            title_c = strip_md(title)
            iso, raw = resolve_deadline(deadline)
            countries = [c.strip() for c in re.split(r",|/", re.sub(r"\(.*?\)", "", strip_md(country))) if c.strip()]
            out.append(
                {
                    "id": slugify(title_c),
                    "title": title_c,
                    "provider": title_c.split("(")[0].strip(),
                    "country": countries[0] if countries else "Multiple",
                    "countries": countries or ["Multiple"],
                    "level": parse_levels(level),
                    "fields": infer_fields(title_c),
                    "fundingType": "full" if re.search(r"full|tuition", covers, re.I) else "partial",
                    "covers": strip_md(covers),
                    "eligibility": {
                        "nationalities": ["ET", "any"],
                        "ethiopiansEligible": "✅" in title,
                        "minGpa": 3.0 if "phd" in parse_levels(level) or "master" in parse_levels(level) else 2.75,
                        "englishTest": "recommended",
                        "workYearsMin": 2 if re.search(r"chevening|daad|australia|fulbright|jj/wb|commonwealth", title_c, re.I) else 0,
                    },
                    "deadline": iso,
                    "deadlineText": raw,
                    "url": strip_md(link),
                    "source": "docs/OPPORTUNITIES.md",
                    "tags": ["fully-funded"] if "full" in covers.lower() or "tuition" in covers.lower() else [],
                    "description": f"{title_c} — {strip_md(covers)}. Open to Ethiopian students; "
                    f"levels: {', '.join(parse_levels(level))}. Study in {strip_md(country)}.",
                    "status": "open",
                }
            )
    # Ethiopia-specific table
    for heading, rows in tables.items():
        if not heading.startswith("🇪🇹"):
            continue
        for r in rows[1:]:
            title, notes, link = r[:3]
            title_c = strip_md(title)
            out.append(
                {
                    "id": slugify(title_c),
                    "title": title_c,
                    "provider": title_c.split("–")[0].split("@")[0].strip(),
                    "country": "Ethiopia" if "Ethiopia" in title_c or "Addis" in title_c else ("Ghana" if "Ghana" in title_c else "Rwanda" if "Rwanda" in title_c else "Multiple"),
                    "countries": ["Ethiopia"],
                    "level": parse_levels(notes),
                    "fields": ["any"],
                    "fundingType": "full",
                    "covers": strip_md(notes),
                    "eligibility": {"nationalities": ["ET"], "ethiopiansEligible": True, "minGpa": 2.5, "englishTest": "none", "workYearsMin": 0},
                    "deadline": None,
                    "deadlineText": "Varies / announced by provider",
                    "url": strip_md(link),
                    "source": "docs/OPPORTUNITIES.md",
                    "tags": ["ethiopia", "local"],
                    "description": f"{title_c} — {strip_md(notes)}.",
                    "status": "open",
                }
            )
    return out


def parse_age(text: str) -> dict:
    m = re.search(r"(\d{2})\s*[–-]\s*(\d{2})", text)
    if m:
        return {"min": int(m.group(1)), "max": int(m.group(2))}
    m = re.search(r"(\d{2})\+", text)
    if m:
        return {"min": int(m.group(1)), "max": None}
    return {"min": None, "max": None}


def build_conferences(tables: dict[str, list[list[str]]]) -> list[dict]:
    out: list[dict] = []
    for heading, rows in tables.items():
        if "Conferences" not in heading:
            continue
        for r in rows[1:]:
            num, title, where, when, funding, who, link = r[:7]
            title_c = strip_md(title)
            iso, raw = resolve_deadline(when)
            out.append(
                {
                    "id": slugify(title_c),
                    "title": title_c,
                    "location": strip_md(where),
                    "when": strip_md(when),
                    "startDate": iso,
                    "funding": strip_md(funding),
                    "fundingType": "full" if "full" in funding.lower() else "partial",
                    "audience": strip_md(who),
                    "age": parse_age(who),
                    "url": strip_md(link),
                    "ethiopiansEligible": "✅" in title,
                    "description": f"{title_c} in {strip_md(where)} ({strip_md(when)}). Funding: {strip_md(funding)}. For: {strip_md(who)}.",
                }
            )
    return out


def main() -> None:
    tables = parse_tables(SRC.read_text(encoding="utf-8"))
    schol = build_scholarships(tables)
    conf = build_conferences(tables)
    (OUT / "scholarships.json").write_text(json.dumps(schol, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "conferences.json").write_text(json.dumps(conf, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {len(schol)} scholarships, {len(conf)} conferences")


if __name__ == "__main__":
    main()
