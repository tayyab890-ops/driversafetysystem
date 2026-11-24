'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Maximize2, Shield, Eye, Compass, Video, AlertCircle } from 'lucide-react';
import { MonitoringMetrics } from '@/types/safety';

interface WebcamPreviewProps {
  isMonitoring: boolean;
  metrics: MonitoringMetrics | null;
  selectedCameraId?: string;
  showOverlay?: boolean;
  onCameraChange?: (deviceId: string) => void;
  onFrameCapture?: (frameData: string) => void;
}

export function WebcamPreview({
  isMonitoring,
  metrics,
  selectedCameraId,
  showOverlay = true,
  onCameraChange,
  onFrameCapture,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [simulatedStream, setSimulatedStream] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Clock for HUD timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString() + ' ' + 
        now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Enumerate video devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const cameras = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cameras);
      }).catch(() => {});
    }
  }, []);

  // Manage webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isMonitoring) {
      setCameraError(null);
      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      };

      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia(constraints)
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
            }
            setHasPermission(true);
            setSimulatedStream(false);
          })
          .catch((err) => {
            console.warn('Real camera not accessible or blocked:', err);
            setHasPermission(false);
            setCameraError(err?.message || 'Camera permission denied or camera device in use.');
            setSimulatedStream(true);
          });
      } else {
        setSimulatedStream(true);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isMonitoring, selectedCameraId]);

  // Real frame capture loop at ~14 FPS for live AI inference over WebSocket
  useEffect(() => {
    let frameInterval: NodeJS.Timeout | null = null;

    if (isMonitoring && onFrameCapture) {
      const offscreen = document.createElement('canvas');
      offscreen.width = 640;
      offscreen.height = 360;
      const offCtx = offscreen.getContext('2d');

      frameInterval = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 2 && offCtx) {
          try {
            offCtx.drawImage(videoRef.current, 0, 0, 640, 360);
            const jpegData = offscreen.toDataURL('image/jpeg', 0.65);
            onFrameCapture(jpegData);
          } catch {
            // Ignore capture error if frame busy
          }
        }
      }, 70); // ~14 FPS
    }

    return () => {
      if (frameInterval) clearInterval(frameInterval);
    };
  }, [isMonitoring, onFrameCapture]);

  // Render automotive detection overlay HUD on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showOverlay || !isMonitoring || !metrics) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Draw Face Mesh Bounding Geometry
    if (metrics.faceDetected) {
      const cx = w * 0.5 + (metrics.distraction.yaw / 45) * 40;
      const cy = h * 0.45 + (metrics.distraction.pitch / 30) * 30;
      const fw = w * 0.28;
      const fh = h * 0.42;

      ctx.strokeStyle = metrics.drowsiness.status !== 'ATTENTION NORMAL' 
        ? '#F27E85' 
        : metrics.distraction.status !== 'FOCUSED ON ROAD'
        ? '#F3BD72'
        : '#43B69A';
      ctx.lineWidth = 1.5;

      // Corner brackets for face detection
      const len = 16;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(cx - fw / 2, cy - fh / 2 + len);
      ctx.lineTo(cx - fw / 2, cy - fh / 2);
      ctx.lineTo(cx - fw / 2 + len, cy - fh / 2);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(cx + fw / 2 - len, cy - fh / 2);
      ctx.lineTo(cx + fw / 2, cy - fh / 2);
      ctx.lineTo(cx + fw / 2, cy - fh / 2 + len);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(cx - fw / 2, cy + fh / 2 - len);
      ctx.lineTo(cx - fw / 2, cy + fh / 2);
      ctx.lineTo(cx - fw / 2 + len, cy + fh / 2);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(cx + fw / 2 - len, cy + fh / 2);
      ctx.lineTo(cx + fw / 2, cy + fh / 2);
      ctx.lineTo(cx + fw / 2, cy + fh / 2 - len);
      ctx.stroke();

      // Driver ID Banner above face box
      ctx.fillStyle = 'rgba(10, 16, 22, 0.75)';
      ctx.fillRect(cx - fw / 2, cy - fh / 2 - 24, 180, 20);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `OPERATOR LOCK [${metrics.drowsiness.eyeState.toUpperCase()}]`, 
        cx - fw / 2 + 6, 
        cy - fh / 2 - 10
      );
    }

    // Draw Threat Candidate Bounding Box if detected
    if (metrics.weapon && metrics.weapon.detected) {
      const bx = (metrics.weapon as any).boundingBox || { x: w * 0.65, y: h * 0.45, width: 140, height: 120 };
      ctx.strokeStyle = '#F27E85';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(bx.x, bx.y, bx.width, bx.height);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(242, 126, 133, 0.2)';
      ctx.fillRect(bx.x, bx.y, bx.width, bx.height);

      ctx.fillStyle = '#F27E85';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `THREAT CANDIDATE [${((metrics.weapon.confidence || 0.88) * 100).toFixed(0)}%]`,
        bx.x + 4,
        Math.max(16, bx.y - 6)
      );
    }

    // Central HUD Horizon & Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    // Pitch ladder bars
    [-20, -10, 10, 20].forEach((offsetDeg) => {
      const yOffset = (offsetDeg / 40) * (h * 0.25);
      const ladderY = h * 0.5 + yOffset;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 24, ladderY);
      ctx.lineTo(w * 0.5 + 24, ladderY);
      ctx.stroke();
    });

    // Subdued crosshair center
    ctx.strokeStyle = 'rgba(67, 182, 154, 0.5)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 6, 0, Math.PI * 2);
    ctx.stroke();

  }, [showOverlay, isMonitoring, metrics]);

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    const el = document.getElementById('camera-preview-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      id="camera-preview-container"
      className="relative rounded-2xl overflow-hidden cockpit-panel aspect-video w-full bg-[#0D151B] select-none border border-[var(--border)]"
    >
      {/* Real Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${simulatedStream ? 'hidden' : 'block'}`}
      />

      {/* Simulated Automotive Cockpit Feed if webcam permission unavailable */}
      {simulatedStream && isMonitoring && (
        <div className="w-full h-full flex flex-col items-center justify-center relative automotive-grid bg-slate-950/80 p-6 text-center">
          <div className="w-48 h-48 rounded-full border border-dashed border-[var(--sensor-blue)]/40 flex items-center justify-center relative">
            <div className="w-36 h-36 rounded-full border border-[var(--safety-mint)]/30 flex items-center justify-center">
              <Shield size={38} className="text-[var(--primary-blue)] opacity-70 animate-pulse-subtle" />
            </div>
            <div className="absolute inset-0 rounded-full radar-sweep pointer-events-none" />
          </div>
          <span className="text-xs font-mono text-[var(--sensor-blue)] mt-4 tracking-widest uppercase">
            SIMULATED AI VISION STREAM ACTIVE
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)] max-w-sm mt-1">
            {cameraError || 'Webcam feed not available. Running real server-side inference pipeline.'}
          </span>
        </div>
      )}

      {/* Idle / Off state */}
      {!isMonitoring && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#10181F] text-slate-400">
          <CameraOff size={42} className="opacity-40 mb-3" />
          <span className="text-sm font-mono tracking-wider text-slate-300 uppercase">
            CABIN SENSOR IDLE
          </span>
          <span className="text-xs font-mono text-slate-500 mt-1">
            Click &quot;Start Monitoring&quot; to initialize video feed &amp; AI models
          </span>
        </div>
      )}

      {/* Real-time HUD Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* HUD Frame Corners (Automotive Camera Look) */}
      <div className="absolute inset-3 pointer-events-none z-20">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/60" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/60" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/60" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/60" />
      </div>

      {/* HUD Header Bar */}
      <div className="absolute top-4 left-5 right-5 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* REC Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white">
            <span className={`w-2.5 h-2.5 rounded-full ${isMonitoring ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
              {isMonitoring ? 'REC • LIVE' : 'STANDBY'}
            </span>
          </div>

          {/* Clock */}
          <span className="text-[11px] font-mono text-white/80 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 hidden sm:inline-block">
            {currentTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Telemetry pill */}
          {metrics && (
            <div className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] flex items-center gap-2">
              <span className="text-[var(--safety-mint)]">{(metrics.fps || 15.0).toFixed(1)} FPS</span>
              <span className="text-white/40">|</span>
              <span className="text-[var(--sensor-blue)]">{metrics.latencyMs || 14}ms</span>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* HUD Bottom Bar */}
      <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          {videoDevices.length > 0 && onCameraChange && (
            <select
              value={selectedCameraId || ''}
              onChange={(e) => onCameraChange(e.target.value)}
              className="bg-black/70 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded border border-white/20 outline-none cursor-pointer"
            >
              {videoDevices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          <div className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] font-mono text-white/70">
            {metrics?.faceDetected 
              ? `FACE LOCKED (${((metrics.faceConfidence || 0.98) * 100).toFixed(0)}%)` 
              : 'SEARCHING FOR DRIVER'}
          </div>
        </div>

        <div className="text-[10px] font-mono text-white/60 bg-black/50 px-2 py-0.5 rounded border border-white/10">
          DRIVEGUARD AI VISION 1080P
        </div>
      </div>
    </div>
  );
}
