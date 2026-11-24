'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { SafetyAlert } from '@/types/safety';
import { exportToCSV } from '@/lib/csvExport';
import { 
  AlertOctagon, 
  Search, 
  Download, 
  Filter, 
  Eye, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  UserX,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [inspectAlert, setInspectAlert] = useState<SafetyAlert | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cat = categoryFilter === 'all' ? undefined : categoryFilter;
      const sev = severityFilter === 'all' ? undefined : severityFilter;
      const data = await api.getAdminAlerts(1, 100, cat, sev);
      setAlerts((data.alerts || []) as unknown as SafetyAlert[]);
    } catch (err: any) {
      console.error('Failed to load fleet alerts:', err);
      setError(err?.message || 'Failed to load safety alerts from database');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = 
      (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleResolve = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      if (inspectAlert?.id === id) {
        setInspectAlert(prev => prev ? { ...prev, acknowledged: true } : null);
      }
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
      alert(err?.message || 'Failed to acknowledge alert');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Category', 'Severity', 'Title', 'Driver', 'Time', 'Confidence', 'Resolved'];
    const rows = filteredAlerts.map(a => [
      a.id,
      a.category,
      a.severity,
      a.title,
      a.driverName,
      a.timestamp,
      a.confidence,
      a.acknowledged ? 'Yes' : 'No'
    ]);
    exportToCSV('fleet-operations-alerts-log', headers, rows);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Incident Operations & Dispatch Audit"
        subtitle="Real-time multi-driver safety alarm triage"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'Alerts' },
        ]}
        actionElement={
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExportCSV}
            disabled={filteredAlerts.length === 0}
          >
            Export Audit Log
          </Button>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Threat Verification Disclaimer Banner per Master Prompt */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs font-mono text-[var(--warning-amber)]">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[var(--text-primary)]">
              MANDATORY DISPATCH PROTOCOL: AI OBJECT VERIFICATION
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              In-cabin weapon and contraband candidate frames are tagged by neural models as unconfirmed silhouettes. Dispatchers must manually inspect bounding boxes before issuing law enforcement or fleet escalation.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl tactile-raised grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Input
              placeholder="Search by driver, alert ID, or incident..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl py-2.5 px-3 text-xs font-mono tactile-inset text-[var(--text-primary)] outline-none border border-[var(--border)] cursor-pointer"
            >
              <option value="all">All Incident Categories</option>
              <option value="drowsiness">Drowsiness / Fatigue</option>
              <option value="distraction">Distraction / Head Turn</option>
              <option value="weapon">Weapon Candidate</option>
              <option value="face_absent">Face Absent / Obscured</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-xl py-2.5 px-3 text-xs font-mono tactile-inset text-[var(--text-primary)] outline-none border border-[var(--border)] cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            <button
              onClick={fetchAlerts}
              disabled={loading}
              title="Refresh Alerts"
              className="p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer w-full flex items-center justify-center"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
            <Button variant="secondary" size="sm" onClick={fetchAlerts}>
              Retry
            </Button>
          </div>
        )}

        {/* Alert Table */}
        <div className="p-5 rounded-2xl tactile-raised overflow-hidden">
          {loading ? (
            <div className="py-16 text-center space-y-3 font-mono text-xs text-[var(--text-muted)]">
              <RefreshCw size={24} className="animate-spin mx-auto text-[var(--primary-blue)]" />
              <p>Auditing fleet safety events from database...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-16 text-center space-y-3 font-mono">
              <CheckCircle2 size={32} className="mx-auto text-[var(--safety-mint)] opacity-80" />
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {searchTerm || categoryFilter !== 'all' || severityFilter !== 'all' 
                  ? 'No Alerts Matching Filters' 
                  : 'Zero Safety Alerts Recorded'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                {searchTerm || categoryFilter !== 'all' || severityFilter !== 'all'
                  ? 'Try clearing the filters or search query to view all historical incident records.'
                  : 'All fleet drivers are currently operating safely without flagged distraction or fatigue violations.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Alert ID</th>
                    <th className="py-3 px-3">Driver Unit</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Incident Title</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Resolution</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                  {filteredAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                        {a.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                        {a.driverName}
                      </td>
                      <td className="py-3 px-3 capitalize">
                        {(a.category || '').replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-medium text-[var(--text-primary)]">
                        {a.title}
                      </td>
                      <td className="py-3 px-3">
                        <Badge severity={a.severity} size="sm">
                          {a.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {a.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                          a.acknowledged ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)]' : 'bg-rose-500/15 text-[var(--alert-coral)] font-bold'
                        }`}>
                          {a.acknowledged ? 'Resolved' : 'Triage Required'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {!a.acknowledged && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="px-2 py-1 rounded bg-[var(--primary-blue)] text-white text-[10px] hover:opacity-90 cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => setInspectAlert(a)}
                          className="px-2 py-1 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-[10px] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal with Verification Action */}
      <Modal
        isOpen={!!inspectAlert}
        onClose={() => setInspectAlert(null)}
        title={inspectAlert ? `Dispatch Triage: ${inspectAlert.id}` : 'Alert'}
        subtitle={inspectAlert ? `${inspectAlert.driverName} • ${inspectAlert.timestamp}` : undefined}
        maxWidth="max-w-md"
      >
        {inspectAlert && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Incident Category:</span>
                <span className="font-bold text-[var(--text-primary)] capitalize">{(inspectAlert.category || '').replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Urgency Rating:</span>
                <Badge severity={inspectAlert.severity} size="sm">{inspectAlert.severity}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Driver / Unit:</span>
                <span className="text-[var(--text-primary)]">{inspectAlert.driverName} ({inspectAlert.driverId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Model Confidence:</span>
                <span className="font-bold text-[var(--primary-blue)]">{((inspectAlert.confidence || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">Incident Telemetry:</span>
              <p className="text-xs text-[var(--text-primary)]">
                {inspectAlert.description}
              </p>
            </div>

            {inspectAlert.category === 'weapon' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-[var(--alert-coral)] space-y-1">
                <div className="font-bold uppercase">Human Verification Step:</div>
                <p>Verify whether detected frame silhouette is an actual firearm candidate or a harmless cabin accessory.</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {!inspectAlert.acknowledged ? (
                <div className="flex gap-2">
                  <Button
                    variant="mint"
                    size="sm"
                    onClick={() => handleResolve(inspectAlert.id)}
                  >
                    Clear / Verified Safe
                  </Button>
                  <Button
                    variant="coral"
                    size="sm"
                    onClick={() => handleResolve(inspectAlert.id)}
                  >
                    Escalate Incident
                  </Button>
                </div>
              ) : (
                <span className="text-[var(--safety-mint)] font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Logged &amp; Resolved
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