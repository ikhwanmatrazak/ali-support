from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_agent
from ..schemas import KBArticleCreate, KBArticleUpdate, KBArticleOut
from .. import models

router = APIRouter(prefix="/kb", tags=["knowledge-base"])


def _serialize(article: models.KBArticle) -> KBArticleOut:
    keywords = [kw.keyword for kw in article.keywords]
    out = KBArticleOut.model_validate(article)
    out.keywords = keywords
    return out


@router.get("", response_model=List[KBArticleOut])
def list_articles(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    qs = db.query(models.KBArticle).filter(models.KBArticle.is_active == True)
    if q:
        qs = qs.filter(
            models.KBArticle.title.ilike(f"%{q}%") |
            models.KBArticle.content_en.ilike(f"%{q}%")
        )
    if category:
        qs = qs.filter(models.KBArticle.category == category)
    return [_serialize(a) for a in qs.order_by(models.KBArticle.created_at.desc()).all()]


@router.get("/{article_id}", response_model=KBArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    article = db.query(models.KBArticle).filter(models.KBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return _serialize(article)


@router.post("", response_model=KBArticleOut)
def create_article(
    payload: KBArticleCreate,
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    article = models.KBArticle(
        title=payload.title,
        content_en=payload.content_en,
        content_bm=payload.content_bm,
        category=payload.category,
        created_by=current_agent.id,
    )
    db.add(article)
    db.flush()

    for kw in set(k.strip().lower() for k in payload.keywords if k.strip()):
        db.add(models.KBKeyword(article_id=article.id, keyword=kw))

    db.commit()
    db.refresh(article)
    return _serialize(article)


@router.put("/{article_id}", response_model=KBArticleOut)
def update_article(
    article_id: int,
    payload: KBArticleUpdate,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    article = db.query(models.KBArticle).filter(models.KBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        if field == "keywords":
            continue
        setattr(article, field, value)

    if payload.keywords is not None:
        db.query(models.KBKeyword).filter(models.KBKeyword.article_id == article_id).delete()
        for kw in set(k.strip().lower() for k in payload.keywords if k.strip()):
            db.add(models.KBKeyword(article_id=article_id, keyword=kw))

    db.commit()
    db.refresh(article)
    return _serialize(article)


@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    article = db.query(models.KBArticle).filter(models.KBArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.is_active = False
    db.commit()
    return {"ok": True}
