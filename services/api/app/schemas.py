from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field


class OTPRequest(BaseModel):
    phone: str = Field(min_length=9, max_length=20, examples=["+251911000000"])


class OTPVerify(BaseModel):
    phone: str
    code: str


class TokenOut(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserOut


class UserOut(BaseModel):
    id: str
    phone: str
    name: str | None = None
    email: str | None = None
    lang: str = "en"
    role: str = "student"


class ProfileIn(BaseModel):
    name: str | None = None
    email: str | None = None
    lang: Literal["en", "am"] | None = None
    region: str | None = None
    degreeLevelSought: Literal["bachelor", "master", "phd", "postdoc", "short-course"] = "master"
    field: str | None = None
    gpa: float | None = Field(default=None, ge=0)
    gpaScale: float = 4.0
    nationalExamScore: float | None = None
    englishTest: str | None = None
    englishScore: float | None = None
    workYears: float = 0
    financialNeed: bool = True
    leadership: bool = False
    gender: str | None = None
    dob: date | None = None
    interests: list[str] = Field(default_factory=list)
    preferredCountries: list[str] = Field(default_factory=list)
    notifications: dict[str, Any] = Field(default_factory=dict)


class ProfileOut(ProfileIn):
    userId: str


class CVCreate(BaseModel):
    mode: Literal["form"] = "form"
    data: dict[str, Any]
    template: Literal["europass", "modern", "academic", "minimal"] = "europass"
    lang: Literal["en", "am"] = "en"
    targetScholarshipId: str | None = None


class CVUpdate(BaseModel):
    data: dict[str, Any] | None = None
    template: Literal["europass", "modern", "academic", "minimal"] | None = None
    lang: Literal["en", "am"] | None = None


class CVEnhance(BaseModel):
    section: Literal["experience", "all"] = "all"


class CVExport(BaseModel):
    format: Literal["pdf"] = "pdf"
    template: Literal["europass", "modern", "academic", "minimal"] | None = None


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    lang: Literal["en", "am"] = "en"
    history: list[dict[str, str]] = Field(default_factory=list)


class EssayIn(BaseModel):
    content: str = Field(min_length=1)
    prompt: str = ""
    wordLimit: int = 500
    lang: Literal["en", "am"] = "en"


class ReminderIn(BaseModel):
    scholarshipId: str | None = None
    remindAt: str
    channel: Literal["push", "telegram", "sms", "email"] = "push"
    note: str | None = None


class FavoriteIn(BaseModel):
    itemId: str
    itemType: Literal["scholarship", "conference"] = "scholarship"


class FavoriteOut(BaseModel):
    id: str
    itemId: str
    itemType: str
    createdAt: str


class GPAIn(BaseModel):
    gpa: float
    scale: float = 4.0
