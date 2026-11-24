"""
DriveGuard AI — Refresh Token Model
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(
        String(50),
        primary_key=True,
        default=lambda: f"RTK-{uuid.uuid4().hex[:8].upper()}",
    )
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
