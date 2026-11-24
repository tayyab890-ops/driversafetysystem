import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ className = '', size = 'md', showTagline = false }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Automotive Safety Shield Motif with Road & Radar Geometry */}
      <div 
        className={`relative ${iconSizes[size]} rounded-xl flex items-center justify-center p-1.5 transition-all duration-300 tactile-raised-sm`}
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-secondary) 100%)',
        }}
      >
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Shield Boundary */}
          <path 
            d="M20 4L7 9V19C7 27.5 12.5 35 20 37C27.5 35 33 27.5 33 19V9L20 4Z" 
            stroke="var(--primary-blue)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Road Perspective Curves */}
          <path 
            d="M13 28L18 16M27 28L22 16" 
            stroke="var(--deep-navy)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            className="dark:stroke-gray-300"
          />
          {/* Center Lane Markings */}
          <path 
            d="M20 18V21M20 25V28" 
            stroke="var(--warning-amber)" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />
          {/* AI Radar Center Point */}
          <circle cx="20" cy="13" r="2.5" fill="var(--safety-mint)" />
          <circle cx="20" cy="13" r="4.5" stroke="var(--safety-mint)" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-[var(--text-primary)] ${textSizes[size]}`}>
            DriveGuard
          </span>
          <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-[var(--primary-blue)] text-white shadow-sm">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase mt-0.5">
            Stay Alert. Stay Protected.
          </span>
        )}
      </div>
    </div>
  );
}
