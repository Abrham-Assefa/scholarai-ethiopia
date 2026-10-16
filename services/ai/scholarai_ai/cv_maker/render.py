"""Render a CVSchema to PDF with ReportLab. Templates: ``europass`` and ``modern``.

Fonts: if a Noto Sans Ethiopic TTF is available (bundled under ``fonts/`` or pointed to by
``SCHOLARAI_FONT_PATH``) it is registered so Amharic text renders correctly; otherwise we
fall back to Helvetica.
"""

from __future__ import annotations

import io
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .schema import CVSchema

GREEN = colors.HexColor("#078C3F")
GOLD = colors.HexColor("#F2B705")
RED = colors.HexColor("#D91E36")
SLATE = colors.HexColor("#334155")
EUROPASS_BLUE = colors.HexColor("#1F4E79")
NAVY = colors.HexColor("#0F2942")
BURGUNDY = colors.HexColor("#7B1113")
CHARCOAL = colors.HexColor("#1E293B")

_FONT_READY: dict[str, str] = {}


def _font() -> tuple[str, str]:
    """Return (regular, bold) font names, registering Noto Sans Ethiopic if present."""
    if _FONT_READY:
        return _FONT_READY["regular"], _FONT_READY["bold"]
    candidates = [
        os.getenv("SCHOLARAI_FONT_PATH", ""),
        str(Path(__file__).parent / "fonts" / "NotoSansEthiopic-Regular.ttf"),
    ]
    for c in candidates:
        if c and Path(c).exists():
            try:
                pdfmetrics.registerFont(TTFont("NotoEthiopic", c))
                bold = Path(c).with_name("NotoSansEthiopic-Bold.ttf")
                if bold.exists():
                    pdfmetrics.registerFont(TTFont("NotoEthiopic-Bold", str(bold)))
                    _FONT_READY.update(regular="NotoEthiopic", bold="NotoEthiopic-Bold")
                else:
                    _FONT_READY.update(regular="NotoEthiopic", bold="NotoEthiopic")
                return _FONT_READY["regular"], _FONT_READY["bold"]
            except Exception:  # noqa: BLE001
                continue
    _FONT_READY.update(regular="Helvetica", bold="Helvetica-Bold")
    return "Helvetica", "Helvetica-Bold"


LABELS = {
    "en": {
        "summary": "Profile",
        "education": "Education",
        "experience": "Experience",
        "projects": "Projects",
        "skills": "Skills",
        "languages": "Languages",
        "awards": "Awards",
        "certifications": "Certifications",
        "volunteering": "Volunteering",
        "publications": "Publications",
        "gpa": "GPA",
    },
    "am": {
        "summary": "መገለጫ",
        "education": "ትምህርት",
        "experience": "የሥራ ልምድ",
        "projects": "ፕሮጀክቶች",
        "skills": "ክህሎቶች",
        "languages": "ቋንቋዎች",
        "awards": "ሽልማቶች",
        "certifications": "ሰርተፊኬቶች",
        "volunteering": "በጎ ፈቃድ",
        "publications": "ህትመቶች",
        "gpa": "አማካይ ውጤት",
    },
}


