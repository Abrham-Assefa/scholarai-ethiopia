from __future__ import annotations

from typing import Protocol

import httpx

USER_AGENT = "Mozilla/5.0 (compatible; ScholarAI-Collector/1.0; +https://github.com/scholarai-ethiopia)"


class Fetcher(Protocol):
    def get(self, url: str) -> str | None: ...


class HttpFetcher:
    """Polite HTTP fetcher: identifies itself, follows redirects, never raises."""

    max_bytes = 4_000_000

    def __init__(self, timeout: float = 20.0) -> None:
        self.client = httpx.Client(
            follow_redirects=True,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"},
        )

    def get(self, url: str) -> str | None:
        if not url.startswith(("http://", "https://")):
            return None
        try:
            r = self.client.get(url)
        except httpx.HTTPError:
            return None
        if r.status_code != 200 or len(r.content) > self.max_bytes:
            return None
        return r.text

    def close(self) -> None:
        self.client.close()
