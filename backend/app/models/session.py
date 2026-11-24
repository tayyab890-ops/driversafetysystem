"""
DriveGuard AI — Driving Session Model
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base


class DrivingSession(Base):
    __tablename__ = "driving_sessions"

    id = Column(
        String(50),
        primary_key=True,
        default=lambda: f"SES-{uuid.uuid4().hex[:6].upper()}",
    )
    driver_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, default=0)
    status = Column(String(20), default="active")  # 'active' | 'completed' | 'paused' | 'warning' | 'critical'
    safety_score = Column(Integer, default=100)
    miles_monitored = Column(Float, default=0.0)
    alert_count = Column(Integer, default=0)
    critical_alerts = Column(Integer, default=0)

    # Relationships
    driver = relationship("User", back_populates="sessions")
    alerts = relationship("SafetyAlert", back_populates="session", cascade="all, delete-orphan")
    telemetry_records = relationship("TelemetryRecord", back_populates="session", cascade="all, delete-orphan")
