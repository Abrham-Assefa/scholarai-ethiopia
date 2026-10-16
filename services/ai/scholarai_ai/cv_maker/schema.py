"""Pydantic mirror of packages/schemas/cv.schema.json."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Personal(BaseModel):
    fullName: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""
    links: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    gpa: str | float | None = None
    scale: str = "4.0"
    start: str = ""
    end: str = ""
    honors: list[str] = Field(default_factory=list)


class Experience(BaseModel):
    org: str = ""
    role: str = ""
    start: str = ""
    end: str = ""
    bullets: list[str] = Field(default_factory=list)


class Project(BaseModel):
    name: str = ""
    description: str = ""
    tech: list[str] = Field(default_factory=list)
    link: str = ""


class Skills(BaseModel):
    technical: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)


class Language(BaseModel):
    name: str = ""
    level: str = ""


class Meta(BaseModel):
    targetScholarshipId: str | None = None
    template: Literal["europass", "modern", "academic", "minimal"] = "europass"
    lang: Literal["en", "am"] = "en"


class CVSchema(BaseModel):
    personal: Personal = Field(default_factory=Personal)
    summary: str = ""
    education: list[Education] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    skills: Skills = Field(default_factory=Skills)
    languages: list[Language] = Field(default_factory=lambda: [Language(name="Amharic", level="Native")])
    awards: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    volunteering: list[str] = Field(default_factory=list)
    publications: list[str] = Field(default_factory=list)
    meta: Meta = Field(default_factory=Meta)
