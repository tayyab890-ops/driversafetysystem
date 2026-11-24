"""
DriveGuard AI — Driver Dashboard & Profile Routes
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.core.permissions import get_current_user, require_driver
from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.models.session import DrivingSession
from backend.app.models.alert import SafetyAlert
from backend.app.models.telemetry import TelemetryRecord

router = APIRouter(prefix="/driver", tags=["Driver"])


def _serialize_alert(alert: SafetyAlert, driver_name: str) -> dict:
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


def _serialize_session(session: DrivingSession, driver_name: str) -> dict:
    return {
        "id": session.id,
        "driverId": session.driver_id,
        "driverName": driver_name,
        "vehicle": session.vehicle,
        "startTime": session.start_time.strftime("%I:%M %p") if session.start_time else "",
        "endTime": session.end_time.strftime("%I:%M %p") if session.end_time else None,
        "durationMinutes": session.duration_minutes,
        "status": session.status,
        "safetyScore": session.safety_score,
        "alertCount": session.alert_count,
        "criticalAlerts": session.critical_alerts,
        "milesMonitored": session.miles_monitored,
    }


@router.get("/dashboard")
def get_driver_dashboard(
    user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """Full driver dashboard data — safety score, stats, recent events, sessions, analytics."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # Sessions today
    sessions_today = (
        db.query(DrivingSession)
        .filter(DrivingSession.driver_id == user.id, DrivingSession.start_time >= today_start)
        .all()
    )

    # All-time stats
    all_sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == user.id).all()
    total_driver_sessions = len(all_sessions)
    total_time_today = sum(s.duration_minutes for s in sessions_today)
    total_miles = sum(s.miles_monitored or 0 for s in all_sessions)
    avg_score = (
        int(sum(s.safety_score for s in all_sessions) / total_driver_sessions)
        if total_driver_sessions > 0
        else 100
    )

    # Safety flags (alerts) today
    alerts_today = (
        db.query(SafetyAlert)
        .filter(SafetyAlert.driver_id == user.id, SafetyAlert.timestamp >= today_start)
        .count()
    )
    critical_alerts_today = (
        db.query(SafetyAlert)
        .filter(
            SafetyAlert.driver_id == user.id,
            SafetyAlert.timestamp >= today_start,
            SafetyAlert.severity == "critical",
        )
        .count()
    )

    threat_count = (
        db.query(SafetyAlert)
        .filter(SafetyAlert.driver_id == user.id, SafetyAlert.category == "weapon")
        .count()
    )

    # Latest telemetry record for sub-indicator display
    latest_telemetry = (
        db.query(TelemetryRecord)
        .join(DrivingSession, TelemetryRecord.session_id == DrivingSession.id)
        .filter(DrivingSession.driver_id == user.id)
        .order_by(desc(TelemetryRecord.timestamp))
        .first()
    )

    # Recent events (last 10)
    recent_alerts = (
        db.query(SafetyAlert)
        .filter(SafetyAlert.driver_id == user.id)
        .order_by(desc(SafetyAlert.timestamp))
        .limit(10)
        .all()
    )

    # Recent sessions (last 5)
    recent_sessions = (
        db.query(DrivingSession)
        .filter(DrivingSession.driver_id == user.id)
        .order_by(desc(DrivingSession.start_time))
        .limit(5)
        .all()
    )

    # Weekly score trend (last 7 days)
    weekly_trend = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_sessions = (
            db.query(DrivingSession)
            .filter(
                DrivingSession.driver_id == user.id,
                DrivingSession.start_time >= day_start,
                DrivingSession.start_time < day_end,
            )
            .all()
        )
        day_score = (
            int(sum(s.safety_score for s in day_sessions) / len(day_sessions))
            if day_sessions
            else avg_score
        )
        day_hours = round(sum(s.duration_minutes for s in day_sessions) / 60.0, 1)
        day_miles = round(sum(s.miles_monitored or 0.0 for s in day_sessions), 1)

        weekly_trend.append({
            "day": "Today" if i == 0 else day.strftime("%a"),
            "date": day.strftime("%Y-%m-%d"),
            "score": day_score,
            "sessions": len(day_sessions),
            "hours": day_hours,
            "miles": day_miles,
        })

    # Hourly focus today (from telemetry if available)
    hourly_focus = []
    if sessions_today:
        today_session_ids = [s.id for s in sessions_today]
        telemetry_today = (
            db.query(TelemetryRecord)
            .filter(TelemetryRecord.session_id.in_(today_session_ids))
            .order_by(TelemetryRecord.timestamp)
            .all()
        )
        hourly_dict: dict = {}
        for t in telemetry_today:
            hour_key = t.timestamp.strftime("%H:%M") if t.timestamp else "00:00"
            if hour_key not in hourly_dict:
                hourly_dict[hour_key] = {"ears": [], "scores": []}
            if t.ear is not None:
                hourly_dict[hour_key]["ears"].append(t.ear)
            if t.safety_score is not None:
                hourly_dict[hour_key]["scores"].append(t.safety_score)

        for h, v in sorted(hourly_dict.items()):
            hourly_focus.append({
                "hour": h,
                "ear": round(sum(v["ears"]) / len(v["ears"]), 3) if v["ears"] else 0.285,
                "attention": int(sum(v["scores"]) / len(v["scores"])) if v["scores"] else 95,
            })

    # Alertness analysis (count by category)
    alertness_data = []
    for cat in ["drowsiness", "distraction", "face_absent", "weapon", "system"]:
        count = (
            db.query(SafetyAlert)
            .filter(SafetyAlert.driver_id == user.id, SafetyAlert.category == cat)
            .count()
        )
        alertness_data.append({"category": cat, "count": count})

    # Fleet percentile (simple: how many drivers have lower avg score)
    total_drivers = db.query(User).filter(User.role == "driver", User.is_active == True).count()  # noqa: E712
    drivers_below = 0
    if total_drivers > 1 and total_driver_sessions > 0:
        all_driver_ids = [u.id for u in db.query(User).filter(User.role == "driver", User.is_active == True).all()]  # noqa: E712
        for did in all_driver_ids:
            if did == user.id:
                continue
            d_sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == did).all()
            if d_sessions:
                d_avg = sum(s.safety_score for s in d_sessions) / len(d_sessions)
                if d_avg < avg_score:
                    drivers_below += 1
        percentile = int((drivers_below / max(total_drivers - 1, 1)) * 100)
    else:
        percentile = 95  # Default for top calibrated driver

    return {
        "safetyScore": avg_score,
        "hasSessions": total_driver_sessions > 0,
        "totalSessions": total_driver_sessions,
        "sessionsToday": len(sessions_today),
        "totalSessionTime": total_time_today,
        "milesProtected": round(total_miles, 1),
        "safetyFlags": alerts_today,
        "criticalAlertsToday": critical_alerts_today,
        "threatCount": threat_count,
        "fleetPercentile": percentile,
        "latestTelemetry": {
            "ear": round(latest_telemetry.ear, 3) if latest_telemetry and latest_telemetry.ear is not None else None,
            "yaw": round(latest_telemetry.head_yaw, 1) if latest_telemetry and latest_telemetry.head_yaw is not None else None,
            "pitch": round(latest_telemetry.head_pitch, 1) if latest_telemetry and latest_telemetry.head_pitch is not None else None,
            "latencyMs": latest_telemetry.latency_ms if latest_telemetry and latest_telemetry.latency_ms is not None else 14,
        } if latest_telemetry else None,
        "recentEvents": [_serialize_alert(a, user.name) for a in recent_alerts],
        "recentSessions": [_serialize_session(s, user.name) for s in recent_sessions],
        "weeklyScoreTrend": weekly_trend,
        "hourlyFocus": hourly_focus,
        "alertnessAnalysis": alertness_data,
    }


