'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/lib/authContext';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Truck, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Radio,
  Car,
  Cpu,
  ShieldCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loading: authLoading } = useAuth();
  const [role, setRole] = useState<'driver' | 'admin'>('driver');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      setError('Administrator accounts cannot be created through public registration. Contact your fleet operations manager.');
      return;
    }

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide your fleet email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Access passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (strength < 50) {
      setError('Please choose a stronger password (minimum 8 characters with numbers or symbols).');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        vehicle_id: vehicleId.trim() || undefined,
      });
      setLoading(false);
      router.push('/driver');
    } catch (err: unknown) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : 'Registration failed';
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-main)] text-[var(--text-primary)] select-none">
      
      {/* ============================================================
          LEFT SECTION — AUTOMOTIVE BRANDING & ONBOARDING TELEMETRY
          ============================================================ */}
      <div 
        className="w-full lg:w-5/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border)]"
        style={{
          background: 'radial-gradient(ellipse 100% 90% at 50% 100%, #203440 0%, #121e28 55%, #0c151c 100%)'
        }}
      >
        {/* Ambient lighting glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(67,182,154,0.2) 0%, transparent 70%)', filter: 'blur(75px)' }} />
        <div className="absolute bottom-10 right-10 w-[450px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(53,120,198,0.22) 0%, transparent 70%)', filter: 'blur(70px)' }} />

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
              UNIT ONBOARDING
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Middle Content Section */}
        <div className="relative z-10 my-8 sm:my-10 space-y-6">
          
          {/* Eyebrow badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[11px] font-mono font-bold tracking-wider uppercase text-white border border-white/20"
              style={{
                background: 'linear-gradient(180deg, rgba(67, 182, 154, 0.4) 0%, rgba(34, 144, 111, 0.4) 100%)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 20px -3px rgba(34, 144, 111, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5)'
              }}
            >
              <Zap size={13} className="text-[var(--safety-mint)]" />
              <span>VEHICLE SAFETY NETWORK</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none"
            style={{ textShadow: '0 4px 24px rgba(67,182,154,0.3)' }}
          >
            Join the Next Generation of Driver Safety
          </h1>

          {/* Description */}
          <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed max-w-md">
            Connect an in-cabin camera terminal to monitor fatigue metrics, gaze deviation, and threat conditions with instantaneous fleet synchronization.
          </p>

          {/* Realistic Automotive Visual with Holographic HUD Badges */}
          <div className="relative py-4 flex items-center justify-center">
            {/* Visual Pedestal Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--safety-mint)]/15 via-transparent to-transparent rounded-3xl blur-xl" />
            
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

            {/* Floating 3D Badge 1: 468 Mesh Locked */}
            <div className="absolute top-2 left-2 animate-clay-float-1">
              <div className="clay-badge-blue px-3.5 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                  468 MESH POINTS LOCKED
                </span>
              </div>
            </div>

            {/* Floating 3D Badge 2: Real-Time Sync */}
            <div className="absolute bottom-2 right-2 animate-clay-float-2">
              <div className="clay-badge-blue px-3.5 py-2 flex items-center gap-2">
                <Activity size={13} className="text-[var(--safety-mint)]" />
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">
                  60 FPS CABIN TELEMETRY
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-white/50">
          <span>DriveGuard AI • Autonomous Safety Architecture</span>
          <span className="flex items-center gap-1.5 text-[var(--safety-mint)]">
            <CheckCircle2 size={13} />
            <span>Encrypted Registration Link</span>
          </span>
        </div>
      </div>

      {/* ============================================================
          RIGHT SECTION — 3D CLAYMORPHISM SIGN UP FORM
          ============================================================ */}
      <div className="w-full lg:w-7/12 p-6 sm:p-10 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-xl">
          
          {/* Main 3D Clay Authentication Card */}
          <div className="clay-auth-card p-6 sm:p-10 space-y-6">
            
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--safety-mint)] block">
                  NETWORK ENROLLMENT
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
                  FLEET SECURE ACCESS
                </span>
              </div>
              <h2 className="font-display uppercase text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight leading-none">
                Create Account
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
                Register a new driver terminal or fleet operations administrative authority.
              </p>
            </div>

            {/* Role Selector Tabs (3D Claymorphic Switcher) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                REGISTER AS:
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
                  <span>Commercial Driver</span>
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
                  <span>Fleet Admin</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-[var(--alert-coral)] flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Full Name
                  </label>
                  <div className="clay-input-inset relative flex items-center">
                    <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-transparent py-3 pl-10 pr-4 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                    />
                  </div>
                </div>

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
                      placeholder="driver@safefleet.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent py-3 pl-10 pr-4 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle ID if Driver */}
              {role === 'driver' && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Vehicle Identifier / Unit Tag (Optional)
                  </label>
                  <div className="clay-input-inset relative flex items-center">
                    <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
                      <Truck size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="VOLVO-FH16-#08"
                      value={vehicleId}
                      onChange={(e) => setVehicleId(e.target.value)}
                      className="w-full bg-transparent py-3 pl-10 pr-4 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Confirm Password
                  </label>
                  <div className="clay-input-inset relative flex items-center">
                    <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-transparent py-3 pl-10 pr-10 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                  <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength <= 25 
                          ? 'bg-[var(--alert-coral)] shadow-[0_0_8px_rgba(242,126,133,0.6)]' 
                          : strength <= 75 
                            ? 'bg-[var(--warning-amber)] shadow-[0_0_8px_rgba(243,189,114,0.6)]' 
                            : 'bg-[var(--safety-mint)] shadow-[0_0_8px_rgba(67,182,154,0.6)]'
                      }`}
                      style={{ width: `${Math.max(strength, 10)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>SECURITY STRENGTH:</span>
                    <span className="font-bold uppercase">
                      {strength <= 25 ? 'Weak (Needs numbers/symbols)' : strength <= 75 ? 'Moderate' : 'Optimal / Strong'}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit 3D Clay Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-3d-primary w-full py-3.5 px-6 rounded-2xl text-sm font-display uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none transition-all mt-5 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Terminal...</span>
                  </>
                ) : (
                  <>
                    <span>{role === 'driver' ? 'Create Driver Account' : 'Create Fleet Admin Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Navigation Link to Login */}
            <div className="pt-4 border-t border-[var(--border)] text-center text-xs font-mono text-[var(--text-secondary)]">
              Already registered in the safety network?{' '}
              <Link href="/login" className="text-[var(--primary-blue)] font-bold hover:underline ml-1">
                Sign In →
              </Link>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
