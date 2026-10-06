from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from scholarai_ai.matcher import Profile as MatchProfile
from scholarai_ai.matcher import match_all
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Match, Profile, Reminder, Scholarship, User
from ..schemas import ProfileIn, ProfileOut, ReminderIn

router = APIRouter(prefix="/v1", tags=["me"])


def _profile_out(p: Profile) -> ProfileOut:
    return ProfileOut(
        userId=p.user_id,
        name=p.user.name,
        email=p.user.email,
        lang=p.user.lang,
        region=p.user.region,
        degreeLevelSought=p.degree_level_sought,
        field=p.field,
        gpa=p.gpa,
        gpaScale=p.gpa_scale,
        nationalExamScore=p.national_exam_score,
        englishTest=p.english_test,
        englishScore=p.english_score,
        workYears=p.work_years,
        financialNeed=p.financial_need,
        leadership=p.leadership,
        gender=p.gender,
        dob=p.dob,
        interests=p.interests or [],
        preferredCountries=p.preferred_countries or [],
        notifications=p.notifications or {},
    )


def _match_profile(p: Profile) -> MatchProfile:
    age = None
    if p.dob:
        age = (date.today() - p.dob).days // 365
    return MatchProfile(
        degreeLevelSought=p.degree_level_sought,
        field=p.field or "",
        gpa=p.gpa,
        gpaScale=p.gpa_scale,
        englishTest=p.english_test,
        englishScore=p.english_score,
        workYears=p.work_years,
        interests=p.interests or [],
        preferredCountries=p.preferred_countries or [],
        leadership=p.leadership,
        financialNeed=p.financial_need,
        age=age,
    )


def recompute_matches(db: Session, user: User) -> list[dict]:
    if not user.profile:
        return []
    scholarships = [s.to_dict() for s in db.scalars(select(Scholarship)).all()]
    results = match_all(_match_profile(user.profile), scholarships, top_k=50)
    db.execute(delete(Match).where(Match.user_id == user.id))
    for m in results:
        db.add(
            Match(
                user_id=user.id,
                scholarship_id=m["scholarshipId"],
                probability=m["probability"],
                why=m["why"],
                missing=m["missing"],
            )
        )
    db.commit()
    return results


@router.get("/me/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    if not user.profile:
        raise HTTPException(404, "Profile not set")
    return _profile_out(user.profile)


@router.put("/me/profile", response_model=ProfileOut)
def put_profile(body: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    p = user.profile or Profile(user_id=user.id)
    p.degree_level_sought = body.degreeLevelSought
    p.field = body.field
    p.gpa = body.gpa
    p.gpa_scale = body.gpaScale
    p.national_exam_score = body.nationalExamScore
    p.english_test = body.englishTest
    p.english_score = body.englishScore
    p.work_years = body.workYears
    p.financial_need = body.financialNeed
    p.leadership = body.leadership
    p.gender = body.gender
    p.dob = body.dob
    p.interests = body.interests
    p.preferred_countries = body.preferredCountries
    p.notifications = body.notifications
    if body.name is not None:
        user.name = body.name
    if body.email is not None:
        user.email = body.email
    if body.lang is not None:
        user.lang = body.lang
    if body.region is not None:
        user.region = body.region
    user.profile = p
    db.add(user)
    db.commit()
    db.refresh(user)
    recompute_matches(db, user)
    return _profile_out(user.profile)


@router.get("/matches")
def get_matches(user: User = Depends(get_current_user), db: Session = Depends(get_db), limit: int = 20):
    user = db.merge(user)
    if not user.profile:
        raise HTTPException(400, "Complete your profile first (PUT /v1/me/profile)")
    results = recompute_matches(db, user)
    by_id = {s.id: s for s in db.scalars(select(Scholarship)).all()}
    for m in results:
        s = by_id[m["scholarshipId"]]
        m["url"] = s.url
        m["fundingType"] = s.funding_type
        m["level"] = s.level
    return {"items": results[:limit], "total": len(results)}


@router.post("/matches/recompute")
def recompute(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.merge(user)
    return {"count": len(recompute_matches(db, user))}


@router.get("/deadlines")
def upcoming_deadlines(user: User = Depends(get_current_user), db: Session = Depends(get_db), days: int = 90):
    user = db.merge(user)
    today = date.today()
    matched = {m.scholarship_id: m.probability for m in db.scalars(select(Match).where(Match.user_id == user.id))}
    rows = db.scalars(select(Scholarship).where(Scholarship.deadline >= today).order_by(Scholarship.deadline)).all()
    items = []
    for s in rows:
        days_left = (s.deadline - today).days
        if days_left > days:
            break
        items.append(
            {
                "scholarshipId": s.id,
                "title": s.title,
                "country": s.country,
                "deadline": s.deadline.isoformat(),
                "daysLeft": days_left,
                "probability": matched.get(s.id),
                "url": s.url,
            }
        )
    if matched:
        items.sort(key=lambda x: (x["probability"] is None, x["daysLeft"]))
    return {"items": items}


@router.get("/reminders")
def list_reminders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Reminder).where(Reminder.user_id == user.id).order_by(Reminder.remind_at)).all()
    return {
        "items": [
            {
                "id": r.id,
                "scholarshipId": r.scholarship_id,
                "channel": r.channel,
                "remindAt": r.remind_at.isoformat(),
                "sent": r.sent,
                "note": r.note,
            }
            for r in rows
        ]
    }


@router.post("/reminders", status_code=201)
def create_reminder(body: ReminderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        when = datetime.fromisoformat(body.remindAt.replace("Z", "+00:00"))
    except ValueError as e:
        raise HTTPException(422, "remindAt must be ISO-8601") from e
    r = Reminder(
        user_id=user.id, scholarship_id=body.scholarshipId, channel=body.channel, remind_at=when, note=body.note
    )
    db.add(r)
    db.commit()
    return {"id": r.id}
