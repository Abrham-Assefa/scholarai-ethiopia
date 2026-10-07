from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import collector as svc
from ..config import settings
from ..db import get_db
from ..models import CollectorRun, Conference, Scholarship

router = APIRouter(prefix="/v1/collector", tags=["collector"])


@router.get("/status")
def status(db: Session = Depends(get_db)):
    """When the catalogue was last refreshed from the web, and when the next refresh is due."""
    last = svc.last_run(db)
    last_ok = svc.last_run(db, ok_only=True)
    discovered = db.scalar(select(func.count()).select_from(Scholarship).where(Scholarship.origin == "discovered")) or 0
    total = db.scalar(select(func.count()).select_from(Scholarship)) or 0
    conf_total = db.scalar(select(func.count()).select_from(Conference)) or 0
    conf_new = db.scalar(select(func.count()).select_from(Conference).where(Conference.origin == "discovered")) or 0
    return {
        "enabled": settings.collector_enabled,
        "intervalHours": settings.collector_interval_hours,
        "running": svc.is_running(db),
        "lastRun": last.to_dict() if last else None,
        "lastSuccessAt": last_ok.to_dict()["finishedAt"] if last_ok else None,
        "nextRunAt": svc.next_run_at(db).isoformat() if settings.collector_enabled else None,
        "totals": {
            "scholarships": total,
            "discovered": discovered,
            "conferences": conf_total,
            "conferencesDiscovered": conf_new,
        },
    }


@router.get("/runs")
def runs(db: Session = Depends(get_db), limit: int = 10):
    rows = db.scalars(select(CollectorRun).order_by(CollectorRun.started_at.desc()).limit(min(limit, 50)))
    return {"items": [r.to_dict() for r in rows]}


@router.post("/run", status_code=202)
def run_now(background: BackgroundTasks, x_admin_token: str | None = Header(default=None)):
    """Trigger a refresh now (runs in the background). Requires X-Admin-Token when ADMIN_TOKEN is set."""
    if settings.admin_token and x_admin_token != settings.admin_token:
        raise HTTPException(401, "Admin token required")
    run_id = svc.start_run("manual")
    if run_id is None:
        raise HTTPException(409, "A collection run is already in progress")
    background.add_task(svc.run_collection, run_id, trigger="manual")
    return {"status": "started", "runId": run_id}
