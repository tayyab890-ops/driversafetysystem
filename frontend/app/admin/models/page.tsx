'use client';

import React from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockMonitoring } from '@/services/mockMonitoringService';
import { ModelStatus } from '@/types/safety';
import { Cpu, Zap, Activity, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminModelsPage() {
  const models = mockMonitoring.getModelStatuses();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="AI Computer Vision Model Registry"
        subtitle="Edge inference benchmarks, neural runtime & weights versioning"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'Model Status' },
        ]}
        actionElement={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => alert('Edge models synchronized with cloud weights registry.')}
          >
            Check Updates
          </Button>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Model Cluster Overview Strip */}
        <div className="p-5 rounded-2xl cockpit-panel bg-[var(--deep-navy)] text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Cpu size={16} className="text-[var(--primary-blue)]" />
              <span className="font-bold tracking-wider uppercase text-[var(--sensor-blue)]">
                EDGE INFERENCE ACCELERATOR
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-400">
              ALL PIPELINES OPTIMAL
            </span>
          </div>

          <h3 className="text-xl font-bold">
            Real-Time Vision Pipeline Performance
          </h3>

          <p className="text-xs text-slate-300 max-w-2xl font-mono leading-relaxed">
            All 3 AI vision models run concurrently on edge vehicle terminals using quantized TensorRT and ONNX runtime backends, achieving a combined inference budget of under 23ms per frame.
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {models.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl tactile-raised space-y-4 select-none relative overflow-hidden"
            >
              <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                    {m.id} • {m.category}
                  </span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                    {m.name}
                  </h4>
                </div>
                <Badge variant={m.status === 'optimal' ? 'mint' : 'amber'} size="sm">
                  {m.status}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl tactile-inset-sm">
                  <span className="text-[var(--text-muted)]">Inference Latency:</span>
                  <span className="font-bold text-[var(--primary-blue)]">{m.inferenceTimeMs} ms</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl tactile-inset-sm">
                  <span className="text-[var(--text-muted)]">Processing Rate:</span>
                  <span className="font-bold text-[var(--safety-mint)]">{m.fps.toFixed(1)} FPS</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl tactile-inset-sm">
                  <span className="text-[var(--text-muted)]">Avg Confidence:</span>
                  <span className="font-bold text-[var(--text-primary)]">{(m.confidenceAvg * 100).toFixed(0)}%</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl tactile-inset-sm">
                  <span className="text-[var(--text-muted)]">Runtime Backend:</span>
                  <span className="text-[var(--text-secondary)]">{m.version}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between border-t border-[var(--border)]">
                <span>Last Updated:</span>
                <span>{m.lastUpdate}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
