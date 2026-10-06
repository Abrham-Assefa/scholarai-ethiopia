"""LLM provider abstraction.

Two providers ship with the MVP:

* :class:`MockProvider` — deterministic, offline. Every feature (CV enhancement,
  chat, essay feedback) works with no API key, which keeps tests and demos
  reproducible.
* :class:`OpenAIProvider` — uses the OpenAI chat completions + embeddings API
  via ``httpx`` when ``OPENAI_API_KEY`` is set.

:class:`LLMRouter` picks a provider per task and falls back to the mock provider
on any error so the product never hard-fails on an upstream outage.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

Lang = Literal["en", "am"]


@dataclass
class LLMRequest:
    system: str
    user: str
    task: str = "general"  # extract | enhance | chat | essay_coach | general
    lang: Lang = "en"
    json_mode: bool = False
    temperature: float = 0.2
    privacy: Literal["low", "high"] = "low"


@dataclass
class LLMResponse:
    text: str
    provider: str
    model: str
    data: dict[str, Any] | None = None
    usage: dict[str, int] = field(default_factory=dict)

    def json(self) -> dict[str, Any]:
        if self.data is not None:
            return self.data
        try:
            return json.loads(self.text)
        except json.JSONDecodeError:
            m = re.search(r"\{.*\}", self.text, re.S)
            return json.loads(m.group(0)) if m else {}


class LLMProvider(Protocol):
    name: str

    def complete(self, req: LLMRequest) -> LLMResponse: ...

    def embed(self, texts: list[str]) -> list[list[float]]: ...


# --------------------------------------------------------------------------- #
# Mock provider
# --------------------------------------------------------------------------- #

ACTION_VERBS = ["Led", "Built", "Designed", "Organized", "Delivered", "Analyzed", "Coordinated", "Mentored"]

AMHARIC_TEMPLATES = {
    "greeting": "ሰላም! እኔ ስኮላር AI ነኝ። ስለ ስኮላርሺፕ፣ የማመልከቻ ቀነ ገደብ ወይም ሲቪ ማዘጋጀት ልረዳዎ እችላለሁ።",
    "results": "ለእርስዎ የሚስማሙ {n} ስኮላርሺፖች አግኝቻለሁ፦",
    "deadlines": "በቅርቡ የሚያልቁ የማመልከቻ ቀነ ገደቦች፦",
    "none": "ይቅርታ፣ ተዛማጅ ስኮላርሺፕ አላገኘሁም። እባክዎ ሌላ ቃል ይሞክሩ።",
    "fallback": "ጥያቄዎን ተረድቻለሁ። ስለ ስኮላርሺፕ ፍለጋ፣ ቀነ ገደቦች ወይም ሲቪ ይጠይቁኝ።",
}


class MockProvider:
    """Deterministic offline provider. Output depends only on the input."""

    name = "mock"
    model = "mock-1"

    def complete(self, req: LLMRequest) -> LLMResponse:
        handler = getattr(self, f"_task_{req.task}", self._task_general)
        text, data = handler(req)
        return LLMResponse(text=text, provider=self.name, model=self.model, data=data)

    # -- task handlers ----------------------------------------------------- #
    def _task_enhance(self, req: LLMRequest) -> tuple[str, dict]:
        """Rewrite bullets with action verbs; never adds numbers that are not in the input."""
        payload = _safe_json(req.user)
        bullets = payload.get("bullets", [])
        out, questions = [], []
        for i, b in enumerate(bullets):
            b_clean = re.sub(r"^(i\s+)?(was|am|have been|worked as|helped|did)\s+", "", b.strip(), flags=re.I)
            b_clean = re.sub(r"^(a|an|the)\s+", "", b_clean, flags=re.I)
            verb = ACTION_VERBS[_stable_int(b) % len(ACTION_VERBS)]
            if re.match(r"^[A-Z][a-z]+ed\b", b_clean):
                enhanced = b_clean
            else:
                enhanced = f"{verb} {b_clean[0].lower() + b_clean[1:] if b_clean else ''}".strip()
            enhanced = enhanced.rstrip(".") + "."
            out.append(enhanced)
            if not re.search(r"\d", b):
                questions.append(f"Bullet {i + 1}: can you add a number (people reached, % improvement, duration)?")
        data = {"bullets": out, "questions": questions}
        return json.dumps(data), data

    def _task_chat(self, req: LLMRequest) -> tuple[str, dict]:
        payload = _safe_json(req.user)
        intent = payload.get("intent", "fallback")
        results = payload.get("results", [])
        n = len(results)
        if req.lang == "am":
            if intent == "greeting":
                text = AMHARIC_TEMPLATES["greeting"]
            elif intent in ("search", "deadlines") and n:
                head = AMHARIC_TEMPLATES["results" if intent == "search" else "deadlines"].format(n=n)
                lines = [
                    f"• {r['title']} — {r.get('country', '')} ({r.get('deadline') or 'ቀን ያልተወሰነ'})" for r in results[:5]
                ]
                text = head + "\n" + "\n".join(lines)
            elif intent in ("search", "deadlines"):
                text = AMHARIC_TEMPLATES["none"]
            else:
                text = AMHARIC_TEMPLATES["fallback"]
        else:
            if intent == "greeting":
                text = "Hi! I'm ScholarAI. Ask me about scholarships, deadlines or building your CV."
            elif intent == "search" and n:
                lines = [
                    f"• {r['title']} — {r.get('country', '')}, deadline {r.get('deadline') or 'varies'}"
                    for r in results[:5]
                ]
                text = f"I found {n} scholarship(s) matching your question:\n" + "\n".join(lines)
            elif intent == "deadlines" and n:
                lines = [f"• {r.get('deadline')}: {r['title']}" for r in results[:5]]
                text = "Upcoming deadlines:\n" + "\n".join(lines)
            elif intent in ("search", "deadlines"):
                text = "I couldn't find a matching scholarship. Try another field, country or level."
            else:
                text = (
                    "I can help you search scholarships (e.g. 'master's in Germany'), list upcoming deadlines, "
                    "or explain requirements like MoE authentication and IELTS."
                )
        return text, {"text": text}

    def _task_essay_coach(self, req: LLMRequest) -> tuple[str, dict]:
        payload = _safe_json(req.user)
        text = payload.get("content", "")
        tips = []
        if len(text.split()) < 150:
            tips.append("Expand with one concrete story (situation → action → result).")
        if not re.search(r"\d", text):
            tips.append("Add at least one measurable outcome to make your impact tangible.")
        tips.append("Close by linking your goal back to Ethiopia's needs and this scholarship's mission.")
        data = {"comments": tips}
        return json.dumps(data), data

    def _task_general(self, req: LLMRequest) -> tuple[str, dict]:
        text = f"[mock:{req.task}] {req.user[:200]}"
        return text, {"text": text}

    # -- embeddings -------------------------------------------------------- #
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Hashing-trick bag-of-words embedding (64 dims) — deterministic and dependency-free."""
        dims = 64
        vecs = []
        for t in texts:
            v = [0.0] * dims
            for tok in re.findall(r"[a-z0-9]+", t.lower()):
                v[_stable_int(tok) % dims] += 1.0
            norm = math.sqrt(sum(x * x for x in v)) or 1.0
            vecs.append([x / norm for x in v])
        return vecs


