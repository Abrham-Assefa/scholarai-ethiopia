from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Conference, Scholarship

router = APIRouter(prefix="/v1", tags=["catalog"])


@router.get("/scholarships")
def list_scholarships(
    db: Session = Depends(get_db),
    level: str | None = None,
    country: str | None = None,
    field: str | None = None,
    q: str | None = None,
    deadlineAfter: date | None = None,
    funding: str | None = None,
    includeClosed: bool = False,
    origin: str | None = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    stmt = select(Scholarship)
    if not includeClosed:
        stmt = stmt.where(Scholarship.status != "closed")
    if origin == "discovered":
        stmt = stmt.where(Scholarship.origin == "discovered")
    elif origin == "curated":
        stmt = stmt.where(or_(Scholarship.origin.is_(None), Scholarship.origin != "discovered"))
    if country:
        stmt = stmt.where(
            or_(
                Scholarship.country.ilike(f"%{country}%"),
                func.lower(func.cast(Scholarship.countries, type_=Scholarship.country.type)).like(
                    f"%{country.lower()}%"
                ),
            )
        )
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Scholarship.title.ilike(like),
                Scholarship.description.ilike(like),
                Scholarship.provider.ilike(like),
                Scholarship.covers.ilike(like),
            )
        )
    if deadlineAfter:
        stmt = stmt.where(or_(Scholarship.deadline >= deadlineAfter, Scholarship.deadline.is_(None)))
    if funding:
        stmt = stmt.where(Scholarship.funding_type == funding)
    rows = db.scalars(stmt.order_by(Scholarship.deadline.is_(None), Scholarship.deadline)).all()
    # JSON-array filters are applied in Python for SQLite/Postgres portability.
    if level:
        rows = [r for r in rows if level in (r.level or [])]
    if field:
        fl = field.lower()
        rows = [r for r in rows if any(fl in f.lower() for f in (r.fields or [])) or "any" in (r.fields or [])]
    total = len(rows)
    items = [r.to_dict() for r in rows[offset : offset + limit]]
    today = date.today()
    for it in items:
        it["daysLeft"] = (date.fromisoformat(it["deadline"]) - today).days if it["deadline"] else None
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/scholarships/stats")
def scholarship_stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(Scholarship)) or 0
    open_ = (
        db.scalar(
            select(func.count())
            .select_from(Scholarship)
            .where(or_(Scholarship.deadline >= date.today(), Scholarship.deadline.is_(None)))
            .where(Scholarship.status != "closed")
        )
        or 0
    )
    countries = db.scalar(select(func.count(func.distinct(Scholarship.country)))) or 0
    conferences = db.scalar(select(func.count()).select_from(Conference).where(_conf_open())) or 0
    return {"total": total, "open": open_, "countries": countries, "conferences": conferences}


@router.get("/scholarships/{sid}")
def get_scholarship(sid: str, db: Session = Depends(get_db)):
    s = db.get(Scholarship, sid)
    if not s:
        raise HTTPException(404, "Scholarship not found")
    d = s.to_dict()
    d["daysLeft"] = (s.deadline - date.today()).days if s.deadline else None
    d["requiredDocuments"] = [
        "Passport (valid ≥ 18 months)",
        "Degree certificate + transcript (MoE / ETA authenticated)",
        "English test (IELTS / TOEFL / Duolingo)" if (s.eligibility or {}).get("englishTest") != "none" else None,
        "CV (Europass for Europe)",
        "Motivation letter / Statement of Purpose",
        "2–3 recommendation letters",
        "Research proposal" if "phd" in (s.level or []) else None,
    ]
    d["requiredDocuments"] = (s.details or {}).get("documents") or [x for x in d["requiredDocuments"] if x]
    return d


def _conf_open():
    return or_(Conference.status.is_(None), Conference.status != "closed")


def _conf_dict(c: Conference) -> dict:
    d = c.to_dict()
    today = date.today()
    d["daysLeft"] = (c.deadline - today).days if c.deadline else None
    d["startsIn"] = (c.start_date - today).days if c.start_date else None
    return d


@router.get("/conferences")
def list_conferences(
    db: Session = Depends(get_db),
    q: str | None = None,
    funding: str | None = None,
    origin: str | None = None,
    includeClosed: bool = False,
):
    stmt = select(Conference)
    if not includeClosed:
        stmt = stmt.where(_conf_open())
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Conference.title.ilike(like), Conference.location.ilike(like), Conference.description.ilike(like))
        )
    if funding:
        stmt = stmt.where(Conference.funding_type == funding)
    if origin == "discovered":
        stmt = stmt.where(Conference.origin == "discovered")
    elif origin == "curated":
        stmt = stmt.where(or_(Conference.origin.is_(None), Conference.origin != "discovered"))
    # Soonest action first: application deadline when known, else the event start.
    key = func.coalesce(Conference.deadline, Conference.start_date)
    rows = db.scalars(stmt.order_by(key.is_(None), key, Conference.title)).all()
    return {"items": [_conf_dict(r) for r in rows], "total": len(rows)}


@router.get("/conferences/{cid}")
def get_conference(cid: str, db: Session = Depends(get_db)):
    c = db.get(Conference, cid)
    if not c:
        raise HTTPException(404, "Conference not found")
    return _conf_dict(c)
