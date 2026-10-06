"""Web collector: keeps the scholarship catalogue fresh from the live internet.

Every run (scheduled every 48h by the API) it:

1. **Verifies** tracked programmes by re-reading their official source pages and
   extracting the current deadline / open-closed signals.
2. **Discovers** new opportunities from scholarship news feeds, keeps only those
   open to Ethiopian applicants with a future deadline, and summarises each one
   into the same in-depth guide format as the curated data (overview, who can
   apply, benefits, how to apply, documents, tips for Ethiopians).
3. **Expires** past deadlines (rolls curated programmes forward as estimates,
   closes discovered one-off calls).

Uses the LLM router for summaries when a real provider is configured and falls
back to deterministic heuristics offline, so tests never touch the network.
"""

from .fetch import Fetcher, HttpFetcher
from .pipeline import DEFAULT_FEEDS, CollectionResult, collect

__all__ = ["DEFAULT_FEEDS", "CollectionResult", "Fetcher", "HttpFetcher", "collect"]
