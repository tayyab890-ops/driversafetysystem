"""
DriveGuard AI — Distraction Detection & Calibration Test Suite
Tests adaptive forward-facing neutral calibration, solvePnP angles,
temporal smoothing, brief glance immunity, sustained off-road alerts,
immediate counter reset on road re-focus, and alert clearing.
"""
import numpy as np
import cv2 as cv
from backend.app.ai.distraction.detector import DistractionDetector
from backend.app.ai.face_detection.processor import (
    MODEL_POINTS,
    FaceMeshProcessor,
)


def run_tests():
    print("=== STARTING DISTRACTION DETECTION & CALIBRATION TESTS ===\n")
    tests_passed = 0
    tests_failed = 0

    def assert_test(condition: bool, name: str):
        nonlocal tests_passed, tests_failed
        if condition:
            print(f"  [PASS] {name}")
            tests_passed += 1
        else:
            print(f"  [FAIL] {name}")
            tests_failed += 1

    # -------------------------------------------------------------------------
    # TEST 1: 3D Model Points & solvePnP Orientation & Sign Verification
    # -------------------------------------------------------------------------
    print("Test 1: 3D Anthropometric Model Points & solvePnP Angle Conventions")
    w, h = 640, 480
    focal_length = w
    camera_matrix = np.array([
        [focal_length, 0, w / 2.0],
        [0, focal_length, h / 2.0],
        [0, 0, 1],
    ], dtype=np.float64)
    dist_coeffs = np.zeros((4, 1))
    tvec = np.array([[0.0], [0.0], [800.0]], dtype=np.float64)

    # 1a. Neutral face
    rvec_neutral = np.zeros((3, 1), dtype=np.float64)
    pts_neutral, _ = cv.projectPoints(MODEL_POINTS, rvec_neutral, tvec, camera_matrix, dist_coeffs)
    ret, r_est, _ = cv.solvePnP(MODEL_POINTS, pts_neutral.reshape(-1, 2), camera_matrix, dist_coeffs)
    rmat, _ = cv.Rodrigues(r_est)
    angles, _, _, _, _, _ = cv.RQDecomp3x3(rmat)
    p_neutral = -angles[0]
    y_neutral = angles[1]
    assert_test(abs(p_neutral) < 0.1 and abs(y_neutral) < 0.1, f"Neutral face yields (0°, 0°): pitch={p_neutral:.2f}°, yaw={y_neutral:.2f}°")

    # 1b. Looking down 25 deg
    rvec_down, _ = cv.Rodrigues(np.array([np.radians(25), 0.0, 0.0]))
    pts_down, _ = cv.projectPoints(MODEL_POINTS, rvec_down, tvec, camera_matrix, dist_coeffs)
    ret, r_est_down, _ = cv.solvePnP(MODEL_POINTS, pts_down.reshape(-1, 2), camera_matrix, dist_coeffs)
    rmat_down, _ = cv.Rodrigues(r_est_down)
    angles_down, _, _, _, _, _ = cv.RQDecomp3x3(rmat_down)
    p_down = -angles_down[0]
    assert_test(abs(p_down - (-25.0)) < 0.5, f"Looking down yields negative pitch: pitch={p_down:.2f}° (expected -25.0°)")

    # 1c. Head turned right 25 deg
    rvec_right, _ = cv.Rodrigues(np.array([0.0, np.radians(25), 0.0]))
    pts_right, _ = cv.projectPoints(MODEL_POINTS, rvec_right, tvec, camera_matrix, dist_coeffs)
    ret, r_est_right, _ = cv.solvePnP(MODEL_POINTS, pts_right.reshape(-1, 2), camera_matrix, dist_coeffs)
    rmat_right, _ = cv.Rodrigues(r_est_right)
    angles_right, _, _, _, _, _ = cv.RQDecomp3x3(rmat_right)
    y_right = angles_right[1]
    assert_test(abs(y_right - 25.0) < 0.5, f"Turning head right yields positive yaw: yaw={y_right:.2f}° (expected +25.0°)")

    # -------------------------------------------------------------------------
    # TEST 2: Temporal Smoothing of Head Pose Angles
    # -------------------------------------------------------------------------
    print("\nTest 2: 3-Frame Rolling Median Temporal Smoothing on Head Pose")
    proc = FaceMeshProcessor()
    proc.reset()
    # Feed mock poses with a single-frame spike: [0, 0, 0], [0, 0, 0], [50, 50, 0]
    proc.pose_history.append((0.0, 0.0, 0.0))
    proc.pose_history.append((0.0, 0.0, 0.0))
    proc.pose_history.append((-45.0, 35.0, 0.0))  # Noise spike
    recent = list(proc.pose_history)[-3:]
    sm_pitch = float(np.median([p[0] for p in recent]))
    sm_yaw = float(np.median([p[1] for p in recent]))
    assert_test(sm_pitch == 0.0 and sm_yaw == 0.0, f"Single-frame noise spike filtered by rolling median: pitch={sm_pitch}, yaw={sm_yaw}")

    # -------------------------------------------------------------------------
    # TEST 3: Adaptive Forward-Facing Neutral Calibration
    # -------------------------------------------------------------------------
    print("\nTest 3: Adaptive Calibration with Tilted Driver Head Position")
    detector = DistractionDetector()
    detector.reset()

    # Driver sits naturally with head at yaw=6.5°, pitch=-5.0° (common monitor angle)
    for _ in range(15):
        detector.evaluate(6.5, -5.0)

    assert_test(detector.is_calibrated is True, "Detector successfully completes adaptive calibration after 15 frames")
    assert_test(abs(detector.neutral_yaw - 6.5) < 0.1, f"Calibrated neutral yaw matches driver position: {detector.neutral_yaw:.1f}°")
    assert_test(abs(detector.neutral_pitch - (-5.0)) < 0.1, f"Calibrated neutral pitch matches driver position: {detector.neutral_pitch:.1f}°")

    # While driver continues to look at their natural position, NO ALERT should trigger
    status, is_alert, _ = detector.evaluate(6.5, -5.0)
    assert_test(status == "FOCUSED ON ROAD" and not is_alert, f"Driver at natural neutral posture: status='{status}', is_alert={is_alert}")

    # -------------------------------------------------------------------------
    # TEST 4: Small Head Movements (Immunity to Jitter)
    # -------------------------------------------------------------------------
    print("\nTest 4: Small Head Movements within Safe Road Attention Zone")
    for delta_y, delta_p in [(+5.0, +3.0), (-6.0, -4.0), (+8.0, -5.0), (-7.0, +4.0)]:
        st, alert, _ = detector.evaluate(6.5 + delta_y, -5.0 + delta_p)
        assert_test(st == "FOCUSED ON ROAD" and not alert, f"Small head motion (Δyaw={delta_y:+.1f}°, Δpitch={delta_p:+.1f}°): NO ALERT")

    # -------------------------------------------------------------------------
    # TEST 5: Brief Glances Away (Glance Immunity)
    # -------------------------------------------------------------------------
    print("\nTest 5: Brief Off-Road Glance (1-4 frames) Does Not Trigger Alert")
    detector.reset()
    # Establish neutral at 0, 0
    for _ in range(15):
        detector.evaluate(0.0, 0.0)

    # Driver glances at side mirror for 4 frames
    for i in range(4):
        st, is_alert, _ = detector.evaluate(30.0, 0.0)
        assert_test(is_alert is False, f"Glance frame {i+1}/4: is_alert=False, status='{st}'")
        assert_test(st == "GLANCING ASIDE", f"Glance frame {i+1}/4 labeled as GLANCING ASIDE")

    # Driver returns to road on frame 5
    st_ret, alert_ret, _ = detector.evaluate(0.0, 0.0)
    assert_test(st_ret == "FOCUSED ON ROAD" and not alert_ret, "Driver returned to road: status='FOCUSED ON ROAD'")
    assert_test(detector.consecutive_distracted_frames == 0, "Distraction counter immediately reset to 0 upon return")

    # -------------------------------------------------------------------------
    # TEST 6: Sustained Looking Down / Phone Distraction Alert
    # -------------------------------------------------------------------------
    print("\nTest 6: Sustained Downward Gaze (Phone / Lap Gaze)")
    detector.reset()
    for _ in range(15):
        detector.evaluate(0.0, 0.0)

    # Downward gaze for 7 frames (below threshold)
    for i in range(7):
        st, is_alert, _ = detector.evaluate(0.0, -25.0)
        assert_test(is_alert is False, f"Downward frame {i+1} does not alert prematurely")

    # Frame 8 crosses duration threshold
    st_down, alert_down, sev_down = detector.evaluate(0.0, -25.0)
    assert_test(alert_down is True, "Downward gaze triggers alert at frame 8")
    assert_test("PHONE" in st_down or "DOWNWARD" in st_down, f"Status correctly identifies downward gaze: '{st_down}'")
    assert_test(sev_down == "high", f"Downward gaze severity is high: '{sev_down}'")

    # Frame 9: Cooldown prevents repeated duplicate audio alert
    _, alert_dup, _ = detector.evaluate(0.0, -25.0)
    assert_test(alert_dup is False, "Repeated frame while active suppresses duplicate alert")

    # -------------------------------------------------------------------------
    # TEST 7: Immediate Clearance and Audio Silence on Forward Return
    # -------------------------------------------------------------------------
    print("\nTest 7: Immediate Counter Reset & Alert Clearance on Forward Return")
    st_clear, alert_clear, _ = detector.evaluate(0.0, 0.0)
    assert_test(st_clear == "FOCUSED ON ROAD", f"Status immediately returns to 'FOCUSED ON ROAD': got '{st_clear}'")
    assert_test(alert_clear is False, "No alert on forward return")
    assert_test(detector.consecutive_distracted_frames == 0, f"Counter immediately reset to 0: got {detector.consecutive_distracted_frames}")
    assert_test(detector.alert_active is False, "Alert active flag immediately cleared")

    # -------------------------------------------------------------------------
    # TEST 8: Sustained Head Turn Off-Road (Left and Right)
    # -------------------------------------------------------------------------
    print("\nTest 8: Sustained Head Turn Off-Road (Left & Right)")
    # Test Left turn (-30°)
    detector.reset()
    for _ in range(15):
        detector.evaluate(0.0, 0.0)
    for _ in range(7):
        detector.evaluate(-30.0, 0.0)
    st_left, alert_left, sev_left = detector.evaluate(-30.0, 0.0)
    assert_test(alert_left is True, "Left head turn triggers alert at frame 8")
    assert_test("HEAD TURNED" in st_left or "OFF-ROAD" in st_left, f"Status indicates head turned: '{st_left}'")

    # Return to road
    detector.evaluate(0.0, 0.0)
    assert_test(detector.consecutive_distracted_frames == 0, "Counter reset after left turn")

    # Fast forward past cooldown
    detector.last_alert_time = 0.0

    # Test Right turn (+30°)
    for _ in range(7):
        detector.evaluate(30.0, 0.0)
    st_right, alert_right, sev_right = detector.evaluate(30.0, 0.0)
    assert_test(alert_right is True, "Right head turn triggers alert at frame 8")
    assert_test("HEAD TURNED" in st_right or "OFF-ROAD" in st_right, f"Status indicates head turned: '{st_right}'")

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print(f"\n=== RESULTS: {tests_passed} PASSED, {tests_failed} FAILED ===")
    assert tests_failed == 0, f"{tests_failed} distraction detection tests failed!"


if __name__ == "__main__":
    run_tests()
