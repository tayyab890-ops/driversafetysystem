"""
DriveGuard AI — Dashboard Schemas
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class DriverDashboardResponse(BaseModel):
    safetyScore: int
    sessionsToday: int
    totalSessionTime: int  # minutes
    milesProtected: float
    safetyFlags: int
    fleetPercentile: int
    recentEvents: List[Dict[str, Any]]
    recentSessions: List[Dict[str, Any]]
    weeklyScoreTrend: List[Dict[str, Any]]
    alertnessAnalysis: List[Dict[str, Any]]


class AdminDashboardResponse(BaseModel):
    enrolledDrivers: int
    activeFeeds: int
    alertsToday: int
    drowsinessEvents: int
    distractionEvents: int
    safetyViolations: int
    activeSessions: List[Dict[str, Any]]
    fleetTrend: List[Dict[str, Any]]
    priorityAlerts: List[Dict[str, Any]]


class DriverProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    vehicle_id: Optional[str] = None
    avatar: Optional[str] = None
    totalSessions: int
    avgSafetyScore: float
    totalAlerts: int
    memberSince: str

    model_config = {"from_attributes": True}
