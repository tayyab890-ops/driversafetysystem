"""
DriveGuard AI — 6-DOF Head Pose & Distraction Detector
Evaluates yaw and pitch angles to detect off-road gaze departures with
adaptive forward-facing calibration, temporal filtering, and rapid alert clearing.

Design principles:
- 'is_new_alert'  fires ONCE per new alert event (for DB persistence and WS broadcast).
- 'is_distracted' is True for the ENTIRE DURATION the condition persists (drives continuous audio).
- Counter resets to 0 IMMEDIATELY when driver returns forward so the next episode
  triggers a fresh alert without cooldown delay.
"""
import logging
import time
from typing import List, Tuple
import numpy as np
from backend.app.core.config import settings

logger = logging.getLogger("DistractionDetector")


class DistractionDetector:
    """
    Detects driver distraction (turning head away from road, looking down at phone).
    Features:
    - Adaptive forward-facing calibration (learns driver's natural neutral posture).
    - Deviation-based detection rather than rigid absolute angles.
    - Immediate counter reset and alert clearing when driver returns gaze to road.
    - Separate is_distracted (continuous) vs is_new_alert (one-shot DB event).
    """

    def __init__(self):
        # Thresholds for deviation from calibrated neutral
        self.pitch_down_threshold = -18.0  # degrees deviation downward (looking down at lap/phone)
        self.yaw_deviation_threshold = 22.0  # degrees deviation left or right (looking aside)

        self.consec_threshold = 8  # consecutive frames (~0.8s at 10-15fps) required to trigger alert
        self.consecutive_distracted_frames = 0
        self.last_alert_time = 0.0
        self.cooldown_seconds = 6.0  # Minimum gap before logging a *new* DB alert

        # alert_active: True during the entire distraction episode (drives continuous beep)
        self.alert_active: bool = False
        # new_alert_fired: True after first DB alert fires for this episode (prevents duplicate DB writes)
        self.new_alert_fired: bool = False

        # Adaptive Neutral Calibration
        self.is_calibrated = False
        self.calibration_samples: List[Tuple[float, float]] = []
        self.min_calibration_samples = 15
        self.neutral_yaw = 0.0
        self.neutral_pitch = 0.0

        # Last evaluated metrics (for external inspection / telemetry)
        self.last_yaw = 0.0
        self.last_pitch = 0.0
        self.last_yaw_dev = 0.0
        self.last_pitch_dev = 0.0
        self.last_status = "FOCUSED ON ROAD"

    def update_calibration(self, yaw: float, pitch: float) -> bool:
        """
        Gathers calibration samples while driver sits naturally.
        Returns True once calibration is complete.
        """
        if self.is_calibrated:
            return True

        # Only accept samples that are plausibly forward-facing (within ±20° of zero)
        if abs(yaw) < 20.0 and -25.0 < pitch < 20.0:
            self.calibration_samples.append((yaw, pitch))

        if len(self.calibration_samples) >= self.min_calibration_samples:
            med_yaw = float(np.median([s[0] for s in self.calibration_samples]))
            med_pitch = float(np.median([s[1] for s in self.calibration_samples]))
            # Constrain neutral to sensible cockpit ranges
            self.neutral_yaw = max(-12.0, min(12.0, med_yaw))
            self.neutral_pitch = max(-15.0, min(15.0, med_pitch))
            self.is_calibrated = True
            logger.info(
                f"[DistractionDetector] Calibrated neutral head pose: "
                f"neutral_yaw={self.neutral_yaw:.1f}°, neutral_pitch={self.neutral_pitch:.1f}° "
                f"from {len(self.calibration_samples)} samples."
            )
            return True

        return False

    def evaluate(self, yaw: float, pitch: float) -> Tuple[str, bool, str, bool]:
        """
        Evaluate distraction from head pose angles relative to calibrated neutral.
        Returns: (status_string, is_distracted, severity, is_new_alert)

        - is_distracted:  True for the ENTIRE DURATION the condition persists (drives continuous audio).
        - is_new_alert:   True only on the FIRST frame of a new alert episode (drives DB write).
        """
        now = time.time()
        self.last_yaw = yaw
        self.last_pitch = pitch

        # Update neutral baseline during initial frames
        if not self.is_calibrated:
            self.update_calibration(yaw, pitch)

        # Calculate deviation from calibrated forward-facing neutral
        yaw_dev = yaw - self.neutral_yaw
        pitch_dev = pitch - self.neutral_pitch
        self.last_yaw_dev = yaw_dev
        self.last_pitch_dev = pitch_dev

        is_looking_down = pitch_dev < self.pitch_down_threshold
        is_looking_aside = abs(yaw_dev) > self.yaw_deviation_threshold

        if is_looking_down or is_looking_aside:
            self.consecutive_distracted_frames += 1

            if self.consecutive_distracted_frames >= self.consec_threshold:
                if is_looking_down:
                    status = "PHONE / DOWNWARD GAZE"
                    severity = "high"
                else:
                    status = "HEAD TURNED / OFF-ROAD"
                    severity = "medium"

                # Maintain continuous distracted state for audio loop
                self.alert_active = True

                # Fire a new DB alert only once per episode, subject to cooldown
                is_new_alert = False
                if not self.new_alert_fired and (now - self.last_alert_time) >= self.cooldown_seconds:
                    is_new_alert = True
                    self.new_alert_fired = True
                    self.last_alert_time = now
                    logger.warning(
                        f"[DistractionDetector] NEW ALERT: {status} "
                        f"(yaw_dev={yaw_dev:.1f}°, pitch_dev={pitch_dev:.1f}°, "
                        f"neutral=({self.neutral_yaw:.1f}°, {self.neutral_pitch:.1f}°), "
                        f"frames={self.consecutive_distracted_frames})"
                    )

                self.last_status = status
                return status, True, severity, is_new_alert

            # Glancing - transient deviation not yet exceeding duration threshold
            if is_looking_down:
                self.last_status = "GLANCING DOWN"
                return "GLANCING DOWN", False, "low", False
            self.last_status = "GLANCING ASIDE"
            return "GLANCING ASIDE", False, "low", False

        else:
            # Immediately reset distraction counter when driver returns to forward-facing position
            if self.alert_active:
                logger.info(
                    f"[DistractionDetector] Alert condition CLEARED: driver returned to forward gaze "
                    f"(yaw_dev={yaw_dev:.1f}°, pitch_dev={pitch_dev:.1f}°)."
                )
            self.consecutive_distracted_frames = 0
            self.alert_active = False
            self.new_alert_fired = False
            # Reset cooldown so next distraction episode triggers fresh alert immediately
            self.last_alert_time = 0.0
            self.last_status = "FOCUSED ON ROAD"
            return "FOCUSED ON ROAD", False, "low", False

    def reset(self):
        """Reset all temporal counters and calibration state."""
        self.consecutive_distracted_frames = 0
        self.last_alert_time = 0.0
        self.alert_active = False
        self.new_alert_fired = False
        self.is_calibrated = False
        self.calibration_samples.clear()
        self.neutral_yaw = 0.0
        self.neutral_pitch = 0.0
        self.last_status = "FOCUSED ON ROAD"
