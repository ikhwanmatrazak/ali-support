"""
Receives incoming WhatsApp messages from the Baileys bridge
and creates/updates tickets accordingly.
"""
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..config import settings
from ..schemas import WhatsAppIncoming
from ..websocket_manager import manager
from ..kb_matcher import match_kb, match_greeting_template, detect_language
from .. import models

import httpx

router = APIRouter(prefix="/webhook", tags=["webhook"])


def _verify_bridge_secret(x_bridge_secret: str = Header(None)):
    if x_bridge_secret != settings.BRIDGE_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/whatsapp/incoming")
async def incoming_whatsapp(
    payload: WhatsAppIncoming,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_bridge_secret),
):
    phone = payload.from_number.replace("+", "").replace(" ", "").replace("-", "")

    # Upsert customer
    customer = db.query(models.Customer).filter(
        models.Customer.whatsapp_number == phone
    ).first()
    if not customer:
        customer = models.Customer(whatsapp_number=phone)
        db.add(customer)
        db.flush()

    # Find open/in-progress ticket for this customer, or create new one
    ticket = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.customer_id == customer.id,
            models.Ticket.status.in_([models.TicketStatus.open, models.TicketStatus.in_progress]),
        )
        .order_by(models.Ticket.created_at.desc())
        .first()
    )

    is_new_ticket = ticket is None
    if is_new_ticket:
        ticket = models.Ticket(
            customer_id=customer.id,
            subject=payload.content[:100] if payload.content else "WhatsApp Message",
            priority=_detect_priority(payload.content),
        )
        db.add(ticket)
        db.flush()

    # Save incoming message
    msg = models.Message(
        ticket_id=ticket.id,
        sender_type=models.SenderType.customer,
        content=payload.content,
        media_url=payload.media_url,
        media_type=payload.media_type,
        wa_message_id=payload.message_id,
    )
    db.add(msg)
    db.commit()
    db.refresh(ticket)

    # KB matching & auto-reply
    lang = detect_language(payload.content)
    auto_reply_text: str | None = None

    if is_new_ticket:
        # Send greeting first
        greeting = match_greeting_template(db, lang)
        if greeting:
            greeting = greeting.replace("{ticket_id}", str(ticket.id))
            auto_reply_text = greeting
    else:
        # Try KB match for subsequent messages
        match = match_kb(payload.content, db)
        if match:
            auto_reply_text = match["reply"]

    if auto_reply_text:
        # Save auto-reply message
        auto_msg = models.Message(
            ticket_id=ticket.id,
            sender_type=models.SenderType.system,
            content=auto_reply_text,
        )
        db.add(auto_msg)
        db.commit()
        # Send via WhatsApp
        asyncio.create_task(_send_whatsapp(phone, auto_reply_text))

    # Push real-time notification to all dashboard agents
    event = "new_ticket" if is_new_ticket else "new_message"
    await manager.broadcast(event, {
        "ticket_id": ticket.id,
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "whatsapp_number": customer.whatsapp_number,
        },
        "message": {
            "content": payload.content,
            "media_url": payload.media_url,
            "sent_at": datetime.utcnow().isoformat(),
        },
    })

    return {"ok": True, "ticket_id": ticket.id, "is_new": is_new_ticket}


def _detect_priority(text: str) -> models.TicketPriority:
    """Bump priority to urgent if message contains urgency keywords."""
    urgent_keywords = {"urgent", "urgently", "emergency", "down", "cannot login", "error", "segera", "kecemasan"}
    text_lower = text.lower()
    if any(kw in text_lower for kw in urgent_keywords):
        return models.TicketPriority.urgent
    return models.TicketPriority.medium


async def _send_whatsapp(phone: str, message: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{settings.WHATSAPP_BRIDGE_URL}/send-message",
                json={"to": phone, "message": message},
                headers={"x-bridge-secret": settings.WHATSAPP_BRIDGE_SECRET},
            )
    except Exception:
        pass
