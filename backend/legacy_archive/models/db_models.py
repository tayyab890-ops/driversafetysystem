"""
DriveGuard AI — SQLAlchemy Database Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database.connection import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String(50), primary_key=True, default=lambda: f"DRV-{uuid.uuid4().hex[:6].upper()}")
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    role = Column(String(20), default="driver") # 'driver' | 'admin'
    vehicle_unit = Column(String(50), nullable=True) # e.g. 'Volvo XC90 #14'
    license_class = Column(String(20), default="CLASS A")
    status = Column(String(20), default="online") # 'online' | 'offline' | 'in_transit'
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("DrivingSession", back_populates="driver")
    alerts = relationship("SafetyAlert", back_populates="driver")

class DrivingSession(Base):
    __tablename__ = "driving_sessions"

    id = Column(String(50), primary_key=True, default=lambda: f"SES-{uuid.uuid4().hex[:6].upper()}")
    driver_id = Column(String(50), ForeignKey("drivers.id"), nullable=False)
    vehicle = Column(String(100), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    status = Column(String(20), default="active") # 'active' | 'completed' | 'warning' | 'critical'
    safety_score = Column(Integer, default=95)
    miles_monitored = Column(Float, default=0.0)
    alert_count = Column(Integer, default=0)
    critical_alerts = Column(Integer, default=0)

    driver = relationship("Driver", back_populates="sessions")
    alerts = relationship("SafetyAlert", back_populates="session")
    telemetry_records = relationship("TelemetryRecord", back_populates="session")

class SafetyAlert(Base):
    __tablename__ = "safety_alerts"

    id = Column(String(50), primary_key=True, default=lambda: f"ALT-{uuid.uuid4().hex[:6].upper()}")
    session_id = Column(String(50), ForeignKey("driving_sessions.id"), nullable=False)
    driver_id = Column(String(50), ForeignKey("drivers.id"), nullable=False)
    category = Column(String(50), nullable=False) # 'drowsiness' | 'distraction' | 'weapon' | 'system'
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="medium") # 'low' | 'medium' | 'high' | 'critical'
    confidence = Column(Float, default=0.90)
    acknowledged = Column(Boolean, default=False)
    ear_value = Column(Float, nullable=True)
    yaw_angle = Column(Float, nullable=True)
    pitch_angle = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver", back_populates="alerts")
    session = relationship("DrivingSession", back_populates="alerts")

class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(50), ForeignKey("driving_sessions.id"), nullable=False)
    fps = Column(Float, default=60.0)
    latency_ms = Column(Integer, default=14)
    face_detected = Column(Boolean, default=True)
    ear = Column(Float, default=0.285)
    mar = Column(Float, default=0.185)
    head_yaw = Column(Float, default=0.0)
    head_pitch = Column(Float, default=0.0)
    head_roll = Column(Float, default=0.0)
    safety_score = Column(Integer, default=95)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("DrivingSession", back_populates="telemetry_records")
