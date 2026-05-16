from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_agent
from ..schemas import TemplateCreate, TemplateUpdate, TemplateOut
from .. import models

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[TemplateOut])
def list_templates(
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    return db.query(models.AutoReplyTemplate).order_by(models.AutoReplyTemplate.created_at).all()


@router.post("", response_model=TemplateOut)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    tpl = models.AutoReplyTemplate(**payload.model_dump())
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.put("/{tpl_id}", response_model=TemplateOut)
def update_template(
    tpl_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    tpl = db.query(models.AutoReplyTemplate).filter(models.AutoReplyTemplate.id == tpl_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(tpl, field, value)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/{tpl_id}")
def delete_template(
    tpl_id: int,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    tpl = db.query(models.AutoReplyTemplate).filter(models.AutoReplyTemplate.id == tpl_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tpl)
    db.commit()
    return {"ok": True}
