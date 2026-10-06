from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    phone: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(120))
    lang: Mapped[str] = mapped_column(String(4), default="en")
    role: Mapped[str] = mapped_column(String(16), default="student")
    region: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    profile: Mapped[Profile | None] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    degree_level_sought: Mapped[str] = mapped_column(String(16), default="master")
    field: Mapped[str | None] = mapped_column(String(120))
    gpa: Mapped[float | None] = mapped_column(Float)
    gpa_scale: Mapped[float] = mapped_column(Float, default=4.0)
    national_exam_score: Mapped[float | None] = mapped_column(Float)
    english_test: Mapped[str | None] = mapped_column(String(16))
    english_score: Mapped[float | None] = mapped_column(Float)
    work_years: Mapped[float] = mapped_column(Float, default=0)
    financial_need: Mapped[bool] = mapped_column(Boolean, default=True)
    leadership: Mapped[bool] = mapped_column(Boolean, default=False)
    gender: Mapped[str | None] = mapped_column(String(16))
    dob: Mapped[date | None] = mapped_column(Date)
    interests: Mapped[list] = mapped_column(JSON, default=list)
    preferred_countries: Mapped[list] = mapped_column(JSON, default=list)
    notifications: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user: Mapped[User] = relationship(back_populates="profile")


class Scholarship(Base):
    __tablename__ = "scholarships"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    provider: Mapped[str | None] = mapped_column(String(200))
    country: Mapped[str] = mapped_column(String(80), index=True)
    countries: Mapped[list] = mapped_column(JSON, default=list)
    level: Mapped[list] = mapped_column(JSON, default=list)
    fields: Mapped[list] = mapped_column(JSON, default=list)
    funding_type: Mapped[str] = mapped_column(String(16), default="full")
    covers: Mapped[str | None] = mapped_column(Text)
    eligibility: Mapped[dict] = mapped_column(JSON, default=dict)
    deadline: Mapped[date | None] = mapped_column(Date, index=True)
    deadline_text: Mapped[str | None] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(400))
    source: Mapped[str | None] = mapped_column(String(120))
    tags: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="open")
    deadline_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    last_verified: Mapped[str | None] = mapped_column(String(10))
    origin: Mapped[str | None] = mapped_column(String(16), default="curated")  # curated | discovered
    last_checked: Mapped[str | None] = mapped_column(String(10))
    check_status: Mapped[str | None] = mapped_column(String(16))
    discovered_at: Mapped[str | None] = mapped_column(String(10))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "provider": self.provider,
            "country": self.country,
            "countries": self.countries,
            "level": self.level,
            "fields": self.fields,
            "fundingType": self.funding_type,
            "covers": self.covers,
            "eligibility": self.eligibility,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "deadlineText": self.deadline_text,
            "url": self.url,
            "source": self.source,
            "tags": self.tags,
            "description": self.description,
            "status": self.status,
            "deadlineConfirmed": bool(self.deadline_confirmed),
            "details": self.details or {},
            "sources": self.sources or [],
            "lastVerified": self.last_verified,
            "origin": self.origin or "curated",
            "lastChecked": self.last_checked,
            "checkStatus": self.check_status,
            "discoveredAt": self.discovered_at,
        }


class CollectorRun(Base):
    """One execution of the web collector (scheduled every N hours or triggered manually)."""

    __tablename__ = "collector_runs"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    trigger: Mapped[str] = mapped_column(String(16), default="auto")
    status: Mapped[str] = mapped_column(String(16), default="running")  # running | ok | error
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    stats: Mapped[dict] = mapped_column(JSON, default=dict)
    changes: Mapped[list] = mapped_column(JSON, default=list)
    errors: Mapped[list] = mapped_column(JSON, default=list)

    def to_dict(self) -> dict:
        def iso(d: datetime | None) -> str | None:
            if d is None:
                return None
            return (d if d.tzinfo else d.replace(tzinfo=UTC)).isoformat()

        return {
            "id": self.id,
            "trigger": self.trigger,
            "status": self.status,
            "startedAt": iso(self.started_at),
            "finishedAt": iso(self.finished_at),
            "stats": self.stats or {},
            "changes": self.changes or [],
            "errors": self.errors or [],
        }


class Conference(Base):
    __tablename__ = "conferences"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    when: Mapped[str | None] = mapped_column(String(120))
    start_date: Mapped[date | None] = mapped_column(Date, index=True)
    funding: Mapped[str | None] = mapped_column(String(200))
    funding_type: Mapped[str] = mapped_column(String(16), default="partial")
    audience: Mapped[str | None] = mapped_column(String(200))
    age: Mapped[dict] = mapped_column(JSON, default=dict)
    url: Mapped[str | None] = mapped_column(String(400))
    ethiopians_eligible: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(Text)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "location": self.location,
            "when": self.when,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "funding": self.funding,
            "fundingType": self.funding_type,
            "audience": self.audience,
            "age": self.age,
            "url": self.url,
            "ethiopiansEligible": self.ethiopians_eligible,
            "description": self.description,
        }


class Match(Base):
    __tablename__ = "matches"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    scholarship_id: Mapped[str] = mapped_column(ForeignKey("scholarships.id"), primary_key=True)
    probability: Mapped[int] = mapped_column(Integer)
    why: Mapped[list] = mapped_column(JSON, default=list)
    missing: Mapped[list] = mapped_column(JSON, default=list)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class CV(Base):
    __tablename__ = "cvs"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    target_scholarship_id: Mapped[str | None] = mapped_column(String(80))
    template: Mapped[str] = mapped_column(String(16), default="europass")
    lang: Mapped[str] = mapped_column(String(4), default="en")
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    ats_score: Mapped[int | None] = mapped_column(Integer)
    ats_report: Mapped[dict] = mapped_column(JSON, default=dict)
    version: Mapped[int] = mapped_column(Integer, default=1)
    pdf_path: Mapped[str | None] = mapped_column(String(400))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Reminder(Base):
    __tablename__ = "reminders"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    scholarship_id: Mapped[str | None] = mapped_column(ForeignKey("scholarships.id"))
    channel: Mapped[str] = mapped_column(String(16), default="push")
    remind_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(String(200))