def _esc(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _styles(template: str) -> dict[str, ParagraphStyle]:
    reg, bold = _font()
    base = getSampleStyleSheet()["Normal"]
    if template == "modern":
        accent = GREEN
        name_size = 20
        name_color = GREEN
    elif template == "academic":
        accent = NAVY
        name_size = 18
        name_color = NAVY
    elif template == "minimal":
        accent = CHARCOAL
        name_size = 17
        name_color = CHARCOAL
    else:
        accent = EUROPASS_BLUE
        name_size = 16
        name_color = SLATE

    return {
        "name": ParagraphStyle(
            "name",
            parent=base,
            fontName=bold,
            fontSize=name_size,
            leading=name_size + 4,
            textColor=name_color,
        ),
        "contact": ParagraphStyle("contact", parent=base, fontName=reg, fontSize=9, leading=12, textColor=SLATE),
        "h": ParagraphStyle(
            "h", parent=base, fontName=bold, fontSize=11, leading=14, textColor=accent, spaceBefore=8, spaceAfter=3
        ),
        "body": ParagraphStyle("body", parent=base, fontName=reg, fontSize=9.5, leading=13, alignment=TA_LEFT),
        "bold": ParagraphStyle("bold", parent=base, fontName=bold, fontSize=9.5, leading=13),
        "muted": ParagraphStyle("muted", parent=base, fontName=reg, fontSize=8.5, leading=11, textColor=colors.gray),
        "bullet": ParagraphStyle(
            "bullet", parent=base, fontName=reg, fontSize=9.5, leading=13, leftIndent=10, bulletIndent=0
        ),
    }


def _section(title: str, st: dict, template: str) -> list:
    flow = [Paragraph(_esc(title).upper(), st["h"])]
    if template == "modern":
        flow.append(HRFlowable(width="100%", thickness=1.2, color=GOLD, spaceAfter=4))
    elif template == "academic":
        flow.append(HRFlowable(width="100%", thickness=1.0, color=NAVY, spaceAfter=4))
    elif template == "minimal":
        flow.append(HRFlowable(width="100%", thickness=0.6, color=SLATE, spaceAfter=4))
    else:
        flow.append(HRFlowable(width="100%", thickness=0.6, color=EUROPASS_BLUE, spaceAfter=4))
    return flow


def _label_value(label: str, value_flow: list, st: dict) -> Table:
    """Europass-style two-column row (label left, content right)."""
    t = Table([[Paragraph(_esc(label), st["muted"]), value_flow]], colWidths=[38 * mm, 132 * mm])
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return t


def render_pdf(cv: CVSchema, template: str | None = None) -> bytes:
    template = template or cv.meta.template
    lang = cv.meta.lang if cv.meta.lang in LABELS else "en"
    L = LABELS[lang]
    st = _styles(template)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"CV — {cv.personal.fullName}",
        author="ScholarAI Ethiopia",
    )
    f: list = []
    p = cv.personal
    contact_bits = [x for x in (p.email, p.phone, p.city, *p.links) if x]

    if template == "modern":
        header = Table(
            [
                [Paragraph(_esc(p.fullName or "Your Name"), st["name"])],
                [Paragraph(" · ".join(_esc(x) for x in contact_bits), st["contact"])],
            ],
            colWidths=[170 * mm],
        )
        header.setStyle(
            TableStyle(
                [
                    ("LINEBELOW", (0, -1), (-1, -1), 2, GREEN),
                    ("BOTTOMPADDING", (0, -1), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        f.append(header)
    elif template == "academic":
        header = Table(
            [
                [Paragraph(_esc(p.fullName or "Your Name").upper(), st["name"])],
                [Paragraph(" · ".join(_esc(x) for x in contact_bits), st["contact"])],
            ],
            colWidths=[170 * mm],
        )
        header.setStyle(
            TableStyle(
                [
                    ("LINEBELOW", (0, -1), (-1, -1), 1.5, NAVY),
                    ("BOTTOMPADDING", (0, -1), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        f.append(header)
    elif template == "minimal":
        header = Table(
            [
                [Paragraph(_esc(p.fullName or "Your Name"), st["name"])],
                [Paragraph(" | ".join(_esc(x) for x in contact_bits), st["contact"])],
            ],
            colWidths=[170 * mm],
        )
        header.setStyle(
            TableStyle(
                [
                    ("LINEBELOW", (0, -1), (-1, -1), 0.8, SLATE),
                    ("BOTTOMPADDING", (0, -1), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        f.append(header)
    else:
        f.append(Paragraph(_esc(p.fullName or "Your Name"), st["name"]))
        f.append(Paragraph(" | ".join(_esc(x) for x in contact_bits), st["contact"]))
        f.append(Spacer(1, 2))
        f.append(HRFlowable(width="100%", thickness=1.5, color=EUROPASS_BLUE))
    f.append(Spacer(1, 6))

    if cv.summary:
        f += _section(L["summary"], st, template)
        f.append(Paragraph(_esc(cv.summary), st["body"]))

    if cv.education:
        f += _section(L["education"], st, template)
        for e in cv.education:
            title = " — ".join(x for x in (e.degree, e.field) if x)
            gpa = f" · {L['gpa']} {e.gpa}/{e.scale}" if e.gpa else ""
            content = [
                Paragraph(f"<b>{_esc(title or e.institution)}</b>", st["body"]),
                Paragraph(_esc(f"{e.institution}{gpa}"), st["muted"]),
            ]
            content += [Paragraph(f"• {_esc(h)}", st["bullet"]) for h in e.honors]
            period = " – ".join(x for x in (e.start, e.end) if x)
            f.append(
                _label_value(period, content, st)
                if template == "europass"
                else Table(
                    [[content, Paragraph(_esc(period), st["muted"])]],
                    colWidths=[135 * mm, 35 * mm],
                    style=[
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ],
                )
            )

    if cv.experience:
        f += _section(L["experience"], st, template)
        for x in cv.experience:
            content = [Paragraph(f"<b>{_esc(x.role)}</b>", st["body"]), Paragraph(_esc(x.org), st["muted"])]
            content += [Paragraph(f"• {_esc(b)}", st["bullet"]) for b in x.bullets]
            period = " – ".join(y for y in (x.start, x.end) if y)
            f.append(
                _label_value(period, content, st)
                if template == "europass"
                else Table(
                    [[content, Paragraph(_esc(period), st["muted"])]],
                    colWidths=[135 * mm, 35 * mm],
                    style=[
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ],
                )
            )
            f.append(Spacer(1, 3))

    if cv.projects:
        f += _section(L["projects"], st, template)
        for pr in cv.projects:
            tech = f" ({', '.join(pr.tech)})" if pr.tech else ""
            f.append(Paragraph(f"<b>{_esc(pr.name)}</b>{_esc(tech)} — {_esc(pr.description)}", st["body"]))

    skills = [*cv.skills.technical, *cv.skills.tools, *cv.skills.soft]
    if skills:
        f += _section(L["skills"], st, template)
        f.append(Paragraph(_esc(" · ".join(skills)), st["body"]))

    if cv.languages:
        f += _section(L["languages"], st, template)
        f.append(
            Paragraph(
                _esc(" · ".join(f"{lg.name} ({lg.level})" if lg.level else lg.name for lg in cv.languages)), st["body"]
            )
        )

    for key in ("awards", "certifications", "volunteering", "publications"):
        items = getattr(cv, key)
        if items:
            f += _section(L[key], st, template)
            f += [Paragraph(f"• {_esc(i)}", st["bullet"]) for i in items]

    f.append(Spacer(1, 10))
    f.append(Paragraph("Generated with ScholarAI Ethiopia · scholarai.et", st["muted"]))
    doc.build(f)
    return buf.getvalue()
