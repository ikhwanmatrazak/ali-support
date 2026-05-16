from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..auth import get_current_agent
from ..schemas import OverviewStats, TrendPoint, AgentPerf, AgentOut
from .. import models

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/overview", response_model=OverviewStats)
def overview(
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    today = datetime.utcnow().date()

    total_open = db.query(models.Ticket).filter(models.Ticket.status == "open").count()
    total_ip = db.query(models.Ticket).filter(models.Ticket.status == "in_progress").count()
    total_resolved = db.query(models.Ticket).filter(models.Ticket.status == "resolved").count()
    tickets_today = db.query(models.Ticket).filter(
        func.date(models.Ticket.created_at) == today
    ).count()

    # Average response time: time between ticket created_at and first agent message
    resolved_tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.resolved_at != None)
        .all()
    )
    response_times = []
    for t in resolved_tickets:
        first_agent_msg = next(
            (m for m in t.messages if m.sender_type == models.SenderType.agent and not m.is_internal_note),
            None,
        )
        if first_agent_msg:
            delta = (first_agent_msg.sent_at - t.created_at).total_seconds() / 60
            response_times.append(delta)

    avg_rt = round(sum(response_times) / len(response_times), 1) if response_times else None

    return OverviewStats(
        total_open=total_open,
        total_in_progress=total_ip,
        total_resolved=total_resolved,
        avg_response_time_minutes=avg_rt,
        tickets_today=tickets_today,
    )


@router.get("/trends", response_model=List[TrendPoint])
def trends(
    days: int = Query(default=30, ge=7, le=90),
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(
            func.date(models.Ticket.created_at).label("date"),
            func.count(models.Ticket.id).label("count"),
        )
        .filter(models.Ticket.created_at >= since)
        .group_by(func.date(models.Ticket.created_at))
        .order_by(func.date(models.Ticket.created_at))
        .all()
    )
    return [TrendPoint(date=str(r.date), count=r.count) for r in rows]


@router.get("/agent-performance", response_model=List[AgentPerf])
def agent_performance(
    db: Session = Depends(get_db),
    _: models.Agent = Depends(get_current_agent),
):
    agents = db.query(models.Agent).filter(models.Agent.is_active == True).all()
    result = []
    for agent in agents:
        resolved = [
            t for t in agent.tickets
            if t.status == models.TicketStatus.resolved
        ]
        response_times = []
        for t in resolved:
            first_msg = next(
                (m for m in t.messages if m.agent_id == agent.id and not m.is_internal_note),
                None,
            )
            if first_msg:
                delta = (first_msg.sent_at - t.created_at).total_seconds() / 60
                response_times.append(delta)

        avg_rt = round(sum(response_times) / len(response_times), 1) if response_times else None
        result.append(AgentPerf(
            agent=AgentOut.model_validate(agent),
            tickets_resolved=len(resolved),
            avg_response_time_minutes=avg_rt,
        ))
    return result
