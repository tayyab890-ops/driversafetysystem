'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ChartPanel } from '@/components/analytics/ChartPanel';
import { StatBlock } from '@/components/ui/StatBlock';
import { Button } from '@/components/ui/Button';
import { api, AdminAnalyticsResponse } from '@/lib/api';
import { exportToCSV } from '@/lib/csvExport';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminAnalytics(timeRange);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load fleet analytics:', err);
      setError(err?.message || 'Failed to calculate analytics from database');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = () => {
    if (!analytics) return;
    const headers = ['Category / Metric', 'Events / Value', 'Share / Rate'];
    const rows = analytics.csvRows && analytics.csvRows.length > 0 
      ? analytics.csvRows 
      : [
          ['Fleet Attention Index', `${analytics.fleetAttentionIndex}/100`, 'Target >= 85'],
          ['Total Monitored Hours', `${analytics.totalHoursMonitored} hrs`, 'Commercial Runs'],
          ['Critical Severity Ratio', `${analytics.criticalSeverityRatio}%`, 'Urgent Triage'],
          ['Threat Clearances', `${analytics.threatClearances}`, 'Dispatcher Verified'],
        ];
    exportToCSV(`fleet-safety-analytics-${timeRange}`, headers, rows);
  };

  const fleetScoreTrend = analytics?.fleetScoreTrend || [];
  const categoryDistribution = analytics?.categoryDistribution || [];
  const hourlyViolationCurve = analytics?.hourlyViolationCurve || [];

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Fleet Safety Analytics & Behavior Modeling"
        subtitle="Aggregated risk factors across registered commercial units"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'Analytics' },
        ]}
        actionElement={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl tactile-inset-sm">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg cursor-pointer ${
                  timeRange === '7d' ? 'bg-[var(--bg-surface)] text-[var(--primary-blue)] font-bold' : 'text-[var(--text-secondary)]'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg cursor-pointer ${
                  timeRange === '30d' ? 'bg-[var(--bg-surface)] text-[var(--primary-blue)] font-bold' : 'text-[var(--text-secondary)]'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg cursor-pointer ${
                  timeRange === '90d' ? 'bg-[var(--bg-surface)] text-[var(--primary-blue)] font-bold' : 'text-[var(--text-secondary)]'
                }`}
              >
                90 Days
              </button>
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh Analytics"
              className="p-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExport}
              disabled={loading || !analytics}
            >
              Export
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-mono text-[var(--alert-coral)]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchAnalytics}>
              Retry
            </Button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatBlock
            label="Fleet Safety Index"
            value={analytics ? `${analytics.fleetAttentionIndex}` : '--'}
            unit="/100"
            subtext="Calculated attention rating"
            icon={<ShieldCheck size={18} />}
            accentColor="var(--safety-mint)"
            trend={{ value: "Real-time DB aggregate", isPositive: true }}
          />

          <StatBlock
            label="Total Monitored Time"
            value={analytics ? `${analytics.totalHoursMonitored}` : '--'}
            unit="hrs"
            subtext="In-transit active runs"
            icon={<TrendingUp size={18} />}
            accentColor="var(--primary-blue)"
          />

          <StatBlock
            label="Critical Urgency Ratio"
            value={analytics ? `${analytics.criticalSeverityRatio}%` : '--'}
            subtext="Share of critical incidents"
            icon={<BarChart3 size={18} />}
            accentColor="var(--sensor-blue)"
          />

          <StatBlock
            label="Verified Threat Clearances"
            value={analytics ? `${analytics.threatClearances}` : '--'}
            unit="events"
            subtext="Neural candidate clearances"
            icon={<AlertTriangle size={18} />}
            accentColor="var(--warning-amber)"
          />
        </div>

        {/* 2 Primary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPanel
            title="Fleet Average Safety Rating Trend"
            subtitle={`Weighted score tracking road attention and cabin alertness (${timeRange})`}
            type="line"
            data={fleetScoreTrend}
            accentColor="var(--primary-blue)"
          />

          <ChartPanel
            title="Incident Breakdown By Category"
            subtitle="Total occurrences logged across active fleet units"
            type="bar"
            data={categoryDistribution}
            accentColor="var(--warning-amber)"
          />
        </div>

        {/* Hourly Peak Time Violation Curve */}
        <div className="p-5 rounded-2xl tactile-raised space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Circadian &amp; Hourly Fatigue Distribution
              </h3>
              <p className="text-xs font-mono text-[var(--text-secondary)]">
                Aggregated hourly violation frequency based on recorded fleet incidents
              </p>
            </div>
          </div>

          <ChartPanel
            title="Hourly Cabin Incident Frequency"
            subtitle="Normalized 24-hour cycle"
            type="line"
            data={hourlyViolationCurve}
            accentColor="var(--alert-coral)"
          />
        </div>

      </div>
    </div>
  );
}