"""
DriveGuard AI — MediaPipe 468-Point Facial Mesh Processor
Acquires facial landmarks and normalizes coordinates for EAR, MAR, and Head Pose.
"""
import numpy as np

class FaceMeshProcessor:
    def __init__(self, static_image_mode=False, max_num_faces=1, min_detection_confidence=0.5):
        self.static_image_mode = static_image_mode
        self.max_num_faces = max_num_faces
        self.min_detection_confidence = min_detection_confidence

        # MediaPipe landmark indices for left & right eye
        self.LEFT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]

        # Lips / Mouth landmarks for MAR
        self.UPPER_LIP = 13
        self.LOWER_LIP = 14
        self.LEFT_MOUTH_CORNER = 78
        self.RIGHT_MOUTH_CORNER = 308

        # 3D Model Points for PnP Head Pose Estimation
        self.MODEL_POINTS = np.array([
            (0.0, 0.0, 0.0),             # Nose tip (landmark 1)
            (0.0, -330.0, -65.0),        # Chin (landmark 199)
            (-225.0, 170.0, -135.0),     # Left eye left corner (landmark 33)
            (225.0, 170.0, -135.0),      # Right eye right corner (landmark 263)
            (-150.0, -150.0, -125.0),    # Left Mouth corner (landmark 61)
            (150.0, -150.0, -125.0)      # Right mouth corner (landmark 291)
        ], dtype=np.float64)

    def extract_landmark_coords(self, landmarks, indices, img_w, img_h):
        """Extract (x, y) coordinates for specific landmark indices."""
        coords = []
        for idx in indices:
            lm = landmarks[idx]
            coords.append(np.array([lm.x * img_w, lm.y * img_h]))
        return coords
