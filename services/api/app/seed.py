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


def seed(db: Session, seed_dir: Path | None = None) -> dict[str, int]:
    seed_dir = seed_dir or settings.seed_dir
    schol = json.loads((seed_dir / "scholarships.json").read_text(encoding="utf-8"))
    conf = json.loads((seed_dir / "conferences.json").read_text(encoding="utf-8"))
    for s in schol:
        db.merge(
            Scholarship(
                id=s["id"],
                title=s["title"],
                provider=s.get("provider"),
                country=s["country"],
                countries=s.get("countries", []),
                level=s.get("level", []),
                fields=s.get("fields", []),
                funding_type=s.get("fundingType", "full"),
                covers=s.get("covers"),
                eligibility=s.get("eligibility", {}),
                deadline=_d(s.get("deadline")),
                deadline_text=s.get("deadlineText"),
                url=s["url"],
                source=s.get("source"),
                tags=s.get("tags", []),
                description=s.get("description"),
                status=s.get("status", "open"),
                deadline_confirmed=s.get("deadlineConfirmed", False),
                details=s.get("details", {}),
                sources=s.get("sources", []),
                last_verified=s.get("lastVerified"),
            )
        )
    # Drop programmes that were removed from the seed (e.g. closed or no longer open to Ethiopians).
    keep = {s["id"] for s in schol}
    stale = [sid for sid in db.scalars(select(Scholarship.id)) if sid not in keep]
    if stale:
        db.execute(delete(Match).where(Match.scholarship_id.in_(stale)))
        db.execute(update(Reminder).where(Reminder.scholarship_id.in_(stale)).values(scholarship_id=None))
        db.execute(delete(Scholarship).where(Scholarship.id.in_(stale)))
    for c in conf:
        db.merge(
            Conference(
                id=c["id"],
                title=c["title"],
                location=c.get("location"),
                when=c.get("when"),
                start_date=_d(c.get("startDate")),
                funding=c.get("funding"),
                funding_type=c.get("fundingType", "partial"),
                audience=c.get("audience"),
                age=c.get("age", {}),
                url=c.get("url"),
                ethiopians_eligible=c.get("ethiopiansEligible", True),
                description=c.get("description"),
            )
        )
    db.commit()
    return {"scholarships": len(schol), "conferences": len(conf)}


def main() -> None:
    init_db()
    with SessionLocal() as db:
        print(seed(db))


if __name__ == "__main__":
    main()
