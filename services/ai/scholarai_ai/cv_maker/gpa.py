"""GPA conversion from the Ethiopian 4.0 scale to German, UK and US systems."""

from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass
class GPAConversion:
    ethiopian: float
    scale: float
    percentage: float
    german: float  # Modified Bavarian formula (1.0 best – 4.0 pass)
    german_label: str
    uk: str
    us_gpa: float
    us_letter: str

    def dict(self) -> dict:
        return asdict(self)


def bavarian(grade: float, n_max: float = 4.0, n_min: float = 2.0) -> float:
    """Modified Bavarian formula: x = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin).

    Ethiopian universities usually require 2.0 to graduate, so Nmin = 2.0.
    """
    grade = max(min(grade, n_max), n_min)
    return round(1 + 3 * (n_max - grade) / (n_max - n_min), 1)


def german_label(x: float) -> str:
    if x <= 1.5:
        return "sehr gut (very good)"
    if x <= 2.5:
        return "gut (good)"
    if x <= 3.5:
        return "befriedigend (satisfactory)"
    if x <= 4.0:
        return "ausreichend (sufficient)"
    return "nicht ausreichend (fail)"


def uk_classification(gpa: float) -> str:
    if gpa >= 3.7:
        return "First-class honours (1st)"
    if gpa >= 3.3:
        return "Upper second-class (2:1)"
    if gpa >= 2.7:
        return "Lower second-class (2:2)"
    if gpa >= 2.0:
        return "Third-class (3rd)"
    return "Fail"


def us_letter(gpa: float) -> str:
    bands = [
        (3.85, "A"),
        (3.5, "A-"),
        (3.15, "B+"),
        (2.85, "B"),
        (2.5, "B-"),
        (2.15, "C+"),
        (1.85, "C"),
        (1.5, "C-"),
        (1.0, "D"),
    ]
    for cutoff, letter in bands:
        if gpa >= cutoff:
            return letter
    return "F"


def convert_gpa(gpa: float, scale: float = 4.0) -> GPAConversion:
    if scale <= 0:
        raise ValueError("scale must be positive")
    if gpa < 0 or gpa > scale:
        raise ValueError(f"gpa must be within 0..{scale}")
    g4 = gpa * 4.0 / scale if scale != 4.0 else gpa
    g4 = round(g4, 2)
    german = bavarian(g4)
    return GPAConversion(
        ethiopian=gpa,
        scale=scale,
        percentage=round(g4 / 4.0 * 100, 1),
        german=german,
        german_label=german_label(german),
        uk=uk_classification(g4),
        us_gpa=g4,
        us_letter=us_letter(g4),
    )
