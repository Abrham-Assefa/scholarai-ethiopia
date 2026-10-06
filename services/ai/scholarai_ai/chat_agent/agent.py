"""RAG chat assistant over the scholarship catalogue with two tools.

Tools: ``search_scholarships(query, level, country)`` and ``get_deadlines(days)``.
Intent detection is rule-based (deterministic) so the agent works offline; the LLM
(mock or OpenAI) turns the retrieved results into a reply in ``en`` or ``am``.
"""

from __future__ import annotations

import json
import re
from datetime import date, timedelta
from typing import Any

from ..llm import LLMRequest, LLMRouter, get_router
from ..matcher.engine import TfidfIndex, scholarship_text

SYSTEM_PROMPT = (
    "You are ScholarAI, a friendly assistant for Ethiopian students. Answer using ONLY the retrieved scholarships "
    "provided as JSON; cite the title and deadline; never guarantee admission or visas; keep answers short."
)

LEVEL_WORDS = {
    "bachelor": ["bachelor", "undergraduate", "undergrad", "ug", "ዲግሪ", "የመጀመሪያ"],
    "master": ["master", "masters", "msc", "ma", "graduate", "ማስተርስ", "ሁለተኛ"],
    "phd": ["phd", "doctoral", "doctorate", "dphil", "ፒኤችዲ", "ዶክትሬት"],
}
COUNTRY_WORDS = {
    "germany": "Germany",
    "german": "Germany",
    "ጀርመን": "Germany",
    "uk": "UK",
    "britain": "UK",
    "england": "UK",
    "እንግሊዝ": "UK",
    "usa": "USA",
    "america": "USA",
    "us": "USA",
    "አሜሪካ": "USA",
    "china": "China",
    "ቻይና": "China",
    "korea": "South Korea",
    "ኮሪያ": "South Korea",
    "japan": "Japan",
    "ጃፓን": "Japan",
    "turkey": "Türkiye",
    "türkiye": "Türkiye",
    "ቱርክ": "Türkiye",
    "hungary": "Hungary",
    "sweden": "Sweden",
    "france": "France",
    "netherlands": "Netherlands",
    "australia": "Australia",
    "canada": "Multiple",
    "africa": "Africa",
    "india": "India",
    "switzerland": "Switzerland",
    "russia": "Russia",
    "romania": "Romania",
}
GREETINGS = {"hi", "hello", "hey", "selam", "ሰላም", "ሀይ", "ጤና", "good morning", "good evening"}
DEADLINE_WORDS = ["deadline", "due", "closing", "when", "upcoming", "ቀነ", "ገደብ", "መቼ", "ያልቃል"]


class ChatAgent:
    def __init__(
        self, scholarships: list[dict[str, Any]], router: LLMRouter | None = None, today: date | None = None
    ) -> None:
        self.scholarships = scholarships
        self.router = router or get_router()
        self.today = today or date.today()
        self.index = TfidfIndex([scholarship_text(s) for s in scholarships])

    # -- tools ------------------------------------------------------------- #
    def search_scholarships(
        self, query: str, level: str | None = None, country: str | None = None, k: int = 5
    ) -> list[dict]:
        sims = self.index.similarities(query)
        scored = []
        for s, sim in zip(self.scholarships, sims, strict=True):
            if level and level not in (s.get("level") or []):
                continue
            if country and country.lower() not in " ".join([s.get("country", ""), *s.get("countries", [])]).lower():
                continue
            scored.append((sim, s))
        scored.sort(key=lambda t: -t[0])
        if level or country:
            hits = [s for _, s in scored[:k]]
        else:
            hits = [s for sim, s in scored[:k] if sim > 0.05]
        return [self._brief(s) for s in hits]

    def get_deadlines(self, days: int = 60, k: int = 5) -> list[dict]:
        limit = self.today + timedelta(days=days)
        upcoming = [
            s
            for s in self.scholarships
            if s.get("deadline") and self.today <= date.fromisoformat(s["deadline"]) <= limit
        ]
        upcoming.sort(key=lambda s: s["deadline"])
        return [self._brief(s) for s in upcoming[:k]]

    @staticmethod
    def _brief(s: dict) -> dict:
        return {
            "id": s["id"],
            "title": s["title"],
            "country": s.get("country"),
            "deadline": s.get("deadline"),
            "level": s.get("level"),
            "url": s.get("url"),
        }

    # -- agent loop -------------------------------------------------------- #
    def detect(self, message: str) -> tuple[str, dict[str, Any]]:
        low = message.lower().strip()
        if low.rstrip("!.") in GREETINGS or any(low.startswith(g + " ") or low.startswith(g + "!") for g in GREETINGS):
            return "greeting", {}
        if any(w in low for w in DEADLINE_WORDS) and not any(
            w in low for w in ("find", "search", "scholarship for", "in ")
        ):
            return "deadlines", {"days": 90}
        level = next(
            (lvl for lvl, words in LEVEL_WORDS.items() if any(re.search(rf"\b{re.escape(w)}\b", low) for w in words)),
            None,
        )
        country = next((c for w, c in COUNTRY_WORDS.items() if re.search(rf"\b{re.escape(w)}\b", low)), None)
        if level or country or any(w in low for w in ("scholarship", "study", "fund", "ስኮላርሺፕ", "ትምህርት", "ነጻ")):
            return "search", {"query": message, "level": level, "country": country}
        return "fallback", {}

    def reply(self, message: str, lang: str = "en", history: list[dict] | None = None) -> dict[str, Any]:
        intent, args = self.detect(message)
        tool_calls: list[dict] = []
        results: list[dict] = []
        if intent == "search":
            results = self.search_scholarships(**args)
            tool_calls.append({"name": "search_scholarships", "args": args, "count": len(results)})
        elif intent == "deadlines":
            results = self.get_deadlines(**args)
            tool_calls.append({"name": "get_deadlines", "args": args, "count": len(results)})
        req = LLMRequest(
            system=SYSTEM_PROMPT,
            user=json.dumps(
                {"intent": intent, "message": message, "results": results, "history": (history or [])[-6:]},
                ensure_ascii=False,
            ),
            task="chat",
            lang=lang,  # type: ignore[arg-type]
        )
        res = self.router.complete(req)
        return {
            "reply": res.text,
            "lang": lang,
            "intent": intent,
            "toolCalls": tool_calls,
            "sources": results,
            "provider": res.provider,
        }
