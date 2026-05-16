from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import verify_password, create_access_token, get_current_agent
from ..schemas import LoginRequest, TokenResponse, AgentOut
from .. import models

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(
        models.Agent.email == payload.email,
        models.Agent.is_active == True,
    ).first()
    if not agent or not verify_password(payload.password, agent.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(agent.id)})
    return TokenResponse(access_token=token, agent=AgentOut.model_validate(agent))


@router.get("/me", response_model=AgentOut)
def me(agent: models.Agent = Depends(get_current_agent)):
    return agent
