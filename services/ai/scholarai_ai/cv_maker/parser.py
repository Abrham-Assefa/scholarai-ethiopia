"""Turn loose form input (dict with possibly missing/odd keys) into a validated CVSchema."""

from __future__ import annotations

import re
from typing import Any

from .schema import CVSchema

_ALIASES = {
    "name": ("personal", "fullName"),
    "full_name": ("personal", "fullName"),
    "fullName": ("personal", "fullName"),
    "email": ("personal", "email"),
    "phone": ("personal", "phone"),
    "city": ("personal", "city"),
}


def _split_list(v: Any) -> list[str]:
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    return [s.strip() for s in re.split(r"[,\n;•]+", str(v)) if s.strip()]


def parse_form(data: dict[str, Any]) -> CVSchema:
    """Accept either a full CVSchema-like dict or a flattened wizard payload."""
    data = dict(data or {})
    personal = dict(data.get("personal") or {})
    for key, (section, field) in _ALIASES.items():
        if key in data and section == "personal":
            personal.setdefault(field, data.pop(key))
    data["personal"] = personal

    for exp in data.get("experience") or []:
        if isinstance(exp, dict) and isinstance(exp.get("bullets"), str):
            exp["bullets"] = _split_list(exp["bullets"])
    skills = data.get("skills")
    if isinstance(skills, (str, list)):
        data["skills"] = {"technical": _split_list(skills)}
    elif isinstance(skills, dict):
        data["skills"] = {k: _split_list(v) for k, v in skills.items()}
    for k in ("awards", "certifications", "volunteering", "publications"):
        if k in data:
            data[k] = _split_list(data[k])
    if isinstance(data.get("languages"), str):
        data["languages"] = [{"name": n, "level": "Fluent"} for n in _split_list(data["languages"])]
    return CVSchema.model_validate(data)
