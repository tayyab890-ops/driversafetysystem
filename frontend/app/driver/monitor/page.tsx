'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { WebcamPreview } from '@/components/monitoring/WebcamPreview';
import { CameraControls } from '@/components/monitoring/CameraControls';
import { EyeStateIndicator } from '@/components/safety/EyeStateIndicator';
import { HeadPoseIndicator } from '@/components/safety/HeadPoseIndicator';
import { WeaponDetectionBadge } from '@/components/safety/WeaponDetectionBadge';
import { AlertNotification } from '@/components/safety/AlertNotification';
import { api } from '@/lib/api';
import { audioAlerts } from '@/lib/audioAlerts';
import { useCameraManager } from '@/lib/useCameraManager';
import { MonitoringMetrics, SafetyAlert } from '@/types/safety';
import { Shield, User, Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DriverMonitorPage() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [activeAlert, setActiveAlert] = useState<SafetyAlert | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<'normal' | 'drowsy' | 'distracted' | 'weapon_alert'>('normal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Central Camera Management (Multi-camera detection, hot-switching, auto-fallback)
  const {
    devices: cameraDevices,
    selectedCameraId,
    status: cameraStatus,
    statusMessage: cameraStatusMessage,
    isSwitching: isCameraSwitching,
    isFallbackActive,
    cameraError,
    videoRef,
    switchCamera: handleCameraChange,
    refreshCameras: handleRefreshCameras,
  } = useCameraManager({
    isMonitoring,
    onCameraSwitched: (id, label) => {
      console.log(`[DriveGuard] Optical feed switched to: ${label} (${id})`);
    },
    onFallbackOccurred: (fromId, toDevice) => {
      console.warn(`[DriveGuard] Camera fallback engaged from ${fromId} to ${toDevice?.label}`);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const wsRef = useRef<WebSocket | null>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const scenarioRef = useRef(selectedScenario);
  scenarioRef.current = selectedScenario;

  // Session timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isMonitoring && !isPaused) {
      timer = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isMonitoring, isPaused]);

  // Audio control sync
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioAlerts.setSoundEnabled(next);
    if (next) {
      audioAlerts.ensureAudioContext();
    }
  };

  // Start monitoring session
  const handleStart = async () => {
    try {
      setErrorMessage(null);
      // Synchronously unlock and resume Web Audio API on direct user gesture to satisfy browser autoplay policies
      await audioAlerts.ensureAudioContext();
      audioAlerts.playAcknowledge();

      // 1. Create or retrieve active session in PostgreSQL
      const sessionData = await api.startSession();
      const currentSessionId = sessionData.sessionId || sessionData.id;
      setSessionId(currentSessionId);

      // 2. Connect WebSocket for live AI inference
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws/monitor/${currentSessionId}?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[DriveGuard] Connected to live monitoring WebSocket: session=${currentSessionId}`);
        setIsMonitoring(true);
        setIsPaused(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'metrics') {
            setMetrics(data);

            const eyeState = data.drowsiness?.eyeState;
            const drowsyStatus = data.drowsiness?.status;
            const distStatus = data.distraction?.status;

            const isDrowsy = drowsyStatus === 'DROWSINESS DETECTED' || drowsyStatus === 'MICROSLEEP WARNING';
            const isDistracted = distStatus === 'HEAD TURNED / OFF-ROAD' || distStatus === 'PHONE / DOWNWARD GAZE';

            // 1. Drowsiness Continuous Alarm Handling
            if (isDrowsy) {
              const priority = drowsyStatus === 'MICROSLEEP WARNING' ? 'critical_warning' : 'drowsiness';
              audioAlerts.startContinuousAlert(priority);
              setActiveAlert((current) => {
                if (!current || current.category !== 'drowsiness') {
                  return {
                    id: 'drowsy-active',
                    sessionId: sessionId || 'session-active',
                    category: 'drowsiness',
                    title: drowsyStatus,
                    description: `Prolonged eye closure detected (EAR: ${data.drowsiness?.ear?.toFixed(3)}). Safety rating: ${data.safetyScore}/100.`,
                    severity: drowsyStatus === 'MICROSLEEP WARNING' ? 'critical' : 'high',
                    acknowledged: false,
                    driverId: 'current-driver',
                    driverName: 'Commercial Driver',
                    confidence: data.drowsiness?.confidence || 0.95,
                    timestamp: new Date().toISOString(),
                  };
                }
                return current;
              });
            } else {
              // Eyes are open OR transitioning — stop drowsiness alarm immediately
              if (audioAlerts.isAlertActive('drowsiness') || audioAlerts.isAlertActive('critical_warning')) {
                audioAlerts.stopAlert('drowsiness');
                audioAlerts.stopAlert('critical_warning');
                setActiveAlert((current) => {
                  if (current?.category === 'drowsiness') return null;
                  return current;
                });
              }
            }

            // 2. Distraction Continuous Alarm Handling (independent of drowsiness)
            if (isDistracted) {
              // Always attempt — startContinuousAlert respects priority; drowsiness (prio 3) wins over distraction (prio 2)
              audioAlerts.startContinuousAlert('distraction');
              setActiveAlert((current) => {
                if (!current || current.category !== 'distraction') {
                  return {
                    id: 'distract-active',
                    sessionId: sessionId || 'session-active',
                    category: 'distraction',
                    title: distStatus ?? 'HEAD TURNED / OFF-ROAD',
                    description: `Gaze departure detected (Pitch: ${data.distraction?.pitch?.toFixed(1)}°, Yaw: ${data.distraction?.yaw?.toFixed(1)}°). Safety rating: ${data.safetyScore}/100.`,
                    severity: distStatus === 'PHONE / DOWNWARD GAZE' ? 'high' : 'medium',
                    acknowledged: false,
                    driverId: 'current-driver',
                    driverName: 'Commercial Driver',
                    confidence: data.distraction?.confidence || 0.95,
                    timestamp: new Date().toISOString(),
                  };
                }
                return current;
              });
            } else {
              // Driver returned gaze forward — stop distraction alarm immediately
              if (audioAlerts.isAlertActive('distraction')) {
                audioAlerts.stopAlert('distraction');
                setActiveAlert((current) => {
                  if (current?.category === 'distraction') return null;
                  return current;
                });
              }
            }
          } else if (data.type === 'alert_cleared') {
            audioAlerts.stopAlert(data.category);
            setActiveAlert((current) => {
              if (current?.category === data.category) {
                return null;
              }
              return current;
            });
          } else if (data.type === 'alert_created' && data.alert) {
            setActiveAlert(data.alert);
            audioAlerts.triggerSafetyAlert(data.alert);
          }
        } catch (err) {
          console.error('[DriveGuard] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[DriveGuard] Monitor WebSocket error:', err);
      };

      ws.onclose = () => {
        console.log('[DriveGuard] Monitor WebSocket closed');
      };

    } catch (err: any) {
      console.error('[DriveGuard] Failed to start monitoring session:', err);
      setErrorMessage(err?.message || 'Failed to start driving session. Please try again.');
      audioAlerts.playCaution();
    }
  };

  // Stop monitoring session
  const handleStop = async () => {
    try {
      audioAlerts.stopCurrentAlert();
      audioAlerts.playAcknowledge();

      // 1. Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // 2. Finalize session in PostgreSQL
      if (sessionId) {
        await api.stopSession(sessionId);
      }
    } catch (err) {
      console.warn('[DriveGuard] Error stopping session:', err);
    } finally {
      setIsMonitoring(false);
      setIsPaused(false);
      setSessionId(null);
      setMetrics(null);
      setActiveAlert(null);
      setSelectedScenario('normal');
    }
  };

  // Pause monitoring
  const handlePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
  };

  // Frame Capture Callback from WebcamPreview
  const handleFrameCapture = useCallback((frameData: string) => {
    if (
      wsRef.current && 
      wsRef.current.readyState === WebSocket.OPEN && 
      !isPausedRef.current
    ) {
      wsRef.current.send(JSON.stringify({
        frame: frameData,
        scenario: scenarioRef.current,
      }));
    }
  }, []);

  // Acknowledge alert
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
    } catch (err) {
      console.warn('[DriveGuard] Error acknowledging alert:', err);
    }
    // Stop the loud warning alarm immediately when driver acknowledges it
    audioAlerts.stopCurrentAlert();
    audioAlerts.playAcknowledge();
    if (activeAlert?.id === id) {
      setActiveAlert(null);
    }
  };

  // Format timer HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Set scenario for triage validation
  const handleSelectScenario = (scenario: 'normal' | 'drowsy' | 'distracted' | 'weapon_alert') => {
    setSelectedScenario(scenario);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ scenario }));
    }
    if (scenario === 'drowsy') {
      audioAlerts.playDrowsinessAlert();
    } else if (scenario === 'distracted') {
      audioAlerts.playDistractionAlert();
    } else if (scenario === 'weapon_alert') {
      audioAlerts.playCriticalWarning();
    } else if (scenario === 'normal') {
      audioAlerts.stopCurrentAlert();
    }
  };

  // Cleanup on page unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Live Monitoring Cockpit"
        subtitle="Real-time Computer Vision Telemetry"
        role="driver"
        breadcrumbs={[
          { label: 'Driver Cockpit', href: '/driver' },
          { label: 'Live Cockpit' },
        ]}
        actionElement={
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xl tactile-inset-sm">
            <Clock size={14} className="text-[var(--primary-blue)]" />
            <span className="text-[var(--text-secondary)]">Session:</span>
            <span className="font-bold text-[var(--text-primary)]">
              {formatTime(sessionSeconds)}
            </span>
          </div>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-mono text-[var(--alert-coral)]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[10px] text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Main Camera Video Frame + HUD Overlay */}
        <WebcamPreview
          isMonitoring={isMonitoring}
          metrics={metrics}
          videoRef={videoRef}
          devices={cameraDevices}
          selectedCameraId={selectedCameraId}
          cameraStatus={cameraStatus}
          statusMessage={cameraStatusMessage}
          isSwitching={isCameraSwitching}
          isFallbackActive={isFallbackActive}
          cameraError={cameraError}
          showOverlay={showOverlay}
          onCameraChange={handleCameraChange}
          onFrameCapture={handleFrameCapture}
          onRefreshCameras={handleRefreshCameras}
        />

        {/* Camera Tactical Controls & Optical Sensor Selection */}
        <CameraControls
          isMonitoring={isMonitoring}
          isPaused={isPaused}
          showOverlay={showOverlay}
          soundEnabled={soundEnabled}
          devices={cameraDevices}
          selectedCameraId={selectedCameraId}
          cameraStatus={cameraStatus}
          statusMessage={cameraStatusMessage}
          isSwitching={isCameraSwitching}
          isFallbackActive={isFallbackActive}
          onCameraChange={handleCameraChange}
          onRefreshCameras={handleRefreshCameras}
          onStart={handleStart}
          onStop={handleStop}
          onPause={handlePause}
          onToggleOverlay={() => setShowOverlay(!showOverlay)}
          onToggleSound={handleToggleSound}
          onSelectScenario={handleSelectScenario}
        />

        {/* Three Dedicated Detection Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Module 1: Drowsiness */}
          <EyeStateIndicator
            metrics={metrics?.drowsiness || {
              eyeState: 'open',
              ear: 0.285,
              yawnDetected: false,
              blinkRatePerMin: 18,
              confidence: 0.96,
              status: 'ATTENTION NORMAL',
            }}
          />

          {/* Module 2: Distraction & Head Pose */}
          <HeadPoseIndicator
            metrics={metrics?.distraction || {
              headPose: 'forward',
              yaw: 0.0,
              pitch: -2.0,
              roll: 0.5,
              confidence: 0.94,
              status: 'FOCUSED ON ROAD',
            }}
          />

          {/* Module 3: Threat Object Surveillance */}
          <WeaponDetectionBadge
            metrics={metrics?.weapon || {
              detected: false,
              objectClass: null,
              confidence: 0.0,
              requiresVerification: true,
              severity: 'low',
            }}
            onSimulateThreat={() => handleSelectScenario('weapon_alert')}
            onClearThreat={() => handleSelectScenario('normal')}
          />

        </div>

        {/* Driver Face Detection State Strip */}
        <div className="p-4 rounded-2xl tactile-raised-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl tactile-inset flex items-center justify-center ${
              metrics?.faceDetected ? 'text-[var(--safety-mint)]' : 'text-[var(--text-muted)]'
            }`}>
              <User size={16} />
            </div>
            <div>
              <span className="text-[var(--text-primary)] font-bold block">
                {metrics?.faceDetected 
                  ? `DRIVER FACE LOCKED (${((metrics.faceConfidence || 0.98) * 100).toFixed(1)}% CONFIDENCE)` 
                  : 'SEARCHING FOR DRIVER FACIAL PROFILE'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Note: Temporary loss of lock occurs when checking mirrors or face is partially obstructed.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-[var(--text-secondary)]">Edge Model:</span>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--primary-blue)] font-bold">
              MediaPipe FaceMesh 468
            </span>
          </div>
        </div>

      </div>

      {/* Dynamic Floating Alert Notification */}
      <AlertNotification
        alert={activeAlert}
        onAcknowledge={handleAcknowledgeAlert}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    </div>
  );
}
