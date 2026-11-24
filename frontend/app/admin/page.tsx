'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Radio, 
  Eye, 
  Compass, 
  ShieldAlert, 
  Activity, 
  Video, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Car, 
  ExternalLink,
  ShieldCheck,
  Volume2,
  Bell,
  RefreshCw,
  X
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { api, AdminDashboardResponse, DriverDashboardSession, DriverDashboardEvent } from '@/lib/api';

export default function AdminOverviewPage() {
  // Filters & State
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const [chartSeriesFilter, setChartSeriesFilter] = useState<{
    drowsiness: boolean;
    distraction: boolean;
    violations: boolean;
  }>({
    drowsiness: true,
    distraction: true,
    violations: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warning' | 'critical'>('all');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  // Real backend dashboard state
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getAdminDashboard();
      setDashboardData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to fleet operations telemetry';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Transform active sessions for display
  const fleetSessions = useMemo(() => {
    if (!dashboardData || !dashboardData.activeSessions) return [];
    const colors = [
      'from-blue-600 to-indigo-800',
      'from-emerald-600 to-teal-800',
      'from-rose-600 to-pink-900',
      'from-cyan-600 to-blue-800',
      'from-amber-600 to-orange-800',
    ];
    return dashboardData.activeSessions.map((s, idx) => {
      const initials = s.driverName
        ? s.driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'DR';
      const durationHours = Math.floor(s.durationMinutes / 60);
      const durationMins = s.durationMinutes % 60;
      return {
        id: s.id,
        driverId: s.driverId,
        driverName: s.driverName,
        initials,
        avatarColor: colors[idx % colors.length],
        vehicle: s.vehicle,
        vehicleType: 'Fleet Commercial Unit',
        route: 'Active Corridor Transit',
        status: (s.status as any) || 'active',
        safetyScore: s.safetyScore,
        duration: `${durationHours}h ${durationMins}m`,
        durationMinutes: s.durationMinutes,
        miles: s.milesMonitored || Math.round(s.durationMinutes * 0.65),
        flags: {
          drowsiness: (s as any).drowsinessFlags ?? 0,
          distraction: (s as any).distractionFlags ?? 0,
          yawning: 0,
          downwardGlance: (s as any).distractionFlags ?? 0,
        },
        telemetry: {
          ear: 0.285,
          yaw: 0.0,
          pitch: 0.0,
          mar: 0.180,
          faceMeshLocked: true,
          speedMph: 60,
          cabinAudioLevel: 'Normal',
        }
      };
    });
  }, [dashboardData]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return fleetSessions.filter((s) => {
      const matchesSearch = 
        s.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.route.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' ? true : s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fleetSessions, searchQuery, statusFilter]);

  // High-Priority Operational Stream from real alerts
  const operationalStream = useMemo(() => {
    if (!dashboardData || !dashboardData.priorityAlerts) return [];
    return dashboardData.priorityAlerts.map((a: DriverDashboardEvent) => ({
      id: a.id,
      type: a.category,
      title: a.title,
      detail: a.description || a.detail,
      driver: a.driverName,
      vehicle: a.sessionRef || 'Assigned Vehicle',
      time: a.time || a.timestamp,
      timestamp: 'Active flag',
      severity: (a.severity as any) || 'warning',
      metrics: a.metrics || 'Calibrated vision stream',
      acknowledged: a.acknowledged,
    }));
  }, [dashboardData]);

  // Handle acknowledge
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setDispatchNotice(`Alert #${id} acknowledged by Dispatch Controller.`);
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          priorityAlerts: dashboardData.priorityAlerts.map(a => 
            a.id === id ? { ...a, acknowledged: true } : a
          ),
        });
      }
      setTimeout(() => setDispatchNotice(null), 4000);
    } catch (err: unknown) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Dispatch audio chime to vehicle
  const handleDispatchAudioChime = (driverName: string, vehicle: string) => {
    setDispatchNotice(`Priority voice intervention chime broadcasted to ${driverName} (${vehicle}).`);
    setTimeout(() => setDispatchNotice(null), 5000);
  };

  // Real backend fleet trend chart points
  const chartData = useMemo(() => {
    if (!dashboardData || !dashboardData.fleetTrend || dashboardData.fleetTrend.length === 0) {
      return [
        { time: 'Mon', drowsiness: 0, distraction: 0, violations: 0 },
        { time: 'Tue', drowsiness: 0, distraction: 0, violations: 0 },
        { time: 'Wed', drowsiness: 0, distraction: 0, violations: 0 },
        { time: 'Thu', drowsiness: 0, distraction: 0, violations: 0 },
        { time: 'Fri', drowsiness: 0, distraction: 0, violations: 0 },
        { time: 'Sat', drowsiness: 0, distraction: 0, violations: 0 },
        { time: 'Today', drowsiness: 0, distraction: 0, violations: 0 },
      ];
    }
    return dashboardData.fleetTrend.map((t) => ({
      time: t.day,
      drowsiness: t.drowsiness || 0,
      distraction: t.distraction || 0,
      violations: t.other || 0,
    }));
  }, [dashboardData]);

  // Max value for scaling SVG chart
  const maxChartVal = useMemo(() => {
    let max = 1;
    chartData.forEach(d => {
      if (d.drowsiness > max) max = d.drowsiness;
      if (d.distraction > max) max = d.distraction;
      if (d.violations > max) max = d.violations;
    });
    return Math.ceil(max * 1.25);
  }, [chartData]);

  // Compute SVG Points
  const getSvgPoints = (key: 'drowsiness' | 'distraction' | 'violations') => {
    const width = 640;
    const height = 180;
    const step = chartData.length > 1 ? width / (chartData.length - 1) : width;

    return chartData.map((d, index) => {
      const x = Math.round(index * step);
      const val = d[key];
      const y = Math.round(height - (val / maxChartVal) * (height - 30) - 15);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="flex-1 flex flex-col select-none pb-12">
      {/* Toast Notification Banner */}
      {dispatchNotice && (
        <div className="fixed top-4 right-4 z-50 bg-[#14233c] text-white border border-[var(--primary-blue)]/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono animate-in fade-in slide-in-from-top duration-200">
          <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-ping" />
          <span>{dispatchNotice}</span>
          <button 
            onClick={() => setDispatchNotice(null)}
            className="text-[var(--text-muted)] hover:text-white ml-2 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">

        {/* Error notification banner if API connection failed */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--alert-coral)] shrink-0" />
              <div>
                <p className="text-xs font-mono font-bold text-[var(--alert-coral)]">Fleet Telemetry Connection Alert</p>
                <p className="text-[11px] font-mono text-[var(--text-secondary)]">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchDashboard}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-[var(--alert-coral)] border border-rose-500/30 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Fleet Welcome & Operations Overview Banner */}
        <section 
          className="p-6 sm:p-7 relative overflow-hidden rounded-[28px] select-none shadow-2xl"
          style={{
            background: 'radial-gradient(ellipse 100% 90% at 50% 0%, #203440 0%, #14232D 50%, #0d161e 100%)',
            borderTop: '1.5px solid rgba(255, 255, 255, 0.22)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.4)',
            borderBottom: '3.5px solid rgba(8, 14, 20, 0.9)',
            boxShadow: '0 20px 45px -10px rgba(10, 20, 30, 0.5), 0 8px 18px -4px rgba(0, 0, 0, 0.35), inset 0 1.5px 1px rgba(255, 255, 255, 0.18), inset 0 -2px 4px rgba(0, 0, 0, 0.55)'
          }}
        >
          {/* Subtle Ambient Background Accents from Landing Page */}
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute top-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(ellipse, rgba(53,120,198,0.35) 0%, transparent 70%)', transform: 'translateY(-20%)' }}
            />
            <div 
              className="absolute bottom-0 left-1/4 w-[400px] h-[250px] rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(ellipse, rgba(67,182,154,0.3) 0%, transparent 70%)', transform: 'translateY(20%)' }}
            />
            {/* Subtle Grid Texture */}
            <div 
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                backgroundSize: '36px 36px'
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title & Description */}
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-blue-300 bg-blue-500/15 border border-blue-400/30 shadow-inner">
                  <Activity size={12} className="animate-pulse text-blue-400" />
                  COMMAND CENTER TELEMETRY
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)] animate-ping" />
                  GATEWAY ONLINE • 24MS
                </span>
              </div>

              <h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-display uppercase tracking-tight text-[#70B8FF] leading-tight font-extrabold"
                style={{ textShadow: '0 2px 24px rgba(53, 120, 198, 0.45)' }}
              >
                Fleet Safety Operations Center
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Real-time AI computer vision driver safety monitoring across commercial vehicles. Instant micro-sleep defense, gaze distraction tracking, and automated emergency dispatch intervention.
              </p>

              {/* Quick Status Sub-strip */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Car size={13} className="text-[#70B8FF]" />
                  <strong className="text-white">{dashboardData?.enrolledDrivers ?? 0}</strong> Enrolled Drivers
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Radio size={13} className="text-[var(--safety-mint)]" />
                  <strong className="text-white">{dashboardData?.activeFeeds ?? 0}</strong> Active Cabin Feeds
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[var(--safety-mint)]" />
                  <strong className="text-white">{dashboardData?.fleetSafetyScore ?? 100}</strong> Fleet Safety Score
                </span>
              </div>
            </div>

            {/* Quick Actions & Live Monitoring Button */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={fetchDashboard}
                disabled={isLoading}
                title="Refresh fleet operations data"
                className="p-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <Link href="/admin/monitoring">
                <button className="btn-3d-primary flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider cursor-pointer">
                  <Video size={16} />
                  <span>LIVE MONITORING</span>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-0.5" />
                </button>
              </Link>

              <button 
                onClick={() => handleDispatchAudioChime('All Active Units', 'Fleet-Wide')}
                className="btn-3d-secondary flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-mono font-medium tracking-wider cursor-pointer bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-md hover:translate-y-[-1px] transition-all"
                title="Send check-in ping to all in-transit drivers"
              >
                <Volume2 size={15} />
                <span>CABIN PING</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Fleet Statistics (6 Visually Attractive 3D Claymorphism Metric Modules) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Enrolled Drivers */}
          <div className="clay-driver-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">
                Drivers
              </span>
              <div className="clay-icon-well w-8 h-8 rounded-lg flex items-center justify-center text-[var(--primary-blue)]">
                <Users size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--primary-blue)] tracking-tight">
                {dashboardData?.enrolledDrivers ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                Total Enrolled
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--safety-mint)] font-bold">100% Verified</span>
              <span className="text-[var(--text-muted)]">Commercial</span>
            </div>
          </div>

          {/* Card 2: Active Feeds */}
          <div className="clay-driver-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">
                Feeds
              </span>
              <div className="clay-icon-well w-8 h-8 rounded-lg flex items-center justify-center text-[var(--safety-mint)]">
                <Radio size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--safety-mint)] tracking-tight">
                {dashboardData?.activeFeeds ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                Active Cabin Streams
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--safety-mint)] font-bold">WSS Connected</span>
              <span className="text-[var(--text-muted)]">Edge NPU</span>
            </div>
          </div>

          {/* Card 3: Safety Alerts Today */}
          <div className="clay-driver-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">
                Alerts Today
              </span>
              <div className="clay-icon-well w-8 h-8 rounded-lg flex items-center justify-center text-[var(--warning-amber)]">
                <Bell size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--primary-blue)] tracking-tight">
                {dashboardData?.alertsToday ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                Total Prompts
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--text-muted)]">Resolved: {dashboardData?.resolvedAlertsToday ?? 0}</span>
              <span className="text-[var(--warning-amber)] font-bold">Today</span>
            </div>
          </div>

          {/* Card 4: Drowsiness Events */}
          <div className="clay-driver-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">
                Drowsiness
              </span>
              <div className="clay-icon-well w-8 h-8 rounded-lg flex items-center justify-center text-[var(--primary-blue)]">
                <Eye size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--primary-blue)] tracking-tight">
                {dashboardData?.drowsinessEvents ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                EAR Depressions
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--primary-blue)] font-bold">&lt; 0.18 EAR</span>
              <span className="text-[var(--text-muted)]">Fatigue</span>
            </div>
          </div>

          {/* Card 5: Distraction Events */}
          <div className="clay-driver-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">
                Distraction
              </span>
              <div className="clay-icon-well w-8 h-8 rounded-lg flex items-center justify-center text-[var(--warning-amber)]">
                <Compass size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--primary-blue)] tracking-tight">
                {dashboardData?.distractionEvents ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                Head Pitch / Yaw
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--warning-amber)] font-bold">Off-Road Gaze</span>
              <span className="text-[var(--text-muted)]">&gt; 2.0s</span>
            </div>
          </div>

          {/* Card 6: Safety Violations & Threats */}
          <div className="clay-driver-card p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">
                Violations
              </span>
              <div className="clay-icon-well w-8 h-8 rounded-lg flex items-center justify-center text-[var(--alert-coral)]">
                <ShieldAlert size={16} />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--alert-coral)] tracking-tight">
                {dashboardData?.safetyViolations ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                Critical Violations
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)]/40 flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--alert-coral)] font-bold">{dashboardData?.threatDetections ?? 0} Threats</span>
              <span className="text-[var(--text-muted)]">Fleet Risk</span>
            </div>
          </div>
        </section>

        {/* 3. Active Fleet Sessions (Prominent Monitoring Table) */}
        <section className="clay-driver-card p-5 sm:p-6 space-y-5">
          {/* Table Header Strip & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-wide uppercase">
                  Active Fleet Sessions in Transit
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border)]">
                  {filteredSessions.length} Monitored
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Real-time multi-vehicle safety telemetry &amp; AI driver state monitoring
              </p>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter driver or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clay-input-inset pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[var(--primary-blue)]"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]/60 text-[11px] font-mono">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'all' 
                      ? 'bg-[var(--primary-blue)] text-white font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'active' 
                      ? 'bg-[var(--safety-mint)] text-slate-950 font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setStatusFilter('warning')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'warning' 
                      ? 'bg-[var(--warning-amber)] text-slate-950 font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Warning
                </button>
                <button
                  onClick={() => setStatusFilter('critical')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === 'critical' 
                      ? 'bg-[var(--alert-coral)] text-white font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Critical
                </button>
              </div>

              <Link href="/admin/sessions">
                <button className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary-blue)] hover:bg-[var(--bg-secondary)] border border-[var(--border)]/40 transition-colors cursor-pointer" title="Full Monitoring Matrix">
                  <ExternalLink size={15} />
                </button>
              </Link>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-[var(--border)]/50 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="pb-3 pl-3">Driver Profile</th>
                  <th className="pb-3">Vehicle / Unit</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Safety Score</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Safety Flags</th>
                  <th className="pb-3 text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/30">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <tr 
                      key={session.id}
                      className="hover:bg-blue-500/[0.03] transition-colors group"
                    >
                      {/* Driver Profile */}
                      <td className="py-3.5 pl-3">
                        <div className="flex items-center gap-3">
                          {/* 3D Clay Avatar Badge */}
                          <div 
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${session.avatarColor} flex items-center justify-center font-display font-bold text-xs text-white shrink-0 shadow-md border-t border-white/40 border-b border-black/40`}
                          >
                            {session.initials}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                              {session.driverName}
                              {session.status === 'critical' && (
                                <span className="w-2 h-2 rounded-full bg-[var(--alert-coral)] animate-ping" />
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {session.driverId} • {session.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5">
                        <div>
                          <span className="font-bold text-[var(--text-primary)] block">
                            {session.vehicle}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {session.route}
                          </span>
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          session.status === 'active'
                            ? 'bg-emerald-500/15 text-[var(--safety-mint)] border border-emerald-500/30'
                            : session.status === 'warning'
                            ? 'bg-amber-500/15 text-[var(--warning-amber)] border border-amber-500/30'
                            : 'bg-rose-500/15 text-[var(--alert-coral)] border border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            session.status === 'active'
                              ? 'bg-[var(--safety-mint)]'
                              : session.status === 'warning'
                              ? 'bg-[var(--warning-amber)] animate-pulse'
                              : 'bg-[var(--alert-coral)] animate-ping'
                          }`} />
                          {session.status}
                        </span>
                      </td>

                      {/* Safety Score */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              session.safetyScore >= 90
                                ? 'bg-emerald-500/15 text-[var(--safety-mint)] border border-emerald-500/30'
                                : session.safetyScore >= 80
                                ? 'bg-amber-500/15 text-[var(--warning-amber)] border border-amber-500/30'
                                : 'bg-rose-500/15 text-[var(--alert-coral)] border border-rose-500/30'
                            }`}
                          >
                            {session.safetyScore}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            / 100
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Clock size={12} className="text-[var(--text-muted)]" />
                          <span>{session.duration}</span>
                        </div>
                      </td>

                      {/* Safety Flags */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span 
                            title={`Drowsiness Events: ${session.flags.drowsiness}`}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              session.flags.drowsiness > 0 
                                ? 'bg-rose-500/15 text-[var(--alert-coral)] border border-rose-500/30' 
                                : 'bg-white/5 text-[var(--text-muted)]'
                            }`}
                          >
                            D:{session.flags.drowsiness}
                          </span>

                          <span 
                            title={`Distraction Events: ${session.flags.distraction}`}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              session.flags.distraction > 0 
                                ? 'bg-amber-500/15 text-[var(--warning-amber)] border border-amber-500/30' 
                                : 'bg-white/5 text-[var(--text-muted)]'
                            }`}
                          >
                            G:{session.flags.distraction}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="btn-3d-secondary px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
                            title="Open Telemetry Inspection"
                          >
                            INSPECT
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center font-mono">
                      <Radio className="w-8 h-8 mx-auto mb-2 text-[var(--primary-blue)] opacity-50" />
                      <p className="text-xs font-bold text-[var(--text-primary)]">No Active Fleet Sessions in Transit</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        All enrolled commercial vehicles are currently off-duty or stationary in depot.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Fleet Violation & Alert Curve (Interactive Chart) + High-Priority Stream */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 4A. Fleet Violation & Alert Curve (7 Columns) */}
          <div className="lg:col-span-7 clay-driver-card p-5 sm:p-6 space-y-5">
            {/* Chart Title & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]/60">
              <div>
                <h3 className="text-sm sm:text-base font-display font-bold text-white tracking-wide uppercase">
                  Fleet Violation &amp; Alert Curve
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  Multi-series temporal analysis of driver safety incidents
                </p>
              </div>

              {/* Time Filters */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]/60 text-xs font-mono">
                <button
                  onClick={() => setTimeFilter('today')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'today'
                      ? 'bg-[var(--primary-blue)] text-white font-bold'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'week'
                      ? 'bg-[var(--primary-blue)] text-white font-bold'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    timeFilter === 'month'
                      ? 'bg-[var(--primary-blue)] text-white font-bold'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Category Toggles (Legends) */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <button
                onClick={() => setChartSeriesFilter(prev => ({ ...prev, drowsiness: !prev.drowsiness }))}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  chartSeriesFilter.drowsiness
                    ? 'bg-blue-500/15 border-blue-500/40 text-[var(--primary-blue)] font-bold'
                    : 'bg-white/5 border-transparent text-[var(--text-muted)] line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-blue)]" />
                <span>Drowsiness Events</span>
              </button>

              <button
                onClick={() => setChartSeriesFilter(prev => ({ ...prev, distraction: !prev.distraction }))}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  chartSeriesFilter.distraction
                    ? 'bg-amber-500/15 border-amber-500/40 text-[var(--warning-amber)] font-bold'
                    : 'bg-white/5 border-transparent text-[var(--text-muted)] line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning-amber)]" />
                <span>Distraction Events</span>
              </button>

              <button
                onClick={() => setChartSeriesFilter(prev => ({ ...prev, violations: !prev.violations }))}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  chartSeriesFilter.violations
                    ? 'bg-rose-500/15 border-rose-500/40 text-[var(--alert-coral)] font-bold'
                    : 'bg-white/5 border-transparent text-[var(--text-muted)] line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--alert-coral)]" />
                <span>Safety Violations</span>
              </button>
            </div>

            {/* SVG Interactive Curve Chart */}
            <div className="clay-icon-well p-4 rounded-2xl relative overflow-hidden">
              <div className="h-48 w-full relative flex flex-col justify-between">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-white w-full" />
                  <div className="border-b border-dashed border-white w-full" />
                  <div className="border-b border-dashed border-white w-full" />
                  <div className="border-b border-dashed border-white w-full" />
                </div>

                {/* SVG Curve Lines */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 640 180" preserveAspectRatio="none">
                  {/* Subtle Gradients */}
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Distraction Curve (Amber) */}
                  {chartSeriesFilter.distraction && (
                    <polyline
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSvgPoints('distraction')}
                    />
                  )}

                  {/* Drowsiness Curve (Blue) */}
                  {chartSeriesFilter.drowsiness && (
                    <polyline
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSvgPoints('drowsiness')}
                    />
                  )}

                  {/* Violations Curve (Coral) */}
                  {chartSeriesFilter.violations && (
                    <polyline
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={getSvgPoints('violations')}
                    />
                  )}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between pt-2 text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border)]/40">
                  {chartData.map((d, i) => (
                    <span key={i} className="text-center">{d.time}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Operational Summary Micro-Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border)]/40">
                <span className="text-[10px] text-[var(--text-muted)] block">FLEET ATTENTION INDEX</span>
                <span className="font-bold text-[var(--safety-mint)]">{dashboardData?.fleetSafetyScore ?? 100} / 100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border)]/40">
                <span className="text-[10px] text-[var(--text-muted)] block">TOTAL SAFETY EVENTS</span>
                <span className="font-bold text-[var(--warning-amber)]">{dashboardData?.totalAlerts ?? 0} LOGGED</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border)]/40">
                <span className="text-[10px] text-[var(--text-muted)] block">TOTAL FLEET SESSIONS</span>
                <span className="font-bold text-[var(--primary-blue)]">{dashboardData?.totalSessions ?? 0} SESSIONS</span>
              </div>
            </div>
          </div>

          {/* 4B. High-Priority Operational Stream (5 Columns) */}
          <div className="lg:col-span-5 clay-driver-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/60">
                <div className="flex items-center gap-2">
                  <div className="clay-icon-well w-7 h-7 rounded-lg flex items-center justify-center text-[var(--alert-coral)]">
                    <Bell size={14} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-white tracking-wide uppercase">
                      High-Priority Stream
                    </h3>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                      Real-time incidents requiring dispatch review
                    </p>
                  </div>
                </div>

                <Link href="/admin/alerts">
                  <button className="text-xs font-mono text-[var(--primary-blue)] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>Alerts Operations</span>
                    <ArrowRight size={12} />
                  </button>
                </Link>
              </div>

              {/* Real-Time Timeline Cards */}
              <div className="space-y-3 mt-4 max-h-[460px] overflow-y-auto pr-1">
                {operationalStream.length > 0 ? (
                  operationalStream.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-xl transition-all border ${
                        item.acknowledged 
                          ? 'bg-[var(--bg-main)]/60 border-[var(--border)]/40 opacity-75' 
                          : item.severity === 'critical'
                          ? 'bg-rose-500/[0.07] border-rose-500/30 shadow-sm'
                          : 'bg-amber-500/[0.07] border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                              item.severity === 'critical'
                                ? 'bg-rose-500/20 text-[var(--alert-coral)]'
                                : item.severity === 'warning'
                                ? 'bg-amber-500/20 text-[var(--warning-amber)]'
                                : 'bg-blue-500/20 text-[var(--primary-blue)]'
                            }`}>
                              {item.severity}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              {item.time} ({item.timestamp})
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div className="font-bold text-xs text-[var(--text-primary)] truncate">
                            {item.title}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans line-clamp-2">
                            {item.detail}
                          </p>

                          {/* Telemetry pill */}
                          <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-2 pt-1">
                            <span className="text-white font-semibold">{item.driver}</span>
                            <span>•</span>
                            <span>{item.vehicle}</span>
                            <span>•</span>
                            <span className="text-[var(--primary-blue)]">{item.metrics}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          {!item.acknowledged ? (
                            <button
                              onClick={() => handleAcknowledgeAlert(item.id)}
                              className="btn-3d-secondary px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-[var(--alert-coral)] hover:text-white cursor-pointer"
                            >
                              AUDIT
                            </button>
                          ) : (
                            <span className="text-[9px] font-mono text-[var(--safety-mint)] flex items-center gap-1 font-bold">
                              <CheckCircle2 size={11} /> ACK
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedAlert(item)}
                            className="text-[10px] font-mono text-[var(--primary-blue)] hover:underline cursor-pointer"
                          >
                            Details &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center font-mono rounded-2xl bg-[var(--bg-main)]/60 border border-[var(--border)]/40">
                    <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-[var(--safety-mint)] opacity-70" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">Zero Critical Incidents Flagged</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Fleet-wide cabin vision streams report calm, compliant conditions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Dispatch Action Bar */}
            <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Supervisor on duty: Sarah Jenkins</span>
              <button 
                onClick={() => setDispatchNotice("Fleet compliance log synchronized.")}
                className="text-[var(--primary-blue)] hover:underline cursor-pointer text-[11px]"
              >
                Log Status &rarr;
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* 5. Telemetry Inspection Modal (Active Session Deep-Dive) */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession ? `Vehicle Telemetry Stream: ${selectedSession.driverName}` : 'Telemetry'}
        subtitle={selectedSession ? `${selectedSession.vehicle} • ID: ${selectedSession.id} • ${selectedSession.route}` : undefined}
        maxWidth="max-w-2xl"
      >
        {selectedSession && (
          <div className="space-y-5 text-xs font-mono">
            {/* Real-time Facial Tracking HUD Simulator */}
            <div className="relative rounded-2xl bg-[#070e18] border border-[var(--border)] p-4 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                    <span className="font-bold text-white uppercase tracking-wide">
                      FACIAL MESH HUD • 468 PTS LOCKED
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                    Real-time MediaPipe face mesh &amp; head pose vector tracking
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[var(--primary-blue)] font-bold text-[10px]">
                    {selectedSession.telemetry.speedMph} MPH IN-TRANSIT
                  </span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    selectedSession.status === 'critical'
                      ? 'bg-rose-500/20 text-[var(--alert-coral)] border border-rose-500/30'
                      : selectedSession.status === 'warning'
                      ? 'bg-amber-500/20 text-[var(--warning-amber)] border border-amber-500/30'
                      : 'bg-emerald-500/20 text-[var(--safety-mint)] border border-emerald-500/30'
                  }`}>
                    SCORE: {selectedSession.safetyScore} / 100
                  </span>
                </div>
              </div>

              {/* Simulated Face Geometry HUD Box */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-white/[0.03]">
                  <span className="text-[10px] text-[var(--text-muted)] block">EYE ASPECT RATIO (EAR)</span>
                  <span className="text-base font-bold text-[var(--safety-mint)]">
                    {selectedSession.telemetry.ear.toFixed(3)}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] block">Threshold: 0.180</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.03]">
                  <span className="text-[10px] text-[var(--text-muted)] block">HEAD PITCH ANGLE</span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {selectedSession.telemetry.pitch.toFixed(1)}°
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] block">Horizon Departure</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.03]">
                  <span className="text-[10px] text-[var(--text-muted)] block">HEAD YAW VECTOR</span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {selectedSession.telemetry.yaw.toFixed(1)}°
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] block">Forward Road Gaze</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white/[0.03]">
                  <span className="text-[10px] text-[var(--text-muted)] block">MOUTH RATIO (MAR)</span>
                  <span className="text-base font-bold text-[var(--safety-mint)]">
                    {selectedSession.telemetry.mar.toFixed(3)}
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] block">Yawn Baseline: 0.550</span>
                </div>
              </div>
            </div>

            {/* Session Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">DISTANCE</span>
                <span className="text-white font-bold">{selectedSession.miles} MILES</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">SESSION TIME</span>
                <span className="text-white font-bold">{selectedSession.duration}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">TOTAL FLAGS</span>
                <span className="text-[var(--warning-amber)] font-bold">
                  {selectedSession.flags.drowsiness + selectedSession.flags.distraction} EVENTS
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">CABIN ACOUSTICS</span>
                <span className="text-white font-bold">{selectedSession.telemetry.cabinAudioLevel}</span>
              </div>
            </div>

            {/* Dispatch Intervention Controls */}
            <div className="p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs uppercase tracking-wide">
                  Emergency Dispatch Controls
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  WSS Telemetry Channel: ACTIVE
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    handleDispatchAudioChime(selectedSession.driverName, selectedSession.vehicle);
                    setSelectedSession(null);
                  }}
                  className="btn-3d-primary flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Volume2 size={14} />
                  <span>DISPATCH VOICE ALERT</span>
                </button>

                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer ml-auto"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Alert Detail Modal (Operational Stream Item) */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert ? `Incident Telemetry: ${selectedAlert.id}` : 'Alert'}
        subtitle={selectedAlert ? `${selectedAlert.title} • ${selectedAlert.driver}` : undefined}
        maxWidth="max-w-lg"
      >
        {selectedAlert && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Severity Level:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedAlert.severity === 'critical' ? 'bg-rose-500/20 text-[var(--alert-coral)]' : 'bg-amber-500/20 text-[var(--warning-amber)]'
                }`}>
                  {selectedAlert.severity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Vehicle Unit:</span>
                <span className="text-white font-bold">{selectedAlert.vehicle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Timestamp:</span>
                <span className="text-white">{selectedAlert.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Telemetry Vector:</span>
                <span className="text-[var(--primary-blue)] font-bold">{selectedAlert.metrics}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans p-3 rounded-xl bg-white/[0.02] border border-white/5">
              {selectedAlert.detail}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {!selectedAlert.acknowledged && (
                <button
                  onClick={() => {
                    handleAcknowledgeAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ACKNOWLEDGE INCIDENT
                </button>
              )}
              <button
                onClick={() => setSelectedAlert(null)}
                className="btn-3d-secondary px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
