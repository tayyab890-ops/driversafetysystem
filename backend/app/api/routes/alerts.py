"""
DriveGuard AI — Alert Management Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.permissions import get_current_user
from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.models.alert import SafetyAlert
from backend.app.schemas.alert import AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
def list_alerts(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    severity: str = Query(None),
):
    """List alerts — drivers see only their own, admins see all."""
    query = db.query(SafetyAlert)
    if user.role == "driver":
        query = query.filter(SafetyAlert.driver_id == user.id)
    if category:
        query = query.filter(SafetyAlert.category == category)
    if severity:
        query = query.filter(SafetyAlert.severity == severity)

    total = query.count()
    offset = (page - 1) * limit
    alerts = query.order_by(desc(SafetyAlert.timestamp)).offset(offset).limit(limit).all()

    result = []
    for a in alerts:
        driver = db.query(User).filter(User.id == a.driver_id).first()
        metadata = {}
        if a.ear_value is not None:
            metadata["ear"] = a.ear_value
        if a.yaw_angle is not None:
            metadata["yaw"] = a.yaw_angle
        if a.pitch_angle is not None:
            metadata["pitch"] = a.pitch_angle
        if a.object_class:
            metadata["objectClass"] = a.object_class
            metadata["requiresVerification"] = True

        result.append({
            "id": a.id,
            "sessionId": a.session_id,
            "timestamp": a.timestamp.strftime("%I:%M:%S %p") if a.timestamp else "",
            "category": a.category,
            "title": a.title,
            "description": a.description,
            "severity": a.severity,
            "acknowledged": a.acknowledged,
            "driverId": a.driver_id,
            "driverName": driver.name if driver else "Unknown",
            "confidence": a.confidence,
            "metadata": metadata if metadata else None,
        })

    return {
        "alerts": result,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/{alert_id}")
def get_alert_detail(
    alert_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single alert's details."""
    alert = db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.driver_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    driver = db.query(User).filter(User.id == alert.driver_id).first()
    metadata = {}
    if alert.ear_value is not None:
        metadata["ear"] = alert.ear_value
    if alert.yaw_angle is not None:
        metadata["yaw"] = alert.yaw_angle
    if alert.pitch_angle is not None:
        metadata["pitch"] = alert.pitch_angle
    if alert.object_class:
        metadata["objectClass"] = alert.object_class
        metadata["requiresVerification"] = True

    return {
        "id": alert.id,
        "sessionId": alert.session_id,
        "timestamp": alert.timestamp.isoformat() if alert.timestamp else "",
        "category": alert.category,
        "title": alert.title,
        "description": alert.description,
        "severity": alert.severity,
        "acknowledged": alert.acknowledged,
        "driverId": alert.driver_id,
        "driverName": driver.name if driver else "Unknown",
        "confidence": alert.confidence,
        "metadata": metadata if metadata else None,
    }


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledgeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an alert as acknowledged/reviewed."""
    alert = db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if alert.driver_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    alert.acknowledged = True
    db.commit()

    return {
        "alertId": alert.id,
        "acknowledged": True,
        "message": f"Alert {alert.id} acknowledged successfully.",
    }
