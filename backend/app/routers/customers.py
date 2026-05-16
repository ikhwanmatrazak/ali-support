from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_agent
from ..schemas import CustomerOut, CustomerUpdate, TicketListItem
from .. import models

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=List[CustomerOut])
def list_customers(
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    qs = db.query(models.Customer)
    if q:
        qs = qs.filter(
            models.Customer.name.ilike(f"%{q}%") |
            models.Customer.whatsapp_number.ilike(f"%{q}%")
        )
    return qs.order_by(models.Customer.created_at.desc()).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    c = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    c = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    if payload.name is not None:
        c.name = payload.name
    db.commit()
    db.refresh(c)
    return c


@router.get("/{customer_id}/tickets")
def customer_tickets(
    customer_id: int,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.customer_id == customer_id)
        .order_by(models.Ticket.created_at.desc())
        .all()
    )
    return tickets
