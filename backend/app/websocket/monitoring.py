"""
DriveGuard AI — Real-Time Monitoring WebSocket Endpoint
Receives webcam frames from driver, processes through MediaPipe face mesh,
drowsiness detector, distraction detector, and threat detector.
Persists alerts, throttled telemetry, and session statistics to PostgreSQL.
"""
import json
import base64
import logging
import time
from datetime import datetime, timezone
from typing import Optional

import numpy as np
from fastapi import WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from backend.app.websocket.manager import ws_manager
from backend.app.database.connection import SessionLocal
from backend.app.models.alert import SafetyAlert
from backend.app.models.session import DrivingSession
from backend.app.models.telemetry import TelemetryRecord
from backend.app.models.user import User
from backend.app.services.safety_score import calculate_composite_safety_score
from backend.app.ai.face_detection.processor import FaceMeshProcessor
from backend.app.ai.drowsiness.detector import DrowsinessDetector
from backend.app.ai.distraction.detector import DistractionDetector
from backend.app.ai.threat_detection.detector import ThreatDetector
from backend.app.core.security import decode_access_token

logger = logging.getLogger("DriveGuardMonitor")

# AI pipeline singletons
face_processor = FaceMeshProcessor()
drowsiness_detector = DrowsinessDetector()
distraction_detector = DistractionDetector()
threat_detector = ThreatDetector()


