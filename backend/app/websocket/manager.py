"""
DriveGuard AI — WebSocket Connection Manager
Manages live connections for monitoring, driver dashboard, and admin dashboard.
"""
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger("DriveGuardWS")


class ConnectionManager:
    """Manages WebSocket connections grouped by channel."""

    def __init__(self):
        # session_id -> list of websockets (monitoring)
        self.monitor_connections: Dict[str, List[WebSocket]] = {}
        # user_id -> list of websockets (driver dashboard)
        self.driver_connections: Dict[str, List[WebSocket]] = {}
        # admin dashboard connections
        self.admin_connections: List[WebSocket] = []

    async def connect_monitor(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.monitor_connections:
            self.monitor_connections[session_id] = []
        self.monitor_connections[session_id].append(websocket)
        logger.info(f"Monitor WS connected: session={session_id}")

    async def connect_driver(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.driver_connections:
            self.driver_connections[user_id] = []
        self.driver_connections[user_id].append(websocket)
        logger.info(f"Driver dashboard WS connected: user={user_id}")

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)
        logger.info("Admin dashboard WS connected")

    def disconnect_monitor(self, websocket: WebSocket, session_id: str):
        if session_id in self.monitor_connections:
            self.monitor_connections[session_id] = [
                ws for ws in self.monitor_connections[session_id] if ws != websocket
            ]
            if not self.monitor_connections[session_id]:
                del self.monitor_connections[session_id]
        logger.info(f"Monitor WS disconnected: session={session_id}")

    def disconnect_driver(self, websocket: WebSocket, user_id: str):
        if user_id in self.driver_connections:
            self.driver_connections[user_id] = [
                ws for ws in self.driver_connections[user_id] if ws != websocket
            ]
            if not self.driver_connections[user_id]:
                del self.driver_connections[user_id]

    def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections = [ws for ws in self.admin_connections if ws != websocket]

    async def broadcast_to_session(self, session_id: str, data: dict):
        """Send data to all WebSockets watching a monitoring session."""
        dead = []
        for ws in self.monitor_connections.get(session_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_monitor(ws, session_id)

    async def broadcast_to_driver(self, user_id: str, data: dict):
        """Send data to all WebSockets for a driver's dashboard."""
        dead = []
        for ws in self.driver_connections.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_driver(ws, user_id)

    async def broadcast_to_admins(self, data: dict):
        """Send data to all admin dashboard WebSockets."""
        dead = []
        for ws in self.admin_connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_admin(ws)


# Singleton manager
ws_manager = ConnectionManager()
