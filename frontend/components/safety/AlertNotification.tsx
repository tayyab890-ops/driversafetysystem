'use client';

import React from 'react';
import { SafetyAlert } from '@/types/safety';
import { AlertTriangle, CheckCircle, Volume2, VolumeX } from 'lucide-react';

interface AlertNotificationProps {
  alert: SafetyAlert | null;
  onAcknowledge: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function AlertNotification({
  alert,
  onAcknowledge,
  soundEnabled,
  onToggleSound,
}: AlertNotificationProps) {
  if (!alert || alert.acknowledged) return null;

  const isCritical = alert.severity === 'critical';

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 max-w-md w-full rounded-2xl p-4 tactile-elevated border transition-all duration-300 animate-in slide-in-from-bottom-5 ${
        isCritical 
          ? 'border-[var(--alert-coral)] bg-rose-950/20 shadow-rose-950/50' 
          : 'border-[var(--warning-amber)] bg-amber-950/20'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div className={`p-2.5 rounded-xl tactile-inset flex items-center justify-center shrink-0 ${
          isCritical ? 'text-[var(--alert-coral)]' : 'text-[var(--warning-amber)]'
        }`}>
          <AlertTriangle size={22} className={isCritical ? 'animate-bounce' : ''} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[var(--alert-coral)]">
              SAFETY EVENT • {alert.category.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {alert.timestamp}
            </span>
          </div>

          <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 truncate">
            {alert.title}
          </h4>

          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
            {alert.description}
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border)]">
            <button
              onClick={onToggleSound}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="text-[10px] font-mono">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 rounded-xl bg-[var(--deep-navy)] hover:bg-[var(--primary-blue)] text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCircle size={14} />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
