# DriveGuard AI — Intelligent Driver Safety & Fleet Operations System

DriveGuard AI is an intelligent computer vision system for real-time commercial vehicle driver safety monitoring, fatigue prevention, distraction tracking, and emergency fleet dispatch operations.

---

## Project Architecture

The project is cleanly divided into **frontend/** and **backend/** modules:

```
DriverSafetySystem/
├── frontend/                     # Next.js 15 Web Application (UI, Dashboards, Live Cockpit)
│   ├── app/                      # App Router: Landing, Login, Register, Driver, Admin
│   ├── components/               # 3D Claymorphic UI components, Layouts, Visualizers
│   ├── lib/                      # Utilities, CSV export, telemetry math helpers
│   ├── public/                   # Static media, SVG icons, automotive cutaways
│   ├── services/                 # Frontend telemetry & simulation services
│   ├── types/                    # TypeScript interfaces for driver safety & alerts
│   ├── package.json              # Frontend npm dependencies (Next.js 15, React 19, Tailwind CSS)
│   ├── tsconfig.json             # TypeScript compiler configuration (@/* aliases)
│   └── next.config.ts            # Next.js runtime & bundler configuration
│
├── backend/                      # Python AI Engine & Telemetry Gateway (FastAPI)
│   ├── api/                      # REST API & WebSocket endpoints (Telemetry, Alerts, Sessions)
│   ├── core/                     # Configuration, CORS, safety thresholds (EAR, Yaw, Pitch)
│   ├── database/                 # SQLite/PostgreSQL connection & relational schema
│   ├── detection/                # Computer vision pipelines:
│   │   ├── face_mesh.py          # MediaPipe 468-point facial landmark processing
│   │   ├── drowsiness_detector.py# Eye Aspect Ratio (EAR) & microsleep calculation
│   │   ├── distraction_detector.py# 6-DOF Head Pose (Yaw/Pitch/Roll) tracking
│   │   ├── yawn_detector.py      # Mouth Aspect Ratio (MAR) yawning cluster tracking
│   │   └── weapon_detector.py    # Threat silhouette detection & human verification protocol
│   ├── models/                   # SQLAlchemy ORM models & pretrained weights directory
│   │   ├── db_models.py          # Relational entities: Driver, Session, Alert, TelemetryRecord
│   │   └── pretrained/           # Pretrained AI model checkpoint files (.pt, .onnx, .tflite)
│   ├── services/                 # Telemetry processing & emergency cabin audio dispatch
│   ├── main.py                   # FastAPI server entrypoint
│   └── requirements.txt          # Python dependencies (OpenCV, MediaPipe, NumPy, FastAPI)
│
├── package.json                  # Root runner script configuration
└── README.md                     # Project overview & running instructions
```

---

## Getting Started

### 1. Running the Frontend

You can launch the frontend either from the root or inside `frontend/`:

**From Project Root:**
```bash
npm run dev
# or
npm run dev:frontend
```

**From `frontend/` directory:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application:
- **Landing Page:** [http://localhost:3000](http://localhost:3000)
- **Driver Dashboard:** [http://localhost:3000/driver](http://localhost:3000/driver)
- **Live Cockpit Video Stream:** [http://localhost:3000/driver/monitor](http://localhost:3000/driver/monitor)
- **Admin Fleet Operations Center:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Live Fleet Telemetry Monitoring:** [http://localhost:3000/admin/monitoring](http://localhost:3000/admin/monitoring)

---

### 2. Running the Backend

**From `backend/` directory:**
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

**Or from Project Root:**
```bash
npm run dev:backend
```

Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
