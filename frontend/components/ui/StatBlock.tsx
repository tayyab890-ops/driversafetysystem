import React from 'react';

interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
  className?: string;
}

export function StatBlock({
  label,
  value,
  unit,
  subtext,
  icon,
  trend,
  accentColor,
  className = '',
}: StatBlockProps) {
  return (
    <div
      className={`p-4 rounded-2xl tactile-raised-sm relative overflow-hidden transition-all duration-200 ${className}`}
    >
      {accentColor && (
        <div 
          className="absolute top-0 left-0 right-0 h-1" 
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </span>
        {icon && (
          <div className="text-[var(--text-muted)] opacity-80">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtext && (
          <span className="text-[var(--text-secondary)] text-[11px]">
            {subtext}
          </span>
        )}
        {trend && (
          <span
            className={`font-mono text-[11px] font-medium ml-auto ${
              trend.isPositive ? 'text-[var(--safety-mint)]' : 'text-[var(--alert-coral)]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
