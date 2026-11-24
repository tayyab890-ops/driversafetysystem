'use client';

import React from 'react';
import { SafetyAlert } from '@/types/safety';
import { Badge } from '@/components/ui/Badge';
import { Eye, Compass, ShieldAlert, UserX, AlertCircle } from 'lucide-react';

interface SafetyTimelineProps {
  alerts: SafetyAlert[];
  onSelectAlert?: (alert: SafetyAlert) => void;
  maxItems?: number;
  className?: string;
}

export function SafetyTimeline({
  alerts,
  onSelectAlert,
  maxItems,
  className = '',
}: SafetyTimelineProps) {
  const displayAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;

  const getCategoryIcon = (category: SafetyAlert['category']) => {
    switch (category) {
      case 'drowsiness':
        return <Eye size={14} className="text-[var(--primary-blue)]" />;
      case 'distraction':
        return <Compass size={14} className="text-[var(--warning-amber)]" />;
      case 'weapon':
        return <ShieldAlert size={14} className="text-[var(--alert-coral)]" />;
      case 'face_absent':
        return <UserX size={14} className="text-[var(--text-muted)]" />;
      default:
        return <AlertCircle size={14} className="text-[var(--text-secondary)]" />;
    }
  };

  if (displayAlerts.length === 0) {
    return (
      <div className={`p-8 text-center rounded-2xl tactile-inset-sm ${className}`}>
        <p className="text-xs font-mono text-[var(--text-muted)]">
          NO SAFETY VIOLATIONS RECORDED
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {displayAlerts.map((alert) => (
        <div
          key={alert.id}
          onClick={() => onSelectAlert && onSelectAlert(alert)}
          className={`p-3.5 rounded-xl tactile-raised-sm flex items-start justify-between gap-3 transition-all duration-200 ${
            onSelectAlert ? 'hover:border-[var(--primary-blue)] cursor-pointer' : ''
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg tactile-inset shrink-0 mt-0.5">
              {getCategoryIcon(alert.category)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {alert.title}
                </span>
                <Badge severity={alert.severity} size="sm">
                  {alert.severity}
                </Badge>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                {alert.description}
              </p>

              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                <span>{alert.driverName}</span>
                <span>•</span>
                <span>{alert.timestamp}</span>
                <span>•</span>
                <span>{(alert.confidence * 100).toFixed(0)}% AI Conf</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
              alert.acknowledged 
                ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]' 
                : 'bg-rose-500/10 text-[var(--alert-coral)] border-rose-500/30 font-bold'
            }`}>
              {alert.acknowledged ? 'ACK' : 'PENDING'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
