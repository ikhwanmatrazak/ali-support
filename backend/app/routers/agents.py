from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_agent, require_admin, hash_password
from ..schemas import AgentCreate, AgentUpdate, AgentOut
from .. import models

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=List[AgentOut])
def list_agents(
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    return db.query(models.Agent).order_by(models.Agent.created_at).all()


@router.post("", response_model=AgentOut)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(require_admin),
):
    if db.query(models.Agent).filter(models.Agent.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    agent = models.Agent(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.patch("/{agent_id}", response_model=AgentOut)
def update_agent(
    agent_id: int,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(require_admin),
):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent
