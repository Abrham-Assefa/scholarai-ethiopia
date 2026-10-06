import json
from pathlib import Path

import pytest

from scholarai_ai.llm import LLMRouter, MockProvider

SEED = Path(__file__).resolve().parents[3] / "data" / "seed"


@pytest.fixture(scope="session")
def scholarships() -> list[dict]:
    return json.loads((SEED / "scholarships.json").read_text())


@pytest.fixture
def router() -> LLMRouter:
    return LLMRouter({"mock": MockProvider()}, default="mock")
