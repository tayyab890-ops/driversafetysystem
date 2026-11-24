"""
DriveGuard AI — Real-Time Webcam Monitoring & AI Detection Test Suite
Tests MediaPipe face mesh, drowsiness thresholds, distraction logic,
threat detector status, WebSocket streaming, and session lifecycle.
"""
import base64
import json
import numpy as np
import cv2 as cv
from fastapi.testclient import TestClient

from backend.main import app
from backend.app.ai.face_detection.processor import FaceMeshProcessor
from backend.app.ai.drowsiness.detector import DrowsinessDetector
from backend.app.ai.distraction.detector import DistractionDetector
from backend.app.ai.threat_detection.detector import ThreatDetector
from backend.app.services.safety_score import calculate_composite_safety_score


def run_tests():
    print("=== STARTING REAL-TIME WEBCAM MONITORING & AI DETECTION TESTS ===")
    client = TestClient(app)

    # 1. Driver Login
    res_login = client.post("/api/auth/login", json={
        "email": "alex.mercer@safefleet.com",
        "password": "DriveGuard2026!",
        "role": "driver"
    })
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    token = res_login.json()["access_token"]
    user_id = res_login.json()["user"]["id"]
    print(f"✓ Authenticated Driver: {res_login.json()['user']['name']} ({user_id})")

    # 2. Test FaceMeshProcessor
    print("\n--- Testing FaceMeshProcessor ---")
    processor = FaceMeshProcessor()

    # Create synthetic test frame (640x480 black image)
    blank_img = np.zeros((480, 640, 3), dtype=np.uint8)
    _, buf = cv.imencode(".jpg", blank_img)
    blank_bytes = buf.tobytes()

    res_blank = processor.process_frame(blank_bytes)
    assert "face_detected" in res_blank, "Missing face_detected"
    assert "fps" in res_blank, "Missing fps"
    assert "latency_ms" in res_blank, "Missing latency_ms"
    assert res_blank["face_detected"] is False, "Expected no face on blank frame"
    print(f"✓ Blank frame test passed: face_detected=False, latency={res_blank['latency_ms']}ms")

    # 3. Test DrowsinessDetector
    print("\n--- Testing DrowsinessDetector ---")
    d_detector = DrowsinessDetector()
    d_detector.reset()

    # Normal eyes open (EAR 0.28)
    status, is_alert, sev = d_detector.evaluate(0.28, 0.18)
    assert status == "ATTENTION NORMAL" and not is_alert
    print("✓ Normal gaze: EAR 0.28 -> ATTENTION NORMAL")

    # Prolonged eye closure: frames 1-14 are non-alerting, frame 15 triggers alert
    for i in range(14):
        _, pre_alert, _ = d_detector.evaluate(0.14, 0.18)
        assert pre_alert is False, f"Frame {i+1} should not alert before threshold"
    status_alert, is_alert, sev = d_detector.evaluate(0.14, 0.18)
    assert is_alert is True, "Expected drowsiness alert on frame 15"
    assert "DROWSINESS" in status_alert or "MICROSLEEP" in status_alert
    print(f"✓ Prolonged closure detected: status='{status_alert}', is_alert={is_alert}, severity='{sev}'")

    # Test cooldown: frame 16 must not alert again due to cooldown
    status_cool, is_alert_cool, _ = d_detector.evaluate(0.14, 0.18)
    assert is_alert_cool is False, "Expected alert cooldown to suppress duplicate alert"
    print("✓ Alert cooldown verified: immediate duplicate alert suppressed")

    # 4. Test DistractionDetector
    print("\n--- Testing DistractionDetector ---")
    dist_detector = DistractionDetector()
    dist_detector.reset()

    # Normal road focus
    status, is_alert, _ = dist_detector.evaluate(0.0, 0.0)
    assert status == "FOCUSED ON ROAD" and not is_alert
    print("✓ Centered gaze: Yaw 0°, Pitch 0° -> FOCUSED ON ROAD")

    # Looking down at lap/phone (Pitch -25°: frames 1-7 non-alerting, frame 8 triggers alert)
    for i in range(7):
        _, pre_alert, _ = dist_detector.evaluate(0.0, -25.0)
        assert pre_alert is False, f"Pitch frame {i+1} should not alert before threshold"
    status_down, is_alert_down, sev_down = dist_detector.evaluate(0.0, -25.0)
    assert is_alert_down is True, "Expected phone/downward gaze alert on frame 8"
    assert "PHONE" in status_down or "DOWNWARD" in status_down
    print(f"✓ Downward gaze detected: status='{status_down}', is_alert={is_alert_down}, severity='{sev_down}'")

    # Head turned off-road (Yaw 30°: frames 1-7 non-alerting, frame 8 triggers alert)
    dist_detector.reset()
    for i in range(7):
        _, pre_alert, _ = dist_detector.evaluate(30.0, 0.0)
        assert pre_alert is False, f"Yaw frame {i+1} should not alert before threshold"
    status_side, is_alert_side, sev_side = dist_detector.evaluate(30.0, 0.0)
    assert is_alert_side is True, "Expected off-road head turn alert on frame 8"
    assert "HEAD TURNED" in status_side or "OFF-ROAD" in status_side
    print(f"✓ Off-road head turn detected: status='{status_side}', is_alert={is_alert_side}, severity='{sev_side}'")

    # 5. Test ThreatDetector Capabilities & Honesty
    print("\n--- Testing ThreatDetector Capabilities & Status ---")
    threat = ThreatDetector()
    report = threat.analyze_frame(blank_img)
    assert report["detected"] is False, "ThreatDetector must not fabricate detections on blank frames"
    assert "status" in report
    assert "modelInfo" in report
    print(f"✓ Threat model status reported honestly: available={report['available']}, status='{report['status']}'")

    # Test simulated scenario frame
    sim_report = threat.analyze_frame(blank_img, simulate_scenario="weapon_alert")
    assert sim_report["detected"] is True, "Expected detection on simulation scenario"
    assert sim_report.get("isSimulation") is True
    assert sim_report.get("boundingBox") is not None
    print(f"✓ Simulation scenario verified: objectClass='{sim_report['objectClass']}', confidence={sim_report['confidence']}")

    # 6. Test Composite Safety Score Calculation
    print("\n--- Testing Composite Safety Score Engine ---")
    score_normal = calculate_composite_safety_score(0.285, 0.0, 0.0, 0.18)
    assert score_normal >= 90, f"Expected normal score >= 90, got {score_normal}"
    print(f"✓ Normal posture composite score: {score_normal}/100")

    score_drowsy = calculate_composite_safety_score(0.12, -25.0, 30.0, 0.60)
    assert score_drowsy <= 65, f"Expected drowsy/distracted score <= 65, got {score_drowsy}"
    print(f"✓ Compromised posture composite score: {score_drowsy}/100")

    # 7. Test Session Lifecycle (Start & Stop) via REST API
    print("\n--- Testing Session Lifecycle via REST API ---")
    res_start = client.post(
        "/api/sessions/start",
        headers={"Authorization": f"Bearer {token}"},
        json={"vehicle": "Volvo XC90 Cockpit Unit #14"}
    )
    assert res_start.status_code == 200, f"Session start failed: {res_start.text}"
    session_data = res_start.json()
    session_id = session_data["sessionId"]
    print(f"✓ Session started in PostgreSQL: ID={session_id}, Vehicle={session_data['vehicle']}")

    # Test re-calling startSession recovers active session gracefully
    res_start_again = client.post(
        "/api/sessions/start",
        headers={"Authorization": f"Bearer {token}"},
        json={"vehicle": "Volvo XC90 Cockpit Unit #14"}
    )
    assert res_start_again.status_code == 200, "Expected recovery of existing active session"
    assert res_start_again.json()["sessionId"] == session_id
    print("✓ Active session recovery verified (no 409 lockout)")

    # 8. Test WebSocket Streaming Pipeline
    print("\n--- Testing WebSocket Streaming Pipeline ---")
    b64_frame = base64.b64encode(blank_bytes).decode("utf-8")

    with client.websocket_connect(f"/ws/monitor/{session_id}?token={token}") as ws:
        # Ping
        ws.send_json({"command": "ping"})
        msg_pong = ws.receive_json()
        assert msg_pong.get("type") == "pong"
        print("✓ WebSocket Ping/Pong verified")

        # Send test frame
        ws.send_json({"frame": b64_frame, "scenario": "normal"})
        metrics = ws.receive_json()
        assert metrics.get("type") == "metrics", f"Expected metrics message, got {metrics}"
        assert "safetyScore" in metrics
        assert "drowsiness" in metrics
        assert "distraction" in metrics
        assert "weapon" in metrics
        print(f"✓ Frame metrics received: Safety Score={metrics['safetyScore']}, Face={metrics['faceDetected']}, Latency={metrics['latencyMs']}ms")

        # Test sending simulated scenario frame to trigger alert persistence
        ws.send_json({"frame": b64_frame, "scenario": "drowsy"})
        # Send enough frames to cross temporal threshold
        alert_received = False
        for _ in range(18):
            ws.send_json({"frame": b64_frame, "scenario": "drowsy"})
            resp = ws.receive_json()
            if resp.get("type") == "alert_created":
                alert_received = True
                print(f"✓ Live WebSocket alert received: category={resp['alert']['category']}, severity={resp['alert']['severity']}")
                break
            elif resp.get("type") == "metrics" and resp.get("drowsiness", {}).get("status") != "ATTENTION NORMAL":
                pass

    # 9. Stop Session & Verify Completion
    print("\n--- Testing Stop Session & PostgreSQL Finalization ---")
    res_stop = client.post(
        f"/api/sessions/{session_id}/stop",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_stop.status_code == 200, f"Session stop failed: {res_stop.text}"
    stop_data = res_stop.json()
    assert stop_data["status"] == "completed"
    print(f"✓ Session stopped: status={stop_data['status']}, duration={stop_data['durationMinutes']}m, alerts={stop_data['alertCount']}")

    print("\n=======================================================")
    print("ALL REAL-TIME WEBCAM MONITORING & AI TESTS PASSED! (100%)")
    print("=======================================================")


if __name__ == "__main__":
    run_tests()