# --------------------------------------------------------------------------- #
# OpenAI provider
# --------------------------------------------------------------------------- #


class OpenAIProvider:
    name = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: str = "https://api.openai.com/v1") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def _client(self):
        import httpx

        return httpx.Client(base_url=self.base_url, headers={"Authorization": f"Bearer {self.api_key}"}, timeout=60)

    def complete(self, req: LLMRequest) -> LLMResponse:
        body: dict[str, Any] = {
            "model": self.model,
            "temperature": req.temperature,
            "messages": [
                {"role": "system", "content": req.system + (" Respond in Amharic (አማርኛ)." if req.lang == "am" else "")},
                {"role": "user", "content": req.user},
            ],
        }
        if req.json_mode:
            body["response_format"] = {"type": "json_object"}
        with self._client() as c:
            r = c.post("/chat/completions", json=body)
            r.raise_for_status()
            j = r.json()
        text = j["choices"][0]["message"]["content"]
        return LLMResponse(text=text, provider=self.name, model=self.model, usage=j.get("usage", {}))

    def embed(self, texts: list[str]) -> list[list[float]]:
        with self._client() as c:
            r = c.post("/embeddings", json={"model": "text-embedding-3-small", "input": texts})
            r.raise_for_status()
            return [d["embedding"] for d in r.json()["data"]]


# --------------------------------------------------------------------------- #
# Router
# --------------------------------------------------------------------------- #


class LLMRouter:
    """Pick a provider per task; always degrade gracefully to the offline mock."""

    def __init__(self, providers: dict[str, LLMProvider] | None = None, default: str | None = None) -> None:
        self.providers: dict[str, LLMProvider] = providers or {"mock": MockProvider()}
        if "mock" not in self.providers:
            self.providers["mock"] = MockProvider()
        self.default = default or ("openai" if "openai" in self.providers else "mock")

    @classmethod
    def from_env(cls) -> LLMRouter:
        providers: dict[str, LLMProvider] = {"mock": MockProvider()}
        key = os.getenv("OPENAI_API_KEY")
        if key and os.getenv("LLM_PROVIDER", "auto") != "mock":
            providers["openai"] = OpenAIProvider(
                api_key=key,
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            )
        forced = os.getenv("LLM_PROVIDER")
        default = forced if forced in providers else None
        return cls(providers, default=default)

    def pick(self, req: LLMRequest) -> LLMProvider:
        if req.privacy == "high":
            return self.providers["mock"]
        return self.providers.get(self.default) or self.providers["mock"]

    def complete(self, req: LLMRequest) -> LLMResponse:
        provider = self.pick(req)
        try:
            return provider.complete(req)
        except Exception:  # noqa: BLE001 — degrade to offline mode on any upstream failure
            if provider.name == "mock":
                raise
            return self.providers["mock"].complete(req)

    def embed(self, texts: list[str]) -> list[list[float]]:
        provider = self.providers.get(self.default) or self.providers["mock"]
        try:
            return provider.embed(texts)
        except Exception:  # noqa: BLE001
            return self.providers["mock"].embed(texts)

    @property
    def active_provider(self) -> str:
        return self.default


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #


def _stable_int(s: str) -> int:
    return int(hashlib.sha1(s.encode("utf-8")).hexdigest()[:8], 16)


def _safe_json(s: str) -> dict[str, Any]:
    try:
        v = json.loads(s)
        return v if isinstance(v, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


_default_router: LLMRouter | None = None


def get_router() -> LLMRouter:
    global _default_router
    if _default_router is None:
        _default_router = LLMRouter.from_env()
    return _default_router