@router.get("/sessions")
def get_driver_sessions(
    user: User = Depends(require_driver),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    """Paginated session history for the current driver."""
    offset = (page - 1) * limit
    total = db.query(DrivingSession).filter(DrivingSession.driver_id == user.id).count()
    sessions = (
        db.query(DrivingSession)
        .filter(DrivingSession.driver_id == user.id)
        .order_by(desc(DrivingSession.start_time))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "sessions": [_serialize_session(s, user.name) for s in sessions],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/events")
def get_driver_events(
    user: User = Depends(require_driver),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str = Query(None),
    severity: str = Query(None),
):
    """Paginated safety events for the current driver, with optional filters."""
    query = db.query(SafetyAlert).filter(SafetyAlert.driver_id == user.id)
    if category:
        query = query.filter(SafetyAlert.category == category)
    if severity:
        query = query.filter(SafetyAlert.severity == severity)

    total = query.count()
    offset = (page - 1) * limit
    alerts = query.order_by(desc(SafetyAlert.timestamp)).offset(offset).limit(limit).all()

    return {
        "events": [_serialize_alert(a, user.name) for a in alerts],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/analytics")
def get_driver_analytics(
    user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """Weekly analytics data for charts."""
    weekly_trend = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_sessions = (
            db.query(DrivingSession)
            .filter(
                DrivingSession.driver_id == user.id,
                DrivingSession.start_time >= day_start,
                DrivingSession.start_time < day_end,
            )
            .all()
        )
        day_alerts = (
            db.query(SafetyAlert)
            .filter(
                SafetyAlert.driver_id == user.id,
                SafetyAlert.timestamp >= day_start,
                SafetyAlert.timestamp < day_end,
            )
            .count()
        )
        day_score = (
            int(sum(s.safety_score for s in day_sessions) / len(day_sessions))
            if day_sessions
            else 95
        )
        weekly_trend.append({
            "day": day.strftime("%a"),
            "date": day.strftime("%Y-%m-%d"),
            "score": day_score,
            "sessions": len(day_sessions),
            "alerts": day_alerts,
            "driveMinutes": sum(s.duration_minutes for s in day_sessions),
        })
    return {"weeklyTrend": weekly_trend}


@router.get("/profile")
def get_driver_profile(
    user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """Get the current driver's profile with aggregate stats."""
    total_sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == user.id).count()
    all_sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == user.id).all()
    avg_score = sum(s.safety_score for s in all_sessions) / max(len(all_sessions), 1)
    total_alerts = db.query(SafetyAlert).filter(SafetyAlert.driver_id == user.id).count()

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "vehicle_id": user.vehicle_id,
        "avatar": user.avatar,
        "totalSessions": total_sessions,
        "avgSafetyScore": round(avg_score, 1),
        "totalAlerts": total_alerts,
        "memberSince": user.created_at.strftime("%B %Y") if user.created_at else "N/A",
    }


@router.get("/reports")
def get_driver_reports(
    user: User = Depends(require_driver),
    db: Session = Depends(get_db),
):
    """Calculated compliance & behavioral safety report for the authenticated driver."""
    all_sessions = db.query(DrivingSession).filter(DrivingSession.driver_id == user.id).all()
    all_alerts = db.query(SafetyAlert).filter(SafetyAlert.driver_id == user.id).all()

    total_sessions = len(all_sessions)
    total_minutes = sum(s.duration_minutes for s in all_sessions)
    total_hours = round(total_minutes / 60.0, 1)
    total_miles = round(sum(s.miles_monitored or 0 for s in all_sessions), 1)
    avg_score = round(sum(s.safety_score for s in all_sessions) / max(total_sessions, 1), 1) if total_sessions > 0 else 100.0

    # 7-day trajectory
    weekly_scores = []
    csv_rows = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_sessions = [s for s in all_sessions if s.start_time and day_start <= s.start_time < day_end]
        day_alerts = [a for a in all_alerts if a.timestamp and day_start <= a.timestamp < day_end]
        day_score = int(sum(s.safety_score for s in day_sessions) / len(day_sessions)) if day_sessions else (int(avg_score) if total_sessions > 0 else 100)
        day_hours = round(sum(s.duration_minutes for s in day_sessions) / 60.0, 1)

        weekly_scores.append({
            "label": "Today" if i == 0 else day.strftime("%a"),
            "value": day_score,
            "day": day.strftime("%A"),
            "hours": day_hours,
            "alerts": len(day_alerts),
        })
        csv_rows.append([
            day.strftime("%A"),
            day_score,
            day_hours,
            len(day_alerts),
        ])

    # Hourly alert distribution across all recorded alerts
    hourly_buckets = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]
    hourly_counts = {b: 0 for b in hourly_buckets}
    for a in all_alerts:
        if a.timestamp:
            h = a.timestamp.hour
            if h < 9:
                hourly_counts["08:00"] += 1
            elif h < 11:
                hourly_counts["10:00"] += 1
            elif h < 13:
                hourly_counts["12:00"] += 1
            elif h < 15:
                hourly_counts["14:00"] += 1
            elif h < 17:
                hourly_counts["16:00"] += 1
            else:
                hourly_counts["18:00"] += 1
    hourly_alerts = [{"label": b, "value": hourly_counts[b]} for b in hourly_buckets]

    # Behavioral metrics from telemetry
    telemetry = (
        db.query(TelemetryRecord)
        .join(DrivingSession, TelemetryRecord.session_id == DrivingSession.id)
        .filter(DrivingSession.driver_id == user.id)
        .all()
    )
    if telemetry:
        ear_vals = [t.ear for t in telemetry if t.ear is not None]
        avg_ear = sum(ear_vals) / len(ear_vals) if ear_vals else None
        ear_stability = round((avg_ear / 0.285) * 100, 1) if avg_ear else 100.0
        centered_frames = len([t for t in telemetry if t.head_yaw is not None and abs(t.head_yaw) <= 15.0])
        focus_pct = round((centered_frames / len(telemetry)) * 100, 1)
    else:
        avg_ear = None
        ear_stability = None
        focus_pct = None

    drowsiness_alerts = len([a for a in all_alerts if a.category == "drowsiness"])
    fatigue_ratio = round(drowsiness_alerts / max(total_miles / 100.0, 1.0), 2) if total_miles > 0 else 0.0
    threat_violations = len([a for a in all_alerts if a.category == "weapon"])

    return {
        "hasData": total_sessions > 0 or len(all_alerts) > 0,
        "totalSessions": total_sessions,
        "totalHoursMonitored": total_hours,
        "totalMiles": total_miles,
        "weeklySafetyAverage": avg_score,
        "fatigueIncidentRatio": fatigue_ratio,
        "earStability": ear_stability,
        "avgEar": round(avg_ear, 3) if avg_ear is not None else None,
        "forwardFocusPct": focus_pct,
        "threatViolations": threat_violations,
        "dailyScores": weekly_scores,
        "hourlyAlerts": hourly_alerts,
        "csvRows": csv_rows,
    }
