"""
DriveGuard AI — Telemetry API Routes & WebSocket Stream
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.services.telemetry_service import TelemetryService
import asyncio

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.get("/current/{session_id}")
async def get_current_telemetry(session_id: str, driver_id: str = "DRV-042"):
    """Fetch latest telemetry snapshot for active session."""
    return TelemetryService.generate_simulated_frame(session_id, driver_id)

@router.websocket("/ws/{session_id}")
async def websocket_telemetry_stream(websocket: WebSocket, session_id: str):
    """Real-time 15 FPS telemetry stream for cockpit gauge & facial HUD."""
    await websocket.accept()
    try:
        while True:
            data = TelemetryService.generate_simulated_frame(session_id, "DRV-042")
            await websocket.send_json(data)
            await asyncio.sleep(0.066) # ~15 FPS
    except WebSocketDisconnect:
        pass
