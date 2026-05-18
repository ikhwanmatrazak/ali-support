import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
import httpx

from ..database import get_db
from ..auth import get_current_agent
from ..schemas import TicketOut, TicketListItem, TicketUpdate, ReplyRequest, MessageOut
from ..websocket_manager import manager
from ..config import settings
from .. import models

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _last_message(ticket: models.Ticket) -> Optional[str]:
    visible = [m for m in ticket.messages if not m.is_internal_note]
    if not visible:
        return None
    return visible[-1].content[:100]


@router.get("", response_model=List[TicketListItem])
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    agent_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    qs = (
        db.query(models.Ticket)
        .options(
            joinedload(models.Ticket.customer),
            joinedload(models.Ticket.assigned_agent),
            joinedload(models.Ticket.messages),
        )
        .order_by(desc(models.Ticket.updated_at))
    )
    if status:
        qs = qs.filter(models.Ticket.status == status)
    if priority:
        qs = qs.filter(models.Ticket.priority == priority)
    if agent_id:
        qs = qs.filter(models.Ticket.assigned_agent_id == agent_id)
    if category:
        qs = qs.filter(models.Ticket.category == category)
    if q:
        qs = qs.join(models.Customer).filter(
            models.Customer.name.ilike(f"%{q}%") |
            models.Customer.whatsapp_number.ilike(f"%{q}%") |
            models.Ticket.subject.ilike(f"%{q}%")
        )

    tickets = qs.all()
    result = []
    for t in tickets:
        item = TicketListItem.model_validate(t)
        item.last_message = _last_message(t)
        result.append(item)
    return result


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    ticket = (
        db.query(models.Ticket)
        .options(
            joinedload(models.Ticket.customer),
            joinedload(models.Ticket.assigned_agent),
            joinedload(models.Ticket.messages),
        )
        .filter(models.Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    changes = payload.model_dump(exclude_none=True)
    old_status = ticket.status

    for field, value in changes.items():
        setattr(ticket, field, value)

    if "status" in changes and changes["status"] == "resolved" and old_status != "resolved":
        ticket.resolved_at = datetime.utcnow()

    log = models.ActivityLog(
        ticket_id=ticket_id,
        agent_id=current_agent.id,
        action="ticket_updated",
        detail=changes,
    )
    db.add(log)
    db.commit()

    db.refresh(ticket)
    await manager.broadcast("ticket_updated", {"ticket_id": ticket_id, "changes": changes})
    return ticket


@router.post("/{ticket_id}/reply", response_model=MessageOut)
async def reply_to_ticket(
    ticket_id: int,
    payload: ReplyRequest,
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msg = models.Message(
        ticket_id=ticket_id,
        sender_type=models.SenderType.agent,
        agent_id=current_agent.id,
        content=payload.content,
        is_internal_note=payload.is_internal_note,
    )
    db.add(msg)

    # Move ticket to in_progress if it's still open
    if ticket.status == models.TicketStatus.open:
        ticket.status = models.TicketStatus.in_progress

    db.commit()
    db.refresh(msg)

    # Send to WhatsApp only for real replies (not internal notes)
    if not payload.is_internal_note:
        customer = db.query(models.Customer).filter(models.Customer.id == ticket.customer_id).first()
        asyncio.create_task(_send_whatsapp(customer.whatsapp_number, payload.content))

    await manager.broadcast("new_message", {
        "ticket_id": ticket_id,
        "message": {
            "id": msg.id,
            "sender_type": msg.sender_type,
            "content": msg.content,
            "is_internal_note": msg.is_internal_note,
            "sent_at": msg.sent_at.isoformat(),
        }
    })
    return msg


async def _send_whatsapp(phone: str, message: str):
    """Fire-and-forget: send message via Baileys bridge."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.WHATSAPP_BRIDGE_URL}/send-message",
                json={"to": phone, "message": message},
                headers={"x-bridge-secret": settings.WHATSAPP_BRIDGE_SECRET},
            )
            if resp.status_code != 200:
                print(f"[WA] Bridge error {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[WA] Failed to send to {phone}: {e}")
