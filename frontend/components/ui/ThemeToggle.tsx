'use client';

import React from 'react';
import { useTheme } from '@/lib/themeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle visual theme"
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 tactile-inset-sm hover:opacity-90 active:scale-95 cursor-pointer ${className}`}
      style={{
        border: '1px solid var(--border)',
      }}
    >
      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
        {theme === 'dark' ? 'Night' : 'Day'}
      </span>
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 tactile-raised-sm"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--deep-navy)' : '#ffffff',
          color: theme === 'dark' ? 'var(--sensor-blue)' : 'var(--warning-amber)',
        }}
      >
        {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
      </div>
    </button>
  );
}
