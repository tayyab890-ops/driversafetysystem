"""
DriveGuard AI — Mouth Aspect Ratio (MAR) Yawning Cluster Detector
Calculates mouth openness to spot early fatigue onset before eye closure.
"""
import numpy as np

def calculate_mar(lip_top, lip_bottom, corner_left, corner_right):
    """
    Computes Mouth Aspect Ratio (MAR):
    MAR = |lip_top - lip_bottom| / |corner_left - corner_right|
    """
    dist_v = np.linalg.norm(lip_top - lip_bottom)
    dist_h = np.linalg.norm(corner_left - corner_right)

    if dist_h == 0:
        return 0.180

    return float(dist_v / dist_h)

class YawnDetector:
    def __init__(self, mar_threshold=0.550, cluster_window_seconds=180):
        self.mar_threshold = mar_threshold
        self.cluster_window_seconds = cluster_window_seconds
        self.yawn_history = []

    def process_frame(self, lip_top, lip_bottom, corner_left, corner_right):
        mar = calculate_mar(lip_top, lip_bottom, corner_left, corner_right)
        is_yawning = mar > self.mar_threshold
        return mar, is_yawning
