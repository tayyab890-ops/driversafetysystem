'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api, DriverDashboardEvent } from '@/lib/api';
import { exportToCSV } from '@/lib/csvExport';
import { audioAlerts } from '@/lib/audioAlerts';
import { 
  Search, 
  Download, 
  CheckCircle, 
  Eye, 
  Compass, 
  ShieldAlert, 
  UserX,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function DriverAlertsPage() {
  const [alerts, setAlerts] = useState<DriverDashboardEvent[]>([]);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [inspectAlert, setInspectAlert] = useState<DriverDashboardEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getDriverEvents(1, 100, selectedCategory, selectedSeverity);
      setAlerts(res.events || []);
      setTotalAlerts(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load safety alerts';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedSeverity]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Client-side text search filter
  const filteredAlerts = alerts.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !term ||
      (a.title && a.title.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term)) ||
      (a.id && a.id.toLowerCase().includes(term));
    return matchesSearch;
  });

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      audioAlerts.playAcknowledge();
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      if (inspectAlert?.id === id) {
        setInspectAlert(prev => prev ? { ...prev, acknowledged: true } : null);
      }
    } catch (err: unknown) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleExportCSV = () => {
    if (filteredAlerts.length === 0) return;
    const headers = ['Alert ID', 'Category', 'Severity', 'Title', 'Description', 'Timestamp', 'Confidence', 'Acknowledged'];
    const rows = filteredAlerts.map(a => [
      a.id,
      a.category,
      a.severity,
      a.title,
      a.description,
      a.timestamp || a.time,
      a.confidence,
      a.acknowledged
    ]);
    exportToCSV('driver-alerts-history', headers, rows);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drowsiness':
        return <Eye size={14} className="text-[var(--primary-blue)]" />;
      case 'distraction':
        return <Compass size={14} className="text-[var(--warning-amber)]" />;
      case 'weapon':
        return <ShieldAlert size={14} className="text-[var(--alert-coral)]" />;
      case 'face_absent':
        return <UserX size={14} className="text-[var(--text-muted)]" />;
      default:
        return <AlertCircle size={14} className="text-[var(--text-secondary)]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Cabin Alert History"
        subtitle="Chronological log of AI vision safety events"
        role="driver"
        breadcrumbs={[
          { label: 'Driver Cockpit', href: '/driver' },
          { label: 'Alert History' },
        ]}
        actionElement={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={fetchAlerts}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExportCSV}
              disabled={filteredAlerts.length === 0}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Search & Filter Controls */}
        <div className="p-4 rounded-2xl tactile-raised space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <Input
                placeholder="Search alert by keyword or ID (e.g. ALT-1092)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl py-2.5 px-3 text-xs font-mono tactile-inset text-[var(--text-primary)] outline-none border border-[var(--border)] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="drowsiness">Drowsiness</option>
                <option value="distraction">Distraction</option>
                <option value="weapon">Weapon Candidate</option>
                <option value="face_absent">Face Absent / Obscured</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full rounded-xl py-2.5 px-3 text-xs font-mono tactile-inset text-[var(--text-primary)] outline-none border border-[var(--border)] cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="p-5 rounded-2xl tactile-raised overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Recorded Alerts ({filteredAlerts.length} of {totalAlerts})
            </span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Event ID</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Alert Title</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">AI Confidence</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs font-mono text-[var(--text-muted)]">
                      <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--primary-blue)]" />
                      Loading cabin alerts from database...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs font-mono text-[var(--alert-coral)]">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                      <p className="font-bold">Error loading alerts</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{error}</p>
                      <Button variant="secondary" size="sm" onClick={fetchAlerts} className="mt-3">
                        Retry
                      </Button>
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center font-mono">
                      <CheckCircle className="w-8 h-8 mx-auto mb-3 text-[var(--safety-mint)] opacity-70" />
                      <p className="text-xs font-bold text-[var(--text-primary)]">No alerts recorded</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        All cabin vision sensors report clear status with zero fatigue or distraction alerts.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                        {a.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 capitalize">
                          {getCategoryIcon(a.category)}
                          <span>{a.category.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                        {a.title}
                      </td>
                      <td className="py-3 px-3">
                        <Badge severity={a.severity as any} size="sm">
                          {a.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {a.time || a.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        {((a.confidence ?? 0.9) * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                          a.acknowledged 
                            ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]' 
                            : 'bg-rose-500/15 text-[var(--alert-coral)] border-rose-500/30 font-bold'
                        }`}>
                          {a.acknowledged ? 'Resolved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {!a.acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2 py-1 rounded bg-[var(--deep-navy)] hover:bg-[var(--primary-blue)] text-white text-[10px] cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => setInspectAlert(a)}
                          className="px-2 py-1 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-[10px] cursor-pointer"
                        >
                          Details
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

      {/* Alert Details Modal */}
      <Modal
        isOpen={!!inspectAlert}
        onClose={() => setInspectAlert(null)}
        title={inspectAlert ? `${inspectAlert.id}: ${inspectAlert.title}` : 'Alert Inspector'}
        subtitle={inspectAlert ? `Recorded at ${inspectAlert.time || inspectAlert.timestamp} • Category: ${inspectAlert.category}` : undefined}
        maxWidth="max-w-md"
      >
        {inspectAlert && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Severity:</span>
                <Badge severity={inspectAlert.severity as any} size="sm">{inspectAlert.severity}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">AI Model Confidence:</span>
                <span className="font-bold text-[var(--text-primary)]">{((inspectAlert.confidence ?? 0.9) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Driver Assigned:</span>
                <span className="text-[var(--text-primary)]">{inspectAlert.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Session Link:</span>
                <span className="text-[var(--primary-blue)]">{inspectAlert.sessionId || inspectAlert.sessionRef}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">
                Telemetry Log Detail:
              </span>
              <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border)]">
                {inspectAlert.description || inspectAlert.detail}
              </p>
            </div>

            {inspectAlert.metadata && (
              <div className="p-3 rounded-xl border border-dashed border-[var(--border)] text-[11px] space-y-1">
                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Sensor Metadata:</span>
                {inspectAlert.metadata.ear !== undefined && <div>EAR Index: <span className="text-[var(--primary-blue)] font-bold">{inspectAlert.metadata.ear}</span></div>}
                {inspectAlert.metadata.yaw !== undefined && <div>Head Yaw: <span className="text-[var(--warning-amber)] font-bold">{inspectAlert.metadata.yaw}°</span></div>}
                {inspectAlert.metadata.pitch !== undefined && <div>Pitch: <span className="text-[var(--warning-amber)] font-bold">{inspectAlert.metadata.pitch}°</span></div>}
                {inspectAlert.metadata.objectClass && <div>Object Candidate: <span className="text-[var(--alert-coral)] font-bold">{inspectAlert.metadata.objectClass}</span></div>}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {!inspectAlert.acknowledged ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAcknowledge(inspectAlert.id)}
                >
                  Mark Acknowledged
                </Button>
              ) : (
                <span className="text-[11px] text-[var(--safety-mint)] font-bold flex items-center gap-1">
                  <CheckCircle size={14} /> Acknowledged &amp; Logged
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectAlert(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
