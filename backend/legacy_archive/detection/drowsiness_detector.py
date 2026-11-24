"""
DriveGuard AI — Drowsiness & Microsleep Detector
Calculates Eye Aspect Ratio (EAR) across 6-point eye contours.
Triggers graduated alerts when EAR drops below threshold for sustained duration.
"""
import numpy as np

def calculate_ear(eye_points):
    """
    Computes Eye Aspect Ratio (EAR):
    EAR = (|p2 - p6| + |p3 - p5|) / (2 * |p1 - p4|)
    """
    if len(eye_points) < 6:
        return 0.285

    p1, p2, p3, p4, p5, p6 = eye_points[:6]

    # Vertical eye distances
    dist_v1 = np.linalg.norm(p2 - p6)
    dist_v2 = np.linalg.norm(p3 - p5)

    # Horizontal eye distance
    dist_h = np.linalg.norm(p1 - p4)

    if dist_h == 0:
        return 0.285

    ear = (dist_v1 + dist_v2) / (2.0 * dist_h)
    return float(ear)

class DrowsinessDetector:
    def __init__(self, threshold=0.180, consecutive_frames=15):
        self.threshold = threshold
        self.consecutive_frames = consecutive_frames
        self.frame_counter = 0
        self.alert_active = False

    def process_frame(self, left_eye_pts, right_eye_pts):
        """
        Processes frame eye contours and evaluates drowsiness state.
        Returns: (avg_ear, status_string, is_alert)
        """
        ear_left = calculate_ear(left_eye_pts)
        ear_right = calculate_ear(right_eye_pts)
        avg_ear = (ear_left + ear_right) / 2.0

        if avg_ear < self.threshold:
            self.frame_counter += 1
            if self.frame_counter >= self.consecutive_frames:
                self.alert_active = True
                status = "MICROSLEEP WARNING" if avg_ear < 0.15 else "DROWSINESS DETECTED"
                return avg_ear, status, True
            else:
                return avg_ear, "SLUGGISH BLINK", False
        else:
            self.frame_counter = max(0, self.frame_counter - 1)
            self.alert_active = False
            return avg_ear, "ATTENTION NORMAL", False
