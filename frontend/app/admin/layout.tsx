'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuth } from '@/lib/authContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'admin') {
        router.replace('/driver');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[var(--primary-blue)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-[var(--text-secondary)] uppercase">
            Verifying Fleet Operations Authorization...
          </span>
        </div>
        {/* Render segment in hidden container to prevent Next.js dropped segment warning */}
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)]">
      {/* Fleet Ops Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Operations Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
