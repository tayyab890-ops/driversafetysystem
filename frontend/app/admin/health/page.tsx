'use client';

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StatBlock } from '@/components/ui/StatBlock';
import { Badge } from '@/components/ui/Badge';
import { mockMonitoring } from '@/services/mockMonitoringService';
import { 
  HeartPulse, 
  Activity, 
  Server, 
  Database, 
  Radio, 
  Cpu, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export default function AdminHealthPage() {
  const health = mockMonitoring.getSystemHealth();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Fleet Infrastructure & Health Diagnostics"
        subtitle="Gateway latency, container nodes, and sensor WebSocket connections"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'System Health' },
        ]}
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Core Connectivity Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl tactile-raised-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server size={20} className="text-[var(--primary-blue)]" />
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">API REST Gateway</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">FastAPI Telemetry Hub</span>
              </div>
            </div>
            <Badge variant="mint" size="sm">
              {health.apiStatus}
            </Badge>
          </div>

          <div className="p-4 rounded-2xl tactile-raised-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio size={20} className="text-emerald-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">WebSocket Hub</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">WSS Stream Ingest</span>
              </div>
            </div>
            <Badge variant="mint" size="sm">
              {health.wsStatus}
            </Badge>
          </div>

          <div className="p-4 rounded-2xl tactile-raised-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-[var(--sensor-blue)]" />
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Telemetry Database</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">TimescaleDB Cluster</span>
              </div>
            </div>
            <Badge variant="mint" size="sm">
              {health.dbStatus}
            </Badge>
          </div>
        </div>

        {/* Diagnostics Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBlock
            label="Cluster CPU Load"
            value={`${health.cpuUsagePct}%`}
            subtext="8 vCPU Node Pool"
            icon={<Cpu size={18} />}
            accentColor="var(--primary-blue)"
          />

          <StatBlock
            label="Memory Allocation"
            value={`${health.memoryUsagePct}%`}
            subtext="12.4 GB / 32 GB utilized"
            icon={<Activity size={18} />}
            accentColor="var(--safety-mint)"
          />

          <StatBlock
            label="Network Roundtrip"
            value={`${health.avgLatencyMs}`}
            unit="ms"
            subtext="P99: 22ms via TLS 1.3"
            icon={<Activity size={18} />}
            accentColor="var(--sensor-blue)"
          />

          <StatBlock
            label="Continuous Uptime"
            value={`${health.uptimeHours}`}
            unit="hrs"
            subtext="Zero unscheduled reboots"
            icon={<Clock size={18} />}
            accentColor="var(--warning-amber)"
          />
        </div>

        {/* Node Specifications */}
        <div className="p-5 rounded-2xl tactile-raised space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Active Edge Gateway Clusters
          </h3>

          <div className="divide-y divide-[var(--border)] text-xs font-mono">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)]">Region: US-East Edge Gateway (Node #01)</span>
                <span className="text-[10px] text-[var(--text-muted)] block">Handles 18 live commercial trucks</span>
              </div>
              <span className="text-[var(--safety-mint)] font-bold">99.98% SLA</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-[var(--text-primary)]">Region: US-Central Edge Gateway (Node #02)</span>
                <span className="text-[10px] text-[var(--text-muted)] block">Standby redundant failover node</span>
              </div>
              <span className="text-[var(--text-secondary)]">Ready (Cold Standby)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
