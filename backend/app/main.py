import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .auth import get_current_agent
from .websocket_manager import manager
from .routers import auth, agents, customers, tickets, knowledge_base, templates, reports, webhook, bridge
from . import models  # noqa: F401  — ensures models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    _seed_defaults()
    yield


def _seed_defaults():
    """Insert default admin + greeting template if DB is empty."""
    from .database import SessionLocal
    from .auth import hash_password

    db = SessionLocal()
    try:
        if not db.query(models.Agent).first():
            admin = models.Agent(
                name="Admin",
                email="admin@ali-support.my",
                password_hash=hash_password("Admin@1234"),
                role=models.AgentRole.admin,
            )
            db.add(admin)

        if not db.query(models.AutoReplyTemplate).first():
            tpl = models.AutoReplyTemplate(
                name="Greeting",
                reply_en=(
                    "Hello! Thank you for contacting Ali Support. "
                    "We have received your message and our team will assist you shortly. "
                    "Your ticket ID is #{ticket_id}."
                ),
                reply_bm=(
                    "Halo! Terima kasih kerana menghubungi Ali Support. "
                    "Kami telah menerima mesej anda dan pasukan kami akan membantu anda tidak lama lagi. "
                    "ID tiket anda ialah #{ticket_id}."
                ),
                is_greeting=True,
                is_active=True,
            )
            db.add(tpl)
            db.commit()
    finally:
        db.close()


app = FastAPI(
    title="Ali Support API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media files
os.makedirs("media", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Routers
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(customers.router)
app.include_router(tickets.router)
app.include_router(knowledge_base.router)
app.include_router(templates.router)
app.include_router(reports.router)
app.include_router(webhook.router)
app.include_router(bridge.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket for real-time dashboard events.
    Client must send {"token": "<jwt>"} as first message after connecting.
    """
    await websocket.accept()
    try:
        auth_msg = await websocket.receive_json()
        token = auth_msg.get("token", "")

        from .database import SessionLocal
        db = SessionLocal()
        try:
            from jose import jwt as jose_jwt, JWTError
            from .config import settings
            payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            agent_id = int(payload["sub"])
            agent = db.query(models.Agent).filter(models.Agent.id == agent_id, models.Agent.is_active == True).first()
            if not agent:
                await websocket.close(code=4001)
                return
        except Exception:
            await websocket.close(code=4001)
            return
        finally:
            db.close()

        # Re-use manager — but we already accepted, so connect manually
        manager._connections.setdefault(agent_id, set()).add(websocket)
        await websocket.send_json({"event": "connected", "payload": {"agent_id": agent_id}})

        # Keep connection alive — listen for pings
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
