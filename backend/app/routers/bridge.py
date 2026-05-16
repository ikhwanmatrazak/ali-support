"""
Proxy endpoints so the frontend can check WhatsApp bridge status via the backend
(avoids CORS issues and keeps bridge port internal).
"""
from fastapi import APIRouter, Depends
import httpx
from ..config import settings
from ..auth import get_current_agent
from .. import models

router = APIRouter(prefix="/bridge", tags=["bridge"])


@router.get("/status")
async def bridge_status(_: models.Agent = Depends(get_current_agent)):
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.WHATSAPP_BRIDGE_URL}/health")
            return r.json()
    except Exception:
        return {"whatsapp_connected": False, "has_qr": False, "error": "Bridge not reachable"}


@router.get("/qr")
async def bridge_qr(_: models.Agent = Depends(get_current_agent)):
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(
                f"{settings.WHATSAPP_BRIDGE_URL}/qr",
                headers={"x-bridge-secret": settings.WHATSAPP_BRIDGE_SECRET},
            )
            return r.json()
    except Exception:
        return {"connected": False, "qr": None}
