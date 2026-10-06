from __future__ import annotations

from functools import lru_cache

from scholarai_ai.llm import LLMRouter

from .config import settings


@lru_cache
def get_router() -> LLMRouter:
    import os

    if settings.openai_api_key:
        os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
    os.environ.setdefault("LLM_PROVIDER", settings.llm_provider)
    return LLMRouter.from_env()
