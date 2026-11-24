'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Sliders, 
  BellRing, 
  ShieldCheck, 
  Database, 
  Save, 
  CheckCircle2 
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState('https://dispatch.safefleet.com/api/v1/alerts');
  const [retentionDays, setRetentionDays] = useState(30);
  const [privacyBlur, setPrivacyBlur] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Fleet Operational Policies & Configuration"
        subtitle="Global alert routing, retention rules, and privacy compliance"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'System Settings' },
        ]}
      />

      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-[var(--safety-mint)] flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Fleet governance settings successfully updated across all nodes.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Dispatch Webhook Integration */}
          <div className="p-5 rounded-2xl tactile-raised space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <BellRing size={18} className="text-[var(--primary-blue)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Emergency Dispatch Webhook
              </h3>
            </div>

            <p className="text-xs font-mono text-[var(--text-secondary)]">
              Real-time HTTP POST destination for High and Critical urgency cabin incidents.
            </p>

            <Input
              label="Endpoint URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Retention & Privacy Compliance */}
          <div className="p-5 rounded-2xl tactile-raised space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <ShieldCheck size={18} className="text-[var(--safety-mint)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Driver Privacy &amp; Frame Retention Policy
              </h3>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-primary)] block">
                    Cabin Anonymization
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Automatically blur non-face cabin background regions in stored threat candidate snapshots.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyBlur}
                  onChange={(e) => setPrivacyBlur(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary-blue)] rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--text-primary)]">Telemetry Retention Window</span>
                  <span className="text-[var(--primary-blue)] font-bold">{retentionDays} Days</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="90"
                  step="1"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full accent-[var(--primary-blue)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>7 Days (Min)</span>
                  <span>30 Days (Standard)</span>
                  <span>90 Days (Audit Log)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Save size={16} />}
            >
              Update Fleet Governance
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
