'use client';

import React from 'react';
import { DistractionMetrics } from '@/types/safety';

interface HeadPoseIndicatorProps {
  metrics: DistractionMetrics;
  className?: string;
}

export function HeadPoseIndicator({ metrics, className = '' }: HeadPoseIndicatorProps) {
  const isDistracted = metrics.status !== 'FOCUSED ON ROAD';
  
  // Calculate compass needle rotation based on yaw (-45 to 45 degrees)
  const needleAngle = Math.max(-45, Math.min(45, metrics.yaw));

  return (
    <div className={`p-4 rounded-2xl tactile-raised-sm relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
          Distraction & Head Pose
        </span>
        <span 
          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
            isDistracted 
              ? 'bg-amber-500/10 text-[var(--warning-amber)] border-amber-500/25 animate-pulse'
              : 'bg-emerald-500/10 text-[var(--safety-mint)] border-emerald-500/20'
          }`}
        >
          {metrics.status}
        </span>
      </div>

      {/* Head Direction Compass & Angle Geometry */}
      <div className="flex items-center gap-4 my-2">
        <div className="w-16 h-16 rounded-full tactile-inset flex items-center justify-center relative">
          {/* Compass ticks */}
          <div className="absolute inset-1 rounded-full border border-dashed border-[var(--border)] opacity-60" />
          
          {/* Center Target */}
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />

          {/* Dynamic Direction Indicator Vector */}
          <div 
            className="absolute w-1 h-7 rounded-full origin-bottom transition-transform duration-300"
            style={{
              bottom: '50%',
              backgroundColor: isDistracted ? 'var(--warning-amber)' : 'var(--safety-mint)',
              transform: `rotate(${needleAngle}deg)`,
            }}
          />
          
          {/* Forward direction mark */}
          <span className="absolute top-1 text-[8px] font-mono text-[var(--text-muted)]">N</span>
        </div>

        {/* Technical Yaw / Pitch Values */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Head Yaw</span>
            <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
              {metrics.yaw > 0 ? `+${metrics.yaw}° R` : `${metrics.yaw}° L`}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Pitch Angle</span>
            <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
              {metrics.pitch > 0 ? `+${metrics.pitch}° UP` : `${metrics.pitch}° DOWN`}
            </span>
          </div>

          <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                Math.abs(metrics.yaw) > 20 || metrics.pitch < -20 ? 'bg-[var(--warning-amber)]' : 'bg-[var(--safety-mint)]'
              }`}
              style={{ width: `${Math.min(100, Math.max(15, Math.abs(metrics.yaw) * 2.2))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pose classification */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border)] text-xs">
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] block">POSE ORIENTATION</span>
          <span className="font-mono text-xs font-semibold text-[var(--text-primary)] capitalize">
            {metrics.headPose} Heading
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] block">DETECTION CONFIDENCE</span>
          <span className="font-mono text-xs text-[var(--text-primary)]">
            {(metrics.confidence * 100).toFixed(0)}% Certainty
          </span>
        </div>
      </div>
    </div>
  );
}
