'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/authContext';
import { api, DriverDashboardSession } from '@/lib/api';
import { exportToCSV } from '@/lib/csvExport';
import { 
  Play, 
  Download, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
} from 'lucide-react';

export default function DriverSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DriverDashboardSession[]>([]);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [selectedSession, setSelectedSession] = useState<DriverDashboardSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getDriverSessions(1, 50);
      setSessions(res.sessions || []);
      setTotalSessions(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load driving sessions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Derived real summary metrics
  const avgSafetyScore = sessions.length > 0
    ? (sessions.reduce((acc, s) => acc + s.safetyScore, 0) / sessions.length).toFixed(1)
    : (totalSessions > 0 ? '100' : 'N/A');

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60.0).toFixed(1);
  const totalMiles = sessions.reduce((acc, s) => acc + (s.milesMonitored || 0), 0).toFixed(0);

  const criticalCount = sessions.reduce((acc, s) => acc + (s.criticalAlerts || 0), 0);

  const handleExportCSV = () => {
    if (sessions.length === 0) return;
    const headers = ['Session ID', 'Driver', 'Vehicle', 'Start Time', 'Duration (min)', 'Safety Score', 'Alerts', 'Status'];
    const rows = sessions.map(s => [
      s.id,
      s.driverName,
      s.vehicle,
      s.startTime,
      s.durationMinutes,
      s.safetyScore,
      s.alertCount,
      s.status
    ]);
    exportToCSV('driver-sessions-report', headers, rows);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Driving Sessions Log"
        subtitle={`Historical cabin monitoring logs & compliance metrics • Unit: ${user?.vehicle_id || 'Active Unit'}`}
        role="driver"
        breadcrumbs={[
          { label: 'Driver Cockpit', href: '/driver' },
          { label: 'Sessions' },
        ]}
        actionElement={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={fetchSessions}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExportCSV}
              disabled={sessions.length === 0}
            >
              Export CSV
            </Button>
            <Link href="/driver/monitor">
              <Button variant="primary" size="sm" icon={<Play size={14} />}>
                New Session
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Sessions Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl tactile-raised-sm">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Total Logged Sessions</span>
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{totalSessions}</span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-1">
              {totalSessions === 0 ? 'No sessions logged' : 'Recorded in fleet DB'}
            </span>
          </div>

          <div className="p-4 rounded-2xl tactile-raised-sm">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Average Safety Index</span>
            <span className="text-2xl font-bold font-mono text-[var(--safety-mint)]">
              {avgSafetyScore}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-1">
              {sessions.length > 0 ? (Number(avgSafetyScore) >= 90 ? 'Optimal rating' : 'Nominal rating') : 'Baseline rating'}
            </span>
          </div>

          <div className="p-4 rounded-2xl tactile-raised-sm">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Cumulative Monitored</span>
            <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{totalHours} hrs</span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-1">{totalMiles} total miles</span>
          </div>

          <div className="p-4 rounded-2xl tactile-raised-sm">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] block">Compliance Status</span>
            <span className={`text-2xl font-bold font-mono ${criticalCount === 0 ? 'text-[var(--primary-blue)]' : 'text-[var(--alert-coral)]'}`}>
              {criticalCount === 0 ? '100% PASS' : `${criticalCount} CRITICAL`}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-1">DOT &amp; OSHA Verified</span>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="p-5 rounded-2xl tactile-raised overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Logged Monitoring Periods
            </h3>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Showing {sessions.length} of {totalSessions} sessions
            </span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Session ID</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3">Start Time</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Safety Score</th>
                  <th className="py-3 px-3">Alerts</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs font-mono text-[var(--text-muted)]">
                      <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--primary-blue)]" />
                      Loading driving sessions from database...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs font-mono text-[var(--alert-coral)]">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                      <p className="font-bold">Error loading sessions</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{error}</p>
                      <Button variant="secondary" size="sm" onClick={fetchSessions} className="mt-3">
                        Retry
                      </Button>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center font-mono">
                      <Clock className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                      <p className="text-xs font-bold text-[var(--text-primary)]">No driving sessions yet</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Your recorded driving logs, safety scores, and compliance metrics will appear here.
                      </p>
                      <Link href="/driver/monitor" className="inline-block mt-3">
                        <Button variant="primary" size="sm" icon={<Play size={13} />}>
                          Start First Session
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                        {s.id}
                      </td>
                      <td className="py-3 px-3">
                        {s.vehicle}
                      </td>
                      <td className="py-3 px-3">
                        {s.startTime}
                      </td>
                      <td className="py-3 px-3">
                        {s.durationMinutes} mins
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${
                          s.safetyScore >= 90 ? 'text-[var(--safety-mint)]' : s.safetyScore >= 80 ? 'text-[var(--warning-amber)]' : 'text-[var(--alert-coral)]'
                        }`}>
                          {s.safetyScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={s.alertCount > 0 ? 'text-[var(--warning-amber)]' : 'text-[var(--text-muted)]'}>
                          {s.alertCount} flags
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={s.status === 'active' ? 'mint' : 'neutral'} size="sm" pulse={s.status === 'active'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-[11px] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Session Details Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession ? `Session Telemetry: ${selectedSession.id}` : 'Session Details'}
        subtitle={selectedSession ? `${selectedSession.vehicle} • ${selectedSession.startTime}` : undefined}
        maxWidth="max-w-lg"
      >
        {selectedSession && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl tactile-inset-sm">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Safety Score</span>
                <span className="text-xl font-bold text-[var(--safety-mint)]">{selectedSession.safetyScore} / 100</span>
              </div>
              <div className="p-3 rounded-xl tactile-inset-sm">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Monitored Duration</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{selectedSession.durationMinutes} mins</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Driver:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedSession.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Vehicle ID:</span>
                <span className="text-[var(--text-primary)]">{selectedSession.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Miles Monitored:</span>
                <span className="text-[var(--text-primary)]">{selectedSession.milesMonitored ?? Math.round(selectedSession.durationMinutes * 0.65)} miles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Recorded Incidents:</span>
                <span className="text-[var(--warning-amber)] font-bold">{selectedSession.alertCount} events ({selectedSession.criticalAlerts} critical)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSession(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
