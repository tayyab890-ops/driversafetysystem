'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Menu, X, ArrowRight } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full pt-2.5 pb-2 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between clay-navbar select-none">
        {/* Brand Logo */}
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[var(--text-secondary)]">
          <Link href="/#technology" className="clay-nav-item">
            Technology
          </Link>
          <Link href="/#features" className="clay-nav-item">
            Detection Modules
          </Link>
          <Link href="/#process" className="clay-nav-item">
            How It Works
          </Link>
          <Link href="/#demo" className="clay-nav-item flex items-center gap-1.5 text-[var(--safety-mint)] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)] animate-ping" />
            Live Demo
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          
          <Link href="/login">
            <button
              type="button"
              className="btn-3d-secondary px-4 py-2 rounded-xl text-xs font-semibold tracking-wide cursor-pointer"
            >
              Sign In
            </button>
          </Link>

          <Link href="/driver/monitor">
            <button
              type="button"
              className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start Cockpit</span>
              <ArrowRight size={13} />
            </button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] tactile-inset-sm cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto clay-navbar p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1 text-sm font-mono uppercase text-[var(--text-secondary)]">
            <Link 
              href="/#technology" 
              onClick={() => setMobileMenuOpen(false)}
              className="clay-nav-item py-2"
            >
              Technology
            </Link>
            <Link 
              href="/#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="clay-nav-item py-2"
            >
              Detection Modules
            </Link>
            <Link 
              href="/#process" 
              onClick={() => setMobileMenuOpen(false)}
              className="clay-nav-item py-2"
            >
              How It Works
            </Link>
            <Link 
              href="/#demo" 
              onClick={() => setMobileMenuOpen(false)}
              className="clay-nav-item py-2 text-[var(--safety-mint)] font-bold flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-ping" />
              Live Demo
            </Link>
          </nav>

          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <button
                type="button"
                className="btn-3d-secondary w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide cursor-pointer"
              >
                Sign In
              </button>
            </Link>
            <Link href="/driver/monitor" onClick={() => setMobileMenuOpen(false)}>
              <button
                type="button"
                className="btn-3d-primary w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Launch Monitoring Cockpit</span>
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
