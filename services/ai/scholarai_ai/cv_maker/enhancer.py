"""Bullet enhancer — STAR method, strong action verbs, never invents facts.

The LLM is asked for JSON ``{"bullets": [...], "questions": [...]}``. We post-validate
the output with an *honesty guard*: any number that appears in an enhanced bullet but
not in the original is rejected and the original bullet is kept.
"""

from __future__ import annotations

import json
import re

from ..llm import LLMRequest, LLMRouter, get_router
from .schema import CVSchema

SYSTEM_PROMPT = (
    "You are an expert scholarship CV writer. Rewrite each bullet using the STAR method, start with a strong "
    "action verb, quantify impact ONLY where the input supports it, and NEVER invent facts, numbers, employers "
    "or degrees. If a number is missing, add a clarifying question instead. "
    'Output strict JSON: {"bullets": [...], "questions": [...]} with the same number of bullets as the input.'
)


def _numbers(s: str) -> set[str]:
    return set(re.findall(r"\d+(?:[.,]\d+)?", s))


def enhance_bullets(
    bullets: list[str],
    *,
    criteria: str = "",
    lang: str = "en",
    router: LLMRouter | None = None,
) -> dict:
    if not bullets:
        return {"bullets": [], "questions": [], "flagged": []}
    router = router or get_router()
    req = LLMRequest(
        system=SYSTEM_PROMPT
        + (f"\nTarget scholarship priorities: {criteria}" if criteria else "")
        + f"\nLanguage: {lang}",
        user=json.dumps({"bullets": bullets, "criteria": criteria}, ensure_ascii=False),
        task="enhance",
        lang=lang,  # type: ignore[arg-type]
        json_mode=True,
    )
    data = router.complete(req).json()
    out_bullets = list(data.get("bullets") or [])
    questions = list(data.get("questions") or [])
    flagged: list[int] = []

    final: list[str] = []
    for i, original in enumerate(bullets):
        candidate = out_bullets[i] if i < len(out_bullets) and isinstance(out_bullets[i], str) else original
        if _numbers(candidate) - _numbers(original):
            flagged.append(i)  # honesty guard: hallucinated figure
            candidate = original
        final.append(candidate.strip() or original)
    return {"bullets": final, "questions": questions, "flagged": flagged, "provider": router.active_provider}


def enhance_cv(cv: CVSchema, *, criteria: str = "", router: LLMRouter | None = None) -> tuple[CVSchema, dict]:
    """Enhance all experience bullets in-place and return (cv, report)."""
    report: dict = {"questions": [], "flagged": 0}
    data = cv.model_dump()
    for exp in data["experience"]:
        res = enhance_bullets(exp["bullets"], criteria=criteria, lang=cv.meta.lang, router=router)
        exp["bullets"] = res["bullets"]
        report["questions"].extend(res["questions"])
        report["flagged"] += len(res["flagged"])
    if not data["summary"] and data["education"]:
        edu = data["education"][0]
        field = edu.get("field") or edu.get("degree") or "graduate"
        data["summary"] = (
            f"{field} graduate from {edu.get('institution') or 'Ethiopia'} seeking a funded opportunity "
            "to deepen expertise and contribute to Ethiopia's development."
        )
    return CVSchema.model_validate(data), report
