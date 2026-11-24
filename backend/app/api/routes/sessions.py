"""
DriveGuard AI — Session Management Routes
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.permissions import get_current_user
from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.models.session import DrivingSession
from backend.app.models.alert import SafetyAlert
from backend.app.schemas.session import SessionStartRequest

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/start")
def start_session(
    payload: SessionStartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initialize a new driving telemetry session."""
    # Check for existing active session
    existing = (
        db.query(DrivingSession)
        .filter(DrivingSession.driver_id == user.id, DrivingSession.status == "active")
        .first()
    )
    if existing:
        now = datetime.now(timezone.utc)
        # If older than 10 minutes, complete it
        st = existing.start_time.replace(tzinfo=timezone.utc) if existing.start_time and existing.start_time.tzinfo is None else existing.start_time
        if st and (now - st).total_seconds() > 600:
            existing.status = "completed"
            existing.end_time = now
            existing.duration_minutes = max(1, int((now - st).total_seconds() / 60))
            db.commit()
        else:
            # Reconnect to current active session
            return {
                "sessionId": existing.id,
                "driverId": user.id,
                "driverName": user.name,
                "vehicle": existing.vehicle,
                "status": "active",
                "safetyScore": existing.safety_score,
                "startTime": existing.start_time.isoformat() if existing.start_time else "",
            }

    session = DrivingSession(
        driver_id=user.id,
        vehicle=payload.vehicle or user.vehicle_id or "Unassigned",
        status="active",
        safety_score=100,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "sessionId": session.id,
        "driverId": user.id,
        "driverName": user.name,
        "vehicle": session.vehicle,
        "status": "active",
        "safetyScore": 100,
        "startTime": session.start_time.isoformat() if session.start_time else "",
    }


@router.post("/{session_id}/stop")
def stop_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Finalize a driving session and compute aggregate stats."""
    session = db.query(DrivingSession).filter(DrivingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Verify ownership (driver owns session, or admin)
    if session.driver_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to stop this session")

    if session.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not active")

    now = datetime.now(timezone.utc)
    session.end_time = now
    if session.start_time:
        st = session.start_time.replace(tzinfo=timezone.utc) if session.start_time.tzinfo is None else session.start_time
        session.duration_minutes = int((now - st).total_seconds() / 60)
    session.status = "completed"

    # Recount alerts
    alert_count = db.query(SafetyAlert).filter(SafetyAlert.session_id == session_id).count()
    critical_count = db.query(SafetyAlert).filter(
        SafetyAlert.session_id == session_id, SafetyAlert.severity.in_(["high", "critical"])
    ).count()
    session.alert_count = alert_count
    session.critical_alerts = critical_count

    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "status": session.status,
        "durationMinutes": session.duration_minutes,
        "safetyScore": session.safety_score,
        "alertCount": session.alert_count,
        "message": "Session completed successfully.",
    }


@router.get("/active")
def get_active_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get active sessions for the current user (or all for admin)."""
    if user.role == "admin":
        sessions = db.query(DrivingSession).filter(DrivingSession.status == "active").all()
    else:
        sessions = db.query(DrivingSession).filter(
            DrivingSession.driver_id == user.id, DrivingSession.status == "active"
        ).all()

    result = []
    for s in sessions:
        driver = db.query(User).filter(User.id == s.driver_id).first()
        result.append({
            "id": s.id,
            "driverId": s.driver_id,
            "driverName": driver.name if driver else "Unknown",
            "vehicle": s.vehicle,
            "status": s.status,
            "safetyScore": s.safety_score,
            "startTime": s.start_time.isoformat() if s.start_time else "",
            "durationMinutes": s.duration_minutes,
            "alertCount": s.alert_count,
        })
    return {"sessions": result}


@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get session details."""
    session = db.query(DrivingSession).filter(DrivingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.driver_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    driver = db.query(User).filter(User.id == session.driver_id).first()
    alerts = (
        db.query(SafetyAlert)
        .filter(SafetyAlert.session_id == session_id)
        .order_by(desc(SafetyAlert.timestamp))
        .all()
    )

    return {
        "id": session.id,
        "driverId": session.driver_id,
        "driverName": driver.name if driver else "Unknown",
        "vehicle": session.vehicle,
        "startTime": session.start_time.isoformat() if session.start_time else "",
        "endTime": session.end_time.isoformat() if session.end_time else None,
        "durationMinutes": session.duration_minutes,
        "status": session.status,
        "safetyScore": session.safety_score,
        "alertCount": session.alert_count,
        "criticalAlerts": session.critical_alerts,
        "milesMonitored": session.miles_monitored,
        "alerts": [
            {
                "id": a.id,
                "category": a.category,
                "title": a.title,
                "severity": a.severity,
                "timestamp": a.timestamp.strftime("%I:%M:%S %p") if a.timestamp else "",
                "acknowledged": a.acknowledged,
            }
            for a in alerts
        ],
    }