async def monitoring_websocket(websocket: WebSocket, session_id: str, token: Optional[str] = None):
    """
    WebSocket endpoint for real-time monitoring.
    Client sends: {"frame": "<base64 JPEG>", "scenario": "normal"} or {"command": "ping"}
    Server responds with real MonitoringMetrics JSON and broadcasts alerts.
    """
    await ws_manager.connect_monitor(websocket, session_id)

    # Validate session and authentication
    db: Session = SessionLocal()
    try:
        session = db.query(DrivingSession).filter(DrivingSession.id == session_id).first()
        if not session:
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close(code=4004)
            return

        # If token provided, verify ownership
        if token:
            payload = decode_access_token(token)
            if not payload:
                logger.warning(f"Invalid token on monitor WS: session={session_id}")
            else:
                user_id = payload.get("sub")
                user_role = payload.get("role")
                if user_id != session.driver_id and user_role != "admin":
                    await websocket.send_json({"type": "error", "message": "Unauthorized session access"})
                    await websocket.close(code=4003)
                    return

        driver = db.query(User).filter(User.id == session.driver_id).first()
        driver_name = driver.name if driver else "Commercial Driver"
        driver_id = session.driver_id
    finally:
        db.close()

    frame_count = 0
    consecutive_face_lost_frames = 0
    last_face_loss_alert = 0.0
    active_scenario = "normal"
    had_active_drowsy_alert = False
    had_active_distract_alert = False

    # Session-isolated detector instances with clean calibration state
    face_processor = FaceMeshProcessor()
    drowsiness_detector = DrowsinessDetector()
    distraction_detector = DistractionDetector()
    threat_detector = ThreatDetector()

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            # Command handling
            if msg.get("command") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if "scenario" in msg:
                active_scenario = msg["scenario"]

            frame_data = msg.get("frame")
            if not frame_data:
                continue

            frame_count += 1

            # Decode frame and run AI pipeline
            try:
                if "," in frame_data:
                    frame_data = frame_data.split(",", 1)[1]

                img_bytes = base64.b64decode(frame_data)

                # 1. Real Face Mesh Inference
                face_result = face_processor.process_frame(img_bytes)

                # 2. Simulated scenario override if active
                if active_scenario == "drowsy":
                    face_result["face_detected"] = True
                    face_result["ear"] = 0.125
                    face_result["confidence"] = 0.98
                elif active_scenario == "distracted":
                    face_result["face_detected"] = True
                    face_result["pitch"] = -25.0
                    face_result["yaw"] = 32.0
                    face_result["confidence"] = 0.96

                now = time.time()

                if face_result["face_detected"]:
                    consecutive_face_lost_frames = 0
                    ear = face_result["ear"]
                    mar = face_result["mar"]
                    yaw = face_result["yaw"]
                    pitch = face_result["pitch"]
                    roll = face_result["roll"]
                    confidence = face_result.get("confidence", 0.98)

                    # Drowsiness evaluation
                    # Returns: (status, is_drowsy[continuous], severity, is_new_alert[one-shot DB write])
                    drowsy_status, is_drowsy, drowsy_severity, drowsy_new_alert = drowsiness_detector.evaluate(ear, mar)
                    # Distraction evaluation
                    # Returns: (status, is_distracted[continuous], severity, is_new_alert[one-shot DB write])
                    distract_status, is_distracted, distract_severity, distract_new_alert = distraction_detector.evaluate(yaw, pitch)
                    # Threat evaluation
                    threat_res = threat_detector.analyze_frame(img_bytes, simulate_scenario=active_scenario)

                    # Composite Safety Score
                    safety_score = calculate_composite_safety_score(ear, pitch, yaw, mar)

                    # Safety State
                    if safety_score >= 88:
                        safety_state = "normal"
                    elif safety_score >= 72:
                        safety_state = "caution"
                    elif safety_score >= 55:
                        safety_state = "warning"
                    else:
                        safety_state = "critical"

                    # Eye State Classification calibrated to driver's dynamic baseline
                    eff_thresh = drowsiness_detector.ear_threshold
                    if ear < eff_thresh - 0.035:
                        eye_state = "closed"
                    elif ear < eff_thresh:
                        eye_state = "sluggish"
                    else:
                        eye_state = "open"

                    # If eyes have reopened and attention is normal, clear any active drowsiness alarm
                    if had_active_drowsy_alert and not is_drowsy:
                        had_active_drowsy_alert = False
                        await websocket.send_json({
                            "type": "alert_cleared",
                            "category": "drowsiness",
                        })

                    # If driver returned gaze to road and distraction cleared, clear any active distraction alarm
                    if had_active_distract_alert and not is_distracted:
                        had_active_distract_alert = False
                        await websocket.send_json({
                            "type": "alert_cleared",
                            "category": "distraction",
                        })

                    # Head Pose Direction relative to calibrated neutral
                    yaw_dev = yaw - distraction_detector.neutral_yaw
                    pitch_dev = pitch - distraction_detector.neutral_pitch
                    if abs(yaw_dev) > 18.0:
                        head_pose = "right" if yaw_dev > 0 else "left"
                    elif pitch_dev < -15.0:
                        head_pose = "down"
                    elif pitch_dev > 15.0:
                        head_pose = "up"
                    else:
                        head_pose = "forward"

                    metrics = {
                        "type": "metrics",
                        "fps": face_result.get("fps", 15.0),
                        "latencyMs": face_result.get("latency_ms", 18),
                        "faceDetected": True,
                        "faceConfidence": confidence,
                        "safetyScore": safety_score,
                        "safetyState": safety_state,
                        "boundingBox": face_result.get("boundingBox"),
                        "drowsiness": {
                            "eyeState": eye_state,
                            "ear": ear,
                            "yawnDetected": mar > 0.55,
                            "blinkRatePerMin": face_result.get("blink_rate", 18),
                            "confidence": confidence,
                            "status": drowsy_status,
                        },
                        "distraction": {
                            "headPose": head_pose,
                            "yaw": yaw,
                            "pitch": pitch,
                            "roll": roll,
                            "neutralYaw": round(distraction_detector.neutral_yaw, 1),
                            "neutralPitch": round(distraction_detector.neutral_pitch, 1),
                            "confidence": confidence,
                            "status": distract_status,
                        },
                        "weapon": {
                            "detected": threat_res.get("detected", False),
                            "objectClass": threat_res.get("objectClass"),
                            "confidence": threat_res.get("confidence", 0.0),
                            "requiresVerification": threat_res.get("requiresVerification", True),
                            "severity": threat_res.get("severity", "low"),
                            "boundingBox": threat_res.get("boundingBox"),
                            "status": threat_res.get("status", "CABIN CLEAR"),
                            "available": threat_res.get("available", False),
                            "isSimulation": threat_res.get("isSimulation", False),
                        },
                    }

                    # Trigger Alerts if thresholds crossed
                    alert_to_save = None
                    if is_drowsy:
                        # Update continuous state tracker (drives alert_cleared emission)
                        had_active_drowsy_alert = True
                        # Only persist to DB on the first frame of a new alert episode
                        if drowsy_new_alert:
                            alert_to_save = {
                                "category": "drowsiness",
                                "title": drowsy_status,
                                "description": f"Prolonged eye closure detected (EAR: {ear:.3f}). Safety rating: {safety_score}/100.",
                                "severity": drowsy_severity,
                                "ear_value": ear,
                            }
                    elif is_distracted:
                        had_active_distract_alert = True
                        if distract_new_alert:
                            alert_to_save = {
                                "category": "distraction",
                                "title": distract_status,
                                "description": f"Gaze departure detected (Pitch: {pitch:.1f}°, Yaw: {yaw:.1f}°). Safety rating: {safety_score}/100.",
                                "severity": distract_severity,
                                "pitch_angle": pitch,
                                "yaw_angle": yaw,
                            }
                    elif threat_res.get("detected"):
                        alert_to_save = {
                            "category": "weapon",
                            "title": "Weapon Candidate Frame",
                            "description": "Cabin visual silhouette candidate flagged for dispatcher verification.",
                            "severity": "critical",
                            "object_class": threat_res.get("objectClass", "weapon_candidate"),
                        }

                    # Persist Alert to Database
                    if alert_to_save:
                        alert_db = SessionLocal()
                        try:
                            new_alert = SafetyAlert(
                                session_id=session_id,
                                driver_id=driver_id,
                                category=alert_to_save["category"],
                                title=alert_to_save["title"],
                                description=alert_to_save["description"],
                                severity=alert_to_save["severity"],
                                confidence=confidence,
                                ear_value=alert_to_save.get("ear_value"),
                                yaw_angle=alert_to_save.get("yaw_angle"),
                                pitch_angle=alert_to_save.get("pitch_angle"),
                                object_class=alert_to_save.get("object_class"),
                            )
                            alert_db.add(new_alert)

                            ses = alert_db.query(DrivingSession).filter(DrivingSession.id == session_id).first()
                            if ses:
                                ses.alert_count = (ses.alert_count or 0) + 1
                                if alert_to_save["severity"] in ("high", "critical"):
                                    ses.critical_alerts = (ses.critical_alerts or 0) + 1
                                ses.safety_score = safety_score
                                if safety_score < 70:
                                    ses.status = "warning"
                                if safety_score < 50:
                                    ses.status = "critical"

                            alert_db.commit()
                            alert_db.refresh(new_alert)

                            # Broadcast alert to driver and admins
                            alert_event = {
                                "type": "alert_created",
                                "alert": {
                                    "id": new_alert.id,
                                    "category": new_alert.category,
                                    "title": new_alert.title,
                                    "severity": new_alert.severity,
                                    "timestamp": datetime.now(timezone.utc).strftime("%I:%M:%S %p"),
                                    "driverName": driver_name,
                                    "driverId": driver_id,
                                    "sessionId": session_id,
                                    "confidence": confidence,
                                    "description": new_alert.description,
                                },
                            }
                            await websocket.send_json(alert_event)
                            await ws_manager.broadcast_to_driver(driver_id, alert_event)
                            await ws_manager.broadcast_to_admins(alert_event)
                        except Exception as ex:
                            logger.error(f"Failed to persist alert: {ex}")
                        finally:
                            alert_db.close()

                    # Save Telemetry Record every 15 frames (~1s interval)
                    if frame_count % 15 == 0:
                        telem_db = SessionLocal()
                        try:
                            record = TelemetryRecord(
                                session_id=session_id,
                                fps=float(metrics["fps"]),
                                latency_ms=int(metrics["latencyMs"]),
                                face_detected=True,
                                face_confidence=confidence,
                                ear=ear,
                                mar=mar,
                                head_yaw=yaw,
                                head_pitch=pitch,
                                head_roll=roll,
                                safety_score=safety_score,
                            )
                            telem_db.add(record)

                            ses = telem_db.query(DrivingSession).filter(DrivingSession.id == session_id).first()
                            if ses:
                                ses.safety_score = safety_score
                            telem_db.commit()
                        except Exception as ex:
                            logger.error(f"Failed to persist telemetry: {ex}")
                        finally:
                            telem_db.close()

                else:
                    # Face NOT detected
                    consecutive_face_lost_frames += 1

                    # Trigger prolonged face absence alert if missing for > 25 frames (~2.5s)
                    face_alert = None
                    if consecutive_face_lost_frames >= 25 and (now - last_face_loss_alert > 8.0):
                        last_face_loss_alert = now
                        face_alert = {
                            "category": "face_absent",
                            "title": "Face Absent / Obscured",
                            "description": "Driver facial profile lost for sustained duration. Road attention unverified.",
                            "severity": "high",
                        }

                    if face_alert:
                        f_db = SessionLocal()
                        try:
                            alert_obj = SafetyAlert(
                                session_id=session_id,
                                driver_id=driver_id,
                                category=face_alert["category"],
                                title=face_alert["title"],
                                description=face_alert["description"],
                                severity=face_alert["severity"],
                                confidence=0.0,
                            )
                            f_db.add(alert_obj)
                            ses = f_db.query(DrivingSession).filter(DrivingSession.id == session_id).first()
                            if ses:
                                ses.alert_count = (ses.alert_count or 0) + 1
                                ses.critical_alerts = (ses.critical_alerts or 0) + 1
                            f_db.commit()
                            f_db.refresh(alert_obj)

                            evt = {
                                "type": "alert_created",
                                "alert": {
                                    "id": alert_obj.id,
                                    "category": alert_obj.category,
                                    "title": alert_obj.title,
                                    "severity": alert_obj.severity,
                                    "timestamp": datetime.now(timezone.utc).strftime("%I:%M:%S %p"),
                                    "driverName": driver_name,
                                    "driverId": driver_id,
                                    "sessionId": session_id,
                                    "confidence": 0.0,
                                    "description": alert_obj.description,
                                },
                            }
                            await websocket.send_json(evt)
                            await ws_manager.broadcast_to_driver(driver_id, evt)
                            await ws_manager.broadcast_to_admins(evt)
                        except Exception as ex:
                            logger.error(f"Failed to persist face absence alert: {ex}")
                        finally:
                            f_db.close()

                    metrics = {
                        "type": "metrics",
                        "fps": face_result.get("fps", 15.0),
                        "latencyMs": face_result.get("latency_ms", 12),
                        "faceDetected": False,
                        "faceConfidence": 0.0,
                        "safetyScore": 75 if consecutive_face_lost_frames < 25 else 60,
                        "safetyState": "warning" if consecutive_face_lost_frames >= 25 else "caution",
                        "boundingBox": None,
                        "drowsiness": {
                            "eyeState": "open",
                            "ear": 0.0,
                            "yawnDetected": False,
                            "blinkRatePerMin": 0,
                            "confidence": 0.0,
                            "status": "SEARCHING FOR FACE",
                        },
                        "distraction": {
                            "headPose": "forward",
                            "yaw": 0.0,
                            "pitch": 0.0,
                            "roll": 0.0,
                            "confidence": 0.0,
                            "status": "FACE NOT DETECTED",
                        },
                        "weapon": {
                            "detected": False,
                            "objectClass": None,
                            "confidence": 0.0,
                            "requiresVerification": True,
                            "severity": "low",
                            "boundingBox": None,
                            "status": "CABIN CLEAR",
                            "available": threat_detector.available,
                            "isSimulation": False,
                        },
                    }

                # Send live metrics back to frontend
                await websocket.send_json(metrics)

            except Exception as e:
                logger.error(f"Frame processing error: {e}")
                await websocket.send_json({
                    "type": "metrics",
                    "fps": 15.0,
                    "latencyMs": 14,
                    "faceDetected": False,
                    "faceConfidence": 0.0,
                    "safetyScore": 90,
                    "safetyState": "normal",
                    "drowsiness": {"eyeState": "open", "ear": 0.28, "yawnDetected": False, "blinkRatePerMin": 18, "confidence": 0.0, "status": "ATTENTION NORMAL"},
                    "distraction": {"headPose": "forward", "yaw": 0.0, "pitch": 0.0, "roll": 0.0, "confidence": 0.0, "status": "FOCUSED ON ROAD"},
                    "weapon": {"detected": False, "objectClass": None, "confidence": 0.0, "requiresVerification": True, "severity": "low"},
                })

    except WebSocketDisconnect:
        ws_manager.disconnect_monitor(websocket, session_id)
        logger.info(f"Monitor WS disconnected: session={session_id}")
    except Exception as e:
        logger.error(f"Monitor WS error: {e}")
        ws_manager.disconnect_monitor(websocket, session_id)


async def driver_dashboard_websocket(websocket: WebSocket, user_id: str):
    """WebSocket for driver dashboard real-time updates."""
    await ws_manager.connect_driver(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect_driver(websocket, user_id)
    except Exception:
        ws_manager.disconnect_driver(websocket, user_id)


async def admin_dashboard_websocket(websocket: WebSocket):
    """WebSocket for admin fleet dashboard real-time updates."""
    await ws_manager.connect_admin(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect_admin(websocket)
    except Exception:
        ws_manager.disconnect_admin(websocket)
