'use client';

import React from 'react';

interface SafetyGaugeProps {
  score: number; // 0 - 100
  size?: number;
  label?: string;
  showDetails?: boolean;
}

export function SafetyGauge({
  score,
  size = 200,
  label = 'SAFETY INDEX',
  showDetails = true,
}: SafetyGaugeProps) {
  // Clamp score
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determine color based on safety score
  let strokeColor = 'var(--safety-mint)';
  let statusText = 'EXCELLENT';
  let statusColor = 'text-[var(--safety-mint)]';

  if (safeScore < 70) {
    strokeColor = 'var(--alert-coral)';
    statusText = 'CRITICAL ATTENTION';
    statusColor = 'text-[var(--alert-coral)]';
  } else if (safeScore < 85) {
    strokeColor = 'var(--warning-amber)';
    statusText = 'CAUTION ADVISED';
    statusColor = 'text-[var(--warning-amber)]';
  } else if (safeScore < 95) {
    strokeColor = 'var(--primary-blue)';
    statusText = 'ALERT & FOCUSED';
    statusColor = 'text-[var(--primary-blue)]';
  }

  // Calculate arc: 240 degrees sweep (-210deg to 30deg)
  const radius = size * 0.38;
  const strokeWidth = size * 0.07;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * safeScore) / 100;

  return (
    <div className="flex flex-col items-center select-none">
      <div 
        className="relative flex items-center justify-center rounded-full tactile-raised p-2"
        style={{ width: size, height: size }}
      >
        {/* Soft inset background track */}
        <div 
          className="absolute rounded-full tactile-inset" 
          style={{ width: size * 0.88, height: size * 0.88 }} 
        />

        <svg 
          width={size} 
          height={size} 
          className="relative z-10 -rotate-[210deg]"
        >
          {/* Background Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
            {label}
          </span>
          <div className="flex items-baseline">
            <span className="text-4xl font-black font-mono tracking-tighter text-[var(--text-primary)]">
              {safeScore}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)] font-bold ml-0.5">
              /100
            </span>
          </div>
          <span className={`text-[10px] font-mono font-bold tracking-wider uppercase mt-0.5 ${statusColor}`}>
            {statusText}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)]" />
            <span>Optimal: 90+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--warning-amber)]" />
            <span>Caution: 70-89</span>
          </div>
        </div>
      )}
    </div>
  );
}
