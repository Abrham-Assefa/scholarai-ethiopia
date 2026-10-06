"""Hybrid scholarship matcher.

1. Hard filters: level sought, deadline not passed, nationality eligibility.
2. Similarity: TF-IDF cosine between profile text and scholarship text (pure Python).
3. Weighted feature scoring → probability 0–100 with ``why[]`` / ``missing[]`` explanations.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from datetime import date
from typing import Any

from pydantic import BaseModel, Field

LEVEL_ORDER = ["bachelor", "master", "phd", "postdoc"]
STOP = {"the", "a", "an", "and", "or", "in", "of", "to", "for", "with", "on", "at", "by", "is", "any", "students"}


class Profile(BaseModel):
    degreeLevelSought: str = "master"  # bachelor | master | phd | postdoc | short-course
    field: str = ""
    gpa: float | None = None
    gpaScale: float = 4.0
    nationality: str = "ET"
    englishTest: str | None = None  # IELTS | TOEFL | Duolingo | None
    englishScore: float | None = None
    workYears: float = 0
    interests: list[str] = Field(default_factory=list)
    preferredCountries: list[str] = Field(default_factory=list)
    leadership: bool = False
    financialNeed: bool = True
    age: int | None = None


# --------------------------------------------------------------------------- #
# TF-IDF
# --------------------------------------------------------------------------- #


def _tokens(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z][a-z0-9\-]+", text.lower()) if t not in STOP and len(t) > 2]


class TfidfIndex:
    def __init__(self, docs: list[str]) -> None:
        self.docs = [Counter(_tokens(d)) for d in docs]
        df: Counter[str] = Counter()
        for d in self.docs:
            df.update(d.keys())
        n = max(len(docs), 1)
        self.idf = {t: math.log((1 + n) / (1 + c)) + 1 for t, c in df.items()}
        self.vecs = [self._vec(d) for d in self.docs]

    def _vec(self, tf: Counter[str]) -> dict[str, float]:
        v = {t: c * self.idf.get(t, 1.0) for t, c in tf.items()}
        norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {t: x / norm for t, x in v.items()}

    def similarities(self, query: str) -> list[float]:
        q = self._vec(Counter(_tokens(query)))
        return [sum(w * dv.get(t, 0.0) for t, w in q.items()) for dv in self.vecs]


def scholarship_text(s: dict[str, Any]) -> str:
    return " ".join(
        [
            s.get("title", ""),
            s.get("provider", ""),
            s.get("country", ""),
            " ".join(s.get("countries", [])),
            " ".join(s.get("level", [])),
            " ".join(s.get("fields", [])),
            s.get("covers", ""),
            s.get("description", ""),
            " ".join(s.get("tags", [])),
        ]
    )


def profile_text(p: Profile) -> str:
    return " ".join(
        [
            p.degreeLevelSought,
            p.field,
            *p.interests,
            *p.preferredCountries,
            "leadership" if p.leadership else "",
            f"{p.workYears} years experience" if p.workYears else "",
        ]
    )


# --------------------------------------------------------------------------- #
# Scoring
# --------------------------------------------------------------------------- #


def _hard_filter(p: Profile, s: dict[str, Any], today: date) -> str | None:
    levels = s.get("level") or []
    if p.degreeLevelSought not in levels:
        return f"Does not offer {p.degreeLevelSought} level"
    dl = s.get("deadline")
    if dl and date.fromisoformat(dl) < today:
        return "Deadline has passed"
    elig = s.get("eligibility") or {}
    nats = elig.get("nationalities") or ["any"]
    if "any" not in nats and p.nationality not in nats and not elig.get("ethiopiansEligible", True):
        return "Nationality not eligible"
    return None


def match_one(
    p: Profile, s: dict[str, Any], *, similarity: float = 0.0, today: date | None = None
) -> dict[str, Any] | None:
    today = today or date.today()
    reason = _hard_filter(p, s, today)
    if reason:
        return None
    elig = s.get("eligibility") or {}
    why: list[str] = []
    missing: list[str] = []
    score = 0.0

    # Level (20)
    score += 20
    why.append(f"Offers {p.degreeLevelSought} level ✓")

    # GPA (20)
    min_gpa = float(elig.get("minGpa") or 0)
    if p.gpa is not None:
        g4 = p.gpa * 4.0 / p.gpaScale
        if g4 >= min_gpa:
            score += 20 if g4 >= min_gpa + 0.3 else 15
            why.append(f"GPA {p.gpa:.2f} meets the ~{min_gpa:.2f} threshold ✓")
        else:
            score += 5
            missing.append(f"GPA {p.gpa:.2f} is below the typical {min_gpa:.2f} threshold")
    else:
        score += 8
        missing.append("Add your GPA to improve match accuracy")

    # Field (20)
    fields = [f.lower() for f in s.get("fields") or ["any"]]
    ftoks = set(_tokens(p.field + " " + " ".join(p.interests)))
    if "any" in fields:
        score += 14
        why.append("Open to all fields ✓")
    elif ftoks and any(ftoks & set(_tokens(f)) for f in fields):
        score += 20
        why.append(f"Field match: {p.field} ✓")
    else:
        score += 4
        missing.append(f"Programme focuses on {', '.join(fields[:3])}")

    # Work experience (10)
    need = int(elig.get("workYearsMin") or 0)
    if need:
        if p.workYears >= need:
            score += 10
            why.append(f"{p.workYears:g}+ years work experience ✓")
        else:
            missing.append(f"Requires ~{need} years work experience (you have {p.workYears:g})")
    else:
        score += 8

    # English (10)
    if elig.get("englishTest") in ("recommended", "required"):
        if p.englishTest:
            score += 10
            why.append(f"English test on file ({p.englishTest}) ✓")
        else:
            score += 3
            missing.append("English test (IELTS/TOEFL) — register at British Council or IDP Addis Ababa")
    else:
        score += 8

    # Country preference (5)
    if p.preferredCountries:
        cs = {c.lower() for c in s.get("countries") or [s.get("country", "")]}
        if any(pc.lower() in cs for pc in p.preferredCountries) or "multiple" in cs or "any" in " ".join(cs):
            score += 5
            why.append("In a preferred country ✓")
    else:
        score += 3

    # Similarity (15)
    score += 15 * min(1.0, similarity * 2.5)

    probability = int(round(max(5, min(97, score))))
    dl = s.get("deadline")
    days_left = (date.fromisoformat(dl) - today).days if dl else None
    return {
        "scholarshipId": s["id"],
        "title": s["title"],
        "country": s.get("country"),
        "deadline": dl,
        "daysLeft": days_left,
        "probability": probability,
        "why": why[:5],
        "missing": missing[:4],
        "effortHours": 10 + 5 * len(missing) + (10 if s.get("fundingType") == "full" else 5),
    }


def match_all(
    p: Profile, scholarships: list[dict[str, Any]], *, today: date | None = None, top_k: int = 20
) -> list[dict[str, Any]]:
    today = today or date.today()
    index = TfidfIndex([scholarship_text(s) for s in scholarships])
    sims = index.similarities(profile_text(p))
    out = []
    for s, sim in zip(scholarships, sims, strict=True):
        m = match_one(p, s, similarity=sim, today=today)
        if m:
            m["similarity"] = round(sim, 3)
            out.append(m)
    out.sort(key=lambda m: (-m["probability"], m["daysLeft"] if m["daysLeft"] is not None else 10**6))
    return out[:top_k]
