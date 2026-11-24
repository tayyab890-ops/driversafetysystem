/**
 * DriveGuard AI — WebSocket Real-Time Telemetry & Monitoring Client
 */
import { MonitoringMetrics, SafetyAlert } from '@/types/safety';

const WS_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

export class LiveMonitoringSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private onMetricsCallback: (metrics: MonitoringMetrics) => void;
  private onAlertCallback?: (alert: SafetyAlert) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isExplicitlyClosed = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    sessionId: string,
    onMetrics: (metrics: MonitoringMetrics) => void,
    onAlert?: (alert: SafetyAlert) => void
  ) {
    this.sessionId = sessionId;
    this.onMetricsCallback = onMetrics;
    this.onAlertCallback = onAlert;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    this.isExplicitlyClosed = false;

    try {
      const url = `${WS_BASE_URL}/ws/monitor/${this.sessionId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ command: 'ping' }));
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'metrics') {
            this.onMetricsCallback(data as MonitoringMetrics);
          } else if (data.type === 'alert_created' && this.onAlertCallback) {
            this.onAlertCallback(data.alert as SafetyAlert);
          }
        } catch {
          // ignore invalid packets
        }
      };

      this.ws.onerror = () => {
        // Handled in onclose
      };

      this.ws.onclose = () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        if (!this.isExplicitlyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 2000);
        }
      };
    } catch {
      // WebSocket connection failed
    }
  }

  public sendFrame(base64Image: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ frame: base64Image }));
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
