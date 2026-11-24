import { 
  MonitoringMetrics, 
  SafetyAlert, 
  DrivingSession, 
  ModelStatus, 
  SystemHealthMetrics 
} from '@/types/safety';
import { api } from '@/lib/api';
import { LiveMonitoringSocket } from '@/lib/websocket';

// Centralized monitoring & telemetry service for DriveGuard AI
// Bridges real-time FastAPI WebSocket & REST backend with local fallback simulation
class MockMonitoringService {
  private listeners: ((metrics: MonitoringMetrics) => void)[] = [];
  private alertListeners: ((alert: SafetyAlert) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private isPaused: boolean = false;
  private currentMode: 'normal' | 'drowsy' | 'distracted' | 'weapon_alert' = 'normal';
  private liveSocket: LiveMonitoringSocket | null = null;
  private currentSessionId: string = 'SES-8821';

  // Seeded historical alerts
  private alerts: SafetyAlert[] = [
    {
      id: 'ALT-1092',
      sessionId: 'SES-8821',
      timestamp: '10:42:15 AM',
      category: 'drowsiness',
      title: 'Prolonged Eye Closure Detected',
      description: 'EAR fell below 0.18 for 2.4 seconds with slight head tilt.',
      severity: 'high',
      acknowledged: true,
      driverId: 'DRV-042',
      driverName: 'Alex Mercer',
      confidence: 0.94,
      metadata: { ear: 0.16, yaw: -4, pitch: 12 }
    },
    {
      id: 'ALT-1091',
      sessionId: 'SES-8821',
      timestamp: '10:31:02 AM',
      category: 'distraction',
      title: 'Downward Gaze / Device Focus',
      description: 'Driver head pitched downward > 25° away from forward road horizon.',
      severity: 'medium',
      acknowledged: true,
      driverId: 'DRV-042',
      driverName: 'Alex Mercer',
      confidence: 0.89,
      metadata: { yaw: 8, pitch: -28 }
    },
    {
      id: 'ALT-1089',
      sessionId: 'SES-8819',
      timestamp: 'Yesterday 04:15 PM',
      category: 'weapon',
      title: 'Unconfirmed Threat Object Frame',
      description: 'Potential handgun silhouette detected near steering quadrant. Human verification required.',
      severity: 'critical',
      acknowledged: false,
      driverId: 'DRV-019',
      driverName: 'Elena Rostova',
      confidence: 0.82,
      metadata: { 
        objectClass: 'handgun_candidate', 
        requiresVerification: true, 
        boundingBox: [0.35, 0.52, 0.18, 0.22] 
      }
    },
    {
      id: 'ALT-1088',
      sessionId: 'SES-8818',
      timestamp: 'Yesterday 02:45 PM',
      category: 'drowsiness',
      title: 'Frequent Yawning Cluster',
      description: 'Mouth aspect ratio elevated with micro-blinks over 60s interval.',
      severity: 'medium',
      acknowledged: true,
      driverId: 'DRV-088',
      driverName: 'Marcus Vance',
      confidence: 0.91,
      metadata: { ear: 0.22 }
    },
    {
      id: 'ALT-1087',
      sessionId: 'SES-8815',
      timestamp: 'Nov 20, 08:12 AM',
      category: 'face_absent',
      title: 'Face Obscured / Out of Frame',
      description: 'Driver face not acquired by camera sensor for 4 seconds.',
      severity: 'low',
      acknowledged: true,
      driverId: 'DRV-042',
      driverName: 'Alex Mercer',
      confidence: 0.98
    }
  ];

  // Seeded driving sessions
  private sessions: DrivingSession[] = [
    {
      id: 'SES-8821',
      driverId: 'DRV-042',
      driverName: 'Alex Mercer',
      vehicle: 'Volvo XC90 Safety Fleet #14',
      startTime: '10:15 AM',
      durationMinutes: 45,
      status: 'active',
      safetyScore: 94,
      alertCount: 2,
      criticalAlerts: 0,
      milesMonitored: 32.4
    },
    {
      id: 'SES-8820',
      driverId: 'DRV-031',
      driverName: 'Sarah Jenkins',
      vehicle: 'Tesla Model Y Fleet #08',
      startTime: '09:00 AM',
      endTime: '10:15 AM',
      durationMinutes: 75,
      status: 'completed',
      safetyScore: 98,
      alertCount: 0,
      criticalAlerts: 0,
      milesMonitored: 58.1
    },
    {
      id: 'SES-8819',
      driverId: 'DRV-019',
      driverName: 'Elena Rostova',
      vehicle: 'Freightliner Cascadia #03',
      startTime: '03:30 PM',
      endTime: '05:00 PM',
      durationMinutes: 90,
      status: 'completed',
      safetyScore: 81,
      alertCount: 3,
      criticalAlerts: 1,
      milesMonitored: 74.0
    },
    {
      id: 'SES-8818',
      driverId: 'DRV-088',
      driverName: 'Marcus Vance',
      vehicle: 'Ford Transit Cargo #22',
      startTime: '01:00 PM',
      endTime: '03:15 PM',
      durationMinutes: 135,
      status: 'completed',
      safetyScore: 88,
      alertCount: 4,
      criticalAlerts: 0,
      milesMonitored: 92.5
    }
  ];

  constructor() {
    this.syncWithBackend().catch(() => {});
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const remoteAlerts = await api.getDriverEvents(1, 50);
      if (remoteAlerts?.events && Array.isArray(remoteAlerts.events) && remoteAlerts.events.length > 0) {
        this.alerts = remoteAlerts.events as unknown as SafetyAlert[];
      }
    } catch {
      // Backend offline or unauthenticated — keep seeded data
    }

    try {
      const remoteSessions = await api.getDriverSessions(1, 20);
      if (remoteSessions?.sessions && Array.isArray(remoteSessions.sessions) && remoteSessions.sessions.length > 0) {
        this.sessions = remoteSessions.sessions as unknown as DrivingSession[];
      }
    } catch {
      // Backend offline or unauthenticated — keep seeded data
    }
  }

