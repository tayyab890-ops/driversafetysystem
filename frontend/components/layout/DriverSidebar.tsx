'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/authContext';
import { 
  Gauge, 
  Video, 
  Clock, 
  FileText, 
  Bell, 
  Settings, 
  LogOut, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

interface DriverSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DriverSidebar({ collapsed = false, onToggleCollapse }: DriverSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AM';

  const navItems = [
    { label: 'Overview', href: '/driver', icon: <Gauge size={17} /> },
    { label: 'Live Cockpit', href: '/driver/monitor', icon: <Video size={17} />, highlight: true },
    { label: 'Driving Sessions', href: '/driver/sessions', icon: <Clock size={17} /> },
    { label: 'Safety Reports', href: '/driver/reports', icon: <FileText size={17} /> },
    { label: 'Alert History', href: '/driver/alerts', icon: <Bell size={17} /> },
    { label: 'Settings', href: '/driver/settings', icon: <Settings size={17} /> },
  ];

  return (
    <aside 
      className={`h-screen sticky top-0 border-r border-[var(--border)] transition-all duration-300 flex flex-col justify-between z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
      }}
    >
      {/* Top Header & Brand */}
      <div>
        <div className={`h-16 flex items-center border-b border-[var(--border)] px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!collapsed ? (
            <Link href="/driver" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" showTagline={false} />
            </Link>
          ) : (
            <div className="w-9 h-9 rounded-xl btn-3d-primary flex items-center justify-center font-bold font-mono text-xs shadow-md">
              DG
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border)] transition-all cursor-pointer hidden md:flex items-center justify-center"
              aria-label="Toggle sidebar width"
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )}
        </div>

        {/* Section Label */}
        {!collapsed && (
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-semibold">
              Driver Cockpit
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--safety-mint)] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)] animate-pulse" />
              TELEMETRY
            </span>
          </div>
        )}

        {/* 3D Claymorphic Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`clay-nav-btn ${
                  isActive ? 'clay-nav-btn-active' : 'clay-nav-btn-inactive'
                } ${collapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'}`}
                title={collapsed ? item.label : undefined}
              >
                {/* Dimensional Icon Well */}
                <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-transform ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-inner' 
                    : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                }`}>
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="flex-1 truncate tracking-wider">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.highlight && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--safety-mint)] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Driver Status Card & Logout */}
      <div className="p-3 border-t border-[var(--border)]">
        {!collapsed && (
          <div className="clay-driver-card p-3 mb-2.5 space-y-2">
            <div className="flex items-center gap-2.5">
              {/* 3D Clay Avatar Badge */}
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-display uppercase font-bold text-xs text-white shrink-0 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #3B86DE 0%, #205CA3 100%)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                  borderBottom: '2px solid rgba(13, 39, 72, 0.8)'
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate block leading-tight">
                  {user?.name || 'Driver'}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] truncate block">
                  {user?.vehicle_id ? `Unit: ${user.vehicle_id}` : 'Unit: Unassigned'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-[var(--safety-mint)] font-bold">
                <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                Driver Online
              </span>
              <span className="text-[var(--primary-blue)] font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                CLASS A
              </span>
            </div>
          </div>
        )}

        {/* Exit / Sign Out Button */}
        <button
          onClick={async () => {
            await logout();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-[var(--text-muted)] hover:text-[var(--alert-coral)] hover:bg-rose-500/10 transition-colors select-none cursor-pointer ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="Sign Out / Exit Cockpit"
        >
          <LogOut size={15} />
          {!collapsed && <span>Exit Cockpit</span>}
        </button>
      </div>
    </aside>
  );
}
