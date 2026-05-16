"""
Rule-based knowledge base keyword matcher.
Tokenizes incoming message text, scores KB articles by keyword hits,
and returns the best match above a minimum threshold.
"""
from __future__ import annotations
import re
from typing import Optional
from sqlalchemy.orm import Session
from . import models

# Common BM words used to detect language
_BM_INDICATORS = {
    "saya", "anda", "tidak", "ada", "boleh", "kami", "awak", "tolong",
    "bantu", "masalah", "ingin", "hendak", "mahu", "terima", "kasih",
    "selamat", "pagi", "petang", "malam", "bagaimana", "kenapa", "bila",
}

MIN_SCORE = 1  # minimum keyword hits to consider a match


def _tokenize(text: str) -> set[str]:
    text = text.lower()
    tokens = set(re.findall(r"[a-z0-9]+", text))
    return tokens


def detect_language(text: str) -> str:
    """Return 'bm' if the message appears to be Bahasa Malaysia, else 'en'."""
    tokens = _tokenize(text)
    if len(tokens & _BM_INDICATORS) >= 2:
        return "bm"
    return "en"


def match_kb(message_text: str, db: Session) -> Optional[dict]:
    """
    Find the best matching KB article for a message.
    Returns a dict with article data and detected language, or None.
    """
    tokens = _tokenize(message_text)
    if not tokens:
        return None

    lang = detect_language(message_text)

    articles = (
        db.query(models.KBArticle)
        .filter(models.KBArticle.is_active == True)
        .all()
    )

    best_score = 0
    best_article = None

    for article in articles:
        score = sum(
            1 for kw in article.keywords
            if kw.keyword.lower() in tokens
        )
        if score > best_score:
            best_score = score
            best_article = article

    if best_score < MIN_SCORE or best_article is None:
        return None

    reply = best_article.content_bm if (lang == "bm" and best_article.content_bm) else best_article.content_en

    return {
        "article_id": best_article.id,
        "article_title": best_article.title,
        "reply": reply,
        "language": lang,
        "score": best_score,
    }


def match_greeting_template(db: Session, lang: str) -> Optional[str]:
    """Return the greeting auto-reply template text, if one exists."""
    tpl = (
        db.query(models.AutoReplyTemplate)
        .filter(
            models.AutoReplyTemplate.is_greeting == True,
            models.AutoReplyTemplate.is_active == True,
        )
        .first()
    )
    if not tpl:
        return None
    return tpl.reply_bm if (lang == "bm" and tpl.reply_bm) else tpl.reply_en
