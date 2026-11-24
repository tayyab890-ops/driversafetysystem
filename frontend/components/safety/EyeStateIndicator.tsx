'use client';

import React from 'react';
import { DrowsinessMetrics } from '@/types/safety';

interface EyeStateIndicatorProps {
  metrics: DrowsinessMetrics;
  className?: string;
}

export function EyeStateIndicator({ metrics, className = '' }: EyeStateIndicatorProps) {
  const isDrowsy = metrics.status !== 'ATTENTION NORMAL';
  const earPercentage = Math.min(100, Math.max(0, (metrics.ear / 0.35) * 100));

  return (
    <div className={`p-4 rounded-2xl tactile-raised-sm relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
          Drowsiness Monitor
        </span>
        <span 
          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
            isDrowsy 
              ? 'bg-rose-500/10 text-[var(--alert-coral)] border-rose-500/25 animate-pulse'
              : 'bg-emerald-500/10 text-[var(--safety-mint)] border-emerald-500/20'
          }`}
        >
          {metrics.status}
        </span>
      </div>

      {/* Automotive Eye Visualization */}
      <div className="flex items-center gap-4 my-2">
        <div className="w-16 h-12 rounded-xl tactile-inset flex items-center justify-center p-1 relative">
          <svg viewBox="0 0 48 32" className="w-full h-full">
            {/* Eye Outline */}
            <path
              d="M4 16C12 7 36 7 44 16C36 25 12 25 4 16Z"
              fill="none"
              stroke="var(--border)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Iris / Pupil */}
            <circle
              cx="24"
              cy="16"
              r={metrics.eyeState === 'closed' ? 1 : metrics.eyeState === 'sluggish' ? 4 : 6}
              fill={isDrowsy ? 'var(--alert-coral)' : 'var(--primary-blue)'}
              className="transition-all duration-300"
            />
            {/* Eyelid closure animation */}
            {metrics.eyeState === 'closed' && (
              <line 
                x1="4" y1="16" x2="44" y2="16" 
                stroke="var(--alert-coral)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
            )}
          </svg>
        </div>

        {/* Technical EAR reading */}
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xl font-mono font-bold text-[var(--text-primary)]">
              {metrics.ear.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              EAR Index
            </span>
          </div>

          {/* EAR Threshold Bar */}
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                metrics.ear < 0.20 ? 'bg-[var(--alert-coral)]' : 'bg-[var(--safety-mint)]'
              }`}
              style={{ width: `${earPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)] mt-1">
            <span>Closed &lt;0.18</span>
            <span>Norm 0.25+</span>
          </div>
        </div>
      </div>

      {/* Yawn & Blink details */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border)] text-xs">
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] block">YAWN STATUS</span>
          <span className={`font-mono text-xs font-semibold ${metrics.yawnDetected ? 'text-[var(--warning-amber)]' : 'text-[var(--text-primary)]'}`}>
            {metrics.yawnDetected ? 'Yawning Active' : 'None Detected'}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] block">CONFIDENCE</span>
          <span className="font-mono text-xs text-[var(--text-primary)]">
            {(metrics.confidence * 100).toFixed(0)}% AI Confidence
          </span>
        </div>
      </div>
    </div>
  );
}
