'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import { Sparkles, Activity } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: 'driver' | 'admin';
  breadcrumbs?: { label: string; href?: string }[];
  actionElement?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  role,
  breadcrumbs,
  actionElement,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between sticky top-0 bg-[var(--bg-main)]/95 backdrop-blur-md z-20 select-none">
      {/* Title & Breadcrumbs */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-0.5" aria-label="Breadcrumb">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="opacity-40">/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-[var(--primary-blue)] transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-[var(--text-secondary)] font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-display uppercase text-lg sm:text-xl tracking-tight text-[var(--text-primary)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] font-mono text-[var(--text-secondary)] hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Tools: Action element, Live status badge, Theme toggle */}
      <div className="flex items-center gap-3">
        {actionElement}

        {/* AI Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-primary)] font-bold">
            AI Engine: Online
          </span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
