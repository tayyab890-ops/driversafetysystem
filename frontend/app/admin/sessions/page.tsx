'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { DrivingSession } from '@/types/safety';
import { exportToCSV } from '@/lib/csvExport';
import { 
  Radio, 
  Search, 
  Download, 
  Eye, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  User,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<DrivingSession | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminSessions();
      setSessions((data.sessions || []) as unknown as DrivingSession[]);
    } catch (err: any) {
      console.error('Failed to load fleet sessions:', err);
      setError(err?.message || 'Failed to retrieve sessions from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filteredSessions = sessions.filter(s => 
    (s.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = sessions.filter(s => s.status === 'active').length;

  const handleExport = () => {
    const headers = ['Session ID', 'Driver Name', 'Vehicle', 'Start Time', 'Duration (min)', 'Safety Score', 'Status'];
    const rows = filteredSessions.map(s => [s.id, s.driverName, s.vehicle, s.startTime, s.durationMinutes, s.safetyScore, s.status]);
    exportToCSV('fleet-active-sessions', headers, rows);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Live Fleet Telemetry Monitoring"
        subtitle="Real-time in-transit cabin surveillance streams"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'Live Monitoring' },
        ]}
        actionElement={
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExport}
            disabled={filteredSessions.length === 0}
          >
            Export Stream Log
          </Button>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Search & Status Bar */}
        <div className="p-4 rounded-2xl tactile-raised flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search driver, vehicle ID, or session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{activeCount} Active {activeCount === 1 ? 'Feed' : 'Feeds'}</span>
            </span>
            <span>•</span>
            <span>0 Packet Loss</span>
            <button
              onClick={fetchSessions}
              disabled={loading}
              title="Refresh Feeds"
              className="p-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer ml-1"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-mono text-[var(--alert-coral)]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchSessions}>
              Retry
            </Button>
          </div>
        )}

        {/* Sessions Content */}
        {loading ? (
          <div className="p-16 rounded-2xl tactile-raised text-center space-y-3 font-mono text-xs text-[var(--text-muted)]">
            <RefreshCw size={24} className="animate-spin mx-auto text-[var(--primary-blue)]" />
            <p>Syncing active fleet cabin telemetry streams...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 rounded-2xl tactile-inset text-center space-y-3 font-mono">
            <Radio className="mx-auto h-10 w-10 text-[var(--text-muted)] opacity-50" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {searchTerm ? 'No Sessions Matching Search' : 'No Active Fleet Sessions in Transit'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              {searchTerm 
                ? 'Try clearing the search query to view all historical and live fleet runs.' 
                : 'Commercial driver monitoring feeds will automatically stream here when operators begin a driving shift.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl tactile-raised space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                      {s.id} • {s.vehicle}
                    </span>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                      {s.driverName}
                    </h4>
                  </div>
                  <Badge variant={s.status === 'active' ? 'mint' : 'neutral'} size="sm" pulse={s.status === 'active'}>
                    {s.status}
                  </Badge>
                </div>

                {/* Cockpit Stream Miniature Preview */}
                <div className="h-28 rounded-xl bg-slate-950 border border-[var(--border)] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-2 border border-white/20 pointer-events-none" />
                  <div className="text-center font-mono text-white/70 space-y-1">
                    <div className="text-[10px] tracking-widest text-[var(--safety-mint)] flex items-center justify-center gap-1">
                      <Radio size={10} className={s.status === 'active' ? 'animate-pulse' : ''} /> {s.status === 'active' ? 'LIVE TELEMETRY' : 'ARCHIVED RUN'}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {s.safetyScore} <span className="text-xs text-white/50">/ 100</span>
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-2 text-[8px] font-mono text-white/40">30 FPS</span>
                </div>

                {/* Metrics strip */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-xs font-mono text-center">
                  <div className="p-1.5 rounded bg-[var(--bg-secondary)]">
                    <span className="text-[9px] text-[var(--text-muted)] block">DURATION</span>
                    <span className="font-bold text-[var(--text-primary)]">{s.durationMinutes}m</span>
                  </div>
                  <div className="p-1.5 rounded bg-[var(--bg-secondary)]">
                    <span className="text-[9px] text-[var(--text-muted)] block">INCIDENTS</span>
                    <span className={`font-bold ${s.alertCount > 0 ? 'text-[var(--warning-amber)]' : 'text-[var(--text-primary)]'}`}>
                      {s.alertCount}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-[var(--bg-secondary)]">
                    <span className="text-[9px] text-[var(--text-muted)] block">THREATS</span>
                    <span className={`font-bold ${s.criticalAlerts > 0 ? 'text-[var(--alert-coral)]' : 'text-[var(--safety-mint)]'}`}>
                      {s.criticalAlerts}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-mono"
                    onClick={() => setSelectedSession(s)}
                  >
                    Open Cabin Diagnostic
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession ? `Cabin Stream: ${selectedSession.driverName}` : 'Session'}
        subtitle={selectedSession ? `${selectedSession.vehicle} • ID: ${selectedSession.id}` : undefined}
      >
        {selectedSession && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 text-white space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Real-time Safety Index:</span>
                <span className="text-xl font-bold text-[var(--safety-mint)]">{selectedSession.safetyScore} / 100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Estimated Distance:</span>
                <span className="text-white">{selectedSession.milesMonitored || 0} miles</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Duration Monitored:</span>
                <span className="text-white">{selectedSession.durationMinutes} minutes</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Connection Gateway:</span>
                <span className="text-emerald-400">WebSocket Secure (WSS) 1080p</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSession(null)}
              >
                Close Stream
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}