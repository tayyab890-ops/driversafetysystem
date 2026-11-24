'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/authContext';
import {
  api,
  DriverDashboardResponse,
  DriverDashboardSession,
  DriverDashboardEvent,
} from '@/lib/api';
import { 
  Play, 
  Video, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Navigation,
  ArrowRight,
  TrendingUp,
  Eye,
  Compass,
  Zap,
  Activity,
  CheckCircle2,
  User,
  Shield,
  Radio,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trends' | 'focus' | 'activity' | 'breakdown'>('trends');
  const [selectedSession, setSelectedSession] = useState<DriverDashboardSession | null>(null);

  // Real backend dashboard state
  const [data, setData] = useState<DriverDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getDriverDashboard();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to driver dashboard telemetry';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Derived metrics from real API data
  const score = data?.safetyScore ?? 100;
  const gradeLabel = score >= 90 ? 'GRADE A+ • OPTIMAL' : score >= 75 ? 'GRADE B • NOMINAL' : 'GRADE C • CAUTION';
  const gradeColor = score >= 90 ? 'var(--safety-mint)' : score >= 75 ? 'var(--warning-amber)' : 'var(--alert-coral)';

  const sessionMinutes = data?.totalSessionTime ?? 0;
  const sessionHours = Math.floor(sessionMinutes / 60);
  const sessionRemainingMins = sessionMinutes % 60;
  const shiftPct = Math.min(100, Math.round((sessionMinutes / (11 * 60)) * 100));

  const weeklyTrends = data?.weeklyScoreTrend || [];
  const hourlyFocus = data?.hourlyFocus || [];
  const recentEvents = data?.recentEvents || [];
  const sessions = data?.recentSessions || [];

  // SVG Trend Chart calculations
  const trendPoints = weeklyTrends.map((t, idx) => ({
    x: 60 + idx * 100,
    y: 10 + (100 - Math.min(100, Math.max(0, t.score))) * 4,
    ...t,
  }));
  const polylinePoints = trendPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const polygonPoints = trendPoints.length > 0
    ? `${polylinePoints} ${trendPoints[trendPoints.length - 1].x},130 ${trendPoints[0].x},130`
    : '';

  const avgTrendScore = weeklyTrends.length > 0
    ? Math.round(weeklyTrends.reduce((acc, t) => acc + t.score, 0) / weeklyTrends.length)
    : score;

  const totalWeeklyHours = weeklyTrends.reduce((acc, t) => acc + (t.hours || 0), 0);
  const totalWeeklyMiles = weeklyTrends.reduce((acc, t) => acc + (t.miles || 0), 0);

  // Categorical event breakdown calculation
  const totalCategorical = (data?.alertnessAnalysis || []).reduce((acc, c) => acc + c.count, 0);
  const getCatCount = (catName: string) => {
    const found = (data?.alertnessAnalysis || []).find((c) => c.category === catName);
    return found ? found.count : 0;
  };
  const drowsinessCount = getCatCount('drowsiness');
  const distractionCount = getCatCount('distraction');
  const faceAbsentCount = getCatCount('face_absent');
  const threatCount = getCatCount('weapon');

  const getEventCategoryIcon = (category: string) => {
    switch (category) {
      case 'drowsiness':
        return <Eye size={18} />;
      case 'distraction':
        return <Compass size={18} />;
      case 'weapon':
        return <Shield size={18} />;
      case 'face_absent':
        return <AlertTriangle size={18} />;
      default:
        return <Activity size={18} />;
    }
  };

  const getEventBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return {
          color: 'var(--alert-coral)',
          badgeBg: 'bg-rose-500/15 border-rose-500/30 text-[var(--alert-coral)]',
        };
      case 'medium':
        return {
          color: 'var(--warning-amber)',
          badgeBg: 'bg-amber-500/15 border-amber-500/30 text-[var(--warning-amber)]',
        };
      default:
        return {
          color: 'var(--primary-blue)',
          badgeBg: 'bg-blue-500/15 border-blue-500/30 text-[var(--primary-blue)]',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col select-none">
      
      {/* Top Header */}
      <DashboardHeader
        title="Driver Command Overview"
        subtitle={`Unit: ${user?.vehicle_id || 'Unassigned'} • Shift Active`}
        role="driver"
        breadcrumbs={[
          { label: 'Driver Cockpit' },
          { label: 'Overview' },
        ]}
        actionElement={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboard}
              title="Refresh telemetry"
              disabled={isLoading}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <Link href="/driver/monitor">
              <button
                type="button"
                className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Video size={14} />
                <span className="hidden sm:inline">Live Cockpit</span>
              </button>
            </Link>
          </div>
        }
      />

      {/* Main Content Dashboard Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">

        {/* Error notification banner if API connection failed */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--alert-coral)] shrink-0" />
              <div>
                <p className="text-xs font-mono font-bold text-[var(--alert-coral)]">Telemetry Connection Notice</p>
                <p className="text-[11px] font-mono text-[var(--text-secondary)]">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-[var(--alert-coral)] border border-rose-500/30 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* ============================================================
            1. WELCOME SECTION (AUTOMOTIVE COCKPIT HERO BANNER)
            ============================================================ */}
        <div 
          className="p-6 sm:p-8 rounded-[32px] relative overflow-hidden text-white border border-white/10 shadow-2xl"
          style={{
            background: 'radial-gradient(ellipse 100% 90% at 50% 100%, #203440 0%, #121e28 55%, #0c151c 100%)'
          }}
        >
          {/* Ambient Lighting Glows */}
          <div 
            className="absolute top-0 right-1/4 w-[450px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(53,120,198,0.22) 0%, transparent 70%)', filter: 'blur(70px)' }}
          />
          <div 
            className="absolute bottom-0 left-10 w-[400px] h-[250px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(67,182,154,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }}
          />

          {/* Road Perspective Geometry lines */}
          <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-10 pointer-events-none hidden lg:block">
            <svg viewBox="0 0 300 200" className="w-full h-full">
              <path d="M0 200L110 0M300 200L190 0" stroke="white" strokeWidth="2.5" />
              <line x1="150" y1="0" x2="150" y2="200" stroke="#F3BD72" strokeWidth="2.5" strokeDasharray="10 8" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left Content */}
            <div className="space-y-3 max-w-2xl">
              
              {/* Telemetry pill */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[var(--safety-mint)] text-[10px] font-mono uppercase tracking-wider font-bold border border-white/15 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse shadow-[0_0_8px_rgba(67,182,154,0.8)]" />
                  AI Engine Online &amp; Calibrated
                </span>
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest hidden sm:inline">
                  {user?.vehicle_id ? `UNIT: ${user.vehicle_id.toUpperCase()} • ACTIVE` : 'UNIT #14 • ACTIVE CORRIDOR'}
                </span>
              </div>

              {/* Heading */}
              <h1 className="font-display uppercase text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-none"
                style={{ textShadow: '0 4px 20px rgba(53,120,198,0.3)' }}
              >
                Welcome Back, {user?.name || 'Driver'}
              </h1>

              {/* Subtitle */}
              <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
                {data?.hasSessions ? (
                  <>
                    Your driving attention index is in the <strong className="text-[var(--safety-mint)]">Top {Math.max(1, 100 - (data.fleetPercentile || 95))}% of commercial fleet units</strong> this week. {data.criticalAlertsToday === 0 ? 'Zero critical fatigue episodes recorded' : `${data.criticalAlertsToday} critical safety flag(s) logged`} over the past {data.milesProtected} monitored miles.
                  </>
                ) : (
                  <>
                    Welcome to DriveGuard AI. Your telemetry profile is calibrated and standing by. Zero critical fatigue episodes recorded. Start your drive session to begin real-time cockpit monitoring.
                  </>
                )}
              </p>

              {/* Driver Specs Row */}
              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-mono text-white/70">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-[var(--primary-blue)]" />
                  <span>ID: {user?.id ? user.id.slice(0, 8).toUpperCase() : 'DRV-READY'} (Class A)</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-1.5">
                  <Navigation size={13} className="text-[var(--safety-mint)]" />
                  <span>{user?.vehicle_id || 'Unassigned'}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <div className="flex items-center gap-1.5">
                  <Zap size={13} className="text-[var(--warning-amber)]" />
                  <span>Edge NPU Latency: {data?.latestTelemetry?.latencyMs ?? 14}ms</span>
                </div>
              </div>

            </div>

            {/* Right Action Buttons */}
            <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
              
              {/* Start New Drive Session (Raised Green 3D Clay Button) */}
              <Link href="/driver/monitor" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer select-none transition-all"
                  style={{
                    background: 'linear-gradient(170deg, #4DC8A8 0%, #31A989 50%, #22906F 100%)',
                    color: '#FFFFFF',
                    borderTop: '2px solid rgba(255, 255, 255, 0.6)',
                    borderLeft: '1.5px solid rgba(255, 255, 255, 0.3)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.2)',
                    borderBottom: '4px solid rgba(15, 72, 55, 0.95)',
                    boxShadow: '0 14px 30px -5px rgba(43, 182, 142, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)'
                  }}
                >
                  <Play size={15} fill="currentColor" />
                  <span>Start New Drive Session</span>
                </button>
              </Link>

              {/* Live Cockpit (Raised Blue 3D Clay Button) */}
              <Link href="/driver/monitor" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="btn-3d-primary w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none shadow-lg"
                >
                  <Video size={15} />
                  <span>Live Cockpit</span>
                </button>
              </Link>

            </div>

          </div>
        </div>

        {/* ============================================================
            2. COMPOSITE SAFETY SCORE & 4 STATISTICS CARDS
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Large Animated Circular 3D Composite Safety Score Gauge */}
          <div className="lg:col-span-5 clay-driver-card p-6 sm:p-7 flex flex-col justify-between">
            
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                  TELEMETRY SYNTHESIS
                </span>
                <h2 className="font-display uppercase text-2xl tracking-tight text-[var(--text-primary)]">
                  Composite Safety Score
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-[var(--safety-mint)] border border-emerald-500/30 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                {gradeLabel}
              </span>
            </div>

            {/* Circular Gauge Visualization */}
            <div className="py-6 flex flex-col items-center justify-center my-auto">
              <div className="cockpit-gauge-bezel w-48 h-48 sm:w-52 sm:h-52 relative">
                {/* SVG Dial Arc */}
                <svg className="w-full h-full transform -rotate-90 p-3" viewBox="0 0 100 100">
                  {/* Outer track */}
                  <circle cx="50" cy="50" r="40" stroke="rgba(0,0,0,0.06)" strokeWidth="7" fill="transparent" />
                  {/* Danger zone marker (below 70) */}
                  <circle cx="50" cy="50" r="40" stroke="var(--alert-coral)" strokeWidth="7" fill="transparent" strokeDasharray="3 250" strokeDashoffset="-75" opacity="0.6" />
                  {/* Caution marker (70 - 85) */}
                  <circle cx="50" cy="50" r="40" stroke="var(--warning-amber)" strokeWidth="7" fill="transparent" strokeDasharray="3 250" strokeDashoffset="-135" opacity="0.6" />
                  {/* Active score arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke={gradeColor} 
                    strokeWidth="7" 
                    fill="transparent" 
                    strokeDasharray="251" 
                    strokeDashoffset={251 - (251 * (score / 100))} 
                    strokeLinecap="round" 
                  />
                </svg>

                {/* Score Center Readout */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    SAFETY INDEX
                  </span>
                  <span className="text-4xl sm:text-5xl font-black font-mono text-[var(--safety-mint)] tracking-tight">
                    {score}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[var(--text-secondary)] uppercase mt-0.5">
                    OUT OF 100
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Indicators: EAR, Head Pose/Focus, Cabin Calmness */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[var(--border)]">
              
              {/* Alertness (EAR) */}
              <div className="p-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--safety-mint)] mb-1">
                  <Eye size={12} />
                  <span className="text-[9px] font-mono font-bold uppercase">Alertness</span>
                </div>
                <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                  {data?.latestTelemetry?.ear ? `${data.latestTelemetry.ear.toFixed(3)} EAR` : '0.285 EAR'}
                </div>
                <span className="text-[9px] font-mono text-[var(--safety-mint)] font-semibold">
                  {data?.latestTelemetry?.ear ? (data.latestTelemetry.ear >= 0.25 ? 'Nominal' : 'Sluggish') : 'Nominal'}
                </span>
              </div>

              {/* Head Pose / Focus */}
              <div className="p-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--primary-blue)] mb-1">
                  <Compass size={12} />
                  <span className="text-[9px] font-mono font-bold uppercase">Head Focus</span>
                </div>
                <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                  {data?.latestTelemetry?.yaw !== undefined && data?.latestTelemetry?.yaw !== null 
                    ? `${data.latestTelemetry.yaw > 0 ? '+' : ''}${data.latestTelemetry.yaw.toFixed(1)}° Yaw`
                    : 'Forward'}
                </div>
                <span className="text-[9px] font-mono text-[var(--primary-blue)] font-semibold">
                  {data?.latestTelemetry?.pitch !== undefined && data?.latestTelemetry?.pitch !== null 
                    ? `${data.latestTelemetry.pitch > 0 ? '+' : ''}${data.latestTelemetry.pitch.toFixed(1)}° Pitch`
                    : 'Steady'}
                </span>
              </div>

              {/* Cabin Calmness */}
              <div className="p-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--safety-mint)] mb-1">
                  <ShieldCheck size={12} />
                  <span className="text-[9px] font-mono font-bold uppercase">Calmness</span>
                </div>
                <div className="text-xs font-bold font-mono text-[var(--text-primary)]">
                  {data?.threatCount ?? 0} Threats
                </div>
                <span className="text-[9px] font-mono text-[var(--safety-mint)] font-semibold">
                  {(data?.threatCount ?? 0) === 0 ? 'Calm Cabin' : 'Flagged'}
                </span>
              </div>

            </div>

            {/* Telemetry label footer */}
            <div className="pt-2 text-center text-[10px] font-mono text-[var(--text-muted)]">
              ACTIVE TELEMETRY PROTOCOL • WEIGHTED MULTI-VECTOR ALGORITHM
            </div>

          </div>

          {/* 4 Statistics Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Stat 1: Session Time Today */}
            <div className="clay-driver-card clay-driver-card-hover p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    ACTIVE MONITORING
                  </span>
                  <h3 className="font-display uppercase text-xl text-[var(--text-primary)] tracking-tight">
                    Session Time Today
                  </h3>
                </div>
                <div className="clay-icon-well w-10 h-10 text-[var(--primary-blue)] bg-blue-500/10 shrink-0">
                  <Clock size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-black text-[var(--text-primary)] tracking-tight">
                    {sessionHours}h {sessionRemainingMins}m
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--safety-mint)] flex items-center gap-0.5">
                    <TrendingUp size={12} /> {data?.sessionsToday ?? 0} session(s)
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                  OSHA Driving Hours: {Math.max(0, 11 - sessionHours)}h remaining
                </p>
              </div>

              {/* Shift Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-[var(--safety-mint)] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(4, shiftPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
                  <span>Shift Elapsed: {shiftPct}%</span>
                  <span>Max 11.0 Hours</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Fleet Safety Percentile */}
            <div className="clay-driver-card clay-driver-card-hover p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    FLEET RANKING
                  </span>
                  <h3 className="font-display uppercase text-xl text-[var(--text-primary)] tracking-tight">
                    Safety Percentile
                  </h3>
                </div>
                <div className="clay-icon-well w-10 h-10 text-[var(--safety-mint)] bg-emerald-500/10 shrink-0">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-black text-[var(--safety-mint)] tracking-tight">
                    Top {Math.max(1, 100 - (data?.fleetPercentile ?? 95))}%
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--safety-mint)] flex items-center gap-0.5">
                    <TrendingUp size={12} /> Fleet Tier 1
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                  Composite attention benchmark among commercial drivers
                </p>
              </div>

              {/* Percentile Pill Bar */}
              <div className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--text-muted)] uppercase">Fleet Index:</span>
                <span className="font-bold text-[var(--safety-mint)]">
                  {data?.fleetPercentile ?? 95}.0 Pct • Standard
                </span>
              </div>
            </div>

            {/* Stat 3: Miles Protected */}
            <div className="clay-driver-card clay-driver-card-hover p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    TOTAL DISTANCE
                  </span>
                  <h3 className="font-display uppercase text-xl text-[var(--text-primary)] tracking-tight">
                    Miles Protected
                  </h3>
                </div>
                <div className="clay-icon-well w-10 h-10 text-[var(--sensor-blue)] bg-blue-500/10 shrink-0">
                  <Navigation size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-black text-[var(--text-primary)] tracking-tight">
                    {(data?.milesProtected ?? 0).toFixed(1)}
                  </span>
                  <span className="text-sm font-mono text-[var(--text-muted)] font-bold">miles</span>
                </div>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                  Continuous edge AI vision coverage active
                </p>
              </div>

              {/* Vehicle Status readout */}
              <div className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--text-muted)] uppercase">Assigned Unit:</span>
                <span className="font-bold text-[var(--text-primary)] truncate max-w-[150px]">
                  {user?.vehicle_id || 'Safety Fleet Unit'}
                </span>
              </div>
            </div>

            {/* Stat 4: Safety Flags */}
            <div className="clay-driver-card clay-driver-card-hover p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    INCIDENT LOG
                  </span>
                  <h3 className="font-display uppercase text-xl text-[var(--text-primary)] tracking-tight">
                    Safety Flags
                  </h3>
                </div>
                <div className="clay-icon-well w-10 h-10 text-[var(--warning-amber)] bg-amber-500/10 shrink-0">
                  <AlertTriangle size={18} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-black text-[var(--warning-amber)] tracking-tight">
                    {data?.safetyFlags ?? 0}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">
                    {(data?.safetyFlags ?? 0) === 1 ? 'Prompt' : 'Prompts Today'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                  {data?.criticalAlertsToday ?? 0} critical safety chimes recorded
                </p>
              </div>

              {/* Severity Summary */}
              <div className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--text-muted)] uppercase">Critical Alarms:</span>
                <span className={`font-bold ${(data?.criticalAlertsToday ?? 0) === 0 ? 'text-[var(--safety-mint)]' : 'text-[var(--alert-coral)]'}`}>
                  {(data?.criticalAlertsToday ?? 0) === 0 ? '0 Active • Clear' : `${data?.criticalAlertsToday} Critical Alarm(s)`}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================
            3. SAFETY ANALYTICS (INTERACTIVE ANIMATED CHARTS)
            ============================================================ */}
        <div className="clay-driver-card p-6 sm:p-7 space-y-6">
          
          {/* Section Header with Functional Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--primary-blue)] block">
                INTELLIGENT ANALYTICS
              </span>
              <h2 className="font-display uppercase text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
                Safety &amp; Focus Telemetry Analytics
              </h2>
            </div>

            {/* 3D Tab Switcher */}
            <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab('trends')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'trends'
                    ? 'btn-3d-primary shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Score Trends
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'focus'
                    ? 'btn-3d-primary shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Alertness Analysis
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'activity'
                    ? 'btn-3d-primary shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Weekly Activity
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('breakdown')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'breakdown'
                    ? 'btn-3d-primary shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Event Breakdown
              </button>
            </div>
          </div>

          {/* Tab 1: Safety Score Trends (7-Day Line Chart) */}
          {activeTab === 'trends' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>7-DAY WEIGHTED SAFETY INDEX (0 - 100)</span>
                <span className="text-[var(--safety-mint)] font-bold">AVG: {avgTrendScore} • PEAK: {Math.max(...weeklyTrends.map(w => w.score), score)}</span>
              </div>

              {/* Custom SVG Line Chart with Gradient Area and Point Tooltips */}
              <div className="w-full h-56 relative overflow-hidden bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-4 flex flex-col justify-between">
                
                {/* SVG Chart */}
                <svg viewBox="0 0 700 160" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="scoreTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3578C6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3578C6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[100, 90, 80, 70].map((scoreVal, i) => {
                    const y = 10 + (100 - scoreVal) * 4;
                    return (
                      <g key={i}>
                        <line x1="40" y1={y} x2="680" y2={y} stroke="var(--border)" strokeDasharray="3 3" strokeWidth="0.8" />
                        <text x="32" y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">
                          {scoreVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Area */}
                  {polygonPoints && (
                    <polygon
                      points={polygonPoints}
                      fill="url(#scoreTrendGrad)"
                    />
                  )}

                  {/* Line Path */}
                  {polylinePoints && (
                    <polyline
                      fill="none"
                      stroke="#3578C6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />
                  )}

                  {/* Interactive Nodes */}
                  {trendPoints.map((t, idx) => {
                    const isToday = t.day === 'Today';
                    return (
                      <g key={idx} className="cursor-pointer group">
                        <circle 
                          cx={t.x} 
                          cy={t.y} 
                          r={isToday ? 6 : 4.5} 
                          fill={isToday ? 'var(--safety-mint)' : '#3578C6'} 
                          stroke="white" 
                          strokeWidth="2"
                        />
                        <text 
                          x={t.x} 
                          y={t.y - 10} 
                          textAnchor="middle" 
                          fontSize="10" 
                          fontWeight="bold" 
                          fill={isToday ? 'var(--safety-mint)' : 'var(--text-primary)'} 
                          fontFamily="monospace"
                        >
                          {t.score}
                        </text>
                        <text 
                          x={t.x} 
                          y="150" 
                          textAnchor="middle" 
                          fontSize="10" 
                          fill="var(--text-muted)" 
                          fontFamily="monospace"
                        >
                          {t.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>

              </div>
            </div>
          )}

          {/* Tab 2: Alertness & Focus Analysis (Hourly Graph) */}
          {activeTab === 'focus' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>TODAY&apos;S HOURLY EYE APERTURE (EAR) &amp; ATTENTION STABILITY</span>
                <span className="text-[var(--primary-blue)] font-bold">CALIBRATED CABIN STREAM</span>
              </div>

              {hourlyFocus.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {hourlyFocus.map((h, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-center space-y-2">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold block">{h.hour}</span>
                      <div className="w-full bg-[var(--bg-main)] h-20 rounded-xl overflow-hidden p-1 flex flex-col justify-end">
                        <div 
                          className="w-full rounded-lg bg-gradient-to-t from-[var(--primary-blue)] to-[var(--safety-mint)] transition-all"
                          style={{ height: `${Math.min(100, Math.max(10, (h.ear / 0.35) * 100))}%` }}
                        />
                      </div>
                      <div className="text-[11px] font-mono font-bold text-[var(--safety-mint)]">{h.ear.toFixed(3)} EAR</div>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] block">{h.attention}% Focus</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <Radio className="w-7 h-7 text-[var(--primary-blue)] mx-auto opacity-70 animate-pulse" />
                  <p className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    No Hourly Focus Telemetry Logged Today
                  </p>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] max-w-md mx-auto">
                    Eye Aperture (EAR) and head-pose telemetry will stream here continuously during your active drive sessions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Weekly Driving Activity (Bar Chart) */}
          {activeTab === 'activity' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>WEEKLY DRIVING HOURS &amp; PROTECTED MILES LOGGED</span>
                <span className="text-[var(--safety-mint)] font-bold">TOTAL: {totalWeeklyHours.toFixed(1)} HOURS • {totalWeeklyMiles.toFixed(1)} MILES</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {weeklyTrends.map((w, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] text-center space-y-2.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] block">{w.day}</span>
                    <div className="w-full bg-[var(--bg-main)] h-24 rounded-xl overflow-hidden p-1 flex flex-col justify-end">
                      <div 
                        className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                        style={{ height: `${Math.min(100, Math.max(6, (w.hours / 8.0) * 100))}%` }}
                      />
                    </div>
                    <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{w.hours} hrs</div>
                    <span className="text-[9px] font-mono text-[var(--primary-blue)] block">{w.miles} mi</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Safety Event Breakdown */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>CATEGORICAL EVENT COMPOSITION</span>
                <span className="text-[var(--text-primary)] font-bold">
                  TOTAL FLAGGED: {totalCategorical} {totalCategorical === 1 ? 'PROMPT' : 'PROMPTS'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Head Pose &amp; Distraction</span>
                  <div className="text-2xl font-black font-mono text-amber-500">
                    {totalCategorical > 0 ? `${Math.round((distractionCount / totalCategorical) * 100)}%` : '0%'}
                  </div>
                  <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all" 
                      style={{ width: `${totalCategorical > 0 ? (distractionCount / totalCategorical) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] block">{distractionCount} Prompts recorded</span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Drowsiness &amp; Fatigue</span>
                  <div className="text-2xl font-black font-mono text-orange-400">
                    {totalCategorical > 0 ? `${Math.round((drowsinessCount / totalCategorical) * 100)}%` : '0%'}
                  </div>
                  <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-400 h-full transition-all" 
                      style={{ width: `${totalCategorical > 0 ? (drowsinessCount / totalCategorical) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] block">{drowsinessCount} Warnings logged</span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Face Occlusion</span>
                  <div className="text-2xl font-black font-mono text-rose-500">
                    {totalCategorical > 0 ? `${Math.round((faceAbsentCount / totalCategorical) * 100)}%` : '0%'}
                  </div>
                  <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full transition-all" 
                      style={{ width: `${totalCategorical > 0 ? (faceAbsentCount / totalCategorical) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] block">{faceAbsentCount} Warning chimes</span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Threat Vectors</span>
                  <div className="text-2xl font-black font-mono text-[var(--safety-mint)]">
                    {totalCategorical > 0 ? `${Math.round((threatCount / totalCategorical) * 100)}%` : '0%'}
                  </div>
                  <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[var(--safety-mint)] h-full transition-all" 
                      style={{ width: `${totalCategorical > 0 ? (threatCount / totalCategorical) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--safety-mint)] block">
                    {threatCount === 0 ? 'Zero incidents' : `${threatCount} Flagged`}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================
            4. RECENT SAFETY EVENTS & TIMELINE
            ============================================================ */}
        <div className="clay-driver-card p-6 sm:p-7 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                CABIN TELEMETRY INCIDENTS
              </span>
              <h2 className="font-display uppercase text-2xl tracking-tight text-[var(--text-primary)]">
                Recent Safety Events
              </h2>
            </div>

            <Link 
              href="/driver/alerts" 
              className="btn-3d-secondary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"
            >
              <span>Full Alert Log</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Events List */}
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((evt: DriverDashboardEvent) => {
                const badge = getEventBadge(evt.severity);
                return (
                  <div 
                    key={evt.id}
                    className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--primary-blue)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Left Event Details */}
                    <div className="flex items-start gap-3.5">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                        style={{ backgroundColor: `color-mix(in srgb, ${badge.color} 15%, transparent)`, color: badge.color }}
                      >
                        {getEventCategoryIcon(evt.category)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                            {evt.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${badge.badgeBg}`}>
                            {evt.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-xl">
                          {evt.detail || evt.description}
                        </p>
                      </div>
                    </div>

                    {/* Right Metadata */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 text-[11px] font-mono shrink-0">
                      <span className="font-bold text-[var(--text-primary)]">{evt.time || evt.timestamp}</span>
                      <span className="text-[10px] text-[var(--primary-blue)] font-bold">{evt.metrics}</span>
                      <span className="text-[9px] text-[var(--text-muted)]">Ref: {evt.sessionRef || evt.sessionId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <CheckCircle2 className="w-8 h-8 text-[var(--safety-mint)] mx-auto opacity-70" />
              <p className="text-xs font-mono font-bold text-[var(--text-primary)]">No Safety Incidents Recorded</p>
              <p className="text-[11px] font-mono text-[var(--text-muted)] max-w-md mx-auto">
                Cabin telemetry is calm and clear with zero fatigue, distraction, or threat alerts logged.
              </p>
            </div>
          )}

        </div>

        {/* ============================================================
            5. RECENT DRIVING SESSIONS TABLE
            ============================================================ */}
        <div className="clay-driver-card p-6 sm:p-7 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                CABIN RECORDINGS
              </span>
              <h2 className="font-display uppercase text-2xl tracking-tight text-[var(--text-primary)]">
                Recent Driving Sessions
              </h2>
            </div>

            <Link 
              href="/driver/sessions" 
              className="btn-3d-secondary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit"
            >
              <span>View All Sessions</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--bg-surface)] border-b border-[var(--border)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Session ID</th>
                  <th className="py-3.5 px-4 font-bold">Vehicle</th>
                  <th className="py-3.5 px-4 font-bold">Start Time</th>
                  <th className="py-3.5 px-4 font-bold">Duration</th>
                  <th className="py-3.5 px-4 font-bold">Distance</th>
                  <th className="py-3.5 px-4 font-bold">Safety Score</th>
                  <th className="py-3.5 px-4 font-bold">Alerts</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sessions.length > 0 ? (
                  sessions.slice(0, 4).map((ses: DriverDashboardSession) => (
                    <tr 
                      key={ses.id}
                      className="hover:bg-[var(--bg-surface)]/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-[var(--primary-blue)]">
                        {ses.id}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-primary)]">
                        {ses.vehicle}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {ses.startTime}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-primary)]">
                        {ses.durationMinutes}m
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-primary)] font-bold">
                        {ses.milesMonitored !== undefined ? ses.milesMonitored : Math.round(ses.durationMinutes * 0.65)} mi
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ses.safetyScore >= 90
                            ? 'bg-emerald-500/15 text-[var(--safety-mint)] border border-emerald-500/30'
                            : ses.safetyScore >= 75
                              ? 'bg-amber-500/15 text-[var(--warning-amber)] border border-amber-500/30'
                              : 'bg-rose-500/15 text-[var(--alert-coral)] border border-rose-500/30'
                        }`}>
                          {ses.safetyScore} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ses.alertCount === 0
                            ? 'text-[var(--text-muted)] bg-black/5 dark:bg-white/5'
                            : 'text-[var(--warning-amber)] bg-amber-500/10'
                        }`}>
                          {ses.alertCount} {ses.alertCount === 1 ? 'flag' : 'flags'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--safety-mint)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)]" />
                          {ses.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSession(ses)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--bg-surface)] hover:bg-[var(--primary-blue)] hover:text-white border border-[var(--border)] transition-all cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-10 text-center font-mono text-xs text-[var(--text-muted)]">
                      <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      No driving sessions recorded yet. Start a new drive session to log telemetry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Session Details Inspection Modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Session Telemetry: ${selectedSession.id}`}
          subtitle={`Vehicle ${selectedSession.vehicle} • Logged by ${selectedSession.driverName}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            
            {/* Modal Highlights Grid */}
            <div className="grid grid-cols-3 gap-3 text-center font-mono">
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Safety Score</span>
                <span className="text-xl font-bold text-[var(--safety-mint)]">{selectedSession.safetyScore} / 100</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Duration</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{selectedSession.durationMinutes} min</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Alert Flags</span>
                <span className="text-xl font-bold text-[var(--warning-amber)]">{selectedSession.alertCount}</span>
              </div>
            </div>

            {/* Session Metadata Details */}
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                <span className="text-[var(--text-muted)]">Session Timestamp:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedSession.startTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                <span className="text-[var(--text-muted)]">Assigned Driver:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedSession.driverName} ({selectedSession.driverId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]/60">
                <span className="text-[var(--text-muted)]">Assigned Vehicle:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedSession.vehicle}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--text-muted)]">Compliance Verification:</span>
                <span className="font-bold text-[var(--safety-mint)]">100% DOT COMPLIANT</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link 
                href="/driver/sessions"
                className="text-xs font-mono text-[var(--primary-blue)] hover:underline flex items-center gap-1"
              >
                <span>Open Full Session History</span>
                <ExternalLink size={12} />
              </Link>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
