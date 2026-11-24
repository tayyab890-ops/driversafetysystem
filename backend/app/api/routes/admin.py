"""
DriveGuard AI — Admin Dashboard & Fleet Management Routes
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.permissions import require_admin
from backend.app.core.security import hash_password
from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.models.session import DrivingSession
from backend.app.models.alert import SafetyAlert

router = APIRouter(prefix="/admin", tags=["Admin"])


class AdminCreateDriverRequest(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = "DriveGuard2026!"
    vehicle: Optional[str] = None
    phone: Optional[str] = None


def _serialize_alert_admin(alert: SafetyAlert, db: Session) -> dict:
    driver = db.query(User).filter(User.id == alert.driver_id).first()
    driver_name = driver.name if driver else "Unknown"
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

    metrics_parts = []
    if alert.ear_value is not None:
        metrics_parts.append(f"EAR {alert.ear_value:.3f}")
    if alert.pitch_angle is not None:
        metrics_parts.append(f"Pitch {alert.pitch_angle:+.1f}°")
    if alert.yaw_angle is not None:
        metrics_parts.append(f"Yaw {alert.yaw_angle:+.1f}°")
    if alert.object_class:
        metrics_parts.append(f"Object: {alert.object_class}")
    metrics_str = " • ".join(metrics_parts) if metrics_parts else f"Confidence {int((alert.confidence or 0.9) * 100)}%"

    time_str = alert.timestamp.strftime("%I:%M %p") if alert.timestamp else ""

    return {
        "id": alert.id,
        "sessionId": alert.session_id,
        "sessionRef": alert.session_id,
        "timestamp": time_str,
        "time": time_str,
        "category": alert.category,
        "title": alert.title,
        "description": alert.description,
        "detail": alert.description,
        "severity": alert.severity,
        "acknowledged": alert.acknowledged,
        "driverId": alert.driver_id,
        "driverName": driver_name,
        "confidence": alert.confidence,
        "metrics": metrics_str,
        "metadata": metadata if metadata else None,
    }


def _serialize_session_admin(session: DrivingSession, db: Session) -> dict:
    driver = db.query(User).filter(User.id == session.driver_id).first()
    driver_name = driver.name if driver else "Unknown"
    # Count flags per category for this session
    drowsiness_count = db.query(SafetyAlert).filter(
        SafetyAlert.session_id == session.id, SafetyAlert.category == "drowsiness"
    ).count()
    distraction_count = db.query(SafetyAlert).filter(
        SafetyAlert.session_id == session.id, SafetyAlert.category == "distraction"
    ).count()

    return {
        "id": session.id,
        "driverId": session.driver_id,
        "driverName": driver_name,
        "driverAvatar": driver.avatar if driver else None,
        "vehicle": session.vehicle,
        "startTime": session.start_time.strftime("%I:%M %p") if session.start_time else "",
        "endTime": session.end_time.strftime("%I:%M %p") if session.end_time else None,
        "durationMinutes": session.duration_minutes,
        "status": session.status,
        "safetyScore": session.safety_score,
        "alertCount": session.alert_count,
        "criticalAlerts": session.critical_alerts,
        "milesMonitored": session.miles_monitored,
        "drowsinessFlags": drowsiness_count,
        "distractionFlags": distraction_count,
    }


@router.get("/dashboard")
def get_admin_dashboard(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Fleet operations center dashboard — stat modules, active sessions, trends, alerts."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    enrolled_drivers = db.query(User).filter(User.role == "driver", User.is_active == True).count()  # noqa: E712
    active_feeds = db.query(DrivingSession).filter(DrivingSession.status == "active").count()
    alerts_today = db.query(SafetyAlert).filter(SafetyAlert.timestamp >= today_start).count()
    drowsiness_events = db.query(SafetyAlert).filter(
        SafetyAlert.timestamp >= today_start, SafetyAlert.category == "drowsiness"
    ).count()
    distraction_events = db.query(SafetyAlert).filter(
        SafetyAlert.timestamp >= today_start, SafetyAlert.category == "distraction"
    ).count()
    threat_detections = db.query(SafetyAlert).filter(SafetyAlert.category == "weapon").count()
    safety_violations = db.query(SafetyAlert).filter(
        SafetyAlert.timestamp >= today_start,
        SafetyAlert.severity.in_(["high", "critical"]),
    ).count()

    all_fleet_sessions = db.query(DrivingSession).all()
    fleet_safety_score = (
        int(sum(s.safety_score for s in all_fleet_sessions) / len(all_fleet_sessions))
        if all_fleet_sessions
        else 100
    )
    total_alerts_count = db.query(SafetyAlert).count()
    total_sessions_count = len(all_fleet_sessions)
    resolved_alerts_today = db.query(SafetyAlert).filter(
        SafetyAlert.timestamp >= today_start, SafetyAlert.acknowledged == True  # noqa: E712
    ).count()

    # Active sessions (all active fleet sessions)
    active_sessions_q = (
        db.query(DrivingSession)
        .filter(DrivingSession.status.in_(["active", "warning", "critical"]))
        .order_by(desc(DrivingSession.start_time))
        .limit(20)
        .all()
    )

    # Fleet trend — last 7 days
    fleet_trend = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        drowsy_count = db.query(SafetyAlert).filter(
            SafetyAlert.timestamp >= day_start,
            SafetyAlert.timestamp < day_end,
            SafetyAlert.category == "drowsiness",
        ).count()
        distract_count = db.query(SafetyAlert).filter(
            SafetyAlert.timestamp >= day_start,
            SafetyAlert.timestamp < day_end,
            SafetyAlert.category == "distraction",
        ).count()
        other_count = db.query(SafetyAlert).filter(
            SafetyAlert.timestamp >= day_start,
            SafetyAlert.timestamp < day_end,
            SafetyAlert.category.notin_(["drowsiness", "distraction"]),
        ).count()
        day_sessions_count = db.query(DrivingSession).filter(
            DrivingSession.start_time >= day_start,
            DrivingSession.start_time < day_end,
        ).count()
        fleet_trend.append({
            "day": "Today" if i == 0 else day.strftime("%a"),
            "date": day.strftime("%Y-%m-%d"),
            "drowsiness": drowsy_count,
            "distraction": distract_count,
            "other": other_count,
            "sessions": day_sessions_count,
        })

    # Priority alerts (unacknowledged, high/critical, recent)
    priority_alerts = (
        db.query(SafetyAlert)
        .filter(
            SafetyAlert.acknowledged == False,  # noqa: E712
            SafetyAlert.severity.in_(["high", "critical"]),
        )
        .order_by(desc(SafetyAlert.timestamp))
        .limit(10)
        .all()
    )

    return {
        "enrolledDrivers": enrolled_drivers,
        "activeFeeds": active_feeds,
        "alertsToday": alerts_today,
        "drowsinessEvents": drowsiness_events,
        "distractionEvents": distraction_events,
        "threatDetections": threat_detections,
        "safetyViolations": safety_violations,
        "fleetSafetyScore": fleet_safety_score,
        "totalAlerts": total_alerts_count,
        "totalSessions": total_sessions_count,
        "resolvedAlertsToday": resolved_alerts_today,
        "activeSessions": [_serialize_session_admin(s, db) for s in active_sessions_q],
        "fleetTrend": fleet_trend,
        "priorityAlerts": [_serialize_alert_admin(a, db) for a in priority_alerts],
    }


@router.get("/drivers")
def list_drivers(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Paginated driver directory for admin."""
    query = db.query(User).filter(User.role == "driver")
    if search:
        query = query.filter(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    total = query.count()
    offset = (page - 1) * limit
    drivers = query.order_by(User.name).offset(offset).limit(limit).all()

    result = []
    for d in drivers:
        session_count = db.query(DrivingSession).filter(DrivingSession.driver_id == d.id).count()
        d_sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == d.id).all()
        avg_score = int(sum(s.safety_score for s in d_sessions) / max(len(d_sessions), 1)) if d_sessions else 100
        alert_count = db.query(SafetyAlert).filter(SafetyAlert.driver_id == d.id).count()
        active = db.query(DrivingSession).filter(
            DrivingSession.driver_id == d.id, DrivingSession.status == "active"
        ).first()

        result.append({
            "id": d.id,
            "name": d.name,
            "email": d.email,
            "phone": "N/A",
            "vehicle": d.vehicle_id or "Unassigned",
            "avatar": d.avatar,
            "status": "active" if active else "inactive" if not d.is_active else "offline",
            "isActive": d.is_active,
            "safetyScore": avg_score,
            "totalSessions": session_count,
            "totalHours": round(sum(s.duration_minutes for s in d_sessions) / 60.0, 1),
            "totalAlerts": alert_count,
            "memberSince": d.created_at.strftime("%Y-%m-%d") if d.created_at else "",
        })

    return {
        "drivers": result,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.post("/drivers", status_code=201)
def create_driver_admin(
    payload: AdminCreateDriverRequest,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin directly enrolls a new driver in the fleet."""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    new_driver = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password or "DriveGuard2026!"),
        role="driver",
        vehicle_id=payload.vehicle.strip() if payload.vehicle else None,
        is_active=True,
    )
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    driver_dict = {
        "id": new_driver.id,
        "name": new_driver.name,
        "email": new_driver.email,
        "vehicle": new_driver.vehicle_id or "Unassigned",
        "phone": payload.phone or "N/A",
        "status": "offline",
        "isActive": True,
        "safetyScore": 100,
        "totalSessions": 0,
        "totalHours": 0.0,
        "totalAlerts": 0,
        "memberSince": new_driver.created_at.strftime("%Y-%m-%d") if new_driver.created_at else "",
    }

    return {
        "status": "success",
        "driver": driver_dict,
        **{k: v for k, v in driver_dict.items() if k != "status"},
    }


@router.patch("/drivers/{driver_id}/status")
def toggle_driver_status(
    driver_id: str,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Toggle active/inactive status of a fleet driver."""
    driver = db.query(User).filter(User.id == driver_id, User.role == "driver").first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    driver.is_active = not driver.is_active
    db.commit()
    db.refresh(driver)
    return {
        "id": driver.id,
        "isActive": driver.is_active,
        "status": "active" if driver.is_active else "inactive",
    }


@router.get("/drivers/{driver_id}")
def get_driver_detail(
    driver_id: str,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get detailed driver profile for admin view."""
    driver = db.query(User).filter(User.id == driver_id, User.role == "driver").first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == driver_id).all()
    alerts = (
        db.query(SafetyAlert)
        .filter(SafetyAlert.driver_id == driver_id)
        .order_by(desc(SafetyAlert.timestamp))
        .limit(10)
        .all()
    )
    avg_score = int(sum(s.safety_score for s in sessions) / max(len(sessions), 1)) if sessions else 100

    return {
        "id": driver.id,
        "name": driver.name,
        "email": driver.email,
        "vehicle": driver.vehicle_id,
        "avatar": driver.avatar,
        "isActive": driver.is_active,
        "memberSince": driver.created_at.strftime("%Y-%m-%d") if driver.created_at else "",
        "totalSessions": len(sessions),
        "avgSafetyScore": avg_score,
        "totalAlerts": db.query(SafetyAlert).filter(SafetyAlert.driver_id == driver_id).count(),
        "recentSessions": [_serialize_session_admin(s, db) for s in sessions[:5]],
        "recentAlerts": [_serialize_alert_admin(a, db) for a in alerts],
    }


@router.get("/sessions")
def list_fleet_sessions(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    status: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """All fleet monitoring sessions (active, completed, warning, critical) with filtering."""
    query = db.query(DrivingSession)
    if status and status != "all":
        query = query.filter(DrivingSession.status == status)
    if search:
        query = query.join(User, DrivingSession.driver_id == User.id).filter(
            DrivingSession.id.ilike(f"%{search}%") |
            DrivingSession.vehicle.ilike(f"%{search}%") |
            User.name.ilike(f"%{search}%")
        )

    total = query.count()
    offset = (page - 1) * limit
    sessions = query.order_by(desc(DrivingSession.start_time)).offset(offset).limit(limit).all()
    active_count = db.query(DrivingSession).filter(DrivingSession.status == "active").count()

    return {
        "sessions": [_serialize_session_admin(s, db) for s in sessions],
        "total": total,
        "activeCount": active_count,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/sessions/active")
def list_active_sessions(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """All currently active fleet sessions."""
    sessions = (
        db.query(DrivingSession)
        .filter(DrivingSession.status.in_(["active", "warning", "critical"]))
        .order_by(desc(DrivingSession.start_time))
        .all()
    )
    return {"sessions": [_serialize_session_admin(s, db) for s in sessions]}


@router.get("/alerts")
def list_fleet_alerts(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    severity: str = Query(None),
    acknowledged: bool = Query(None),
):
    """Paginated fleet alerts with filters across all drivers."""
    query = db.query(SafetyAlert)
    if category and category != "all":
        query = query.filter(SafetyAlert.category == category)
    if severity and severity != "all":
        query = query.filter(SafetyAlert.severity == severity)
    if acknowledged is not None:
        query = query.filter(SafetyAlert.acknowledged == acknowledged)

    total = query.count()
    offset = (page - 1) * limit
    alerts = query.order_by(desc(SafetyAlert.timestamp)).offset(offset).limit(limit).all()
    unack_count = db.query(SafetyAlert).filter(SafetyAlert.acknowledged == False).count()  # noqa: E712

    return {
        "alerts": [_serialize_alert_admin(a, db) for a in alerts],
        "total": total,
        "unacknowledgedCount": unack_count,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/analytics")
def get_fleet_analytics(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    time_range: str = Query("7d"),
):
    """Comprehensive fleet safety analytics for charts & reporting."""
    num_days = 90 if time_range == "90d" else 30 if time_range == "30d" else 7

    fleet_score_trend = []
    for i in range(num_days - 1, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        day_sessions = db.query(DrivingSession).filter(
            DrivingSession.start_time >= day_start, DrivingSession.start_time < day_end
        ).all()

        day_score = int(sum(s.safety_score for s in day_sessions) / len(day_sessions)) if day_sessions else 100
        fleet_score_trend.append({
            "label": day.strftime("%b %d") if num_days > 7 else ("Today" if i == 0 else day.strftime("%a")),
            "value": day_score,
            "date": day.strftime("%Y-%m-%d"),
            "sessions": len(day_sessions),
        })

    # Categorical distribution
    cat_names = [
        ("drowsiness", "Drowsiness"),
        ("distraction", "Head Turn Distraction"),
        ("face_absent", "Face Obscured"),
        ("weapon", "Threat Candidate"),
        ("system", "System Diagnostics"),
    ]
    category_distribution = []
    total_alerts = db.query(SafetyAlert).count()
    for cat_key, cat_label in cat_names:
        count = db.query(SafetyAlert).filter(SafetyAlert.category == cat_key).count()
        category_distribution.append({
            "label": cat_label,
            "value": count,
            "percentage": f"{round((count / max(total_alerts, 1)) * 100, 1)}%",
        })

    # Hourly violation curve
    hourly_buckets = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00"]
    hourly_counts = {b: 0 for b in hourly_buckets}
    all_alerts = db.query(SafetyAlert).all()
    for a in all_alerts:
        if a.timestamp:
            h = a.timestamp.hour
            if h < 8:
                hourly_counts["06:00"] += 1
            elif h < 11:
                hourly_counts["09:00"] += 1
            elif h < 14:
                hourly_counts["12:00"] += 1
            elif h < 17:
                hourly_counts["15:00"] += 1
            elif h < 20:
                hourly_counts["18:00"] += 1
            elif h < 23:
                hourly_counts["21:00"] += 1
            else:
                hourly_counts["00:00"] += 1
    hourly_violation_curve = [{"label": b, "value": hourly_counts[b]} for b in hourly_buckets]

    all_sessions = db.query(DrivingSession).all()
    total_hours = round(sum(s.duration_minutes for s in all_sessions) / 60.0, 1)
    avg_attention = int(sum(s.safety_score for s in all_sessions) / len(all_sessions)) if all_sessions else 100
    critical_alerts = db.query(SafetyAlert).filter(SafetyAlert.severity.in_(["high", "critical"])).count()
    critical_ratio = f"{round((critical_alerts / max(total_alerts, 1)) * 100, 1)}%"
    threat_count = db.query(SafetyAlert).filter(SafetyAlert.category == "weapon").count()

    csv_rows = [
        [item["label"], item["value"], item["percentage"]]
        for item in category_distribution
    ]

    return {
        "fleetScoreTrend": fleet_score_trend,
        "categoryDistribution": category_distribution,
        "hourlyViolationCurve": hourly_violation_curve,
        "fleetAttentionIndex": avg_attention,
        "totalHoursMonitored": total_hours,
        "criticalSeverityRatio": critical_ratio,
        "threatClearances": threat_count,
        "totalAlerts": total_alerts,
        "totalSessions": len(all_sessions),
        "csvRows": csv_rows,
    }