  public getAlerts(): SafetyAlert[] {
    return [...this.alerts];
  }

  public getSessions(): DrivingSession[] {
    return [...this.sessions];
  }

  public acknowledgeAlert(alertId: string) {
    this.alerts = this.alerts.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    );
    // Fire-and-forget backend update
    api.acknowledgeAlert(alertId).catch(() => {});
  }

  public setSimulationScenario(scenario: 'normal' | 'drowsy' | 'distracted' | 'weapon_alert') {
    this.currentMode = scenario;
    if (scenario === 'weapon_alert') {
      const newAlert: SafetyAlert = {
        id: `ALT-${Date.now().toString().slice(-4)}`,
        sessionId: this.currentSessionId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        category: 'weapon',
        title: 'Candidate Threat Silhouette Detected',
        description: 'Weapon candidate detected in camera quadrant. Visual verification required.',
        severity: 'critical',
        acknowledged: false,
        driverId: 'DRV-042',
        driverName: 'Alex Mercer',
        confidence: 0.86,
        metadata: {
          objectClass: 'handgun_candidate',
          requiresVerification: true,
          boundingBox: [0.38, 0.48, 0.22, 0.26]
        }
      };
      this.alerts = [newAlert, ...this.alerts];
      this.alertListeners.forEach(cb => cb(newAlert));
    }
  }

  public startMonitoring(onMetrics: (m: MonitoringMetrics) => void, onAlert?: (a: SafetyAlert) => void) {
    this.listeners.push(onMetrics);
    if (onAlert) this.alertListeners.push(onAlert);
    this.isMonitoring = true;
    this.isPaused = false;

    // Connect to live WebSocket stream if possible
    try {
      this.liveSocket = new LiveMonitoringSocket(
        this.currentSessionId,
        (metrics) => {
          if (!this.isPaused && this.isMonitoring) {
            this.listeners.forEach(cb => cb(metrics));
          }
        },
        (alert) => {
          this.alerts = [alert, ...this.alerts];
          this.alertListeners.forEach(cb => cb(alert));
        }
      );
      this.liveSocket.connect();
    } catch {
      // Fallback to local simulator
    }

    if (!this.intervalId) {
      let tick = 0;
      this.intervalId = setInterval(() => {
        if (!this.isMonitoring || this.isPaused) return;
        tick++;

        // Base metrics generator
        let ear = 0.28 + Math.sin(tick * 0.2) * 0.04;
        let yaw = Math.sin(tick * 0.15) * 6;
        let pitch = Math.cos(tick * 0.1) * 4;
        let safetyScore = 96;
        let eyeState: 'open' | 'sluggish' | 'closed' = 'open';
        let drowsinessStatus: MonitoringMetrics['drowsiness']['status'] = 'ATTENTION NORMAL';
        let distractionStatus: MonitoringMetrics['distraction']['status'] = 'FOCUSED ON ROAD';
        let safetyState: MonitoringMetrics['safetyState'] = 'normal';
        let weaponDetected = false;
        let weaponSeverity: MonitoringMetrics['weapon']['severity'] = 'low';

        // Apply scenario modifiers
        if (this.currentMode === 'drowsy') {
          ear = 0.14 + Math.random() * 0.04;
          eyeState = ear < 0.16 ? 'closed' : 'sluggish';
          drowsinessStatus = 'DROWSINESS DETECTED';
          safetyScore = 72;
          safetyState = 'warning';
        } else if (this.currentMode === 'distracted') {
          yaw = 32 + Math.random() * 8;
          pitch = -22 + Math.random() * 6;
          distractionStatus = 'PHONE / DOWNWARD GAZE';
          safetyScore = 78;
          safetyState = 'caution';
        } else if (this.currentMode === 'weapon_alert') {
          weaponDetected = true;
          weaponSeverity = 'critical';
          safetyScore = 65;
          safetyState = 'critical';
        }

        const metrics: MonitoringMetrics = {
          fps: 29.8 + (Math.random() * 0.4 - 0.2),
          latencyMs: 14 + Math.floor(Math.random() * 4),
          faceDetected: true,
          faceConfidence: 0.97,
          safetyScore: Math.round(safetyScore),
          safetyState,
          drowsiness: {
            eyeState,
            ear: Number(ear.toFixed(3)),
            yawnDetected: this.currentMode === 'drowsy' && Math.random() > 0.6,
            blinkRatePerMin: 18 + (this.currentMode === 'drowsy' ? 14 : 0),
            confidence: 0.95,
            status: drowsinessStatus,
          },
          distraction: {
            headPose: Math.abs(yaw) > 20 ? (yaw > 0 ? 'right' : 'left') : (pitch < -15 ? 'down' : 'forward'),
            yaw: Number(yaw.toFixed(1)),
            pitch: Number(pitch.toFixed(1)),
            roll: 1.2,
            confidence: 0.92,
            status: distractionStatus,
          },
          weapon: {
            detected: weaponDetected,
            objectClass: weaponDetected ? 'handgun_candidate' : null,
            confidence: weaponDetected ? 0.86 : 0.05,
            requiresVerification: true,
            boundingBox: weaponDetected ? [0.38, 0.48, 0.22, 0.26] : undefined,
            severity: weaponSeverity,
          }
        };

        this.listeners.forEach(cb => cb(metrics));
      }, 500);
    }
  }

  public sendFrameToBackend(base64Frame: string): void {
    if (this.liveSocket) {
      this.liveSocket.sendFrame(base64Frame);
    }
  }

  public stopMonitoring() {
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.liveSocket) {
      this.liveSocket.disconnect();
      this.liveSocket = null;
    }
    this.listeners = [];
    this.alertListeners = [];
  }

  public pauseMonitoring() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public getModelStatuses(): ModelStatus[] {
    return [
      {
        id: 'MDL-01',
        name: 'EyeWatch-V3 (EAR & Microsleep)',
        category: 'drowsiness',
        version: 'v3.4.2-tensorrt',
        status: 'optimal',
        inferenceTimeMs: 4.8,
        fps: 30.0,
        confidenceAvg: 0.96,
        lastUpdate: '2026-11-20 03:00'
      },
      {
        id: 'MDL-02',
        name: 'HeadPose-Net (6-DOF Euler)',
        category: 'distraction',
        version: 'v2.8.0-onnx',
        status: 'optimal',
        inferenceTimeMs: 6.2,
        fps: 29.8,
        confidenceAvg: 0.94,
        lastUpdate: '2026-11-18 14:20'
      },
      {
        id: 'MDL-03',
        name: 'ThreatSentinel-YOLO (Weapon Candidate)',
        category: 'weapon',
        version: 'v5.1.0-quantized',
        status: 'optimal',
        inferenceTimeMs: 11.4,
        fps: 28.5,
        confidenceAvg: 0.88,
        lastUpdate: '2026-11-21 09:15'
      }
    ];
  }

  public getSystemHealth(): SystemHealthMetrics {
    return {
      apiStatus: 'healthy',
      wsStatus: 'connected',
      dbStatus: 'operational',
      cpuUsagePct: 24,
      memoryUsagePct: 38,
      avgLatencyMs: 14,
      uptimeHours: 342.6,
      activeSessions: 18
    };
  }
}

export const mockMonitoring = new MockMonitoringService();
