"""
DriveGuard AI — Alert Schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class AlertResponse(BaseModel):
    id: str
    sessionId: str
    timestamp: str
    category: str
    title: str
    description: str
    severity: str
    acknowledged: bool
    driverId: str
    driverName: str
    confidence: float
    metadata: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class AlertAcknowledgeRequest(BaseModel):
    note: Optional[str] = None
