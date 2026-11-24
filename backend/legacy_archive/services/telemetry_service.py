"""
DriveGuard AI — Telemetry Processing & Safety Scoring Service
Calculates composite safety score (Alertness EAR + Head Pose + Cabin Calmness).
"""
import random

class TelemetryService:
    @staticmethod
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
        if pitch < -20.0: # looking down
            score -= min(30.0, abs(pitch - (-20.0)) * 2.5)
        if abs(yaw) > 25.0: # turned away from road
            score -= min(25.0, (abs(yaw) - 25.0) * 1.5)

        # MAR penalty
        if mar > 0.55: # yawning
            score -= 15.0

        return max(40, min(100, int(score)))

    @staticmethod
    def generate_simulated_frame(session_id: str, driver_id: str):
        """Generates realistic telemetry packet for live WebSocket monitoring."""
        ear = round(random.uniform(0.265, 0.298), 3)
        pitch = round(random.uniform(-4.0, 3.0), 1)
        yaw = round(random.uniform(-3.5, 4.0), 1)
        mar = round(random.uniform(0.160, 0.210), 3)

        score = TelemetryService.calculate_composite_safety_score(ear, pitch, yaw, mar)

        return {
            "sessionId": session_id,
            "driverId": driver_id,
            "fps": 60,
            "latencyMs": 14,
            "faceDetected": True,
            "ear": ear,
            "headPose": {
                "pitch": pitch,
                "yaw": yaw,
                "roll": round(random.uniform(-1.0, 1.0), 1),
                "status": "FOCUSED ON ROAD"
            },
            "mar": mar,
            "safetyScore": score,
            "cabinAudio": "Normal",
            "timestamp": "Live Stream"
        }
