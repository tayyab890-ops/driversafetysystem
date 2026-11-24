"""
DriveGuard AI — Drowsiness Detection & Calibration Test Suite
Tests adaptive baseline calibration, landmark accuracy, temporal smoothing,
brief blink immunity, prolonged closure alerts, and immediate counter reset on eye reopen.
"""
import numpy as np
from backend.app.ai.drowsiness.detector import DrowsinessDetector
from backend.app.ai.face_detection.processor import (
    LEFT_EYE_POINTS,
    RIGHT_EYE_POINTS,
    _calculate_ear_accurate,
)


class MockLandmark:
    def __init__(self, x, y):
        self.x = x
        self.y = y


def run_tests():
    print("=== STARTING DROWSINESS DETECTION & CALIBRATION TESTS ===\n")
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
    # TEST 1: Accurate 8-Point EAR Geometry Calculation
    # -------------------------------------------------------------------------
    print("Test 1: MediaPipe 8-Point Apex-Weighted EAR Calculation")
    w, h = 640.0, 360.0

    # Build simulated open eye landmarks (w=640, h=360)
    # Eye width = 40px, Center vertical opening = 12px, sides = 8px
    landmarks = [MockLandmark(0, 0)] * 500
    # Left eye mapping
    landmarks[362] = MockLandmark(200.0 / w, 150.0 / h)  # inner corner
    landmarks[263] = MockLandmark(240.0 / w, 150.0 / h)  # outer corner
    landmarks[385] = MockLandmark(210.0 / w, 146.0 / h)  # top inner
    landmarks[386] = MockLandmark(220.0 / w, 144.0 / h)  # top apex
    landmarks[387] = MockLandmark(230.0 / w, 146.0 / h)  # top outer
    landmarks[380] = MockLandmark(210.0 / w, 154.0 / h)  # bot inner
    landmarks[374] = MockLandmark(220.0 / w, 156.0 / h)  # bot apex
    landmarks[373] = MockLandmark(230.0 / w, 154.0 / h)  # bot outer

    ear_open = _calculate_ear_accurate(landmarks, LEFT_EYE_POINTS, w, h)
    print(f"  Calculated Open Eye EAR: {ear_open:.3f}")
    assert_test(0.25 <= ear_open <= 0.35, f"Open eye EAR ({ear_open:.3f}) falls in healthy open range (0.25–0.35)")

    # Build simulated closed eye landmarks (vertical distance = 1px)
    landmarks[385] = MockLandmark(210.0 / w, 149.5 / h)
    landmarks[386] = MockLandmark(220.0 / w, 149.5 / h)
    landmarks[387] = MockLandmark(230.0 / w, 149.5 / h)
    landmarks[380] = MockLandmark(210.0 / w, 150.5 / h)
    landmarks[374] = MockLandmark(220.0 / w, 150.5 / h)
    landmarks[373] = MockLandmark(230.0 / w, 150.5 / h)

    ear_closed = _calculate_ear_accurate(landmarks, LEFT_EYE_POINTS, w, h)
    print(f"  Calculated Closed Eye EAR: {ear_closed:.3f}")
    assert_test(ear_closed <= 0.08, f"Closed eye EAR ({ear_closed:.3f}) collapses below 0.08")
    assert_test(ear_open / max(ear_closed, 0.001) >= 4.0, "Open vs closed EAR shows > 4x contrast")

    # -------------------------------------------------------------------------
    # TEST 2: Eyes Open Looking Straight -> NO ALERT
    # -------------------------------------------------------------------------
    print("\nTest 2: Eyes Open Looking Straight (NO ALERT)")
    detector = DrowsinessDetector()
    detector.reset()

    for frame in range(30):
        status, is_alert, sev = detector.evaluate(0.285, 0.18)
        assert_test(is_alert is False, f"Frame {frame+1}: Open eye does not alert")
        assert_test(status == "ATTENTION NORMAL", f"Frame {frame+1}: Status is ATTENTION NORMAL")
        if not (is_alert is False and status == "ATTENTION NORMAL"):
            break

    # -------------------------------------------------------------------------
    # TEST 3: Normal Physiological Blinking (1-3 frames closed) -> NO ALERT
    # -------------------------------------------------------------------------
    print("\nTest 3: Normal Physiological Blinking (NO ALERT)")
    detector.reset()

    # Driver looking open
    for _ in range(10):
        detector.evaluate(0.28, 0.18)

    # Fast blink: 3 frames with closed eye EAR=0.08
    for blink_frame in range(3):
        status, is_alert, sev = detector.evaluate(0.08, 0.18)
        assert_test(is_alert is False, f"Blink frame {blink_frame+1} (EAR 0.08) does NOT trigger alert")
        assert_test(sev == "low", f"Blink frame {blink_frame+1} severity is low")

    # Eyes reopen
    status, is_alert, sev = detector.evaluate(0.28, 0.18)
    assert_test(is_alert is False, "Reopened eye does not alert")
    assert_test(status == "ATTENTION NORMAL", "Status returns to ATTENTION NORMAL immediately after blink")
    assert_test(detector.consecutive_low_frames == 0, "Consecutive low frames reset to 0 after blink")

    # -------------------------------------------------------------------------
    # TEST 4: Brief Eye Closure (5-10 frames) -> NO Warning Beep
    # -------------------------------------------------------------------------
    print("\nTest 4: Brief Eye Closure (5-10 frames) -> NO Warning Beep")
    detector.reset()

    for f in range(8):
        status, is_alert, sev = detector.evaluate(0.12, 0.18)
        assert_test(is_alert is False, f"Brief closure frame {f+1} does NOT trigger warning beep")

    # Eyes reopen on frame 9
    status, is_alert, _ = detector.evaluate(0.28, 0.18)
    assert_test(detector.consecutive_low_frames == 0, "Counter immediately reset to 0 upon eye reopening")
    assert_test(status == "ATTENTION NORMAL", "Status restored to ATTENTION NORMAL")

    # -------------------------------------------------------------------------
    # TEST 5: Prolonged Closure (>= 15 frames) -> DROWSINESS ALERT
    # -------------------------------------------------------------------------
    print("\nTest 5: Genuine Prolonged Closure (>= 15 frames) -> DROWSINESS ALERT")
    detector.reset()

    # Frames 1-14 must NOT alert
    for f in range(14):
        _, is_alert, _ = detector.evaluate(0.14, 0.18)
        assert_test(is_alert is False, f"Closure frame {f+1} is non-alerting prior to 15 frames")

    # Frame 15 MUST alert
    status, is_alert, sev = detector.evaluate(0.14, 0.18)
    assert_test(is_alert is True, "Frame 15 triggers drowsiness alert")
    assert_test("DROWSINESS" in status or "MICROSLEEP" in status, f"Alert status is '{status}'")
    assert_test(sev in ("high", "critical"), f"Alert severity is '{sev}'")

    # -------------------------------------------------------------------------
    # TEST 6: Eyes Reopen After Alert -> Counter Resets & Alert Clears
    # -------------------------------------------------------------------------
    print("\nTest 6: Eyes Reopen After Alert -> Condition Clears Immediately")
    # Eyes reopen
    status_reopen, is_alert_reopen, _ = detector.evaluate(0.28, 0.18)
    assert_test(is_alert_reopen is False, "Eyes open frame does not alert")
    assert_test(status_reopen == "ATTENTION NORMAL", "Status immediately returns to ATTENTION NORMAL")
    assert_test(detector.consecutive_low_frames == 0, "Consecutive low counter reset to 0 immediately")
    assert_test(detector.alert_active is False, "Alert active flag cleared")

    # -------------------------------------------------------------------------
    # TEST 7: Microsleep Detection (>= 25 frames continuous closure)
    # -------------------------------------------------------------------------
    print("\nTest 7: Microsleep Detection (>= 25 frames continuous closure)")
    detector.reset()

    for f in range(24):
        detector.evaluate(0.11, 0.18)

    # Frame 25 (microsleep threshold)
    status_micro, is_alert_micro, sev_micro = detector.evaluate(0.11, 0.18)
    assert_test(status_micro == "MICROSLEEP WARNING", f"Frame 25 triggers '{status_micro}'")
    assert_test(sev_micro == "critical", "Microsleep severity is critical")

    # -------------------------------------------------------------------------
    # TEST 8: Adaptive Baseline Calibration for Naturally Narrow Eyes
    # -------------------------------------------------------------------------
    print("\nTest 8: Adaptive Baseline Calibration for Naturally Narrow Eyes")
    detector.reset()

    # Simulate driver with narrower eye shape (open EAR ~ 0.22 instead of 0.28)
    for _ in range(20):
        detector.evaluate(0.22, 0.18)

    print(f"  Calibrated Baseline EAR: {detector.baseline_ear:.3f}")
    print(f"  Dynamically Calibrated Threshold: {detector.ear_threshold:.3f}")
    assert_test(detector.is_calibrated is True, "Driver baseline calibration complete")
    assert_test(detector.ear_threshold < 0.165, f"Threshold adapted downward ({detector.ear_threshold:.3f} < 0.165) for narrower eyes")

    # Driver looks straight ahead with their normal 0.21 eyes -> MUST NOT ALERT
    status_narrow, is_alert_narrow, _ = detector.evaluate(0.21, 0.18)
    assert_test(is_alert_narrow is False, "Narrow eye driver looking at camera does NOT trigger alert")
    assert_test(status_narrow == "ATTENTION NORMAL", "Narrow eye driver status remains ATTENTION NORMAL")

    print(f"\n=======================================================")
    print(f"RESULTS: {tests_passed} passed, {tests_failed} failed")
    print(f"=======================================================\n")

    if tests_failed > 0:
        raise SystemExit(1)


if __name__ == "__main__":
    run_tests()
