"""
DriveGuard AI — Drowsiness & Microsleep Detector
Evaluates Eye Aspect Ratio (EAR) and Mouth Aspect Ratio (MAR) with adaptive
baseline calibration, temporal persistence, and immediate closure-counter reset.

Design principles:
- 'is_new_alert' fires ONCE per new alert event (for DB persistence and WS broadcast).
- 'is_drowsy'    is True for the ENTIRE DURATION that the alert condition persists —
  the WebSocket handler uses this to maintain continuous audio and UI state.
- Counter resets to 0 IMMEDIATELY when eyes reopen so a new closure episode
  triggers a fresh alert without cooldown delay.
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
        self.cooldown_seconds: float = 6.0  # Minimum gap before logging a *new* DB alert

        # Adaptive baseline calibration
        self.is_calibrated: bool = False
        self.calibration_samples: list = []
        self.last_status: str = "ATTENTION NORMAL"

        # alert_active: True during the entire drowsy episode (drives continuous beep)
        self.alert_active: bool = False
        # new_alert_fired: True after first DB alert fires for this episode (prevents duplicate DB writes)
        self.new_alert_fired: bool = False

    def evaluate(self, ear: float, mar: float) -> Tuple[str, bool, str, bool]:
        """
        Evaluate drowsiness from EAR and MAR.
        Returns: (status_string, is_drowsy, severity, is_new_alert)

        - is_drowsy:    True for the ENTIRE DURATION the condition persists (drives continuous audio).
        - is_new_alert: True only on the FIRST frame of a new alert episode (drives DB write).

        Rules:
        - Normal blinking (1-4 frames below threshold): NO ALERT.
        - Prolonged closure (>= 15 frames): DROWSINESS DETECTED.
        - Severe closure (>= 25 frames): MICROSLEEP WARNING.
        - Eyes reopen (ear >= threshold): counter resets to 0 immediately, episode ends.
        """
        now = time.time()

        # =====================================================================
        # 1. EYES OPEN (EAR >= Threshold)
        # =====================================================================
        if ear >= self.ear_threshold:
            # Immediate reset of low frames counter upon eye reopening
            if self.consecutive_low_frames > 0:
                self.consecutive_low_frames = 0

            # Log alert clearance and reset active state
            if self.alert_active:
                logger.info(
                    f"[DrowsinessDetector] Alert condition CLEARED: eyes reopened "
                    f"(EAR={ear:.3f} >= threshold {self.ear_threshold:.3f}). Counter reset to 0."
                )
                self.alert_active = False
                self.new_alert_fired = False
                # Reset cooldown so next closure triggers fresh alert immediately
                self.last_alert_time = 0.0

            # Adaptive baseline calibration when eyes are comfortably open
            if ear >= 0.17:
                if not self.is_calibrated:
                    self.calibration_samples.append(ear)
                    if len(self.calibration_samples) >= 15:
                        self.baseline_ear = float(np.median(self.calibration_samples))
                        # Set threshold to 62% of open baseline, clamped between 0.140 and 0.190
                        self.ear_threshold = max(0.140, min(0.190, self.baseline_ear * 0.62))
                        self.is_calibrated = True
                        logger.info(
                            f"[DrowsinessDetector] Driver baseline calibrated: {self.baseline_ear:.3f} | "
                            f"Dynamic EAR threshold: {self.ear_threshold:.3f}"
                        )
                else:
                    # Slow adaptive drift tracking under varying ambient cabin lighting
                    if ear > self.ear_threshold + 0.03:
                        self.baseline_ear = 0.995 * self.baseline_ear + 0.005 * ear
                        self.ear_threshold = max(0.140, min(0.190, self.baseline_ear * 0.62))

            # Yawn evaluation (eyes open only)
            if mar > self.mar_threshold:
                self.consecutive_yawn_frames += 1
                if self.consecutive_yawn_frames >= 12:
                    self.last_status = "YAWNING DETECTED"
                    return "YAWNING DETECTED", False, "low", False
            else:
                self.consecutive_yawn_frames = max(0, self.consecutive_yawn_frames - 1)

            self.last_status = "ATTENTION NORMAL"
            return "ATTENTION NORMAL", False, "low", False

        # =====================================================================
        # 2. EYES CLOSED / SUB-THRESHOLD (EAR < Threshold)
        # =====================================================================
        self.consecutive_low_frames += 1

        # Level 3: Microsleep (sustained closure >= 25 frames, ~1.8s)
        if self.consecutive_low_frames >= self.microsleep_threshold:
            status = "MICROSLEEP WARNING"
            severity = "critical"
            # Always maintain continuous drowsy state for audio loop
            self.alert_active = True
            # Fire a new DB alert only once per episode, subject to cooldown
            is_new_alert = False
            if not self.new_alert_fired and (now - self.last_alert_time) >= self.cooldown_seconds:
                is_new_alert = True
                self.new_alert_fired = True
                self.last_alert_time = now
                logger.warning(
                    f"[DrowsinessDetector] NEW ALERT: {status} | "
                    f"EAR={ear:.3f} < {self.ear_threshold:.3f} | "
                    f"frames={self.consecutive_low_frames}"
                )
            self.last_status = status
            return status, True, severity, is_new_alert

        # Level 2: Drowsiness (sustained closure >= 15 frames, ~1.1s)
        if self.consecutive_low_frames >= self.consec_threshold:
            status = "DROWSINESS DETECTED"
            severity = "high"
            self.alert_active = True
            is_new_alert = False
            if not self.new_alert_fired and (now - self.last_alert_time) >= self.cooldown_seconds:
                is_new_alert = True
                self.new_alert_fired = True
                self.last_alert_time = now
                logger.warning(
                    f"[DrowsinessDetector] NEW ALERT: {status} | "
                    f"EAR={ear:.3f} < {self.ear_threshold:.3f} | "
                    f"frames={self.consecutive_low_frames}"
                )
            self.last_status = status
            return status, True, severity, is_new_alert

        # Level 1: Early closure transition (5-14 frames) — visual indicator only, NO audio alert
        if self.consecutive_low_frames >= 5:
            self.last_status = "EYES CLOSING"
            return "EYES CLOSING", False, "medium", False

        # Brief closure (1-4 frames) — normal physiological blink, NO alert
        self.last_status = "ATTENTION NORMAL"
        return "ATTENTION NORMAL", False, "low", False

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
        self.new_alert_fired = False
