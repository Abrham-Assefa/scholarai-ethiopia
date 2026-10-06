"""Dependency-free HTML → structured text (blocks, headings, list items, links)."""

from __future__ import annotations

import html as htmllib
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser

SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "header", "form", "iframe", "ins", "aside", "button"}
BLOCK = {"p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "dt", "dd", "blockquote", "br", "div", "section"}
CONTENT_MARKERS = ("entry-content", "post-content", "article-content", "td-post-content", "single-content")
CONTENT_END = ("sharedaddy", "post-tags", "jp-relatedposts", "related-posts", 'id="comments"', "penci-post-share",
               "</article>")


@dataclass
class Block:
    kind: str  # h | p | li
    text: str


@dataclass
class Doc:
    blocks: list[Block] = field(default_factory=list)
    links: list[tuple[str, str]] = field(default_factory=list)

    @property
    def text(self) -> str:
        return "\n".join(b.text for b in self.blocks)


class _Parser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.doc = Doc()
        self.skip = 0
        self.buf: list[str] = []
        self.kind = "p"
        self.href: str | None = None
        self.atext: list[str] = []

    def _flush(self) -> None:
        t = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        if t:
            self.doc.blocks.append(Block(self.kind, t))
        self.buf = []
        self.kind = "p"

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.skip += 1
            return
        if self.skip:
            return
        if tag in BLOCK:
            self._flush()
            if tag[0] == "h" and tag[1:].isdigit():
                self.kind = "h"
            elif tag == "li":
                self.kind = "li"
        if tag == "a":
            self.href = dict(attrs).get("href")
            self.atext = []

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if tag == "a" and self.href:
            self.doc.links.append((self.href, re.sub(r"\s+", " ", "".join(self.atext)).strip()))
            self.href = None
        if tag in BLOCK:
            self._flush()

    def handle_data(self, data):
        if self.skip:
            return
        self.buf.append(data)
        if self.href is not None:
            self.atext.append(data)


def main_content(raw: str) -> str:
    """Slice the article body out of a full blog page when we can recognise it."""
    low = raw.lower()
    starts = [i for m in CONTENT_MARKERS if (i := low.find(m)) >= 0]
    if not starts:
        return raw
    start = raw.rfind("<", 0, min(starts))
    ends = [i for m in CONTENT_END if (i := low.find(m.lower(), min(starts) + 200)) >= 0]
    return raw[max(start, 0) : min(ends) if ends else len(raw)]


def parse_html(raw: str, article: bool = False) -> Doc:
    p = _Parser()
    try:
        p.feed(main_content(raw) if article else raw)
        p.close()
    except Exception:  # noqa: BLE001 — malformed markup: keep what we parsed
        pass
    p._flush()
    return p.doc


def strip_tags(s: str) -> str:
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()
