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
  AlertTriangle 
} from 'lucide-react';

interface CameraControlsProps {
  isMonitoring: boolean;
  isPaused: boolean;
  showOverlay: boolean;
  soundEnabled: boolean;
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
  onStart,
  onStop,
  onPause,
  onToggleOverlay,
  onToggleSound,
  onSelectScenario,
}: CameraControlsProps) {
  const [showStopModal, setShowStopModal] = useState(false);

  const handleStopClick = () => {
    setShowStopModal(true);
  };

  const handleConfirmStop = () => {
    setShowStopModal(false);
    onStop();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl tactile-raised">
        {/* Primary Controls */}
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
              onClick={() => onSelectScenario('normal')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] hover:text-[var(--primary-blue)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
            >
              Normal
            </button>
            <button
              onClick={() => onSelectScenario('drowsy')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] hover:text-[var(--warning-amber)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
            >
              Drowsy
            </button>
            <button
              onClick={() => onSelectScenario('distracted')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] hover:text-[var(--warning-amber)] text-[var(--text-primary)] border border-[var(--border)] cursor-pointer"
            >
              Distracted
            </button>
            <button
              onClick={() => onSelectScenario('weapon_alert')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-[var(--alert-coral)] border border-rose-500/30 font-semibold cursor-pointer"
            >
              Threat Frame
            </button>
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
