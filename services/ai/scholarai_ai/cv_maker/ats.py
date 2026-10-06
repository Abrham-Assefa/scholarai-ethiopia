"""ATS / rubric scorer: deterministic 0–100 score with actionable suggestions."""

from __future__ import annotations

import re

from .schema import CVSchema

ACTION_VERBS = {
    "led",
    "built",
    "designed",
    "organized",
    "delivered",
    "analyzed",
    "coordinated",
    "mentored",
    "developed",
    "launched",
    "managed",
    "created",
    "implemented",
    "improved",
    "increased",
    "reduced",
    "taught",
    "tutored",
    "founded",
    "researched",
    "published",
    "presented",
    "trained",
    "volunteered",
    "achieved",
    "won",
}

DEFAULT_KEYWORDS = ["leadership", "research", "community", "impact", "project", "team", "analysis", "volunteer"]


def _bullets(cv: CVSchema) -> list[str]:
    return [b for e in cv.experience for b in e.bullets]


def ats_score(cv: CVSchema, keywords: list[str] | None = None) -> dict:
    score = 0
    suggestions: list[str] = []
    breakdown: dict[str, int] = {}

    # Contact (10)
    contact = sum(bool(getattr(cv.personal, k)) for k in ("fullName", "email", "phone", "city"))
    pts = min(10, contact * 3 if contact < 4 else 10)
    breakdown["contact"] = pts
    score += pts
    if contact < 4:
        suggestions.append("Add complete contact details (name, email, phone, city).")

    # Summary (10)
    words = len(cv.summary.split())
    pts = 10 if 25 <= words <= 80 else (5 if words else 0)
    breakdown["summary"] = pts
    score += pts
    if words == 0:
        suggestions.append("Write a 2–3 sentence profile summary stating your goal and strengths.")
    elif words < 25 or words > 80:
        suggestions.append("Keep the summary between 25 and 80 words.")

    # Education (15)
    pts = 0
    if cv.education:
        pts = 10
        if any(e.gpa for e in cv.education):
            pts += 5
        else:
            suggestions.append("Add your GPA (with scale) — most scholarships screen on it.")
    else:
        suggestions.append("Add at least one education entry.")
    breakdown["education"] = pts
    score += pts

    # Experience bullets (30): count, action verbs, quantification
    bullets = _bullets(cv)
    pts = 0
    if bullets:
        pts += min(10, len(bullets) * 2)
        verb_hits = sum(1 for b in bullets if b.split(" ", 1)[0].lower().rstrip(",.") in ACTION_VERBS)
        pts += round(10 * verb_hits / len(bullets))
        quant = sum(1 for b in bullets if re.search(r"\d", b))
        pts += round(10 * quant / len(bullets))
        if verb_hits < len(bullets):
            suggestions.append("Start every bullet with a strong action verb (Led, Built, Organized…).")
        if quant < len(bullets) / 2:
            suggestions.append("Quantify impact: how many people, what % improvement, how long?")
    else:
        suggestions.append("Add experience, internships, or volunteering with 2–4 bullets each.")
    breakdown["experience"] = pts
    score += pts

    # Skills (10)
    n_skills = len(cv.skills.technical) + len(cv.skills.soft) + len(cv.skills.tools)
    pts = min(10, n_skills * 2)
    breakdown["skills"] = pts
    score += pts
    if n_skills < 5:
        suggestions.append("List at least 5 skills (technical + tools + soft).")

    # Extras (15): languages, awards, volunteering, certifications, projects
    pts = 0
    pts += 3 if len(cv.languages) >= 2 else 0
    pts += 3 if cv.awards else 0
    pts += 3 if cv.volunteering else 0
    pts += 3 if cv.certifications else 0
    pts += 3 if cv.projects else 0
    breakdown["extras"] = pts
    score += pts
    if not cv.volunteering:
        suggestions.append(
            "No volunteering yet — Ethiopian Red Cross, EYVA, or campus clubs are common ways to add it."
        )
    if len(cv.languages) < 2:
        suggestions.append("Add English (and other) language levels, e.g. 'English — IELTS 6.5'.")

    # Keywords (10)
    kws = [k.lower() for k in (keywords or DEFAULT_KEYWORDS)]
    text = " ".join([cv.summary, *bullets, *cv.skills.technical, *cv.skills.soft, *cv.awards, *cv.volunteering]).lower()
    hits = [k for k in kws if k in text]
    pts = round(10 * len(hits) / len(kws)) if kws else 10
    breakdown["keywords"] = pts
    score += pts
    missing = [k for k in kws if k not in hits]
    if missing:
        suggestions.append(f"Consider covering these keywords naturally: {', '.join(missing[:5])}.")

    return {"score": max(0, min(100, score)), "breakdown": breakdown, "suggestions": suggestions[:6]}
