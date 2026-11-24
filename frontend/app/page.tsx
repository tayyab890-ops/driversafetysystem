'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { SafetyGauge } from '@/components/safety/SafetyGauge';
import { EyeStateIndicator } from '@/components/safety/EyeStateIndicator';
import { HeadPoseIndicator } from '@/components/safety/HeadPoseIndicator';
import { WeaponDetectionBadge } from '@/components/safety/WeaponDetectionBadge';
import { 
  ShieldCheck, 
  Eye, 
  Compass, 
  ShieldAlert, 
  Cpu, 
  ArrowRight, 
  Zap, 
  Camera, 
  CheckCircle2, 
  ChevronRight,
  Radio,
  Sliders,
  Sparkles,
  Shield,
  Target,
  Timer,
  BellRing,
  Activity,
  Gauge,
  Radar,
  Crosshair,
  AlertTriangle,
  Volume2,
  Scan,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  // Interactive demo state for live simulation preview on the landing page
  const [demoMode, setDemoMode] = useState<'normal' | 'drowsy' | 'distracted' | 'threat'>('normal');

  const demoData = {
    normal: {
      score: 97,
      status: 'ATTENTION NORMAL' as const,
      ear: 0.292,
      eyeState: 'open' as const,
      yawn: false,
      yaw: 2.1,
      pitch: -3.0,
      poseStatus: 'FOCUSED ON ROAD' as const,
      headPose: 'forward' as const,
      threatDetected: false,
    },
    drowsy: {
      score: 68,
      status: 'DROWSINESS DETECTED' as const,
      ear: 0.148,
      eyeState: 'closed' as const,
      yawn: true,
      yaw: -4.5,
      pitch: 14.0,
      poseStatus: 'FOCUSED ON ROAD' as const,
      headPose: 'forward' as const,
      threatDetected: false,
    },
    distracted: {
      score: 74,
      status: 'ATTENTION NORMAL' as const,
      ear: 0.275,
      eyeState: 'open' as const,
      yawn: false,
      yaw: 34.2,
      pitch: -26.0,
      poseStatus: 'PHONE / DOWNWARD GAZE' as const,
      headPose: 'right' as const,
      threatDetected: false,
    },
    threat: {
      score: 62,
      status: 'ATTENTION NORMAL' as const,
      ear: 0.281,
      eyeState: 'open' as const,
      yawn: false,
      yaw: 8.0,
      pitch: -5.0,
      poseStatus: 'FOCUSED ON ROAD' as const,
      headPose: 'forward' as const,
      threatDetected: true,
    },
  }[demoMode];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-20 border-b border-[var(--border)] automotive-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Hero Column — Text, Editorial Headline & 3D CTAs */}
            <div className="lg:col-span-6 space-y-6 lg:space-y-7 z-10">
              
              {/* Eyebrow Status Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full tactile-inset-sm border border-[var(--border)] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)] animate-pulse" />
                <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-secondary)] font-semibold">
                  INTELLIGENT DRIVER SAFETY
                </span>
              </div>

              {/* Ultra-Condensed Tall Editorial Headline */}
              <h1 className="font-display uppercase tracking-tight text-[var(--text-primary)] leading-[0.88] select-none text-[4.5rem] sm:text-[6rem] md:text-[7rem] lg:text-[7.5rem] font-normal">
                <span className="block">Stay Alert.</span>
                <span className="block text-[var(--primary-blue)]">Stay Alive.</span>
              </h1>

              {/* Supporting Editorial Description */}
              <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed font-sans">
                AI-powered vision monitors driver fatigue, distraction and potential threats to make every journey safer.
              </p>

              {/* Premium Tactile 3D Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link href="/driver/monitor">
                  <button
                    type="button"
                    className="btn-3d-primary inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-semibold tracking-wide cursor-pointer select-none"
                  >
                    <span>Start Monitoring</span>
                    <ArrowRight size={16} />
                  </button>
                </Link>

                <a href="#features">
                  <button
                    type="button"
                    className="btn-3d-secondary inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-semibold tracking-wide cursor-pointer select-none"
                  >
                    <Shield size={16} className="text-[var(--primary-blue)]" />
                    <span>Explore Safety</span>
                  </button>
                </a>
              </div>

              {/* Technical Precision Assurance Strip */}
              <div className="pt-6 border-t border-[var(--border)] grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)] block">&lt;15ms</span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Edge Inference</span>
                </div>
                <div>
                  <span className="text-lg font-bold font-mono text-[var(--safety-mint)] block">468 Pts</span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Facial Mesh</span>
                </div>
                <div>
                  <span className="text-lg font-bold font-mono text-[var(--sensor-blue)] block">100% Edge</span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Cabin Privacy</span>
                </div>
              </div>

            </div>

            {/* Right Hero Column — User-Supplied Cutaway Vehicle with 3D Depth & Floating Dynamics */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Ambient Spotlight Lighting Behind Car */}
              <div 
                className="absolute inset-0 -m-8 pointer-events-none rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(53, 120, 198, 0.16) 0%, rgba(67, 182, 154, 0.08) 50%, transparent 72%)',
                  filter: 'blur(30px)',
                }}
              />

              {/* Perspective Stage Container */}
              <div className="relative w-full max-w-xl mx-auto flex flex-col items-center select-none py-4">
                
                {/* 1. Floating 3D Claymorphism Status Indicator: Drowsiness Detected */}
                <div className="absolute -top-4 -left-1 sm:-top-3 sm:-left-6 lg:-left-6 z-20 clay-badge-blue px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 animate-clay-float-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/20 border border-blue-400/30 text-blue-300 shadow-inner">
                    <Eye size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                        Drowsiness Detected
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-mono text-blue-200/70 mt-0.5">
                      Eye closure / fatigue
                    </div>
                  </div>
                </div>

                {/* 2. Floating 3D Claymorphism Status Indicator: Distraction Detected */}
                <div className="absolute top-11 -right-1 sm:-top-1 sm:-right-6 lg:-right-4 z-20 clay-badge-blue px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 animate-clay-float-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 bg-sky-500/20 border border-sky-400/30 text-sky-300 shadow-inner">
                    <Compass size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
                        Distraction Detected
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-mono text-blue-200/70 mt-0.5">
                      Head turned away
                    </div>
                  </div>
                </div>

                {/* Floating Vehicle with Depth Transform */}
                <div className="relative w-full animate-car-float flex items-center justify-center my-3">
                  <img
                    src="/hero-car.png"
                    alt="DriveGuard AI Vehicle Vision Telemetry"
                    className="w-full h-auto object-contain drop-shadow-2xl relative z-10 pointer-events-none transition-transform duration-500 hover:scale-[1.02]"
                    loading="eager"
                  />
                </div>

                {/* Ground Contact Shadow (Breathing in Sync with Car Float) */}
                <div 
                  className="w-4/5 h-8 -mt-5 rounded-[100%] animate-shadow-pulse pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(16, 26, 32, 0.45) 0%, rgba(16, 26, 32, 0.18) 45%, transparent 72%)',
                    filter: 'blur(7px)',
                  }}
                />

                {/* 3. Floating 3D Claymorphism Status Indicator: Threat Detected */}
                <div className="absolute -bottom-5 right-1 sm:right-4 lg:right-2 z-20 clay-badge-blue px-3.5 py-2.5 flex items-center gap-3 animate-clay-float-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/20 border border-rose-400/30 text-rose-300 shadow-inner">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        Threat Detected
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-blue-200/70 mt-0.5">
                      Potential weapon detected
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          DETECTION MODULES — PREMIUM 3D CLAYMORPHISM REDESIGN
          ============================================================ */}

      {/* MODULE 01 — DROWSINESS & MICROSLEEP RECOGNITION */}
      <section id="features" className="py-24 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">

            {/* ── Visual Column ── */}
            <div className="lg:col-span-5 order-2 lg:order-1 module-animate-in">
              <div className="clay-module-card space-y-4">

                {/* Card header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/60">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    EAR Landmark Geometry
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-500/12 text-[var(--primary-blue)] border border-blue-500/25 font-bold">
                    P1..P6 VECTOR
                  </span>
                </div>

                {/* Animated Eye SVG instrument */}
                <div className="clay-instrument-well h-52 flex items-center justify-center p-6 relative">
                  <svg viewBox="0 0 300 140" className="w-full h-full" aria-label="Eye EAR landmark visualization">

                    {/* Background grid lines */}
                    <line x1="0" y1="70" x2="300" y2="70" stroke="currentColor" strokeWidth="0.4" className="text-blue-400/15" />
                    <line x1="150" y1="0" x2="150" y2="140" stroke="currentColor" strokeWidth="0.4" className="text-blue-400/15" />

                    {/* Outer eye silhouette with blink animation */}
                    <path className="ear-eyelid-blink" d="M20 70 Q150 10 280 70 Q150 130 20 70 Z"
                      fill="rgba(59,130,246,0.06)" stroke="var(--primary-blue)" strokeWidth="2.5" />

                    {/* Inner pupil circle */}
                    <circle cx="150" cy="70" r="14" fill="none" stroke="var(--primary-blue)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
                    <circle cx="150" cy="70" r="6" fill="var(--primary-blue)" opacity="0.35" />
                    <circle cx="150" cy="70" r="2.5" fill="var(--primary-blue)" />

                    {/* Vertical EAR measurement vectors */}
                    <line x1="100" y1="43" x2="100" y2="97" stroke="var(--safety-mint)" strokeWidth="1.8" strokeDasharray="4 3" />
                    <line x1="200" y1="43" x2="200" y2="97" stroke="var(--safety-mint)" strokeWidth="1.8" strokeDasharray="4 3" />

                    {/* Horizontal span line */}
                    <line x1="20" y1="70" x2="280" y2="70" stroke="var(--warning-amber)" strokeWidth="1.4" opacity="0.65" />

                    {/* P1..P6 landmark points */}
                    <circle cx="20"  cy="70" r="4.5" fill="var(--warning-amber)" className="ear-landmark-pulse" />
                    <circle cx="280" cy="70" r="4.5" fill="var(--warning-amber)" className="ear-landmark-pulse" style={{animationDelay:'0.3s'}} />
                    <circle cx="100" cy="43" r="4"   fill="var(--safety-mint)"   className="ear-landmark-pulse" style={{animationDelay:'0.6s'}} />
                    <circle cx="100" cy="97" r="4"   fill="var(--safety-mint)"   className="ear-landmark-pulse" style={{animationDelay:'0.9s'}} />
                    <circle cx="200" cy="43" r="4"   fill="var(--safety-mint)"   className="ear-landmark-pulse" style={{animationDelay:'0.45s'}} />
                    <circle cx="200" cy="97" r="4"   fill="var(--safety-mint)"   className="ear-landmark-pulse" style={{animationDelay:'0.75s'}} />

                    {/* Point labels */}
                    <text x="8"   y="68" fontSize="8" fill="var(--warning-amber)" fontFamily="monospace">P1</text>
                    <text x="284" y="68" fontSize="8" fill="var(--warning-amber)" fontFamily="monospace">P4</text>
                    <text x="90"  y="40" fontSize="8" fill="var(--safety-mint)"   fontFamily="monospace">P2</text>
                    <text x="90"  y="108" fontSize="8" fill="var(--safety-mint)"  fontFamily="monospace">P6</text>
                    <text x="204" y="40" fontSize="8" fill="var(--safety-mint)"   fontFamily="monospace">P3</text>
                    <text x="204" y="108" fontSize="8" fill="var(--safety-mint)"  fontFamily="monospace">P5</text>

                    {/* Animated scan line */}
                    <line x1="20" y1="70" x2="280" y2="70"
                      stroke="var(--primary-blue)" strokeWidth="1.5" opacity="0.8"
                      className="ear-scan-line"
                      style={{ transformOrigin: '150px 70px' }} />

                    {/* Corner tick marks */}
                    <line x1="12" y1="10" x2="22" y2="10" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="12" y1="10" x2="12" y2="20" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="288" y1="10" x2="278" y2="10" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="288" y1="10" x2="288" y2="20" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="12" y1="130" x2="22" y2="130" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="12" y1="130" x2="12" y2="120" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="288" y1="130" x2="278" y2="130" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                    <line x1="288" y1="130" x2="288" y2="120" stroke="var(--primary-blue)" strokeWidth="1" opacity="0.4" />
                  </svg>

                  {/* EAR formula overlay */}
                  <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)]/70 px-2 py-1 rounded-lg backdrop-blur-sm">
                    EAR = (||p2−p6|| + ||p3−p5||) / 2||p1−p4||
                  </div>
                </div>

                {/* Metric pills */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="clay-metric-pill">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] block mb-1">Microsleep Gate</span>
                    <span className="text-xs font-bold font-mono text-[var(--text-primary)]">&gt; 1.8s below 0.18</span>
                  </div>
                  <div className="clay-metric-pill">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)] block mb-1">Yawn Detector</span>
                    <span className="text-xs font-bold font-mono text-[var(--text-primary)]">MAR &gt; 0.65 ratio</span>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Content Column ── */}
            <div className="lg:col-span-7 space-y-5 order-1 lg:order-2 module-animate-in module-animate-in-delay-1">
              <div>
                <button
                  type="button"
                  className="btn-3d-module btn-3d-module-blue"
                  style={{
                    background: 'linear-gradient(180deg, #3B86DE 0%, #205CA3 100%)',
                    borderTop: '1.5px solid rgba(255, 255, 255, 0.75)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                    borderBottom: '3px solid rgba(13, 39, 72, 0.95)',
                    boxShadow: '0 12px 26px -3px rgba(41, 102, 176, 0.5), 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.75), inset 0 -1.5px 2px rgba(10, 28, 52, 0.4)'
                  }}
                >
                  <Eye size={14} className="text-white" />
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse inline-block" />
                  <span>MODULE 01 • FATIGUE PREVENTION</span>
                </button>
              </div>
              <h2 className="font-display text-5xl sm:text-6xl uppercase leading-none tracking-tight text-[var(--text-primary)]">
                Drowsiness &amp;<br />Microsleep<br />Recognition
              </h2>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                By tracking 6-point Euclidean distance vectors across both left and right eye contours, DriveGuard computes Eye Aspect Ratio (EAR) dynamically. If the driver begins drooping or exhibits prolonged closure patterns, graduated multi-stage chimes trigger before microsleep causes road departure.
              </p>
              <ul className="space-y-3 pt-1 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Sub-millimeter eye corner and eyelid tracking even in low-cabin lighting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Yawn frequency clustering to anticipate drowsiness before eyes close</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Tolerant to prescription eyewear and varying lighting environments</span>
                </li>
              </ul>

              {/* 3D Action Button */}
              <div className="pt-2">
                <Link href="/driver/monitor">
                  <button
                    type="button"
                    className="btn-3d-primary inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase cursor-pointer select-none"
                  >
                    <Eye size={15} />
                    <span>Launch Fatigue Monitor</span>
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MODULE 02 — 6-DOF HEAD POSE & DISTRACTION DETECTION */}
      <section className="py-24 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">

            {/* ── Content Column ── */}
            <div className="lg:col-span-7 space-y-5 module-animate-in">
              <div>
                <button
                  type="button"
                  className="btn-3d-module btn-3d-module-orange"
                  style={{
                    background: 'linear-gradient(180deg, #F59E0B 0%, #B45309 100%)',
                    borderTop: '1.5px solid rgba(255, 255, 255, 0.8)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                    borderBottom: '3px solid rgba(120, 53, 15, 0.95)',
                    boxShadow: '0 12px 26px -3px rgba(217, 119, 6, 0.5), 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.75), inset 0 -1.5px 2px rgba(69, 26, 3, 0.4)'
                  }}
                >
                  <Compass size={14} className="text-white" />
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse inline-block" />
                  <span>MODULE 02 • ROAD ATTENTION</span>
                </button>
              </div>
              <h2 className="font-display text-5xl sm:text-6xl uppercase leading-none tracking-tight text-[var(--text-primary)]">
                6-DOF Head Pose<br />&amp; Phone Gaze<br />Detection
              </h2>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                Taking eyes off the road for more than two seconds doubles crash risk. DriveGuard solves perspective-n-point (PnP) equations to estimate head yaw, pitch, and roll in real-time, detecting phone checking, side-window gazing, and downward inattention instantly.
              </p>
              <ul className="space-y-3 pt-1 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Yaw analysis detects turns towards passenger seats or side mirrors</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Pitch tracking catches downward lap/smartphone glances immediately</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Customizable sensitivity thresholds tailored for commercial fleet requirements</span>
                </li>
              </ul>

              {/* 3D Action Button */}
              <div className="pt-2">
                <Link href="/driver/monitor">
                  <button
                    type="button"
                    className="btn-3d-module btn-3d-module-orange inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase cursor-pointer select-none"
                  >
                    <Compass size={15} />
                    <span>Launch Head-Pose Monitor</span>
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>

            {/* ── Visual Column ── */}
            <div className="lg:col-span-5 module-animate-in module-animate-in-delay-1">
              <div className="clay-module-card space-y-4">

                {/* Card header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/60">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    Angular Pose Vector
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/12 text-[var(--warning-amber)] border border-amber-500/25 font-bold">
                    6-DOF EULER
                  </span>
                </div>

                {/* Head-pose radar instrument */}
                <div className="clay-instrument-well h-56 flex items-center justify-center relative">
                  <svg viewBox="0 0 240 220" className="w-full h-full" aria-label="Head pose orientation radar">

                    {/* Concentric tracking rings with pulse */}
                    <circle cx="120" cy="110" r="90" fill="none" stroke="var(--warning-amber)" strokeWidth="0.6" opacity="0.2" />
                    <circle cx="120" cy="110" r="65" fill="none" stroke="var(--warning-amber)" strokeWidth="0.8" opacity="0.25" />
                    <circle cx="120" cy="110" r="40" fill="none" stroke="var(--warning-amber)" strokeWidth="1" opacity="0.35" />
                    <circle cx="120" cy="110" r="40" fill="none" stroke="var(--warning-amber)" strokeWidth="2" opacity="0.4"
                      className="radar-ring-pulse" />
                    <circle cx="120" cy="110" r="65" fill="none" stroke="var(--warning-amber)" strokeWidth="1.5" opacity="0.25"
                      className="radar-ring-pulse-delay" />

                    {/* Cross-hair axes */}
                    <line x1="120" y1="18" x2="120" y2="202" stroke="var(--warning-amber)" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3" />
                    <line x1="28"  y1="110" x2="212" y2="110" stroke="var(--warning-amber)" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3" />

                    {/* Arc zone shading for threshold (±18°) */}
                    <path d="M120 110 L120 20 A90 90 0 0 1 150.4 115.5 Z" fill="var(--warning-amber)" opacity="0.06" />
                    <path d="M120 110 L120 20 A90 90 0 0 0 89.6 115.5 Z" fill="var(--warning-amber)" opacity="0.06" />

                    {/* Compass needle — animated */}
                    <g className="compass-needle" style={{ transformOrigin: '120px 110px' }}>
                      <line x1="120" y1="110" x2="120" y2="30" stroke="var(--warning-amber)" strokeWidth="2.5" strokeLinecap="round" />
                      <polygon points="120,24 115,36 125,36" fill="var(--warning-amber)" />
                    </g>

                    {/* Center face dot */}
                    <circle cx="120" cy="110" r="8" fill="var(--bg-surface)" stroke="var(--warning-amber)" strokeWidth="2" />
                    <circle cx="120" cy="110" r="3.5" fill="var(--warning-amber)" />

                    {/* Directional labels */}
                    <text x="112" y="13" fontSize="9" fill="var(--warning-amber)" fontFamily="monospace" fontWeight="700">ROAD</text>
                    <text x="108" y="215" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">PHONE</text>
                    <text x="216" y="114" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">+35°</text>
                    <text x="12"  y="114" fontSize="9" fill="var(--text-muted)" fontFamily="monospace">−35°</text>

                    {/* Alert threshold arc labels */}
                    <text x="140" y="45" fontSize="7.5" fill="var(--warning-amber)" fontFamily="monospace" opacity="0.7">+18°</text>
                    <text x="92"  y="45" fontSize="7.5" fill="var(--warning-amber)" fontFamily="monospace" opacity="0.7">−18°</text>
                  </svg>

                  {/* Directional status chips */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center">
                    {(['LEFT','RIGHT','UP','DOWN'] as const).map((dir, i) => (
                      <span key={dir} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-[var(--warning-amber)] border border-amber-500/20"
                        style={{ animationDelay: `${i * 0.4}s` }}>
                        {dir}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metric pill */}
                <div className="clay-metric-pill flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Attention State</span>
                  <span className="text-xs font-bold font-mono text-[var(--warning-amber)]">MONITORED RANGE (±18°)</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MODULE 03 — THREAT OBJECT & IN-CABIN SECURITY */}
      <section className="py-24 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">

            {/* ── Visual Column ── */}
            <div className="lg:col-span-5 order-2 lg:order-1 module-animate-in">
              <div className="clay-module-card space-y-4">

                {/* Card header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/60">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    Quadrant Threat Silhouette Scan
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/12 text-[var(--alert-coral)] border border-rose-500/25 font-bold">
                    VERIFY PROTOCOL
                  </span>
                </div>

                {/* Animated bounding-box detection instrument */}
                <div className="clay-instrument-well h-52 flex items-center justify-center relative bg-rose-500/5 overflow-hidden">
                  <svg viewBox="0 0 260 160" className="w-full h-full" aria-label="Threat detection bounding box scanner">

                    {/* Background scene grid */}
                    {[0,1,2,3,4].map(i => (
                      <line key={`vg${i}`} x1={i*52+26} y1="0" x2={i*52+26} y2="160"
                        stroke="var(--alert-coral)" strokeWidth="0.3" opacity="0.1" />
                    ))}
                    {[0,1,2].map(i => (
                      <line key={`hg${i}`} x1="0" y1={i*53+27} x2="260" y2={i*53+27}
                        stroke="var(--alert-coral)" strokeWidth="0.3" opacity="0.1" />
                    ))}

                    {/* Animated scan line */}
                    <line x1="10" y1="0" x2="250" y2="0"
                      stroke="var(--alert-coral)" strokeWidth="1.5" opacity="0.7"
                      className="threat-scan-line" />

                    {/* Primary threat bounding box */}
                    <rect x="68" y="22" width="124" height="116" rx="4"
                      fill="rgba(239,68,68,0.06)"
                      stroke="var(--alert-coral)" strokeWidth="2.5"
                      strokeDasharray="12 6"
                      className="bounding-box-pulse" />

                    {/* Corner bracket marks — top-left */}
                    <path d="M68 42 L68 22 L88 22" fill="none" stroke="var(--alert-coral)" strokeWidth="3.5"
                      strokeLinecap="round" className="corner-bracket-glow" />
                    {/* top-right */}
                    <path d="M172 22 L192 22 L192 42" fill="none" stroke="var(--alert-coral)" strokeWidth="3.5"
                      strokeLinecap="round" className="corner-bracket-glow" style={{animationDelay:'0.4s'}} />
                    {/* bottom-left */}
                    <path d="M68 118 L68 138 L88 138" fill="none" stroke="var(--alert-coral)" strokeWidth="3.5"
                      strokeLinecap="round" className="corner-bracket-glow" style={{animationDelay:'0.8s'}} />
                    {/* bottom-right */}
                    <path d="M172 138 L192 138 L192 118" fill="none" stroke="var(--alert-coral)" strokeWidth="3.5"
                      strokeLinecap="round" className="corner-bracket-glow" style={{animationDelay:'1.2s'}} />

                    {/* Center crosshair */}
                    <line x1="130" y1="74" x2="130" y2="86" stroke="var(--alert-coral)" strokeWidth="1.5" opacity="0.9" />
                    <line x1="124" y1="80" x2="136" y2="80" stroke="var(--alert-coral)" strokeWidth="1.5" opacity="0.9" />
                    <circle cx="130" cy="80" r="10" fill="none" stroke="var(--alert-coral)" strokeWidth="1" opacity="0.4" />

                    {/* Tracking markers at corners */}
                    <circle cx="68"  cy="22"  r="3" fill="var(--alert-coral)" opacity="0.7" className="confidence-count" />
                    <circle cx="192" cy="22"  r="3" fill="var(--alert-coral)" opacity="0.7" className="confidence-count" style={{animationDelay:'0.6s'}} />
                    <circle cx="68"  cy="138" r="3" fill="var(--alert-coral)" opacity="0.7" className="confidence-count" style={{animationDelay:'1.2s'}} />
                    <circle cx="192" cy="138" r="3" fill="var(--alert-coral)" opacity="0.7" className="confidence-count" style={{animationDelay:'1.8s'}} />

                    {/* Confidence label */}
                    <rect x="68" y="4" width="88" height="15" rx="3" fill="var(--alert-coral)" opacity="0.9" className="confidence-count" />
                    <text x="76" y="15" fontSize="9" fill="white" fontFamily="monospace" fontWeight="700">CANDIDATE 87%</text>

                    {/* Status label */}
                    <text x="68" y="152" fontSize="8.5" fill="var(--alert-coral)" fontFamily="monospace" opacity="0.8">UNCONFIRMED — AWAITING DISPATCH</text>
                  </svg>
                </div>

                {/* Metric pill */}
                <div className="clay-metric-pill flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Dispatch Verify</span>
                  <span className="text-xs font-bold font-mono text-[var(--safety-mint)]">HUMAN-IN-THE-LOOP ACTIVE</span>
                </div>

              </div>
            </div>

            {/* ── Content Column ── */}
            <div className="lg:col-span-7 space-y-5 order-1 lg:order-2 module-animate-in module-animate-in-delay-1">
              <div>
                <button
                  type="button"
                  className="btn-3d-module btn-3d-module-rose"
                  style={{
                    background: 'linear-gradient(180deg, #F43F5E 0%, #BE123C 100%)',
                    borderTop: '1.5px solid rgba(255, 255, 255, 0.8)',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                    borderBottom: '3px solid rgba(136, 19, 55, 0.95)',
                    boxShadow: '0 12px 26px -3px rgba(225, 29, 72, 0.5), 0 4px 10px rgba(0, 0, 0, 0.15), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.75), inset 0 -1.5px 2px rgba(76, 5, 25, 0.4)'
                  }}
                >
                  <ShieldAlert size={14} className="text-white" />
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse inline-block" />
                  <span>MODULE 03 • CABIN SECURITY</span>
                </button>
              </div>
              <h2 className="font-display text-5xl sm:text-6xl uppercase leading-none tracking-tight text-[var(--text-primary)]">
                Threat Object<br />&amp; In-Cabin<br />Security
              </h2>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                For rideshare, cash transit, and executive fleet drivers, DriveGuard runs quantized object detection models to flag weapon silhouettes in monitored camera frames. Per strict automotive safety ethics, candidate frames are logged as unconfirmed alerts that require rapid human verification.
              </p>
              <ul className="space-y-3 pt-1 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Real-time detection frame bounding boxes for immediate dispatcher triage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Dual verification safeguards prevent false panic alarms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--safety-mint)]/15 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-[var(--safety-mint)]" />
                  </span>
                  <span>Instant silent notification path to central security dispatch</span>
                </li>
              </ul>

              {/* 3D Action Button */}
              <div className="pt-2">
                <Link href="/driver/monitor">
                  <button
                    type="button"
                    className="btn-3d-module btn-3d-module-rose inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase cursor-pointer select-none"
                  >
                    <ShieldAlert size={15} />
                    <span>Launch Threat Scanner</span>
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS / SYSTEM ARCHITECTURE — 3D CLAYMORPHISM PROCESS
          ============================================================ */}
      <section id="process" className="py-24 sm:py-28 border-b border-[var(--border)] bg-[var(--bg-surface)] relative overflow-hidden">
        
        {/* Subtle background ambient lighting glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(53, 120, 198, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 72%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Main Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
            <div>
              <span 
                className="btn-3d-module btn-3d-module-blue inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase cursor-default select-none shadow-md"
                style={{
                  background: 'linear-gradient(180deg, #3B86DE 0%, #205CA3 100%)',
                  borderTop: '1.5px solid rgba(255, 255, 255, 0.75)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                  borderBottom: '3px solid rgba(13, 39, 72, 0.95)',
                  boxShadow: '0 10px 24px -3px rgba(41, 102, 176, 0.45), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.75)'
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-pulse inline-block" />
                SYSTEM ARCHITECTURE • WORKFLOW
              </span>
            </div>

            <h2 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl leading-none tracking-tight text-[var(--text-primary)]">
              How DriveGuard AI Works
            </h2>

            <p className="font-sans text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto pt-1">
              From real-time camera input to intelligent risk detection and instant driver alerts, every stage works together to improve road safety.
            </p>
          </div>

          {/* Connected 4-Step Process Pipeline */}
          <div className="relative">
            
            {/* Desktop Horizontal Connecting Pathway Line (Positioned behind step numbers) */}
            <div className="hidden md:block absolute top-[2.25rem] left-[8%] right-[8%] h-[3px] rounded-full process-pathway-line z-0 opacity-80" />

            {/* Mobile Vertical Connected Line */}
            <div className="md:hidden absolute top-8 bottom-8 left-7 w-[3px] rounded-full process-pathway-line z-0 opacity-70" />

            {/* The 4 Connected 3D Claymorphism Process Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-7 lg:gap-8 relative z-10">
              {[
                {
                  step: '01',
                  title: '01 — Camera Input',
                  desc: "Captures the driver's live video through the webcam for continuous monitoring.",
                  badgeColor: 'linear-gradient(180deg, #3B86DE 0%, #205CA3 100%)',
                  badgeBorderBottom: '#0D2748',
                  badgeShadow: 'rgba(41, 102, 176, 0.55)',
                  tagIcon: Camera,
                  tagColor: 'text-[var(--primary-blue)]',
                  tagText: 'Live Cabin Stream',
                  renderVisual: () => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Optical Aperture Blades Rotating */}
                      <svg viewBox="0 0 100 100" className="w-20 h-20 anim-aperture-spin" aria-hidden="true">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary-blue)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
                        <circle cx="50" cy="50" r="30" fill="none" stroke="var(--primary-blue)" strokeWidth="1.2" opacity="0.3" />
                        {/* Shutter Blade segments */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
                          <line
                            key={idx}
                            x1="50"
                            y1="22"
                            x2="62"
                            y2="42"
                            stroke="var(--primary-blue)"
                            strokeWidth="1.5"
                            opacity="0.75"
                            transform={`rotate(${angle} 50 50)`}
                          />
                        ))}
                      </svg>
                      {/* Camera Lens Center Glow */}
                      <div className="absolute w-8 h-8 rounded-full bg-[var(--primary-blue)]/20 border border-[var(--primary-blue)]/60 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Camera size={14} className="text-white" />
                      </div>
                      {/* Corner Target Bracket Reticles */}
                      <span className="absolute top-2.5 left-2.5 w-2 h-2 border-t-2 border-l-2 border-[var(--primary-blue)] opacity-60" />
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 border-t-2 border-r-2 border-[var(--primary-blue)] opacity-60" />
                      <span className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b-2 border-l-2 border-[var(--primary-blue)] opacity-60" />
                      <span className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b-2 border-r-2 border-[var(--primary-blue)] opacity-60" />
                    </div>
                  ),
                },
                {
                  step: '02',
                  title: '02 — Computer Vision',
                  desc: 'Analyzes facial landmarks, eye movements, head position and visual objects.',
                  badgeColor: 'linear-gradient(180deg, #0EA5E9 0%, #0369A1 100%)',
                  badgeBorderBottom: '#082F49',
                  badgeShadow: 'rgba(14, 165, 233, 0.55)',
                  tagIcon: Cpu,
                  tagColor: 'text-sky-400',
                  tagText: 'Edge Neural Mesh',
                  renderVisual: () => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Neural Facial Landmark Mesh Simulation */}
                      <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden="true">
                        {/* Connecting Mesh Triangles */}
                        <polygon points="50,20 30,45 50,60" fill="none" stroke="var(--safety-mint)" strokeWidth="0.8" opacity="0.35" />
                        <polygon points="50,20 70,45 50,60" fill="none" stroke="var(--safety-mint)" strokeWidth="0.8" opacity="0.35" />
                        <polygon points="30,45 50,60 50,82" fill="none" stroke="var(--safety-mint)" strokeWidth="0.8" opacity="0.35" />
                        <polygon points="70,45 50,60 50,82" fill="none" stroke="var(--safety-mint)" strokeWidth="0.8" opacity="0.35" />
                        <polygon points="30,45 20,65 50,82" fill="none" stroke="var(--safety-mint)" strokeWidth="0.8" opacity="0.25" />
                        <polygon points="70,45 80,65 50,82" fill="none" stroke="var(--safety-mint)" strokeWidth="0.8" opacity="0.25" />
                        {/* Animated Scanning Beam sweeping vertically */}
                        <line x1="15" y1="50" x2="85" y2="50" stroke="var(--safety-mint)" strokeWidth="1.8" className="anim-grid-scan" opacity="0.8" />
                        {/* Landmark Feature Dots */}
                        <circle cx="50" cy="20" r="2.5" fill="var(--safety-mint)" />
                        <circle cx="30" cy="45" r="2.5" fill="var(--safety-mint)" />
                        <circle cx="70" cy="45" r="2.5" fill="var(--safety-mint)" />
                        <circle cx="50" cy="60" r="3"   fill="white" className="anim-neural-pulse" />
                        <circle cx="50" cy="82" r="2.5" fill="var(--safety-mint)" />
                        <circle cx="40" cy="52" r="2"   fill="var(--safety-mint)" />
                        <circle cx="60" cy="52" r="2"   fill="var(--safety-mint)" />
                      </svg>
                      {/* Center Node Chip */}
                      <div className="absolute w-7 h-7 rounded-lg bg-[var(--safety-mint)]/20 border border-[var(--safety-mint)]/50 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                        <Cpu size={14} className="text-[var(--safety-mint)]" />
                      </div>
                    </div>
                  ),
                },
                {
                  step: '03',
                  title: '03 — Risk Analysis',
                  desc: 'Evaluates drowsiness, distraction and potential weapon threats using detection logic.',
                  badgeColor: 'linear-gradient(180deg, #F59E0B 0%, #B45309 100%)',
                  badgeBorderBottom: '#78350F',
                  badgeShadow: 'rgba(217, 119, 6, 0.55)',
                  tagIcon: ShieldCheck,
                  tagColor: 'text-[var(--warning-amber)]',
                  tagText: 'Multi-Vector Logic',
                  renderVisual: () => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Risk Evaluation Matrix Radar & Nodes */}
                      <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden="true">
                        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--warning-amber)" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                        <circle cx="50" cy="50" r="24" fill="none" stroke="var(--warning-amber)" strokeWidth="1" opacity="0.25" />
                        {/* 3 Evaluating Risk Vector Axis lines */}
                        <line x1="50" y1="16" x2="50" y2="50" stroke="var(--warning-amber)" strokeWidth="1.5" opacity="0.7" />
                        <line x1="50" y1="50" x2="22" y2="68" stroke="var(--warning-amber)" strokeWidth="1.5" opacity="0.7" />
                        <line x1="50" y1="50" x2="78" y2="68" stroke="var(--warning-amber)" strokeWidth="1.5" opacity="0.7" />
                        {/* 3 Risk Vector Status Indicator Nodes */}
                        <circle cx="50" cy="16" r="3.5" fill="var(--primary-blue)" className="anim-neural-pulse" />
                        <circle cx="22" cy="68" r="3.5" fill="var(--warning-amber)" className="anim-neural-pulse" style={{ animationDelay: '0.7s' }} />
                        <circle cx="78" cy="68" r="3.5" fill="var(--alert-coral)" className="anim-neural-pulse" style={{ animationDelay: '1.4s' }} />
                        {/* Risk Boundary Triangle Polygon */}
                        <polygon points="50,22 28,64 72,64" fill="var(--warning-amber)" fillOpacity="0.12" stroke="var(--warning-amber)" strokeWidth="1" strokeDasharray="2 2" />
                      </svg>
                      {/* Center Shield Logic Indicator */}
                      <div className="absolute w-7 h-7 rounded-lg bg-[var(--warning-amber)]/20 border border-[var(--warning-amber)]/60 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                        <ShieldCheck size={14} className="text-[var(--warning-amber)]" />
                      </div>
                    </div>
                  ),
                },
                {
                  step: '04',
                  title: '04 — Real-Time Alerts',
                  desc: 'Generates immediate visual and audio warnings when potentially dangerous conditions are detected.',
                  badgeColor: 'linear-gradient(180deg, #F43F5E 0%, #BE123C 100%)',
                  badgeBorderBottom: '#881337',
                  badgeShadow: 'rgba(225, 29, 72, 0.55)',
                  tagIcon: Zap,
                  tagColor: 'text-[var(--alert-coral)]',
                  tagText: 'Instant Warning',
                  renderVisual: () => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Alert Soundwave Broadcast Pulse Simulation */}
                      <svg viewBox="0 0 100 100" className="w-24 h-24" aria-hidden="true">
                        <circle cx="50" cy="50" r="18" fill="none" stroke="var(--alert-coral)" strokeWidth="2" className="anim-soundwave" />
                        <circle cx="50" cy="50" r="28" fill="none" stroke="var(--alert-coral)" strokeWidth="1.5" className="anim-soundwave-delayed" />
                        {/* Radiating Broadcast Wave Arcs */}
                        <path d="M72,32 A30,30 0 0,1 72,68" fill="none" stroke="var(--alert-coral)" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <path d="M28,32 A30,30 0 0,0 28,68" fill="none" stroke="var(--alert-coral)" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <path d="M82,24 A42,42 0 0,1 82,76" fill="none" stroke="var(--alert-coral)" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
                        <path d="M18,24 A42,42 0 0,0 18,76" fill="none" stroke="var(--alert-coral)" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
                      </svg>
                      {/* Center Alert Beacon */}
                      <div className="absolute w-8 h-8 rounded-full bg-rose-500/25 border border-rose-400/70 flex items-center justify-center shadow-[0_0_18px_rgba(244,63,94,0.6)]">
                        <Zap size={15} className="text-white fill-white" />
                      </div>
                    </div>
                  ),
                },
              ].map((st, i) => {
                const TagIcon = st.tagIcon;
                return (
                  <div 
                    key={st.step} 
                    className="clay-process-card flex flex-col justify-between group select-none"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    <div>
                      {/* Step Header with 3D Numbered Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="clay-step-badge"
                          style={{
                            background: st.badgeColor,
                            borderTop: '1.5px solid rgba(255, 255, 255, 0.75)',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                            borderBottom: `3px solid ${st.badgeBorderBottom}`,
                            boxShadow: `0 10px 22px -3px ${st.badgeShadow}, inset 0 1.5px 1.5px rgba(255, 255, 255, 0.8), inset 0 -1.5px 2px rgba(0, 0, 0, 0.35)`
                          }}
                        >
                          <span>{st.step}</span>
                        </div>

                        {/* Telemetry Status Chip */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[9px] font-mono font-semibold text-[var(--text-muted)]">
                          <TagIcon size={11} className={st.tagColor} />
                          <span>{st.tagText}</span>
                        </div>
                      </div>

                      {/* 3D Animated Instrument Stage */}
                      <div className="process-visual-well mb-5">
                        {st.renderVisual()}
                      </div>

                      {/* Card Title with Ultra-Condensed Antonio Display Font */}
                      <h3 className="font-display uppercase text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary-blue)] transition-colors">
                        {st.title}
                      </h3>

                      {/* Card Description */}
                      <p className="font-sans text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================
          INTERACTIVE SIMULATION MODE — 4 MINIATURE AUTOMOTIVE CONSOLES
          ============================================================ */}
      <section id="demo" className="py-24 sm:py-28 border-b border-[var(--border)] bg-[var(--bg-main)] relative overflow-hidden">
        
        {/* Subtle background ambient lighting glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(53, 120, 198, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 72%)',
            filter: 'blur(75px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Main Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-4">
            <div>
              <span 
                className="btn-3d-module btn-3d-module-blue inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl text-xs font-mono font-bold tracking-wider uppercase cursor-default select-none shadow-md"
                style={{
                  background: 'linear-gradient(180deg, #3B86DE 0%, #205CA3 100%)',
                  borderTop: '1.5px solid rgba(255, 255, 255, 0.75)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRight: '1px solid rgba(0, 0, 0, 0.15)',
                  borderBottom: '3px solid rgba(13, 39, 72, 0.95)',
                  boxShadow: '0 10px 24px -3px rgba(41, 102, 176, 0.45), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.75)'
                }}
              >
                <Sparkles size={13} className="text-white" />
                <span>INTERACTIVE SIMULATION MODE</span>
              </span>
            </div>

            <h2 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl leading-none tracking-tight text-[var(--text-primary)]">
              Experience the Safety Telemetry
            </h2>

            <p className="font-sans text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto pt-1">
              Select any of the four miniature vehicle monitoring consoles below to evaluate live neural heuristics, measurement scales, directional instruments and graduated safety protocols.
            </p>

            {/* 3D Scenario Switcher Buttons (Exact Button Style from User Reference) */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDemoMode('normal')}
                className={`px-6 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all ${
                  demoMode === 'normal'
                    ? 'btn-3d-primary shadow-lg'
                    : 'btn-3d-secondary'
                }`}
              >
                NORMAL FOCUS
              </button>

              <button
                type="button"
                onClick={() => setDemoMode('drowsy')}
                className={`px-6 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all ${
                  demoMode === 'drowsy'
                    ? 'btn-3d-primary shadow-lg'
                    : 'btn-3d-secondary'
                }`}
              >
                SIMULATE DROWSINESS
              </button>

              <button
                type="button"
                onClick={() => setDemoMode('distracted')}
                className={`px-6 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all ${
                  demoMode === 'distracted'
                    ? 'btn-3d-primary shadow-lg'
                    : 'btn-3d-secondary'
                }`}
              >
                SIMULATE DISTRACTION
              </button>

              <button
                type="button"
                onClick={() => setDemoMode('threat')}
                className={`px-6 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all ${
                  demoMode === 'threat'
                    ? 'btn-3d-primary shadow-lg'
                    : 'btn-3d-secondary'
                }`}
              >
                SIMULATE THREAT OBJECT
              </button>
            </div>

            {/* Simulation Guardrail Notice */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                SIMULATION MODE • NON-CONVICTIVE TELEMETRY
              </span>
              {demoMode !== 'normal' && (
                <button
                  type="button"
                  onClick={() => setDemoMode('normal')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--safety-mint)]/15 border border-[var(--safety-mint)]/30 text-[10px] font-mono text-[var(--safety-mint)] font-bold hover:bg-[var(--safety-mint)]/25 transition-all cursor-pointer select-none"
                >
                  <span>↺ Reset to Normal Focus</span>
                </button>
              )}
            </div>
          </div>

          {/* DYNAMIC SINGLE DASHBOARD CONSOLE CONTAINER — ONLY ONE ACTIVE AT A TIME */}
          <div className="max-w-4xl mx-auto mt-6">
            
            {/* ========================================================
                DASHBOARD 01 — NORMAL FOCUS CONSOLE
                ======================================================== */}
            {demoMode === 'normal' && (
              <div key="dashboard-normal" className="cockpit-instrument-console anim-console-fadein p-6 sm:p-8 space-y-6">
                
                {/* Console Bezel Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]/60">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xs font-mono font-bold text-[var(--primary-blue)] shadow-inner">
                      01
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                        CONSOLE INST-01 • PRIMARY ATTENTION MONITOR
                      </span>
                      <h3 className="font-display uppercase text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
                        Normal Focus Console
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-[var(--safety-mint)] border border-emerald-500/30 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--safety-mint)] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    STATUS: SAFE / FOCUSED
                  </span>
                </div>

                {/* Primary Instrument Cluster: Circular EAR Gauge + Eye Status Viewport */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  
                  {/* Large Circular EAR Gauge with Numerical Ratio */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm">
                    <div className="cockpit-gauge-bezel">
                      <svg className="w-full h-full transform -rotate-90 p-2" viewBox="0 0 100 100">
                        {/* Background Dial Track */}
                        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="transparent" />
                        {/* Threshold Indicator Line at 0.18 */}
                        <circle cx="50" cy="50" r="40" stroke="var(--alert-coral)" strokeWidth="6" fill="transparent" strokeDasharray="2 250" strokeDashoffset="-90" opacity="0.6" />
                        {/* Active Gauge Value (0.292 out of 0.35) */}
                        <circle cx="50" cy="50" r="40" stroke="var(--safety-mint)" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * (0.292 / 0.35))} strokeLinecap="round" />
                      </svg>
                      {/* Gauge Numerical Readout */}
                      <div className="absolute flex flex-col items-center">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">EAR RATIO</span>
                        <span className="text-2xl font-bold font-mono text-[var(--safety-mint)]">0.292</span>
                        <span className="text-[9px] font-mono text-[var(--text-secondary)]">NOMINAL</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--safety-mint)] mt-3 font-bold tracking-wider">
                      SAFETY SCORE: 97 / 100
                    </span>
                  </div>

                  {/* Eye-Open Status Indicator & Monitoring Viewport */}
                  <div className="sm:col-span-7 cockpit-crt-screen p-5 h-44 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                      <span>MONITOR: 1080P CABIN IR</span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE 30FPS • ACTIVE
                      </span>
                    </div>

                    {/* Calibrated Eyelid Geometry Graphic */}
                    <div className="flex items-center justify-center my-auto">
                      <svg viewBox="0 0 120 46" className="w-36 h-16" aria-hidden="true">
                        <path d="M10 23 Q60 2 110 23 Q60 44 10 23 Z" fill="rgba(16,185,129,0.08)" stroke="var(--safety-mint)" strokeWidth="2" />
                        <circle cx="60" cy="23" r="8" fill="none" stroke="var(--safety-mint)" strokeWidth="1.2" strokeDasharray="2 2" />
                        <circle cx="60" cy="23" r="3.5" fill="var(--safety-mint)" />
                        <line x1="45" y1="12" x2="45" y2="34" stroke="var(--safety-mint)" strokeWidth="1.4" strokeDasharray="2 2" />
                        <line x1="75" y1="12" x2="75" y2="34" stroke="var(--safety-mint)" strokeWidth="1.4" strokeDasharray="2 2" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)]">
                      <span>P1..P6 VECTOR: CALIBRATED</span>
                      <span className="text-[var(--safety-mint)] font-bold">EYES OPEN (100% STABLE)</span>
                    </div>
                  </div>

                </div>

                {/* Secondary Measurement Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Head Pose</span>
                    <span className="font-bold text-[var(--text-primary)] text-sm">+2.1° / −3.0°</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Attention Stability</span>
                    <span className="font-bold text-[var(--safety-mint)] text-sm">97% Steady</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Face Mesh</span>
                    <span className="font-bold text-[var(--text-primary)] text-sm">468 Pts Locked</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Blink Cadence</span>
                    <span className="font-bold text-[var(--text-primary)] text-sm">18 Blinks/Min</span>
                  </div>
                </div>

                {/* Live Monitoring Waveform */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1.5">
                    <span>LIVE ATTENTION WAVEFORM (30S WINDOW)</span>
                    <span className="text-[var(--safety-mint)] font-bold">STEADY FREQUENCY • NOMINAL GAZE</span>
                  </div>
                  <div className="h-8 overflow-hidden relative flex items-center">
                    <svg viewBox="0 0 200 24" className="w-full h-full text-[var(--safety-mint)]" aria-hidden="true">
                      <path d="M0 12 Q20 2, 40 12 T80 12 T120 12 T160 12 T200 12" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Console Footer Status */}
                <div className="pt-4 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--safety-mint)]" />
                    TELEMETRY FEED: 60FPS SYNCHRONIZED • ZERO WARNINGS
                  </span>
                  <span className="text-[var(--safety-mint)] font-bold">
                    SYSTEM STATE: NOMINAL DRIVER FOCUS
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================
                DASHBOARD 02 — SIMULATE DROWSINESS CONSOLE
                ======================================================== */}
            {demoMode === 'drowsy' && (
              <div key="dashboard-drowsy" className="cockpit-instrument-console anim-console-fadein p-6 sm:p-8 space-y-6">
                
                {/* Console Bezel Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]/60">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold text-[var(--warning-amber)] shadow-inner">
                      02
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                        CONSOLE INST-02 • FATIGUE &amp; MICROSLEEP INSTRUMENT
                      </span>
                      <h3 className="font-display uppercase text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
                        Fatigue &amp; Microsleep Console
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-[var(--warning-amber)] border border-amber-500/30 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning-amber)] animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    DROWSINESS DETECTED
                  </span>
                </div>

                {/* Primary Instrument Cluster: Circular Depressed EAR Gauge + Drooping Eyelid Viewport */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  
                  {/* Large EAR Circular Gauge with Depressed Value */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm">
                    <div className="cockpit-gauge-bezel">
                      <svg className="w-full h-full transform -rotate-90 p-2" viewBox="0 0 100 100">
                        {/* Background Dial Track */}
                        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="transparent" />
                        {/* Breached Gate Reference Line at 0.18 */}
                        <circle cx="50" cy="50" r="40" stroke="var(--alert-coral)" strokeWidth="7" fill="transparent" strokeDasharray="3 250" strokeDashoffset="-85" />
                        {/* Depressed Gauge Value (0.148 out of 0.35) */}
                        <circle cx="50" cy="50" r="40" stroke="var(--alert-coral)" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * (0.148 / 0.35))} strokeLinecap="round" />
                      </svg>
                      {/* Gauge Numerical Readout */}
                      <div className="absolute flex flex-col items-center">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">EAR RATIO</span>
                        <span className="text-2xl font-bold font-mono text-[var(--alert-coral)] animate-pulse">0.148</span>
                        <span className="text-[9px] font-mono text-[var(--alert-coral)] font-bold">&lt; 0.18 GATE</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--alert-coral)] mt-3 font-bold tracking-wider">
                      SAFETY SCORE: 68 / 100
                    </span>
                  </div>

                  {/* Eye-Closure Duration Timer & Drooping Eyelid Viewport */}
                  <div className="sm:col-span-7 cockpit-crt-screen p-5 h-44 flex flex-col justify-between bg-amber-500/5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-400">
                      <span>ALERT GATE: PROLONGED CLOSURE</span>
                      <span className="flex items-center gap-1.5 font-bold text-[var(--alert-coral)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--alert-coral)] animate-pulse" />
                        CLOSURE &gt; 1.8s GATE BREACHED
                      </span>
                    </div>

                    {/* Drooping/Closed Eyelid Silhouette */}
                    <div className="flex items-center justify-center my-auto">
                      <svg viewBox="0 0 120 46" className="w-36 h-16" aria-hidden="true">
                        <path d="M10 23 Q60 17 110 23 Q60 29 10 23 Z" fill="rgba(244,63,94,0.15)" stroke="var(--alert-coral)" strokeWidth="2.5" className="anim-eye-drowsy" />
                        <circle cx="60" cy="23" r="2" fill="var(--alert-coral)" />
                        <line x1="45" y1="20" x2="45" y2="26" stroke="var(--alert-coral)" strokeWidth="1.8" />
                        <line x1="75" y1="20" x2="75" y2="26" stroke="var(--alert-coral)" strokeWidth="1.8" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-[var(--alert-coral)]">
                      <span className="font-bold">CONTINUOUS CLOSURE: 2.1s</span>
                      <span className="font-bold">STAGE 2 CHIME ACTIVE</span>
                    </div>
                  </div>

                </div>

                {/* Secondary Measurement Matrix: MAR Meter + Microsleep Indicator + Risk Level */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Microsleep State</span>
                    <span className="font-bold text-[var(--alert-coral)] text-sm">GATE ACTIVE</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">MAR Ratio (Yawn)</span>
                    <span className="font-bold text-[var(--warning-amber)] text-sm">0.68 (Elevated)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Fatigue Risk Level</span>
                    <span className="font-bold text-[var(--alert-coral)] text-sm">CRITICAL TIER</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Alert Marker</span>
                    <span className="font-bold text-[var(--alert-coral)] text-sm">0.180 Threshold</span>
                  </div>
                </div>

                {/* Animated Eye-Closure Waveform (Flattening Line) */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1.5">
                    <span>EYE ACTIVITY WAVEFORM</span>
                    <span className="text-[var(--alert-coral)] font-bold">FLATTENED CLOSURE PERIOD (2.1s SUSTAINED)</span>
                  </div>
                  <div className="h-8 overflow-hidden relative flex items-center">
                    <svg viewBox="0 0 200 24" className="w-full h-full text-[var(--alert-coral)]" aria-hidden="true">
                      <path d="M0 12 L50 12 Q55 2 60 12 L140 12 Q145 2 150 12 L200 12" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                </div>

                {/* Console Footer Status */}
                <div className="pt-4 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--alert-coral)] animate-pulse" />
                    ACOUSTIC WARNING: MULTI-FREQ HARMONIC ALERT TRANSMITTING
                  </span>
                  <span className="text-[var(--alert-coral)] font-bold">
                    SYSTEM STATE: GRADUATED DROWSINESS WARNING
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================
                DASHBOARD 03 — SIMULATE DISTRACTION CONSOLE
                ======================================================== */}
            {demoMode === 'distracted' && (
              <div key="dashboard-distracted" className="cockpit-instrument-console anim-console-fadein p-6 sm:p-8 space-y-6">
                
                {/* Console Bezel Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]/60">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-xs font-mono font-bold text-orange-500 shadow-inner">
                      03
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                        CONSOLE INST-03 • HEAD-POSE &amp; ATTENTION CONSOLE
                      </span>
                      <h3 className="font-display uppercase text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
                        Distraction Console
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-[var(--warning-amber)] border border-amber-500/30 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    DEVIATION ALERT
                  </span>
                </div>

                {/* Primary Instrument Cluster: Directional Compass + Deflection Viewport */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  
                  {/* Circular Directional Compass for Head Orientation */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm">
                    <div className="cockpit-gauge-bezel">
                      <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                        {/* Compass Base Ring */}
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
                        {/* Reference Axis */}
                        <line x1="50" y1="12" x2="50" y2="88" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1="12" y1="50" x2="88" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
                        {/* Compass Needle deflecting off-center to +34.2 degrees */}
                        <g className="anim-needle-deflect" style={{ transformOrigin: '50px 50px' }}>
                          <line x1="50" y1="50" x2="78" y2="24" stroke="var(--warning-amber)" strokeWidth="2.8" strokeLinecap="round" />
                          <polygon points="78,24 71,28 77,34" fill="var(--warning-amber)" />
                        </g>
                        <circle cx="50" cy="50" r="4.5" fill="var(--deep-navy)" stroke="var(--warning-amber)" strokeWidth="2" />
                      </svg>
                      {/* Compass Center Readout */}
                      <div className="absolute bottom-3 text-center">
                        <span className="text-xs font-bold font-mono text-[var(--warning-amber)]">+34.2° YAW</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--warning-amber)] mt-3 font-bold tracking-wider">
                      SAFETY SCORE: 74 / 100
                    </span>
                  </div>

                  {/* Face Tracking Indicator & Directional Left/Right/Up/Down */}
                  <div className="sm:col-span-7 cockpit-crt-screen p-5 h-44 flex flex-col justify-between bg-orange-500/5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-400">
                      <span>GAZE TRACKER: 6-DOF PNP</span>
                      <span className="font-bold text-[var(--warning-amber)]">PHONE / LAP GAZE DETECTED</span>
                    </div>

                    {/* Directional Left/Right/Up/Down Indicators */}
                    <div className="flex items-center justify-center my-auto gap-4">
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-mono font-bold">
                        <span className="opacity-0">.</span>
                        <span className="px-2.5 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">UP</span>
                        <span className="opacity-0">.</span>
                        <span className="px-2.5 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">LEFT</span>
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">0°</span>
                        <span className="px-2.5 py-1 rounded bg-amber-500 text-white font-black animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]">RIGHT</span>
                        <span className="opacity-0">.</span>
                        <span className="px-2.5 py-1 rounded bg-amber-500 text-white font-black animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]">DOWN</span>
                        <span className="opacity-0">.</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-[var(--warning-amber)]">
                      <span>DISTRACTION TIMER: &gt; 2.4s</span>
                      <span className="font-bold">STAGE 1 VISUAL NOTIFICATION</span>
                    </div>
                  </div>

                </div>

                {/* Secondary Measurement Matrix: Numerical Yaw/Pitch + Attention % */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Yaw Angle</span>
                    <span className="font-bold text-[var(--warning-amber)] text-sm">+34.2° (Exceeds)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Pitch Angle</span>
                    <span className="font-bold text-[var(--warning-amber)] text-sm">−26.0° Down</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Road Attention</span>
                    <span className="font-bold text-[var(--warning-amber)] text-sm">28% (Critical)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Deviation Vector</span>
                    <span className="font-bold text-[var(--warning-amber)] text-sm">43.0° Mag</span>
                  </div>
                </div>

                {/* Attention Deviation Meter Bar */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1.5">
                    <span>ATTENTION DEVIATION METER</span>
                    <span className="text-[var(--warning-amber)] font-bold">OFF-ROAD BOUNDARY BREACHED (72% DEFLECTION)</span>
                  </div>
                  <div className="w-full bg-[var(--bg-main)] h-3 rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full w-[72%] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  </div>
                </div>

                {/* Console Footer Status */}
                <div className="pt-4 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--warning-amber)] animate-pulse" />
                    CALIBRATED SAFE CONE: ±18° YAW / ±12° PITCH
                  </span>
                  <span className="text-[var(--warning-amber)] font-bold">
                    SYSTEM STATE: RECENTER HEAD POSE
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================
                DASHBOARD 04 — SIMULATE THREAT OBJECT CONSOLE
                ======================================================== */}
            {demoMode === 'threat' && (
              <div key="dashboard-threat" className="cockpit-instrument-console anim-console-fadein p-6 sm:p-8 space-y-6">
                
                {/* Console Bezel Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]/60">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-xs font-mono font-bold text-[var(--alert-coral)] shadow-inner">
                      04
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                        CONSOLE INST-04 • CV THREAT DETECTION CONSOLE
                      </span>
                      <h3 className="font-display uppercase text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]">
                        Threat Object Console
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-[var(--alert-coral)] border border-rose-500/30 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--alert-coral)] animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                    CANDIDATE FLAGGED
                  </span>
                </div>

                {/* Primary Instrument Cluster: Confidence Gauge + Object Viewport */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  
                  {/* Detection Confidence Gauge */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm">
                    <div className="cockpit-gauge-bezel">
                      <svg className="w-full h-full transform -rotate-90 p-2" viewBox="0 0 100 100">
                        {/* Background Dial Track */}
                        <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="transparent" />
                        {/* Active Confidence Level (0.86) */}
                        <circle cx="50" cy="50" r="40" stroke="var(--alert-coral)" strokeWidth="6" fill="transparent" strokeDasharray="251" strokeDashoffset={251 - (251 * 0.86)} strokeLinecap="round" />
                      </svg>
                      {/* Gauge Numerical Readout */}
                      <div className="absolute flex flex-col items-center">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">CONFIDENCE</span>
                        <span className="text-2xl font-bold font-mono text-[var(--alert-coral)] animate-pulse">86%</span>
                        <span className="text-[9px] font-mono text-[var(--alert-coral)] font-bold">DISPATCH QUEUED</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--alert-coral)] mt-3 font-bold tracking-wider">
                      SAFETY SCORE: 62 / 100
                    </span>
                  </div>

                  {/* Central Object Detection Viewport with Bounding Box */}
                  <div className="sm:col-span-7 cockpit-crt-screen p-5 h-44 flex flex-col justify-between bg-rose-500/5 relative">
                    {/* Scanning Laser Line Sweeping Vertically */}
                    <div className="threat-scan-line" />

                    <div className="flex items-center justify-between text-[10px] font-mono text-rose-400">
                      <span>VIEWPORT: QUANTIZED INFERENCE</span>
                      <span className="font-bold text-[var(--alert-coral)]">HOLD FOR VERIFY</span>
                    </div>

                    {/* Animated Bounding Box Around Simulated Object */}
                    <div className="flex items-center justify-center my-auto">
                      <svg viewBox="0 0 120 46" className="w-36 h-16" aria-hidden="true">
                        <rect x="25" y="6" width="70" height="34" rx="2" fill="rgba(244,63,94,0.12)" stroke="var(--alert-coral)" strokeWidth="1.5" strokeDasharray="4 2" className="bounding-box-pulse" />
                        {/* Corner Brackets */}
                        <path d="M25 14 L25 6 L33 6" fill="none" stroke="var(--alert-coral)" strokeWidth="2.5" />
                        <path d="M87 6 L95 6 L95 14" fill="none" stroke="var(--alert-coral)" strokeWidth="2.5" />
                        <path d="M25 30 L25 38 L33 38" fill="none" stroke="var(--alert-coral)" strokeWidth="2.5" />
                        <path d="M87 38 L95 38 L95 30" fill="none" stroke="var(--alert-coral)" strokeWidth="2.5" />
                        <circle cx="60" cy="22" r="4" fill="none" stroke="var(--alert-coral)" strokeWidth="1" />
                        <line x1="56" y1="22" x2="64" y2="22" stroke="var(--alert-coral)" strokeWidth="1" />
                        <line x1="60" y1="18" x2="60" y2="26" stroke="var(--alert-coral)" strokeWidth="1" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-[var(--alert-coral)]">
                      <span className="font-bold">CLASS: HANDGUN_CANDIDATE</span>
                      <span className="text-white font-bold">SILENT LOG #904 QUEUED</span>
                    </div>
                  </div>

                </div>

                {/* Secondary Measurement Matrix: Classification + Threat Status + Scanning Progress */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Classification</span>
                    <span className="font-bold text-[var(--alert-coral)] text-sm">Handgun Candidate</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Scanning Engine</span>
                    <span className="font-bold text-[var(--text-primary)] text-sm">30 FPS • 14ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Threat State</span>
                    <span className="font-bold text-[var(--alert-coral)] text-sm">Candidate Flag</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Human Verification</span>
                    <span className="font-bold text-[var(--safety-mint)] text-sm">Human-in-Loop</span>
                  </div>
                </div>

                {/* Alert Notification Panel */}
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert size={16} className="text-[var(--alert-coral)] shrink-0" />
                    <span className="text-[10px] text-[var(--alert-coral)] font-bold">
                      ALERT NOTIFICATION: DISPATCH HOLD QUEUED • SILENT AUDIT PACKET
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-[var(--alert-coral)] border border-rose-500/30 font-bold uppercase">
                    Unconfirmed
                  </span>
                </div>

                {/* Console Footer Status */}
                <div className="pt-4 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--alert-coral)] animate-pulse" />
                    FRAME TIME: 14.2MS • INFERENCE ON EDGE NPU
                  </span>
                  <span className="text-[var(--alert-coral)] font-bold">
                    SYSTEM STATE: SILENT MONITORING (NO FALSE CABIN ALARM)
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ============================================================
          PREMIUM 3D CLAYMORPHISM CTA SECTION
          ============================================================ */}
      <section
        className="py-28 sm:py-36 select-none relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 100%, #203440 0%, #121e28 55%, #0d161e 100%)' }}
      >

        {/* Deep background ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(53,120,198,0.22) 0%, transparent 70%)', filter: 'blur(80px)', transform: 'translateY(-30%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(67,182,154,0.18) 0%, transparent 70%)', filter: 'blur(80px)', transform: 'translateY(30%)' }} />
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(53,120,198,0.08) 0%, transparent 65%)', filter: 'blur(60px)', transform: 'translate(-50%,-50%)' }} />
        </div>

        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">

          {/* Eyebrow label */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider text-white/80 border border-white/15"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}>
              <Zap size={12} className="text-[var(--safety-mint)]" />
              DriveGuard AI — Live Protection System
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="font-display uppercase text-center text-6xl sm:text-7xl md:text-8xl leading-none tracking-tight text-white mb-6"
            style={{ textShadow: '0 2px 30px rgba(53,120,198,0.3), 0 0 60px rgba(67,182,154,0.15)' }}>
            Ready to Protect<br />
            <span className="cta-heading-gradient">Every Mile?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-center font-sans text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-14">
            Equip your vehicle or entire commercial fleet with real-time AI computer vision driver safety — drowsiness, distraction and threat detection in one unified platform.
          </p>

          {/* 3D Clay CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">

            {/* Primary — Launch Driver Cockpit (Green / Mint) */}
            <Link href="/driver/monitor" className="cta-btn-primary group">
              <span className="cta-btn-primary-inner flex items-center gap-3 px-8 py-4">
                <span className="cta-btn-icon-wrap bg-white/20 rounded-xl p-2 shadow-inner group-hover:bg-white/28 transition-colors">
                  <Camera size={20} className="text-white" />
                </span>
                <span className="flex flex-col items-start">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/70 leading-none mb-0.5">Driver Portal</span>
                  <span className="text-base font-display uppercase tracking-wide text-white leading-tight">Launch Driver Cockpit</span>
                </span>
                <ChevronRight size={18} className="text-white/70 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Secondary — Open Fleet Operations (Outlined / Navy) */}
            <Link href="/admin" className="cta-btn-secondary group">
              <span className="cta-btn-secondary-inner flex items-center gap-3 px-8 py-4">
                <span className="cta-btn-icon-wrap bg-white/10 rounded-xl p-2 shadow-inner group-hover:bg-white/16 transition-colors">
                  <Radio size={20} className="text-[var(--sensor-blue)]" />
                </span>
                <span className="flex flex-col items-start">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 leading-none mb-0.5">Fleet Management</span>
                  <span className="text-base font-display uppercase tracking-wide text-white leading-tight">Open Fleet Operations</span>
                </span>
                <ChevronRight size={18} className="text-white/40 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

          </div>

          {/* Trust indicators strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-14 pt-10 border-t border-white/10">
            {[
              { icon: <ShieldCheck size={15} className="text-[var(--safety-mint)]" />, label: 'Real-Time AI Detection' },
              { icon: <Eye size={15} className="text-[var(--sensor-blue)]" />, label: '468-Point Face Mesh' },
              { icon: <Cpu size={15} className="text-[var(--warning-amber)]" />, label: 'Edge NPU Inference' },
              { icon: <Zap size={15} className="text-[var(--alert-coral)]" />, label: 'Instant Audio Alerts' },
            ].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs font-mono text-white/45 tracking-wider uppercase">
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================
          PREMIUM 3D CLAYMORPHISM FOOTER
          ============================================================ */}
      <footer className="bg-[var(--bg-main)] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Main footer clay card */}
          <div className="clay-footer-card px-6 sm:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

              {/* Brand identity */}
              <div className="flex items-center gap-3 select-none">
                {/* Clay logo badge */}
                <div className="clay-footer-logo w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={17} className="text-[var(--primary-blue)]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display uppercase text-base tracking-tight text-[var(--text-primary)]">
                    DriveGuard AI
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                    Stay Alert. Stay Protected.
                  </span>
                </div>
              </div>

              {/* Navigation links — 3D Blue Buttons matching Header */}
              <nav className="flex flex-wrap items-center gap-2.5 sm:gap-3" aria-label="Footer navigation">
                <Link href="/driver">
                  <button
                    type="button"
                    className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all shadow-md"
                  >
                    Driver Portal
                  </button>
                </Link>
                <Link href="/admin">
                  <button
                    type="button"
                    className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all shadow-md"
                  >
                    Fleet Admin
                  </button>
                </Link>
                <Link href="/login">
                  <button
                    type="button"
                    className="btn-3d-primary px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer select-none transition-all shadow-md"
                  >
                    Sign In
                  </button>
                </Link>
              </nav>

            </div>

            {/* Bottom strip — divider + copyright */}
            <div className="mt-5 pt-4 border-t border-[var(--border)]/60 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                © 2026 DriveGuard AI · All rights reserved
              </span>
              <div className="flex items-center gap-4">
                {[
                  { icon: <ShieldCheck size={11} />, label: 'Real-Time AI' },
                  { icon: <Eye size={11} />, label: 'Face Mesh' },
                  { icon: <Cpu size={11} />, label: 'Edge NPU' },
                ].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                    <span className="text-[var(--primary-blue)]">{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
