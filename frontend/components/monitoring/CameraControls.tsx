'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { 
  Play, 
  Square, 
  Pause, 
  Layers, 
  Volume2, 
  VolumeX, 
  Sparkles,
  AlertTriangle,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Usb
} from 'lucide-react';
import { CameraDeviceInfo, CameraConnectionStatus } from '@/lib/useCameraManager';

interface CameraControlsProps {
  isMonitoring: boolean;
  isPaused: boolean;
  showOverlay: boolean;
  soundEnabled: boolean;
  // Camera management props
  devices?: CameraDeviceInfo[];
  selectedCameraId?: string;
  cameraStatus?: CameraConnectionStatus;
  statusMessage?: string;
  isSwitching?: boolean;
  isFallbackActive?: boolean;
  onCameraChange?: (deviceId: string) => void;
  onRefreshCameras?: () => void;
  // Session callbacks
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onToggleOverlay: () => void;
  onToggleSound: () => void;
  onSelectScenario: (scenario: 'normal' | 'drowsy' | 'distracted' | 'weapon_alert') => void;
}

export function CameraControls({
  isMonitoring,
  isPaused,
  showOverlay,
  soundEnabled,
  devices = [],
  selectedCameraId = '',
  cameraStatus = 'idle',
  statusMessage = '',
  isSwitching = false,
  isFallbackActive = false,
  onCameraChange,
  onRefreshCameras,
  onStart,
  onStop,
  onPause,
  onToggleOverlay,
  onToggleSound,
  onSelectScenario,
}: CameraControlsProps) {
  const [showStopModal, setShowStopModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleStopClick = () => {
    setShowStopModal(true);
  };

  const handleConfirmStop = () => {
    setShowStopModal(false);
    onStop();
  };

  const handleManualRefresh = async () => {
    if (onRefreshCameras) {
      setIsRefreshing(true);
      await onRefreshCameras();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const activeDevice = devices.find((d) => d.deviceId === selectedCameraId);

  // Status badge styling helper
  const getStatusBadge = () => {
    if (isSwitching) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-500',
        dot: 'bg-amber-400 animate-pulse',
        text: 'Switching Sensor...',
      };
    }
    if (isFallbackActive) {
      return {
        bg: 'bg-amber-500/20 border-amber-500/40 text-amber-500',
        dot: 'bg-amber-400 animate-ping',
        text: 'Fallback to Built-in Camera',
      };
    }
    switch (cameraStatus) {
      case 'connected':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-[var(--safety-mint)]',
          dot: 'bg-[var(--safety-mint)]',
          text: isMonitoring ? 'Active Optical Stream' : 'Ready',
        };
      case 'error':
      case 'disconnected':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-[var(--alert-coral)]',
          dot: 'bg-[var(--alert-coral)] animate-pulse',
          text: 'Hardware Interrupted',
        };
      default:
        return {
          bg: 'bg-slate-500/15 border-slate-500/30 text-[var(--text-muted)]',
          dot: 'bg-slate-400',
          text: 'Sensors Standby',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <>
      <div className="space-y-3">
        {/* 1. Camera Management & Hardware Selection Strip (Directly Below Monitoring Panel) */}
        <div className="p-4 rounded-2xl tactile-raised space-y-3 bg-[var(--bg-surface)] border border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Camera Selector with Icon and Status Pill */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl tactile-inset flex items-center justify-center text-[var(--primary-blue)] shrink-0">
                <Camera size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[var(--text-primary)]">
                    Optical Feed Sensor
                  </span>
                  
                  {/* Status Indicator Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{badge.text}</span>
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5 truncate">
                  {statusMessage || (activeDevice ? `Connected: ${activeDevice.label}` : 'Detecting webcams...')}
                </div>
              </div>
            </div>

            {/* Right: Detected Cameras Pill & Rescan Button */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-xl text-[10px] font-mono font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                {devices.length} {devices.length === 1 ? 'Sensor' : 'Sensors'} Available
              </span>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Rescan camera hardware"
                className="btn-3d-secondary p-2 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[var(--primary-blue)]' : ''} />
                <span className="hidden md:inline text-[10px]">Rescan</span>
              </button>
            </div>
          </div>

          {/* Camera Selection Dropdown Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <select
                value={selectedCameraId || ''}
                onChange={(e) => onCameraChange && onCameraChange(e.target.value)}
                disabled={devices.length === 0 || isSwitching}
                aria-label="Select camera feed for AI monitoring"
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-mono font-semibold px-3.5 py-2.5 rounded-xl border border-[var(--border)] outline-none cursor-pointer focus:border-[var(--primary-blue)] transition-all truncate pr-8 disabled:opacity-50"
              >
                {devices.length === 0 ? (
                  <option value="">No camera detected (searching...)</option>
                ) : (
                  devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label}
                      {device.isExternal ? ' • [USB External]' : device.isBuiltIn ? ' • [Built-in Laptop]' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Hardware Type Quick Indicator */}
            {activeDevice && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] shrink-0">
                {activeDevice.isExternal ? (
                  <>
                    <Usb size={13} className="text-[var(--sensor-blue)]" />
                    <span className="text-[var(--text-secondary)]">USB Optical Sensor</span>
                  </>
                ) : (
                  <>
                    <Laptop size={13} className="text-[var(--primary-blue)]" />
                    <span className="text-[var(--text-secondary)]">Integrated System Sensor</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Primary Tactical Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl tactile-raised">
          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5">
            {!isMonitoring ? (
              <Button
                variant="mint"
                size="md"
                icon={<Play size={16} />}
                onClick={onStart}
              >
                Start Monitoring
              </Button>
            ) : (
              <>
                <Button
                  variant="coral"
                  size="md"
                  icon={<Square size={16} />}
                  onClick={handleStopClick}
                >
                  End Session
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  icon={<Pause size={16} />}
                  onClick={onPause}
                >
                  {isPaused ? 'Resume Feed' : 'Pause'}
                </Button>
              </>
            )}

            {/* HUD Overlay Toggle */}
            <Button
              variant={showOverlay ? 'inset' : 'secondary'}
              size="md"
              icon={<Layers size={16} />}
              onClick={onToggleOverlay}
              title="Toggle AI Vision Detection Bounds"
            >
              HUD Bounds
            </Button>

            {/* Sound Toggle */}
            <Button
              variant={soundEnabled ? 'secondary' : 'inset'}
              size="md"
              icon={soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              onClick={onToggleSound}
              title={soundEnabled ? 'Audio Alerts Active' : 'Audio Alerts Muted'}
            >
              {soundEnabled ? 'Chime On' : 'Muted'}
            </Button>
          </div>

          {/* Interactive Scenario Simulation Switcher */}
          <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={12} className="text-[var(--primary-blue)]" />
              Simulate Event:
            </span>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => onSelectScenario('normal')}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] hover:text-[var(--primary-blue)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onSelectScenario('drowsy')}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] hover:text-[var(--warning-amber)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
              >
                Drowsy
              </button>
              <button
                type="button"
                onClick={() => onSelectScenario('distracted')}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] hover:text-[var(--warning-amber)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
              >
                Distracted
              </button>
              <button
                type="button"
                onClick={() => onSelectScenario('weapon_alert')}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-[var(--alert-coral)] border border-rose-500/30 font-semibold cursor-pointer"
              >
                Threat Frame
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Ending Driving Session */}
      <Modal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="End Driving Session?"
        subtitle="Confirm session completion and compile safety telemetry"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-primary)]">
              Ending this session will freeze the session timer, calculate final compliance metrics, and archive alert history.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStopModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="coral"
              size="sm"
              onClick={handleConfirmStop}
            >
              Confirm End Session
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
