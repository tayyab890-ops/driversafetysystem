export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  vehicleId?: string;
}

export type SafetyState = 'normal' | 'caution' | 'warning' | 'critical';

export type AlertCategory = 
  | 'drowsiness'
  | 'distraction'
  | 'weapon'
  | 'face_absent'
  | 'camera_disconnected'
  | 'system';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SafetyAlert {
  id: string;
  sessionId: string;
  timestamp: string;
  category: AlertCategory;
  title: string;
  description: string;
  severity: AlertSeverity;
  acknowledged: boolean;
  driverId: string;
  driverName: string;
  confidence: number;
  metadata?: {
    ear?: number;
    yaw?: number;
    pitch?: number;
    objectClass?: string;
    requiresVerification?: boolean;
    boundingBox?: [number, number, number, number]; // [x, y, w, h] normalized
  };
}

export interface DrowsinessMetrics {
  eyeState: 'open' | 'sluggish' | 'closed';
  ear: number; // Eye Aspect Ratio (e.g. 0.28)
  yawnDetected: boolean;
  blinkRatePerMin: number;
  confidence: number;
  status: 'ATTENTION NORMAL' | 'DROWSINESS DETECTED' | 'MICROSLEEP WARNING' | string;
}

export interface DistractionMetrics {
  headPose: 'forward' | 'left' | 'right' | 'down' | 'up' | string;
  yaw: number; // degrees -45 to +45
  pitch: number;
  roll: number;
  confidence: number;
  status: 'FOCUSED ON ROAD' | 'HEAD TURNED' | 'PHONE / DOWNWARD GAZE' | 'DISTRACTED' | string;
}

export interface WeaponDetectionMetrics {
  detected: boolean;
  objectClass: string | null;
  confidence: number;
  requiresVerification: boolean; // Must always require human confirmation per safety protocol
  boundingBox?: any;
  severity: AlertSeverity;
  status?: string;
  available?: boolean;
  isSimulation?: boolean;
}

export interface MonitoringMetrics {
  fps: number;
  latencyMs: number;
  faceDetected: boolean;
  faceConfidence: number;
  safetyScore: number; // 0 - 100
  safetyState: SafetyState;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
  drowsiness: DrowsinessMetrics;
  distraction: DistractionMetrics;
  weapon: WeaponDetectionMetrics;
}

export interface DrivingSession {
  id: string;
  driverId: string;
  driverName: string;
  vehicle: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  status: 'active' | 'completed' | 'paused';
  safetyScore: number;
  alertCount: number;
  criticalAlerts: number;
  milesMonitored?: number;
}

export interface ModelStatus {
  id: string;
  name: string;
  category: 'drowsiness' | 'distraction' | 'weapon';
  version: string;
  status: 'optimal' | 'degraded' | 'offline';
  inferenceTimeMs: number;
  fps: number;
  confidenceAvg: number;
  lastUpdate: string;
}

export interface SystemHealthMetrics {
  apiStatus: 'healthy' | 'degraded' | 'offline';
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  dbStatus: 'operational' | 'slow' | 'unreachable';
  cpuUsagePct: number;
  memoryUsagePct: number;
  avgLatencyMs: number;
  uptimeHours: number;
  activeSessions: number;
}
