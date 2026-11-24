import React from 'react';
import { AlertSeverity } from '@/types/safety';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'mint' | 'blue' | 'amber' | 'coral' | 'neutral' | 'severity';
  severity?: AlertSeverity;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  severity,
  size = 'md',
  pulse = false,
}: BadgeProps) {
  let colorStyle = 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]';

  if (severity) {
    switch (severity) {
      case 'low':
        colorStyle = 'bg-blue-500/10 text-[var(--primary-blue)] border-blue-500/20';
        break;
      case 'medium':
        colorStyle = 'bg-amber-500/10 text-[var(--warning-amber)] border-amber-500/25';
        break;
      case 'high':
        colorStyle = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
        break;
      case 'critical':
        colorStyle = 'bg-rose-500/15 text-[var(--alert-coral)] border-rose-500/30 font-bold';
        break;
    }
  } else {
    switch (variant) {
      case 'mint':
        colorStyle = 'bg-emerald-500/15 text-[var(--safety-mint)] border-emerald-500/25';
        break;
      case 'blue':
        colorStyle = 'bg-blue-500/15 text-[var(--primary-blue)] border-blue-500/25';
        break;
      case 'amber':
        colorStyle = 'bg-amber-500/15 text-[var(--warning-amber)] border-amber-500/25';
        break;
      case 'coral':
        colorStyle = 'bg-rose-500/15 text-[var(--alert-coral)] border-rose-500/25';
        break;
      case 'neutral':
      default:
        colorStyle = 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]';
        break;
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono tracking-wider uppercase border ${sizeClasses} ${colorStyle}`}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping opacity-75" />
      )}
      {children}
    </span>
  );
}
