from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from .database import Base
import enum


class AgentRole(str, enum.Enum):
    admin = "admin"
    agent = "agent"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class SenderType(str, enum.Enum):
    customer = "customer"
    agent = "agent"
    system = "system"


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(AgentRole), default=AgentRole.agent, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="assigned_agent")
    messages = relationship("Message", back_populates="agent")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    whatsapp_number = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="customer")


TICKET_CATEGORIES = [
    "Bug Report",
    "Account Issue",
    "Billing",
    "Feature Request",
    "General Inquiry",
    "Service Inquiry",
]


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    status = Column(SAEnum(TicketStatus), default=TicketStatus.open, nullable=False)
    priority = Column(SAEnum(TicketPriority), default=TicketPriority.medium, nullable=False)
    category = Column(String(50), default="General Inquiry")
    tags = Column(JSON, default=list)
    subject = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    customer = relationship("Customer", back_populates="tickets")
    assigned_agent = relationship("Agent", back_populates="tickets")
    messages = relationship("Message", back_populates="ticket", order_by="Message.sent_at")
    activity_logs = relationship("ActivityLog", back_populates="ticket")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    sender_type = Column(SAEnum(SenderType), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    content = Column(Text, nullable=False)
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(50), nullable=True)  # image, document, audio
    is_internal_note = Column(Boolean, default=False)
    wa_message_id = Column(String(100), nullable=True)  # WhatsApp message ID
    sent_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="messages")
    agent = relationship("Agent", back_populates="messages")


class KBArticle(Base):
    __tablename__ = "kb_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content_en = Column(Text, nullable=False)
    content_bm = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("agents.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    keywords = relationship("KBKeyword", back_populates="article", cascade="all, delete-orphan")


class KBKeyword(Base):
    __tablename__ = "kb_keywords"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("kb_articles.id"), nullable=False)
    keyword = Column(String(100), nullable=False, index=True)

    article = relationship("KBArticle", back_populates="keywords")


class AutoReplyTemplate(Base):
    __tablename__ = "auto_reply_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    trigger_keyword = Column(String(200), nullable=True)
    reply_en = Column(Text, nullable=False)
    reply_bm = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_greeting = Column(Boolean, default=False)  # sent on first message
    created_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g. "status_changed", "assigned"
    detail = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="activity_logs")
