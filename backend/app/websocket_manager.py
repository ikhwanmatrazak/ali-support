import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # agent_id → set of WebSocket connections (same agent can open multiple tabs)
        self._connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, agent_id: int):
        await websocket.accept()
        self._connections.setdefault(agent_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket, agent_id: int):
        conns = self._connections.get(agent_id, set())
        conns.discard(websocket)
        if not conns:
            self._connections.pop(agent_id, None)

    async def broadcast(self, event: str, payload: dict):
        """Send an event to ALL connected agents."""
        message = json.dumps({"event": event, "payload": payload})
        dead: list[tuple[int, WebSocket]] = []
        for agent_id, sockets in self._connections.items():
            for ws in list(sockets):
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append((agent_id, ws))
        for agent_id, ws in dead:
            self.disconnect(ws, agent_id)

    async def send_to_agent(self, agent_id: int, event: str, payload: dict):
        """Send an event to a specific agent only."""
        message = json.dumps({"event": event, "payload": payload})
        sockets = list(self._connections.get(agent_id, set()))
        for ws in sockets:
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(ws, agent_id)


manager = ConnectionManager()
