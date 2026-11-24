"""
DriveGuard AI — Safety Alert Model
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base


class SafetyAlert(Base):
    __tablename__ = "safety_alerts"

    id = Column(
        String(50),
        primary_key=True,
        default=lambda: f"ALT-{uuid.uuid4().hex[:6].upper()}",
    )
    session_id = Column(String(50), ForeignKey("driving_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # 'drowsiness' | 'distraction' | 'weapon' | 'face_absent' | 'system'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="medium")  # 'low' | 'medium' | 'high' | 'critical'
    confidence = Column(Float, default=0.90)
    acknowledged = Column(Boolean, default=False)
    ear_value = Column(Float, nullable=True)
    yaw_angle = Column(Float, nullable=True)
    pitch_angle = Column(Float, nullable=True)
    object_class = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    driver = relationship("User", back_populates="alerts")
    session = relationship("DrivingSession", back_populates="alerts")
