'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'mint' | 'coral' | 'cockpit' | 'inset';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-medium',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--primary-blue)] text-white hover:opacity-95 shadow-md active:scale-[0.98]';
      case 'mint':
        return 'bg-[var(--safety-mint)] text-slate-950 font-medium hover:opacity-95 shadow-md active:scale-[0.98]';
      case 'coral':
        return 'bg-[var(--alert-coral)] text-white font-medium hover:opacity-95 shadow-md active:scale-[0.98]';
      case 'cockpit':
        return 'bg-[var(--deep-navy)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] active:scale-[0.98]';
      case 'inset':
        return 'tactile-inset-sm text-[var(--text-primary)] active:scale-[0.98]';
      case 'secondary':
      default:
        return 'tactile-raised-sm text-[var(--text-primary)] hover:border-[var(--primary-blue)] active:scale-[0.98]';
    }
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-medium tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${getVariantStyles()} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
