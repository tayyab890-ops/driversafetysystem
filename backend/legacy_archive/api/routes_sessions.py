"""
DriveGuard AI — Driving Sessions API Routes
"""
from fastapi import APIRouter

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("/")
async def list_active_sessions():
    """List all currently active fleet transit sessions."""
    return [
        {
            "id": "SES-8821",
            "driverName": "Alex Mercer",
            "vehicle": "Volvo XC90 #14",
            "status": "warning",
            "safetyScore": 88,
            "durationMinutes": 225,
            "alertCount": 3
        },
        {
            "id": "SES-8820",
            "driverName": "Elena Rostova",
            "vehicle": "Tesla Semi #03",
            "status": "active",
            "safetyScore": 98,
            "durationMinutes": 72,
            "alertCount": 0
        }
    ]

@router.post("/start")
async def start_session(driver_id: str = "DRV-042", vehicle: str = "Volvo XC90 #14"):
    """Initialize a new driving telemetry session."""
    return {
        "sessionId": "SES-8822",
        "driverId": driver_id,
        "vehicle": vehicle,
        "status": "active",
        "safetyScore": 100
    }
