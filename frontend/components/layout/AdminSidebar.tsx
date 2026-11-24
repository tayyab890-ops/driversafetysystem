'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/authContext';
import { 
  LayoutDashboard, 
  Users, 
  Radio, 
  AlertOctagon, 
  BarChart3, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SJ';

  // Exactly the 5 requested navigation items
  const navItems = [
    { label: 'Fleet Overview', href: '/admin', icon: <LayoutDashboard size={17} /> },
    { label: 'Live Monitoring', href: '/admin/monitoring', icon: <Radio size={17} />, live: true },
    { label: 'Driver Directory', href: '/admin/drivers', icon: <Users size={17} /> },
    { label: 'Alert Operations', href: '/admin/alerts', icon: <AlertOctagon size={17} /> },
    { label: 'Fleet Analytics', href: '/admin/analytics', icon: <BarChart3 size={17} /> },
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
      {/* Brand Header */}
      <div>
        <div className={`h-16 flex items-center border-b border-[var(--border)] px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          {!collapsed ? (
            <Link href="/admin" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" showTagline={false} />
            </Link>
          ) : (
            <div className="w-9 h-9 rounded-xl btn-3d-primary flex items-center justify-center font-bold font-mono text-xs shadow-md">
              HQ
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
              Fleet Operations Center
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--safety-mint)] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)] animate-pulse" />
              ONLINE
            </span>
          </div>
        )}

        {/* 3D Claymorphic Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/admin/monitoring' && pathname === '/admin/sessions');
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

                {!collapsed && item.live && (
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

      {/* Admin User Card & Logout */}
      <div className="p-3 border-t border-[var(--border)]">
        {!collapsed && (
          <div className="clay-driver-card p-3 mb-2.5 space-y-2">
            <div className="flex items-center gap-2.5">
              {/* 3D Clay Avatar Badge */}
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-display uppercase font-bold text-xs text-white shrink-0 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #3B86DE 0%, #1E4F8A 100%)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                  borderBottom: '2px solid rgba(13, 39, 72, 0.8)'
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate block leading-tight">
                  {user?.name || 'Sarah Jenkins'}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] truncate block">
                  {user?.role === 'admin' ? 'Fleet Ops Controller' : 'Driver Account'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-[var(--safety-mint)] font-bold">
                <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                Administrator Online
              </span>
              <span className="text-[var(--primary-blue)] font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                HQ DISPATCH
              </span>
            </div>
          </div>
        )}

        {/* Exit Operations / Sign Out */}
        <button
          onClick={async () => {
            await logout();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-[var(--text-muted)] hover:text-[var(--alert-coral)] hover:bg-rose-500/10 transition-colors select-none cursor-pointer ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="Sign Out / Exit Operations"
        >
          <LogOut size={15} />
          {!collapsed && <span>Exit Operations</span>}
        </button>
      </div>
    </aside>
  );
}
