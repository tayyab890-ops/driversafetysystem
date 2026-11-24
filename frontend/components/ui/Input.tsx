'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl py-2.5 text-sm transition-all duration-200 outline-none tactile-inset ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-[var(--primary-blue)] ${
            error ? 'border-[var(--alert-coral)] ring-1 ring-[var(--alert-coral)]' : ''
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 text-[var(--text-muted)] flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--alert-coral)] font-mono pl-1">
          {error}
        </p>
      )}
    </div>
  );
}
