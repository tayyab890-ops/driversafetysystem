"""
DriveGuard AI — Drowsiness & Microsleep Detector
Evaluates Eye Aspect Ratio (EAR) and Mouth Aspect Ratio (MAR) with adaptive
baseline calibration, temporal persistence, and immediate closure-counter reset.
"""
import logging
import time
from typing import Tuple
import numpy as np
from backend.app.core.config import settings

logger = logging.getLogger("DrowsinessDetector")


class DrowsinessDetector:
    def __init__(self):
        self.baseline_ear: float = 0.280
        self.ear_threshold: float = settings.EAR_DROWSINESS_THRESHOLD  # 0.180 default
        self.mar_threshold: float = settings.MAR_YAWN_THRESHOLD  # 0.550
        self.consec_threshold: int = settings.EAR_CONSEC_FRAMES  # 15 frames (~1.1s at 14 FPS)
        self.microsleep_threshold: int = 25  # frames for microsleep (~1.8s at 14 FPS)

        self.consecutive_low_frames: int = 0
        self.consecutive_yawn_frames: int = 0
        self.last_alert_time: float = 0.0
        self.cooldown_seconds: float = 6.0

        # Adaptive baseline calibration
        self.is_calibrated: bool = False
        self.calibration_samples: list = []
        self.last_status: str = "ATTENTION NORMAL"
        self.alert_active: bool = False

    def evaluate(self, ear: float, mar: float) -> Tuple[str, bool, str]:
        """
        Evaluate drowsiness from EAR and MAR.
        Returns: (status_string, is_alert, severity).

        Rules:
        - Normal blinking (1-4 frames below threshold): NO ALERT.
        - Prolonged closure (>= 15 frames): DROWSINESS DETECTED.
        - Severe closure (>= 25 frames): MICROSLEEP WARNING.
        - Eyes reopen (ear >= threshold): counter resets to 0 immediately.
        """
        now = time.time()
        in_cooldown = (now - self.last_alert_time) < self.cooldown_seconds

        # =====================================================================
        # 1. EYES OPEN (EAR >= Threshold)
        # =====================================================================
        if ear >= self.ear_threshold:
            # Immediate reset of low frames counter upon eye reopening
            if self.consecutive_low_frames > 0:
                self.consecutive_low_frames = 0

            # Log alert clearance
            if self.alert_active:
                logger.info(
                    f"[DrowsinessDetector] Alert condition cleared: eyes reopened "
                    f"(EAR={ear:.3f} >= threshold {self.ear_threshold:.3f}). Counter reset to 0."
                )
                self.alert_active = False

            # Adaptive baseline calibration when eyes are comfortably open
            if ear >= 0.20:
                if not self.is_calibrated:
                    self.calibration_samples.append(ear)
                    if len(self.calibration_samples) >= 15:
                        self.baseline_ear = float(np.median(self.calibration_samples))
                        # Set threshold to 65% of open baseline, clamped between 0.145 and 0.200
                        self.ear_threshold = max(0.145, min(0.200, self.baseline_ear * 0.65))
                        self.is_calibrated = True
                        logger.info(
                            f"[DrowsinessDetector] Driver baseline calibrated: {self.baseline_ear:.3f} | "
                            f"Dynamic EAR threshold set to: {self.ear_threshold:.3f}"
                        )
                else:
                    # Slow adaptive drift tracking under varying ambient cabin lighting
                    if ear > self.ear_threshold + 0.03:
                        self.baseline_ear = 0.995 * self.baseline_ear + 0.005 * ear
                        self.ear_threshold = max(0.145, min(0.200, self.baseline_ear * 0.65))

            # Yawn evaluation
            if mar > self.mar_threshold:
                self.consecutive_yawn_frames += 1
                if self.consecutive_yawn_frames >= 12:
                    self.last_status = "YAWNING DETECTED"
                    return "YAWNING DETECTED", False, "low"
            else:
                self.consecutive_yawn_frames = max(0, self.consecutive_yawn_frames - 1)

            self.last_status = "ATTENTION NORMAL"
            return "ATTENTION NORMAL", False, "low"

        # =====================================================================
        # 2. EYES CLOSED / SUB-THRESHOLD (EAR < Threshold)
        # =====================================================================
        self.consecutive_low_frames += 1

        # Level 3: Microsleep (sustained closure >= 25 frames, ~1.8s)
        if self.consecutive_low_frames >= self.microsleep_threshold:
            status = "MICROSLEEP WARNING"
            severity = "critical"
            is_alert = not in_cooldown
            if is_alert:
                self.last_alert_time = now
                self.alert_active = True
                logger.warning(
                    f"[DrowsinessDetector] ALERT TRIGGERED: {status} (Severity: {severity}) | "
                    f"EAR={ear:.3f} < {self.ear_threshold:.3f} for {self.consecutive_low_frames} consecutive frames."
                )
            self.last_status = status
            return status, is_alert, severity

        # Level 2: Drowsiness (sustained closure >= 15 frames, ~1.1s)
        if self.consecutive_low_frames >= self.consec_threshold:
            status = "DROWSINESS DETECTED"
            severity = "high"
            is_alert = not in_cooldown
            if is_alert:
                self.last_alert_time = now
                self.alert_active = True
                logger.warning(
                    f"[DrowsinessDetector] ALERT TRIGGERED: {status} (Severity: {severity}) | "
                    f"EAR={ear:.3f} < {self.ear_threshold:.3f} for {self.consecutive_low_frames} consecutive frames."
                )
            self.last_status = status
            return status, is_alert, severity

        # Level 1: Early closure transition (5-14 frames) — visual indicator only, NO audio alert
        if self.consecutive_low_frames >= 5:
            self.last_status = "EYES CLOSING"
            return "EYES CLOSING", False, "medium"

        # Brief closure (1-4 frames) — normal physiological blink, NO alert
        self.last_status = "ATTENTION NORMAL"
        return "ATTENTION NORMAL", False, "low"

    def reset(self):
        """Reset all temporal counters and calibration state."""
        self.consecutive_low_frames = 0
        self.consecutive_yawn_frames = 0
        self.last_alert_time = 0.0
        self.calibration_samples.clear()
        self.is_calibrated = False
        self.baseline_ear = 0.280
        self.ear_threshold = settings.EAR_DROWSINESS_THRESHOLD
        self.last_status = "ATTENTION NORMAL"
        self.alert_active = False
