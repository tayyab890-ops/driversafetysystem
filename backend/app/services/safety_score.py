"""
DriveGuard AI — Composite Safety Score Calculator
Shared service used by monitoring WebSocket, dashboard endpoints, and DB storage.
"""


def calculate_composite_safety_score(ear: float, pitch: float, yaw: float, mar: float) -> int:
    """
    Computes composite safety score out of 100:
    - Alertness EAR Weight: 45% (baseline 0.285)
    - Head Pose Attention Weight: 35% (centered road gaze 0° yaw/pitch)
    - Mouth Aspect Ratio (Fatigue) Weight: 20% (relaxed mouth < 0.30)
    """
    score = 100.0

    # EAR penalty
    if ear < 0.18:
        penalty_ear = min(45.0, (0.18 - ear) * 350.0)
        score -= penalty_ear
    elif ear < 0.24:
        score -= 10.0

    # Head Pose penalty
    if pitch < -20.0:  # looking down (phone/dashboard)
        score -= min(30.0, abs(pitch - (-20.0)) * 2.5)
    if abs(yaw) > 25.0:  # turned away from road
        score -= min(25.0, (abs(yaw) - 25.0) * 1.5)

    # MAR penalty (yawning)
    if mar > 0.55:
        score -= 15.0

    return max(40, min(100, int(score)))
