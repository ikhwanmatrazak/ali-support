from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from .models import AgentRole, TicketStatus, TicketPriority, SenderType


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    agent: "AgentOut"


# ─── Agents ───────────────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: AgentRole = AgentRole.agent

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[AgentRole] = None
    is_active: Optional[bool] = None

class AgentOut(BaseModel):
    id: int
    name: str
    email: str
    role: AgentRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Customers ────────────────────────────────────────────────────────────────

class CustomerOut(BaseModel):
    id: int
    whatsapp_number: str
    name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class CustomerUpdate(BaseModel):
    name: Optional[str] = None


# ─── Messages ─────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: int
    ticket_id: int
    sender_type: SenderType
    agent_id: Optional[int]
    content: str
    media_url: Optional[str]
    media_type: Optional[str]
    is_internal_note: bool
    sent_at: datetime

    model_config = {"from_attributes": True}


# ─── Tickets ──────────────────────────────────────────────────────────────────

class TicketOut(BaseModel):
    id: int
    customer_id: int
    assigned_agent_id: Optional[int]
    status: TicketStatus
    priority: TicketPriority
    category: str
    tags: List[str]
    subject: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    customer: CustomerOut
    assigned_agent: Optional[AgentOut]
    messages: List[MessageOut] = []

    model_config = {"from_attributes": True}

class TicketListItem(BaseModel):
    id: int
    customer: CustomerOut
    assigned_agent: Optional[AgentOut]
    status: TicketStatus
    priority: TicketPriority
    category: str
    subject: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None

    model_config = {"from_attributes": True}

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    tags: Optional[List[str]] = None

class ReplyRequest(BaseModel):
    content: str
    is_internal_note: bool = False

class NoteRequest(BaseModel):
    content: str


# ─── Knowledge Base ───────────────────────────────────────────────────────────

class KBArticleCreate(BaseModel):
    title: str
    content_en: str
    content_bm: Optional[str] = None
    category: Optional[str] = None
    keywords: List[str] = []

class KBArticleUpdate(BaseModel):
    title: Optional[str] = None
    content_en: Optional[str] = None
    content_bm: Optional[str] = None
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_active: Optional[bool] = None

class KBArticleOut(BaseModel):
    id: int
    title: str
    content_en: str
    content_bm: Optional[str]
    category: Optional[str]
    is_active: bool
    keywords: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Auto-reply Templates ─────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str
    trigger_keyword: Optional[str] = None
    reply_en: str
    reply_bm: Optional[str] = None
    is_greeting: bool = False

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    trigger_keyword: Optional[str] = None
    reply_en: Optional[str] = None
    reply_bm: Optional[str] = None
    is_active: Optional[bool] = None
    is_greeting: Optional[bool] = None

class TemplateOut(BaseModel):
    id: int
    name: str
    trigger_keyword: Optional[str]
    reply_en: str
    reply_bm: Optional[str]
    is_active: bool
    is_greeting: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Reports ──────────────────────────────────────────────────────────────────

class OverviewStats(BaseModel):
    total_open: int
    total_in_progress: int
    total_resolved: int
    avg_response_time_minutes: Optional[float]
    tickets_today: int

class TrendPoint(BaseModel):
    date: str
    count: int

class AgentPerf(BaseModel):
    agent: AgentOut
    tickets_resolved: int
    avg_response_time_minutes: Optional[float]


# ─── WebSocket events ─────────────────────────────────────────────────────────

class WSEvent(BaseModel):
    event: str          # "new_ticket" | "ticket_updated" | "new_message"
    payload: dict


# ─── Webhook (incoming from Baileys bridge) ──────────────────────────────────

class WhatsAppIncoming(BaseModel):
    from_number: str
    message_id: str
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    timestamp: int


TokenResponse.model_rebuild()
