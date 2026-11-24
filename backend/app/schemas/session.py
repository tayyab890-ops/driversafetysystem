"""
DriveGuard AI — Session Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SessionStartRequest(BaseModel):
    vehicle: Optional[str] = Field(default=None)


class SessionResponse(BaseModel):
    id: str
    driverId: str
    driverName: str
    vehicle: str
    startTime: str
    endTime: Optional[str] = None
    durationMinutes: int
    status: str
    safetyScore: int
    alertCount: int
    criticalAlerts: int
    milesMonitored: Optional[float] = None

    model_config = {"from_attributes": True}


class SessionStopResponse(BaseModel):
    id: str
    status: str
    durationMinutes: int
    safetyScore: int
    alertCount: int
    message: str
