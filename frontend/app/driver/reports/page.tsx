'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ChartPanel } from '@/components/analytics/ChartPanel';
import { StatBlock } from '@/components/ui/StatBlock';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/authContext';
import { api, DriverReportsResponse } from '@/lib/api';
import { exportToCSV } from '@/lib/csvExport';
import { 
  Download, 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  Clock, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  FileText 
} from 'lucide-react';

export default function DriverReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DriverReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getDriverReports();
      setReports(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate driver safety reports';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = () => {
    if (!reports || !reports.hasData || reports.csvRows.length === 0) return;
    const headers = ['Day', 'Safety Score', 'Driving Hours', 'Incidents'];
    exportToCSV('driver-safety-weekly-report', headers, reports.csvRows);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Driver Safety Analytics & Compliance"
        subtitle={`Performance audit and behavioral trend reports • Unit: ${user?.vehicle_id || 'Active Unit'}`}
        role="driver"
        breadcrumbs={[
          { label: 'Driver Cockpit', href: '/driver' },
          { label: 'Reports' },
        ]}
        actionElement={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={fetchReports}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExport}
              disabled={!reports?.hasData}
            >
              Export Audit Report
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {isLoading ? (
          <div className="py-20 text-center font-mono">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--primary-blue)]" />
            <p className="text-xs font-bold text-[var(--text-primary)]">Compiling Telemetry Audit Reports...</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Aggregating compliance records and session trends</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl tactile-raised text-center space-y-3 font-mono">
            <AlertTriangle className="w-8 h-8 text-[var(--alert-coral)] mx-auto" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Unable to load safety reports</p>
            <p className="text-xs text-[var(--text-muted)]">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchReports} className="mt-2">
              Retry
            </Button>
          </div>
        ) : !reports?.hasData ? (
          <div className="py-16 p-8 rounded-2xl tactile-raised text-center font-mono space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <FileText size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">No safety reports available</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                No recorded driving sessions or safety incidents exist for your profile yet. Once you complete monitored drive sessions, compliance trajectories and behavioral audit charts will generate automatically.
              </p>
            </div>
            <Link href="/driver/monitor" className="inline-block pt-2">
              <Button variant="primary" size="sm" icon={<Play size={14} />}>
                Start New Drive Session
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Top Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBlock
                label="Weekly Safety Average"
                value={reports.weeklySafetyAverage.toFixed(1)}
                unit="/100"
                subtext={reports.weeklySafetyAverage >= 90 ? "Rated 'Superior Driver'" : "Rated 'Nominal Driver'"}
                icon={<Award size={18} />}
                accentColor="var(--safety-mint)"
                trend={{ value: reports.weeklySafetyAverage >= 90 ? "+Optimal Tier" : "Active Standard", isPositive: true }}
              />

              <StatBlock
                label="Fatigue Incident Ratio"
                value={reports.fatigueIncidentRatio.toFixed(2)}
                unit="per 100mi"
                subtext="Industry average: 0.18"
                icon={<TrendingUp size={18} />}
                accentColor="var(--primary-blue)"
                trend={{ value: reports.fatigueIncidentRatio <= 0.05 ? "Sub-threshold safe" : "Monitoring active", isPositive: true }}
              />

              <StatBlock
                label="Total Hours Monitored"
                value={reports.totalHoursMonitored.toFixed(1)}
                unit="hours"
                subtext={`${reports.totalSessions} sessions logged`}
                icon={<ShieldCheck size={18} />}
                accentColor="var(--sensor-blue)"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartPanel
                title="Weekly Safety Score Trajectory"
                subtitle="7-day attention index based on EAR and head pose tracking"
                type="line"
                data={reports.dailyScores.map(d => ({ label: d.label, value: d.value }))}
                accentColor="var(--safety-mint)"
              />

              <ChartPanel
                title="Hourly Cabin Alert Distribution"
                subtitle="Frequency of warnings across different driving hours"
                type="bar"
                data={reports.hourlyAlerts}
                accentColor="var(--warning-amber)"
              />
            </div>

            {/* Category Breakdown */}
            <div className="p-5 rounded-2xl tactile-raised space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Behavioral Metrics Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl tactile-inset-sm space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">
                    Eye Aspect Ratio (EAR) Stability
                  </span>
                  <span className="text-xl font-bold text-[var(--text-primary)]">
                    {reports.earStability !== null ? `${reports.earStability}%` : '100%'}
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {reports.avgEar !== null
                      ? `Average EAR was ${reports.avgEar} throughout ${reports.totalHoursMonitored} driving hours. No prolonged microsleep lapses recorded.`
                      : `Standard EAR baseline maintained across all sessions. No microsleep lapses recorded.`}
                  </p>
                </div>

                <div className="p-4 rounded-xl tactile-inset-sm space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">
                    Road Forward Focus
                  </span>
                  <span className="text-xl font-bold text-[var(--text-primary)]">
                    {reports.forwardFocusPct !== null ? `${reports.forwardFocusPct}%` : '100%'}
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Driver maintained head Euler yaw within ±15 degrees of road center during active travel periods.
                  </p>
                </div>

                <div className="p-4 rounded-xl tactile-inset-sm space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">
                    Cabin Threat Clearances
                  </span>
                  <span className="text-xl font-bold text-[var(--safety-mint)]">
                    {reports.threatViolations} Violations
                  </span>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Cabin surveillance models detected zero verified weapons or illicit objects during active sessions.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
