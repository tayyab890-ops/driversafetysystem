# Pretrained AI Model Weights Directory

This folder holds the binary weights and checkpoint files for DriveGuard AI's edge detection models:

1. **MediaPipe Face Mesh** (`face_landmarker.task` / `face_mesh.tflite`):
   - 468-point 3D facial landmark mesh for real-time EAR and MAR calculation.
2. **Head Pose Estimation** (`head_pose_pnp.onnx` / calibrated 3D head model):
   - 6-DOF Perspective-n-Point pose vector mapping for yaw/pitch/roll tracking.
3. **Weapon & Threat Silhouette Classifier** (`yolov8n_threat.pt` / `threat_detection.onnx`):
   - Edge-optimized lightweight CNN object detector for in-cabin security.

*Note: Large binary weight files (`.pt`, `.onnx`, `.tflite`) are excluded from Git commits via `.gitignore`.*
