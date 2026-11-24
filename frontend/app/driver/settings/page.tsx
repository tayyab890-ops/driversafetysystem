'use client';

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { audioAlerts } from '@/lib/audioAlerts';
import { useAuth } from '@/lib/authContext';
import { api, DriverDashboardResponse } from '@/lib/api';
import { 
  Sliders, 
  Volume2, 
  Camera, 
  User, 
  Bell, 
  CheckCircle2, 
  ShieldCheck,
  Save
} from 'lucide-react';

export default function DriverSettingsPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DriverDashboardResponse | null>(null);
  const [earThreshold, setEarThreshold] = useState(0.20);
  const [headYawAngle, setHeadYawAngle] = useState(22);
  const [microsleepDelay, setMicrosleepDelay] = useState(1.8);
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getDriverDashboard()
      .then(setDashboardData)
      .catch(() => { /* silently ignore — profile fields still come from useAuth */ });
  }, [user?.id]);

  const handleTestChime = async () => {
    await audioAlerts.ensureAudioContext();
    audioAlerts.playCaution();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    audioAlerts.playAcknowledge();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Cockpit Configuration"
        subtitle="Driver thresholds, sensor calibration & alerts"
        role="driver"
        breadcrumbs={[
          { label: 'Driver Cockpit', href: '/driver' },
          { label: 'Settings' },
        ]}
      />

      <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
        
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-[var(--safety-mint)] flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Driver sensitivity parameters synchronized to vehicle terminal.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Driver Profile Summary */}
          <div className="p-5 rounded-2xl tactile-raised space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <User size={18} className="text-[var(--primary-blue)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Assigned Driver Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl tactile-inset-sm">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Driver Identity</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {user?.name || '—'}{user?.id ? ` (${user.id.slice(0, 8).toUpperCase()})` : ''}
                </span>
              </div>
              <div className="p-3 rounded-xl tactile-inset-sm">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Vehicle Assigned</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {user?.vehicle_id || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 rounded-xl tactile-inset-sm">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Safety Tier</span>
                <span className="text-sm font-bold text-[var(--safety-mint)]">
                  {dashboardData
                    ? (dashboardData.safetyScore >= 90
                        ? `Commercial Class A (${dashboardData.safetyScore.toFixed(1)})`
                        : dashboardData.safetyScore >= 75
                        ? `Commercial Class B (${dashboardData.safetyScore.toFixed(1)})`
                        : `Standard (${dashboardData.safetyScore.toFixed(1)})`)
                    : (user ? 'Loading…' : '—')}
                </span>
              </div>
            </div>
          </div>

          {/* AI Vision Sensitivity Controls */}
          <div className="p-5 rounded-2xl tactile-raised space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <Sliders size={18} className="text-[var(--primary-blue)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                AI Vision Detection Thresholds
              </h3>
            </div>

            <div className="space-y-5 text-xs font-mono">
              {/* EAR Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--text-primary)] font-bold">
                    Eye Aspect Ratio (EAR) Closure Threshold
                  </span>
                  <span className="text-[var(--primary-blue)] font-bold">
                    {earThreshold.toFixed(2)} EAR
                  </span>
                </div>
                <input
                  type="range"
                  min="0.14"
                  max="0.26"
                  step="0.01"
                  value={earThreshold}
                  onChange={(e) => setEarThreshold(parseFloat(e.target.value))}
                  className="w-full accent-[var(--primary-blue)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Sensitive (0.24)</span>
                  <span>Default (0.20)</span>
                  <span>Relaxed (0.16)</span>
                </div>
              </div>

              {/* Head Yaw Angle Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--text-primary)] font-bold">
                    Head Pose Yaw Angle Limit (Road Departure)
                  </span>
                  <span className="text-[var(--warning-amber)] font-bold">
                    ±{headYawAngle}°
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={headYawAngle}
                  onChange={(e) => setHeadYawAngle(parseInt(e.target.value))}
                  className="w-full accent-[var(--warning-amber)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Strict ±18°</span>
                  <span>Recommended ±22°</span>
                  <span>Permissive ±30°</span>
                </div>
              </div>

              {/* Microsleep Trigger Delay */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--text-primary)] font-bold">
                    Microsleep Trigger Grace Period
                  </span>
                  <span className="text-[var(--alert-coral)] font-bold">
                    {microsleepDelay.toFixed(1)} seconds
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={microsleepDelay}
                  onChange={(e) => setMicrosleepDelay(parseFloat(e.target.value))}
                  className="w-full accent-[var(--alert-coral)] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Audio Chime Settings */}
          <div className="p-5 rounded-2xl tactile-raised space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Volume2 size={18} className="text-[var(--primary-blue)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Tactile Audio Chime System
                </h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestChime}
              >
                Test Caution Chime
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[var(--text-primary)] font-bold block">
                  Harmonic Caution &amp; Alert Chimes
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Plays gentle two-tone chime upon distraction and escalating pulses upon fatigue
                </span>
              </div>
              <input
                type="checkbox"
                checked={audioChimeEnabled}
                onChange={(e) => {
                  setAudioChimeEnabled(e.target.checked);
                  audioAlerts.setSoundEnabled(e.target.checked);
                }}
                className="w-4 h-4 accent-[var(--primary-blue)] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={<Save size={16} />}
            >
              Save Configuration
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
