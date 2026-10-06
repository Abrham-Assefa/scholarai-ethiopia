"""Essay / motivation-letter coach: deterministic rubric + LLM comments."""

from __future__ import annotations

import json
import re

from ..llm import LLMRequest, LLMRouter, get_router

CLICHES = [
    "ever since i was a child",
    "since childhood",
    "passion for",
    "think outside the box",
    "in today's world",
    "give back to my community",
    "make a difference",
    "dream come true",
    "last but not least",
    "in conclusion",
    "it is my firm belief",
    "hard worker",
    "i have always been",
    "the world is changing",
]
SPECIFICITY_MARKERS = [r"\d", r"\b(19|20)\d{2}\b", r"\b(university|hospital|school|ngo|company|lab)\b", r"%"]
SYSTEM = (
    "You are an encouraging scholarship essay coach. Give 3 concrete, specific suggestions. Never rewrite the essay."
)


def essay_feedback(
    content: str, *, prompt: str = "", word_limit: int = 500, lang: str = "en", router: LLMRouter | None = None
) -> dict:
    router = router or get_router()
    words = re.findall(r"\b\w+\b", content)
    n = len(words)
    sentences = [s for s in re.split(r"[.!?]+", content) if s.strip()]
    avg_len = n / max(len(sentences), 1)
    low = content.lower()
    found_cliches = [c for c in CLICHES if c in low]
    spec_hits = sum(len(re.findall(p, low)) for p in SPECIFICITY_MARKERS)
    first_person = len(re.findall(r"\bi\b", low))

    # Rubric (each 0-25)
    clarity = 25 if 12 <= avg_len <= 22 else (18 if 8 <= avg_len <= 28 else 10)
    specificity = min(25, 8 + spec_hits * 3)
    length_ratio = n / word_limit if word_limit else 1
    word_count_score = 25 if 0.85 <= length_ratio <= 1.0 else (18 if 0.6 <= length_ratio <= 1.1 else 8)
    authenticity = max(5, 25 - 5 * len(found_cliches)) if first_person else 10
    total = clarity + specificity + word_count_score + authenticity

    issues: list[dict] = []
    if n > word_limit:
        issues.append(
            {"type": "word_count", "severity": "high", "message": f"{n} words exceeds the {word_limit}-word limit."}
        )
    elif length_ratio < 0.6:
        issues.append(
            {
                "type": "word_count",
                "severity": "medium",
                "message": f"Only {n} words — aim for ~{int(word_limit * 0.9)}.",
            }
        )
    if avg_len > 28:
        issues.append(
            {"type": "clarity", "severity": "medium", "message": "Sentences are long; split them for clarity."}
        )
    if spec_hits < 2:
        issues.append(
            {
                "type": "specificity",
                "severity": "high",
                "message": "Add concrete details: names, dates, numbers, places.",
            }
        )
    for c in found_cliches:
        issues.append(
            {"type": "cliche", "severity": "low", "message": f'Cliché: "{c}" — replace with a specific example.'}
        )

    res = router.complete(
        LLMRequest(
            system=SYSTEM,
            user=json.dumps({"prompt": prompt, "content": content}, ensure_ascii=False),
            task="essay_coach",
            lang=lang,
            json_mode=True,
        )
    )  # type: ignore[arg-type]
    comments = res.json().get("comments", [])
    return {
        "score": total,
        "rubric": {
            "clarity": clarity,
            "specificity": specificity,
            "wordCount": word_count_score,
            "authenticity": authenticity,
        },
        "wordCount": n,
        "wordLimit": word_limit,
        "issues": issues,
        "comments": comments,
        "provider": res.provider,
    }
