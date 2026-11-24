# DriveGuard AI — Backend Architecture

DriveGuard AI's backend is a high-performance computer vision and telemetry gateway designed for real-time commercial vehicle driver safety monitoring.

## Folder Organization

```
backend/
├── api/                     # REST & WebSocket API endpoints
│   ├── routes_telemetry.py  # Real-time WebSocket stream & telemetry polling
│   ├── routes_alerts.py     # High-priority alerts & dispatch auditing
│   ├── routes_sessions.py   # Active & historical driving session management
│   └── routes_drivers.py    # Enrolled driver directory & vehicle assignments
├── core/                    # System configuration & safety threshold constants
│   ├── config.py            # EAR (0.180), Pitch (-20°), and CORS settings
│   └── security.py          # Authentication & token verification
├── database/                # Relational persistence & connection pool
│   └── connection.py        # SQLite / PostgreSQL engine & sessionmaker
├── detection/               # Computer vision & signal processing algorithms
│   ├── face_mesh.py         # MediaPipe 468-point facial landmark processing
│   ├── drowsiness_detector.py # Eye Aspect Ratio (EAR) & microsleep calculation
│   ├── distraction_detector.py # 6-DOF Head Pose (Yaw/Pitch/Roll) tracking
│   ├── yawn_detector.py     # Mouth Aspect Ratio (MAR) yawning cluster tracking
│   └── weapon_detector.py   # In-cabin threat classification & verification protocol
├── models/                  # Data structures & AI weights
│   ├── db_models.py         # SQLAlchemy ORM models (Driver, Session, Alert, Telemetry)
│   └── pretrained/          # Directory for AI model weights (.pt, .onnx, .tflite)
├── services/                # Business logic & dispatch workflows
│   ├── telemetry_service.py # Composite safety score calculation (EAR + Pose + Calmness)
│   └── dispatch_service.py  # Emergency audio chimes & alert broadcasting
├── main.py                  # FastAPI application entrypoint with WebSockets
└── requirements.txt         # Python dependencies
```

## Running the Backend

1. **Create and activate a virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the development server:**
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   Or from the project root:
   ```bash
   npm run dev:backend
   ```

4. **Interactive API Documentation:**
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
