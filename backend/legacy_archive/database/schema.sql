-- DriveGuard AI — Relational Database Schema
-- Compatible with SQLite & PostgreSQL

CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'driver',
    vehicle_unit VARCHAR(50),
    license_class VARCHAR(20) DEFAULT 'CLASS A',
    status VARCHAR(20) DEFAULT 'online',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driving_sessions (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle VARCHAR(100) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    safety_score INTEGER DEFAULT 95,
    miles_monitored REAL DEFAULT 0.0,
    alert_count INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS safety_alerts (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL REFERENCES driving_sessions(id) ON DELETE CASCADE,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    confidence REAL DEFAULT 0.90,
    acknowledged BOOLEAN DEFAULT FALSE,
    ear_value REAL,
    yaw_angle REAL,
    pitch_angle REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(50) NOT NULL REFERENCES driving_sessions(id) ON DELETE CASCADE,
    fps REAL DEFAULT 60.0,
    latency_ms INTEGER DEFAULT 14,
    face_detected BOOLEAN DEFAULT TRUE,
    ear REAL DEFAULT 0.285,
    mar REAL DEFAULT 0.185,
    head_yaw REAL DEFAULT 0.0,
    head_pitch REAL DEFAULT 0.0,
    head_roll REAL DEFAULT 0.0,
    safety_score INTEGER DEFAULT 95,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_session ON safety_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_session ON telemetry_records(session_id);
