"""Runs the web collector against the database and schedules it every N hours."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, date, datetime, timedelta
from typing import Any

from scholarai_ai.collector import Fetcher, collect, collect_events
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import SessionLocal
from .deps import get_router
from .models import CollectorRun, Conference, Scholarship
from .seed import apply_conference, apply_record

log = logging.getLogger("scholarai.collector")
STALE_LOCK = timedelta(hours=2)


def _aware(d: datetime | None) -> datetime | None:
    return d if d is None or d.tzinfo else d.replace(tzinfo=UTC)


def last_run(db: Session, *, ok_only: bool = False) -> CollectorRun | None:
    stmt = select(CollectorRun).order_by(CollectorRun.started_at.desc()).limit(1)
    if ok_only:
        stmt = stmt.where(CollectorRun.status == "ok")
    return db.scalars(stmt).first()


def is_running(db: Session) -> bool:
    r = last_run(db)
    return bool(r and r.status == "running" and datetime.now(UTC) - _aware(r.started_at) < STALE_LOCK)


def next_run_at(db: Session, now: datetime | None = None) -> datetime:
    r = last_run(db, ok_only=True)
    if not r:
        return now or datetime.now(UTC)  # never collected yet: due immediately
    return _aware(r.finished_at or r.started_at) + timedelta(hours=settings.collector_interval_hours)


def is_due(db: Session) -> bool:
    now = datetime.now(UTC)
    return not is_running(db) and now >= next_run_at(db, now)


def start_run(trigger: str) -> str | None:
    """Create a 'running' row (acts as a lock). Returns the run id, or None if one is already running."""
    with SessionLocal() as db:
        if is_running(db):
            return None
        run = CollectorRun(trigger=trigger, status="running")
        db.add(run)
        db.commit()
        return run.id


def run_collection(
    run_id: str | None = None,
    *,
    trigger: str = "auto",
    fetcher: Fetcher | None = None,
    today: date | None = None,
    feeds: list[str] | None = None,
    event_feeds: list[str] | None = None,
) -> dict[str, Any] | None:
    run_id = run_id or start_run(trigger)
    if run_id is None:
        return None
    with SessionLocal() as db:
        run = db.get(CollectorRun, run_id)
        try:
            records = [r.to_dict() for r in db.scalars(select(Scholarship))]
            res = collect(
                records,
                fetcher=fetcher,
                router=get_router(),
                today=today,
                feeds=feeds,
                max_new=settings.collector_max_new,
                log=log.info,
            )
            by_id = {r["id"]: r for r in res.records}
            for sid in res.touched:
                rec = by_id[sid]
                apply_record(db.get(Scholarship, sid) or Scholarship(id=sid), rec, db)
            db.flush()

            # Same pass for conferences / summits / youth forums.
            events = [c.to_dict() for c in db.scalars(select(Conference))]
            eres = collect_events(
                events,
                fetcher=fetcher,
                router=get_router(),
                today=today,
                feeds=event_feeds,
                max_new=settings.collector_max_new,
                log=log.info,
            )
            ev_by_id = {r["id"]: r for r in eres.records}
            for cid in eres.touched:
                apply_conference(db.get(Conference, cid) or Conference(id=cid), ev_by_id[cid], db)

            run.status = "ok"
            run.stats = {**res.summary(), "conferences": eres.summary()}
            run.changes = (res.changes + [{**c, "type": "conference"} for c in eres.changes])[:300]
            run.errors = (res.errors + eres.errors)[:50]
        except Exception as e:  # noqa: BLE001 — record the failure, keep the API alive
            log.exception("collector run failed")
            db.rollback()
            run = db.get(CollectorRun, run_id)
            run.status = "error"
            run.errors = [f"{type(e).__name__}: {e}"]
        run.finished_at = datetime.now(UTC)
        db.commit()
        log.info("collector run %s: %s %s", run.id, run.status, run.stats)
        return run.to_dict()


def mark_interrupted() -> None:
    """A run left 'running' by a previous process (restart/crash) will never finish — close it."""
    with SessionLocal() as db:
        for r in db.scalars(select(CollectorRun).where(CollectorRun.status == "running")):
            r.status, r.finished_at, r.errors = "error", datetime.now(UTC), ["interrupted: server restarted"]
        db.commit()


async def scheduler(poll_seconds: float = 900, first_delay: float = 5) -> None:
    """Background loop: run the collector whenever the last successful run is older than the interval."""
    await asyncio.to_thread(mark_interrupted)
    await asyncio.sleep(first_delay)
    while True:
        try:
            with SessionLocal() as db:
                due = is_due(db)
            if due:
                await asyncio.to_thread(run_collection, trigger="auto")
        except Exception:  # noqa: BLE001
            log.exception("collector scheduler tick failed")
        await asyncio.sleep(poll_seconds)
