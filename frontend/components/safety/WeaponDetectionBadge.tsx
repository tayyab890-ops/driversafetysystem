'use client';

import React from 'react';
import { WeaponDetectionMetrics } from '@/types/safety';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface WeaponDetectionBadgeProps {
  metrics: WeaponDetectionMetrics;
  className?: string;
  onSimulateThreat?: () => void;
  onClearThreat?: () => void;
}

export function WeaponDetectionBadge({
  metrics,
  className = '',
  onSimulateThreat,
  onClearThreat,
}: WeaponDetectionBadgeProps) {
  const isThreatDetected = metrics.detected;

  return (
    <div className={`p-4 rounded-2xl tactile-raised-sm relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
          Threat Object Surveillance
        </span>
        <span 
          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium flex items-center gap-1 ${
            isThreatDetected 
              ? 'bg-rose-500/15 text-[var(--alert-coral)] border-rose-500/30 animate-pulse font-bold'
              : 'bg-emerald-500/10 text-[var(--safety-mint)] border-emerald-500/20'
          }`}
        >
          {isThreatDetected ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
          {isThreatDetected ? 'CANDIDATE DETECTED' : 'CABIN CLEAR'}
        </span>
      </div>

      {/* Visual Bounding Box Indicator */}
      <div className="flex items-center gap-4 my-2">
        <div className={`w-16 h-12 rounded-xl tactile-inset flex items-center justify-center p-1.5 relative border ${
          isThreatDetected ? 'border-[var(--alert-coral)] bg-rose-500/5' : 'border-[var(--border)]'
        }`}>
          {isThreatDetected ? (
            <div className="w-full h-full border border-dashed border-[var(--alert-coral)] flex items-center justify-center">
              <span className="text-[8px] font-mono font-bold text-[var(--alert-coral)] text-center leading-tight">
                OBJ BOX<br />86%
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          )}
        </div>

        {/* Readout */}
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
              {isThreatDetected ? metrics.objectClass || 'Threat Silhouette' : 'No Threat Objects'}
            </span>
          </div>

          <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
            {isThreatDetected 
              ? 'AI-detected candidate. Protocol requires human review.' 
              : 'Continuous cabin quadrant scanning active.'}
          </p>
        </div>
      </div>

      {/* Verification Protocol Banner */}
      <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
        <div className="text-[10px] font-mono text-[var(--text-muted)]">
          CONFIRMATION: <span className="text-[var(--text-secondary)] font-semibold">HUMAN AUDIT REQUIRED</span>
        </div>

        {/* Demo trigger toggle for test simulation */}
        <div className="flex items-center gap-1.5">
          {onSimulateThreat && !isThreatDetected && (
            <button
              onClick={onSimulateThreat}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] cursor-pointer"
            >
              Simulate Event
            </button>
          )}
          {onClearThreat && isThreatDetected && (
            <button
              onClick={onClearThreat}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--safety-mint)]/20 text-[var(--safety-mint)] hover:bg-[var(--safety-mint)]/30 font-bold cursor-pointer"
            >
              Verify / Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
