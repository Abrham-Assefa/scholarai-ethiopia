"""Load data/seed/*.json into the database. Idempotent (upsert by id)."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from .config import settings
from .db import SessionLocal, init_db
from .models import Conference, Match, Reminder, Scholarship


def _d(s: str | None) -> date | None:
    return date.fromisoformat(s) if s else None


def apply_record(row: Scholarship, s: dict, db: Session | None = None) -> Scholarship:
    """Copy a seed/collector record (camelCase JSON) onto an ORM row."""
    row.title = s["title"][:200]
    row.provider = s.get("provider")
    row.country = s.get("country") or "Multiple"
    row.countries = s.get("countries", [])
    row.level = s.get("level", [])
    row.fields = s.get("fields", [])
    row.funding_type = s.get("fundingType", "full")
    row.covers = s.get("covers")
    row.eligibility = s.get("eligibility", {})
    row.deadline = _d(s.get("deadline"))
    row.deadline_text = (s.get("deadlineText") or None) and s["deadlineText"][:200]
    row.url = s["url"][:400]
    row.source = s.get("source")
    row.tags = s.get("tags", [])
    row.description = s.get("description")
    row.status = s.get("status", "open")
    row.deadline_confirmed = bool(s.get("deadlineConfirmed", False))
    row.details = s.get("details", {})
    row.sources = s.get("sources", [])
    row.last_verified = s.get("lastVerified")
    row.origin = s.get("origin", "curated")
    row.last_checked = s.get("lastChecked") or row.last_checked
    row.check_status = s.get("checkStatus") or row.check_status
    row.discovered_at = s.get("discoveredAt") or row.discovered_at
    if db is not None and row not in db:
        db.add(row)
    return row


def apply_conference(row: Conference, c: dict, db: Session | None = None) -> Conference:
    """Copy a seed/collector conference record (camelCase JSON) onto an ORM row."""
    row.title = c["title"][:200]
    row.location = (c.get("location") or None) and c["location"][:200]
    row.when = (c.get("when") or None) and c["when"][:120]
    row.start_date = _d(c.get("startDate"))
    row.funding = (c.get("funding") or None) and c["funding"][:200]
    row.funding_type = c.get("fundingType", "partial")
    row.audience = (c.get("audience") or None) and c["audience"][:200]
    row.age = c.get("age", {})
    row.url = (c.get("url") or None) and c["url"][:400]
    row.ethiopians_eligible = c.get("ethiopiansEligible", True)
    row.description = c.get("description")
    row.deadline = _d(c.get("deadline"))
    row.status = c.get("status", "open")
    row.date_confirmed = bool(c.get("dateConfirmed", True))
    row.details = c.get("details", {})
    row.sources = c.get("sources", [])
    row.last_verified = c.get("lastVerified")
    row.origin = c.get("origin", "curated")
    row.last_checked = c.get("lastChecked") or row.last_checked
    row.check_status = c.get("checkStatus") or row.check_status
    row.discovered_at = c.get("discoveredAt") or row.discovered_at
    if db is not None and row not in db:
        db.add(row)
    return row


def seed(db: Session, seed_dir: Path | None = None) -> dict[str, int]:
    seed_dir = seed_dir or settings.seed_dir
    schol = json.loads((seed_dir / "scholarships.json").read_text(encoding="utf-8"))
    conf = json.loads((seed_dir / "conferences.json").read_text(encoding="utf-8"))
    for s in schol:
        row = db.get(Scholarship, s["id"])
        # Never overwrite data the web collector refreshed more recently than the seed file.
        fresh = max(row.last_verified or "", row.last_checked or "") if row is not None else ""
        if row is not None and fresh > max(s.get("lastVerified") or "", s.get("lastChecked") or ""):
            continue
        apply_record(row or Scholarship(id=s["id"]), s, db)
    # Drop curated programmes removed from the seed (e.g. closed or no longer open to Ethiopians);
    # programmes found by the web collector are managed by the collector itself.
    keep = {s["id"] for s in schol}
    stale = [
        r.id for r in db.scalars(select(Scholarship)) if r.id not in keep and (r.origin or "curated") != "discovered"
    ]
    if stale:
        db.execute(delete(Match).where(Match.scholarship_id.in_(stale)))
        db.execute(update(Reminder).where(Reminder.scholarship_id.in_(stale)).values(scholarship_id=None))
        db.execute(delete(Scholarship).where(Scholarship.id.in_(stale)))
    for c in conf:
        row = db.get(Conference, c["id"])
        fresh = max(row.last_verified or "", row.last_checked or "") if row is not None else ""
        if row is not None and fresh > max(c.get("lastVerified") or "", c.get("lastChecked") or ""):
            continue
        apply_conference(row or Conference(id=c["id"]), c, db)
    keep_c = {c["id"] for c in conf}
    stale_c = [
        r.id for r in db.scalars(select(Conference)) if r.id not in keep_c and (r.origin or "curated") != "discovered"
    ]
    if stale_c:
        db.execute(delete(Conference).where(Conference.id.in_(stale_c)))
    db.commit()
    return {"scholarships": len(schol), "conferences": len(conf)}


def main() -> None:
    init_db()
    with SessionLocal() as db:
        print(seed(db))


if __name__ == "__main__":
    main()
