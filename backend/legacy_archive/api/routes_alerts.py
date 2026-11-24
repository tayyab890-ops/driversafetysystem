"""
DriveGuard AI — Safety Alerts API Routes
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/alerts", tags=["Alerts"])

class AlertAcknowledgeRequest(BaseModel):
    supervisor_id: Optional[str] = "ADMIN-01"
    note: Optional[str] = None

@router.get("/")
async def list_alerts():
    """Retrieve all high-priority alerts for fleet dispatcher operations."""
    return [
        {
            "id": "ALT-1092",
            "sessionId": "SES-8821",
            "driverName": "Alex Mercer",
            "title": "Driver Drowsiness Detected",
            "severity": "critical",
            "acknowledged": False,
            "ear": 0.160,
            "timestamp": "10:42 AM"
        },
        {
            "id": "ALT-1091",
            "sessionId": "SES-8821",
            "driverName": "Alex Mercer",
            "title": "Downward Gaze / Device Focus",
            "severity": "warning",
            "acknowledged": True,
            "pitch": -26.0,
            "timestamp": "10:31 AM"
        }
    ]

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, payload: AlertAcknowledgeRequest):
    """Mark alert as reviewed and audited by dispatcher."""
    return {
        "status": "success",
        "alertId": alert_id,
        "auditedBy": payload.supervisor_id,
        "message": f"Alert {alert_id} acknowledged successfully."
    }
