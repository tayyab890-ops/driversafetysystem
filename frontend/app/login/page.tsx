'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/authContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  ShieldAlert, 
  ArrowRight,
  Shield,
  CheckCircle2,
  Zap,
  Radio,
  Eye as EyeIcon,
  Compass,
  Cpu,
  Sparkles,
  Car
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [role, setRole] = useState<'driver' | 'admin'>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // If already logged in, redirect to the respective dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/driver');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your registered fleet email address.');
      return;
    }
    if (!password) {
      setError('Access password is required.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password, role);
      setLoading(false);
      if (loggedUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/driver');
      }
    } catch (err: unknown) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : 'Authentication failed';
      if (
        errMsg.includes('Unable to connect') ||
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('connection refused')
      ) {
        setError('Unable to connect to the DriveGuard AI authentication server. Please verify the FastAPI backend is running.');
      } else {
        setError(errMsg);
      }
    }
  };

  // 1-Click Demo Login Helpers
  const handleQuickDemo = (selectedRole: 'driver' | 'admin') => {
    setRole(selectedRole);
    if (selectedRole === 'driver') {
      setEmail('alex.mercer@safefleet.com');
      setPassword('DriveGuard2026!');
    } else {
      setEmail('ops.admin@driveguard.ai');
      setPassword('FleetOpsAdmin2026!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-main)] text-[var(--text-primary)] select-none">
      
      {/* ============================================================
          LEFT SECTION — AUTOMOTIVE BRANDING & AI SAFETY TELEMETRY
          ============================================================ */}
      <div 
        className="w-full lg:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border)]"
        style={{
          background: 'radial-gradient(ellipse 100% 90% at 50% 100%, #203440 0%, #121e28 55%, #0c151c 100%)'
        }}
      >
        {/* Ambient lighting glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(53,120,198,0.22) 0%, transparent 70%)', filter: 'blur(75px)' }} />
        <div className="absolute bottom-10 right-10 w-[450px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(67,182,154,0.18) 0%, transparent 70%)', filter: 'blur(70px)' }} />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Top Navbar Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-white/70 bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--safety-mint)] animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Middle Feature Section */}
        <div className="relative z-10 my-8 sm:my-10 space-y-6">
          
          {/* Eyebrow badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[11px] font-mono font-bold tracking-wider uppercase text-white border border-white/20"
              style={{
                background: 'linear-gradient(180deg, rgba(59, 134, 222, 0.4) 0%, rgba(32, 92, 163, 0.4) 100%)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 20px -3px rgba(41, 102, 176, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5)'
              }}
            >
              <Zap size={13} className="text-[var(--safety-mint)]" />
              <span>AI DRIVER SAFETY TELEMETRY</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none"
            style={{ textShadow: '0 4px 24px rgba(53,120,198,0.3)' }}
          >
            Intelligent Cabin Monitoring &amp; Telemetry
          </h1>

          {/* Description */}
          <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed max-w-md">
            DriveGuard AI continuously tracks driver eyelid metrics, 6-DOF head rotation, and in-cabin threat vectors with edge neural inference to prevent accidents before they occur.
          </p>

          {/* Realistic Automotive Visual with Holographic HUD Floating Badges */}
          <div className="relative py-4 flex items-center justify-center">
            {/* Visual Pedestal Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary-blue)]/15 via-transparent to-transparent rounded-3xl blur-xl" />
            
            {/* Transparent Car Image */}
            <div className="relative w-full max-w-sm h-48 sm:h-56">
              <Image
                src="/hero-car.png"
                alt="DriveGuard AI Safety Monitoring Vehicle"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]"
                priority
              />
            </div>

            {/* Floating 3D Badge 1: Accuracy */}
            <div className="absolute top-2 left-2 animate-clay-float-1">
              <div className="clay-badge-blue px-3.5 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                  EAR 0.292 • OPTIMAL
                </span>
              </div>
            </div>

            {/* Floating 3D Badge 2: Latency */}
            <div className="absolute bottom-2 right-2 animate-clay-float-2">
              <div className="clay-badge-blue px-3.5 py-2 flex items-center gap-2">
                <Cpu size={13} className="text-[var(--sensor-blue)]" />
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                  &lt; 15MS NPU LATENCY
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-white/50">
          <span>DriveGuard AI v4.2 • Hardware Token Ready</span>
          <span className="flex items-center gap-1.5 text-[var(--safety-mint)]">
            <CheckCircle2 size={13} />
            <span>Encrypted Telemetry</span>
          </span>
        </div>
      </div>

      {/* ============================================================
          RIGHT SECTION — 3D CLAYMORPHISM AUTHENTICATION FORM
          ============================================================ */}
      <div className="w-full lg:w-7/12 p-6 sm:p-10 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-xl">
          
          {/* Main 3D Clay Authentication Card */}
          <div className="clay-auth-card p-6 sm:p-10 space-y-7">
            
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--primary-blue)] block">
                  AUTHENTICATION CONSOLE
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
                  FLEET SECURE ACCESS
                </span>
              </div>
              <h2 className="font-display uppercase text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight leading-none">
                System Sign In
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
                Select your designated access terminal profile and enter your credentials.
              </p>
            </div>

            {/* Role Selector Tabs (3D Claymorphic Switcher) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                LOGIN AS:
              </label>
              <div className="clay-role-track grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all select-none ${
                    role === 'driver'
                      ? 'btn-3d-primary shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Car size={15} />
                  <span>Driver Cockpit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all select-none ${
                    role === 'admin'
                      ? 'btn-3d-primary shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Radio size={15} />
                  <span>Fleet Operations</span>
                </button>
              </div>
            </div>

            {/* 1-Click Quick Demo Credentials Pill */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                <Sparkles size={14} className="text-[var(--primary-blue)] shrink-0" />
                <span>QUICK DEMO AUTOFILL:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('driver')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--bg-surface)] hover:bg-emerald-500/15 border border-[var(--border)] hover:border-emerald-500/30 text-[var(--safety-mint)] transition-all cursor-pointer select-none"
                >
                  Driver Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--bg-surface)] hover:bg-blue-500/15 border border-[var(--border)] hover:border-blue-500/30 text-[var(--primary-blue)] transition-all cursor-pointer select-none"
                >
                  Admin Demo
                </button>
              </div>
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-[var(--alert-coral)] flex items-center gap-2">
                  <ShieldAlert size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Fleet Email Address
                </label>
                <div className="clay-input-inset relative flex items-center">
                  <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder={role === 'driver' ? 'alex.mercer@safefleet.com' : 'ops.admin@driveguard.ai'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent py-3 pl-10 pr-4 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Access Password
                </label>
                <div className="clay-input-inset relative flex items-center">
                  <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent py-3 pl-10 pr-10 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary-blue)] cursor-pointer"
                  />
                  <span className="font-mono text-[11px]">Remember terminal</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-mono text-[var(--primary-blue)] hover:underline font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit 3D Clay Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-3d-primary w-full py-3.5 px-6 rounded-2xl text-sm font-display uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none transition-all mt-4 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Terminal...</span>
                  </>
                ) : (
                  <>
                    <span>{role === 'driver' ? 'Sign In to Driver Cockpit' : 'Sign In to Fleet Operations'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Navigation Link to Sign Up */}
            <div className="pt-5 border-t border-[var(--border)] text-center text-xs font-mono text-[var(--text-secondary)]">
              New vehicle unit or driver registration?{' '}
              <Link href="/register" className="text-[var(--primary-blue)] font-bold hover:underline ml-1">
                Create Account →
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => {
          setForgotModalOpen(false);
          setForgotSent(false);
        }}
        title="Reset Access Credentials"
        subtitle="Verification token will be dispatched to your registered fleet email"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {forgotSent ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-[var(--safety-mint)] space-y-1">
              <div className="font-bold">Dispatch Token Sent!</div>
              <p>Check {forgotEmail} for your cryptographic access restoration token.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  Registered Fleet Email
                </label>
                <div className="clay-input-inset relative flex items-center">
                  <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder="driver@safefleet.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail) setForgotSent(true);
                  }}
                  className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  Send Reset Token
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
