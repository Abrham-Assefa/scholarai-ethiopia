"""CLI: python -m scholarai_ai.collector --seed data/seed/scholarships.json [--write] [--no-verify]"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .pipeline import collect, dumps


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Refresh scholarships from the live web")
    ap.add_argument("--seed", type=Path, required=True)
    ap.add_argument("--write", action="store_true", help="write the refreshed list back to --seed")
    ap.add_argument("--no-verify", action="store_true")
    ap.add_argument("--no-discover", action="store_true")
    ap.add_argument("--max-new", type=int, default=40)
    a = ap.parse_args(argv)
    records = json.loads(a.seed.read_text(encoding="utf-8"))
    res = collect(records, verify=not a.no_verify, discover=not a.no_discover, max_new=a.max_new,
                  log=lambda m: print(m, file=sys.stderr))
    for c in res.changes:
        print(f"[{c['kind']}] {c['id']}: {c['detail']}", file=sys.stderr)
    print(json.dumps(res.summary()), file=sys.stderr)
    if a.write:
        out = sorted(res.records, key=lambda r: (r.get("deadline") is None, r.get("deadline") or ""))
        a.seed.write_text(dumps(out), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
