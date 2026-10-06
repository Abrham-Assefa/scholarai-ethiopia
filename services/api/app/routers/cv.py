from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from scholarai_ai.cv_maker import CVSchema, ats_score, convert_gpa, enhance_cv, parse_form, render_pdf
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import settings
from ..db import get_db
from ..deps import get_router
from ..models import CV, Scholarship, User
from ..schemas import CVCreate, CVEnhance, CVExport, CVUpdate, GPAIn

router = APIRouter(prefix="/v1", tags=["cv"])


def _score_and_save(db: Session, cv: CV, data: CVSchema) -> dict:
    keywords = None
    if cv.target_scholarship_id:
        s = db.get(Scholarship, cv.target_scholarship_id)
        if s:
            keywords = [*(s.fields or []), "leadership", "impact", "community", "research"]
            keywords = [k for k in keywords if k != "any"]
    report = ats_score(data, keywords)
    cv.data = data.model_dump()
    cv.ats_score = report["score"]
    cv.ats_report = report
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return report


def _out(cv: CV) -> dict:
    return {
        "id": cv.id,
        "template": cv.template,
        "lang": cv.lang,
        "targetScholarshipId": cv.target_scholarship_id,
        "data": cv.data,
        "atsScore": cv.ats_score,
        "ats": cv.ats_report,
        "version": cv.version,
        "updatedAt": cv.updated_at.isoformat() if cv.updated_at else None,
    }


def _owned(db: Session, cv_id: str, user: User) -> CV:
    cv = db.get(CV, cv_id)
    if not cv or cv.user_id != user.id:
        raise HTTPException(404, "CV not found")
    return cv


@router.post("/cv", status_code=201)
def create_cv(body: CVCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        data = parse_form(body.data)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(422, f"Invalid CV data: {e}") from e
    data.meta.template = body.template
    data.meta.lang = body.lang
    data.meta.targetScholarshipId = body.targetScholarshipId
    cv = CV(user_id=user.id, template=body.template, lang=body.lang, target_scholarship_id=body.targetScholarshipId)
    _score_and_save(db, cv, data)
    return _out(cv)


@router.get("/cv")
def list_cvs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(CV).where(CV.user_id == user.id).order_by(CV.updated_at.desc())).all()
    return {"items": [_out(c) for c in rows]}


@router.get("/cv/{cv_id}")
def get_cv(cv_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _out(_owned(db, cv_id, user))


@router.put("/cv/{cv_id}")
def update_cv(cv_id: str, body: CVUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = _owned(db, cv_id, user)
    data = parse_form(body.data) if body.data is not None else CVSchema.model_validate(cv.data)
    if body.template:
        cv.template = body.template
        data.meta.template = body.template
    if body.lang:
        cv.lang = body.lang
        data.meta.lang = body.lang
    cv.version += 1
    _score_and_save(db, cv, data)
    return _out(cv)


@router.post("/cv/{cv_id}/enhance")
def enhance(cv_id: str, body: CVEnhance, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = _owned(db, cv_id, user)
    data = CVSchema.model_validate(cv.data)
    criteria = ""
    if cv.target_scholarship_id:
        s = db.get(Scholarship, cv.target_scholarship_id)
        criteria = f"{s.title}: {', '.join(s.fields or [])}; {s.covers}" if s else ""
    before = cv.ats_score or 0
    enhanced, report = enhance_cv(data, criteria=criteria, router=get_router())
    cv.version += 1
    ats = _score_and_save(db, cv, enhanced)
    return {**_out(cv), "enhancement": {**report, "scoreBefore": before, "scoreAfter": ats["score"]}}


@router.get("/cv/{cv_id}/score")
def score(cv_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = _owned(db, cv_id, user)
    return cv.ats_report or ats_score(CVSchema.model_validate(cv.data))


@router.post("/cv/{cv_id}/export")
def export(cv_id: str, body: CVExport, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cv = _owned(db, cv_id, user)
    data = CVSchema.model_validate(cv.data)
    template = body.template or cv.template
    pdf = render_pdf(data, template=template)
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    path = settings.storage_dir / f"{cv.id}-{template}.pdf"
    path.write_bytes(pdf)
    cv.pdf_path = str(path)
    db.add(cv)
    db.commit()
    name = (data.personal.fullName or "cv").replace(" ", "_")
    return Response(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{name}-{template}.pdf"'},
    )


@router.post("/cv/preview")
def preview(body: CVCreate, user: User = Depends(get_current_user)):
    """Stateless PDF preview used by the live preview pane."""
    data = parse_form(body.data)
    data.meta.lang = body.lang
    return Response(render_pdf(data, template=body.template), media_type="application/pdf")


@router.post("/tools/gpa")
def gpa(body: GPAIn):
    try:
        return convert_gpa(body.gpa, body.scale).dict()
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
