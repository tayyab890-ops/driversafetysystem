"""
DriveGuard AI — Telemetry Record Model
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("driving_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    fps = Column(Float, default=60.0)
    latency_ms = Column(Integer, default=14)
    face_detected = Column(Boolean, default=True)
    face_confidence = Column(Float, default=0.97)
    ear = Column(Float, default=0.285)
    mar = Column(Float, default=0.185)
    head_yaw = Column(Float, default=0.0)
    head_pitch = Column(Float, default=0.0)
    head_roll = Column(Float, default=0.0)
    safety_score = Column(Integer, default=100)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    session = relationship("DrivingSession", back_populates="telemetry_records")
