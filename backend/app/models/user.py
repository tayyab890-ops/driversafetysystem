"""
DriveGuard AI — User Model (Driver & Admin)
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(50),
        primary_key=True,
        default=lambda: f"USR-{uuid.uuid4().hex[:8].upper()}",
    )
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="driver")  # 'driver' | 'admin'
    vehicle_id = Column(String(100), nullable=True)
    avatar = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    sessions = relationship("DrivingSession", back_populates="driver", cascade="all, delete-orphan")
    alerts = relationship("SafetyAlert", back_populates="driver", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
