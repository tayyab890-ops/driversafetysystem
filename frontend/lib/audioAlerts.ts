// Web Audio API Synthesizer for automotive active safety audio alerts
// Compliant with automotive ADAS warning sound standards (ISO 15008 / SAE J2808)

export interface AudioAlertConfig {
  masterVolume: number;
  maxSafeGain: number;
  warningDurationSec: number;
  defaultCooldownMs: number;
  globalCooldownMs: number;
  criticalCooldownMs: number;
}

export const AUDIO_CONFIG: AudioAlertConfig = {
  masterVolume: 0.82,            // Clearly audible volume ceiling (0.0 to 1.0)
  maxSafeGain: 0.85,             // Maximum per-tone gain before limiting
  warningDurationSec: 4.5,       // Target warning sequence duration (~4.5 seconds)
  defaultCooldownMs: 5000,       // Minimum gap between identical alert repeats (5s)
  globalCooldownMs: 3000,        // Minimum gap between non-critical alert sequences (3s)
  criticalCooldownMs: 3500,      // Minimum gap for critical alerts (3.5s)
};

export type AlertPriority = 1 | 2 | 3; // 1 = Caution, 2 = Warning, 3 = Critical

interface ActiveAlertSession {
  priority: AlertPriority;
  category: string;
  startedAt: number;
  expectedEndTime: number;
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  timerIds: (NodeJS.Timeout | number)[];
  stop: () => void;
  isContinuous?: boolean;
}

class AudioAlertSystem {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private masterVolume: number = AUDIO_CONFIG.masterVolume;
  private soundEnabled: boolean = true;
  private activeAlert: ActiveAlertSession | null = null;
  private lastAlertTimes: Map<string, number> = new Map();
  private globalLastAlertTime: number = 0;

  // Initialize or resume AudioContext
  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();

      // Dynamics compressor acts as a brickwall limiter to ensure zero digital clipping
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-4, this.ctx.currentTime);
      this.compressorNode.knee.setValueAtTime(6, this.ctx.currentTime);
      this.compressorNode.ratio.setValueAtTime(10, this.ctx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressorNode.release.setValueAtTime(0.05, this.ctx.currentTime);

      // Master output gain
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

      this.compressorNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => {
        console.warn('[AudioAlertSystem] AudioContext resume failed:', err);
      });
    }

    return true;
  }

  /**
   * Explicitly resume AudioContext on user gesture (e.g. clicking 'Start Monitoring')
   * to satisfy modern browser autoplay security policies.
   */
  public async ensureAudioContext(): Promise<AudioContext | null> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('[AudioAlertSystem] Could not resume audio context:', err);
      }
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopCurrentAlert();
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0.0, Math.min(1.0, volume));
    if (this.ctx && this.masterGainNode) {
      this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Stop an active alert immediately.
   * If category is specified, only stops if that category is currently active.
   */
  public stopAlert(category?: string) {
    if (!this.activeAlert) return;
    if (category && this.activeAlert.category !== category) {
      return;
    }
    this.stopCurrentAlert();
  }

  /**
   * Stop any actively playing warning sequence immediately.
   * Cancels oscillators, zeros gain nodes, and clears scheduled timers.
   */
  public stopCurrentAlert() {
    if (!this.activeAlert) return;
    const cat = this.activeAlert.category;

    try {
      this.activeAlert.stop();
      this.activeAlert.timerIds.forEach((t) => clearTimeout(t));

      const now = this.ctx ? this.ctx.currentTime : 0;
      this.activeAlert.gainNodes.forEach((gain) => {
        try {
          if (this.ctx) {
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(0.0, now);
          }
          gain.disconnect();
        } catch {
          // ignore already disconnected
        }
      });

      this.activeAlert.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore already stopped
        }
      });
    } catch (e) {
      console.warn('[AudioAlertSystem] Error stopping alert:', e);
    } finally {
      this.activeAlert = null;
      // Clear cooldown for this category so subsequent alarms trigger immediately without delay
      if (cat) {
        this.lastAlertTimes.delete(cat);
      }
      this.globalLastAlertTime = 0;
    }
  }

  /**
   * Check if an alert is currently active
   */
  public isAlertActive(category?: string): boolean {
    if (!this.activeAlert) return false;
    if (category) return this.activeAlert.category === category;
    return true;
  }

  /**
   * Start or maintain a continuous looping warning beep for an active safety condition.
   * Keeps playing continuously without stopping until stopAlert(category) or stopCurrentAlert() is called.
   */
  public startContinuousAlert(category: 'drowsiness' | 'distraction' | 'critical_warning') {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    const priority: AlertPriority = category === 'critical_warning' ? 3 : category === 'drowsiness' ? 3 : 2;

    // If an alert session is already running for this exact category in continuous mode, let it keep playing
    if (this.activeAlert && this.activeAlert.category === category && this.activeAlert.isContinuous) {
      return;
    }

    // If an alert of higher priority is currently active, do not downgrade it
    if (this.activeAlert && this.activeAlert.priority > priority) {
      return;
    }

    // Stop lower-priority or previous alert before starting new continuous alert
    if (this.activeAlert) {
      this.stopCurrentAlert();
    }

    let isRunning = true;
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const timerIds: (NodeJS.Timeout | number)[] = [];

    const stop = () => {
      isRunning = false;
      timerIds.forEach((t) => clearTimeout(t));
      const now = this.ctx ? this.ctx.currentTime : 0;
      gainNodes.forEach((g) => {
        try {
          if (this.ctx) {
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(0.0, now);
          }
          g.disconnect();
        } catch {}
      });
      oscillators.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {}
      });
    };

    const session: ActiveAlertSession = {
      priority,
      category,
      startedAt: Date.now(),
      expectedEndTime: Infinity, // Continuous loop!
      oscillators,
      gainNodes,
      timerIds,
      stop,
      isContinuous: true,
    };
    this.activeAlert = session;

    // Start continuous cycle schedule
    const scheduleNextCycle = () => {
      if (!isRunning || !this.ctx || !this.compressorNode || this.activeAlert !== session) {
        return;
      }

      const ctx = this.ctx;
      const targetComp = this.compressorNode;
      const startTime = ctx.currentTime + 0.01;

      // Clean up finished nodes from earlier cycles
      oscillators.length = 0;
      gainNodes.length = 0;

      let cycleDuration = 0.50; // seconds

      if (category === 'drowsiness') {
        // Alternating heavy wake-up tones (740 Hz & 932 Hz)
        this.scheduleAlertBeep(ctx, targetComp, 740, startTime, 0.16, 'sawtooth', 2000, 0.75, oscillators, gainNodes);
        this.scheduleAlertBeep(ctx, targetComp, 932, startTime + 0.24, 0.16, 'sawtooth', 2000, 0.75, oscillators, gainNodes);
        cycleDuration = 0.52;
      } else if (category === 'distraction') {
        // Urgent syncopated double-beeps (880 Hz & 1046 Hz)
        this.scheduleAlertBeep(ctx, targetComp, 880, startTime, 0.10, 'triangle', 2600, 0.75, oscillators, gainNodes);
        this.scheduleAlertBeep(ctx, targetComp, 1046, startTime + 0.16, 0.10, 'triangle', 2600, 0.75, oscillators, gainNodes);
        cycleDuration = 0.42;
      } else if (category === 'critical_warning') {
        // Rapid dual harmonic siren pulse
        [1046.5, 1318.5].forEach((freq, idx) => {
          this.scheduleAlertBeep(ctx, targetComp, freq, startTime, 0.10, idx === 0 ? 'sawtooth' : 'triangle', 2600, idx === 0 ? 0.70 : 0.50, oscillators, gainNodes);
          this.scheduleAlertBeep(ctx, targetComp, freq, startTime + 0.14, 0.10, idx === 0 ? 'sawtooth' : 'triangle', 2600, idx === 0 ? 0.70 : 0.50, oscillators, gainNodes);
        });
        cycleDuration = 0.38;
      }

      const timer = setTimeout(() => {
        scheduleNextCycle();
      }, Math.max(50, Math.floor((cycleDuration - 0.02) * 1000)));

      timerIds.push(timer);
    };

    scheduleNextCycle();
  }

  /**
   * Evaluates alert cooldown and priority.
   * Returns true if playback should proceed, false if blocked by cooldown or active higher-priority alert.
   */
  private shouldPlayAlert(category: string, priority: AlertPriority): boolean {
    if (!this.soundEnabled) return false;

    const now = Date.now();
    const isCritical = priority === 3;

    // Check currently active alert stream
    if (this.activeAlert) {
      if (now < this.activeAlert.expectedEndTime) {
        if (priority > this.activeAlert.priority) {
          // High-priority alert PREEMPTS and terminates lower-priority stream!
          this.stopCurrentAlert();
        } else {
          // Active stream of equal or higher priority is currently playing -> do not overlap!
          return false;
        }
      } else {
        this.activeAlert = null;
      }
    }

    // Check cooldowns
    const lastCategoryTime = this.lastAlertTimes.get(category) || 0;
    const categoryCooldown = isCritical ? AUDIO_CONFIG.criticalCooldownMs : AUDIO_CONFIG.defaultCooldownMs;
    if (now - lastCategoryTime < categoryCooldown) {
      return false;
    }

    // Check global cooldown unless critical
    if (!isCritical && now - this.globalLastAlertTime < AUDIO_CONFIG.globalCooldownMs) {
      return false;
    }

    return true;
  }

  private markAlertPlayed(category: string) {
    const now = Date.now();
    this.lastAlertTimes.set(category, now);
    this.globalLastAlertTime = now;
  }

  // =========================================================================
  // 1. Tactile Confirmation Beep (Short positive interaction chime)
  // =========================================================================
  public playAcknowledge() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.compressorNode);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (err) {
      console.warn('[AudioAlertSystem] playAcknowledge error:', err);
    }
  }

  // =========================================================================
  // 2. Critical Warning Pattern (Severe Drowsiness, Weapon, Critical Event)
  // Duration: ~4.6 seconds. Rapid high-urgency penetrating beeps.
  // =========================================================================
  public playCriticalWarning() {
    if (!this.shouldPlayAlert('critical_warning', 3)) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    const ctx = this.ctx;
    const targetComp = this.compressorNode;
    const startTime = ctx.currentTime + 0.02;
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const timerIds: (NodeJS.Timeout | number)[] = [];

    // 8 cycles of rapid emergency bursts (3 sharp pulses + rest)
    // Pulse: 110ms, Gap: 50ms, Cycle Rest: 150ms -> 0.58s per burst * 8 = 4.64s
    const burstCount = 8;
    const pulseDuration = 0.11;
    const pulseGap = 0.05;
    const burstCycleTime = 0.58;

    for (let b = 0; b < burstCount; b++) {
      const burstStart = startTime + b * burstCycleTime;

      for (let p = 0; p < 3; p++) {
        const pulseStart = burstStart + p * (pulseDuration + pulseGap);
        const pulseEnd = pulseStart + pulseDuration;

        // Dual harmonic oscillator for maximum penetration (1046 Hz C6 + 1318 Hz E6)
        [1046.5, 1318.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = idx === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, pulseStart);

          // Subtle pitch drop during pulse for authoritative automotive siren feel
          osc.frequency.exponentialRampToValueAtTime(freq * 0.96, pulseEnd);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, pulseStart);

          // Loud, punchy envelope
          const pulseGain = idx === 0 ? 0.65 : 0.45;
          gain.gain.setValueAtTime(0.001, pulseStart);
          gain.gain.linearRampToValueAtTime(pulseGain, pulseStart + 0.015);
          gain.gain.setValueAtTime(pulseGain, pulseEnd - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(targetComp);

          osc.start(pulseStart);
          osc.stop(pulseEnd + 0.01);

          oscillators.push(osc);
          gainNodes.push(gain);
        });
      }
    }

    const totalDuration = burstCount * burstCycleTime;
    const expectedEndTime = Date.now() + Math.ceil(totalDuration * 1000);

    const session: ActiveAlertSession = {
      priority: 3,
      category: 'critical_warning',
      startedAt: Date.now(),
      expectedEndTime,
      oscillators,
      gainNodes,
      timerIds,
      stop: () => {},
    };

    const cleanupTimer = setTimeout(() => {
      if (this.activeAlert === session) {
        this.activeAlert = null;
      }
    }, Math.ceil(totalDuration * 1000) + 100);
    timerIds.push(cleanupTimer);

    this.activeAlert = session;
    this.markAlertPlayed('critical_warning');
  }

  // Alias for severe drowsiness
  public playSevereDrowsinessAlert() {
    this.playCriticalWarning();
  }

  // =========================================================================
  // 3. Drowsiness Wake-Up Alert (High Severity / Prolonged Eye Closure)
  // Duration: ~4.4 seconds. Repeating heavy alternating wake-up pulses.
  // =========================================================================
  public playDrowsinessAlert() {
    if (!this.shouldPlayAlert('drowsiness', 2)) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    const ctx = this.ctx;
    const targetComp = this.compressorNode;
    const startTime = ctx.currentTime + 0.02;
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const timerIds: (NodeJS.Timeout | number)[] = [];

    // 7 cycles of alternating two-tone heavy alert beeps (~4.4s)
    const cycles = 7;
    const toneDur = 0.20;
    const pauseDur = 0.12;
    let t = startTime;

    for (let c = 0; c < cycles; c++) {
      // Tone A: 740 Hz (F#5)
      this.scheduleAlertBeep(ctx, targetComp, 740, t, toneDur, 'sawtooth', 1900, 0.70, oscillators, gainNodes);
      t += toneDur + pauseDur;

      // Tone B: 932 Hz (Bb5)
      this.scheduleAlertBeep(ctx, targetComp, 932, t, toneDur, 'sawtooth', 1900, 0.70, oscillators, gainNodes);
      t += toneDur + pauseDur;
    }

    const totalDuration = t - startTime;
    const expectedEndTime = Date.now() + Math.ceil(totalDuration * 1000);

    const session: ActiveAlertSession = {
      priority: 2,
      category: 'drowsiness',
      startedAt: Date.now(),
      expectedEndTime,
      oscillators,
      gainNodes,
      timerIds,
      stop: () => {},
    };

    const cleanupTimer = setTimeout(() => {
      if (this.activeAlert === session) {
        this.activeAlert = null;
      }
    }, Math.ceil(totalDuration * 1000) + 100);
    timerIds.push(cleanupTimer);

    this.activeAlert = session;
    this.markAlertPlayed('drowsiness');
  }

  // =========================================================================
  // 4. Distraction Alert (Head turned / Gaze departed from road)
  // Duration: ~4.2 seconds. Rapid syncopated double-beeps (Beep-Beep ... Beep-Beep).
  // =========================================================================
  public playDistractionAlert() {
    if (!this.shouldPlayAlert('distraction', 2)) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    const ctx = this.ctx;
    const targetComp = this.compressorNode;
    const startTime = ctx.currentTime + 0.02;
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const timerIds: (NodeJS.Timeout | number)[] = [];

    // 8 cycles of double-beeps (100ms beep, 60ms gap, 100ms beep, 340ms pause = 0.60s * 7 + 0.28s = 4.48s)
    const cycles = 8;
    const beepDur = 0.10;
    const innerGap = 0.06;
    const restGap = 0.34;
    let t = startTime;

    for (let c = 0; c < cycles; c++) {
      // Beep 1: 880 Hz (A5)
      this.scheduleAlertBeep(ctx, targetComp, 880, t, beepDur, 'triangle', 2600, 0.75, oscillators, gainNodes);
      t += beepDur + innerGap;

      // Beep 2: 1046 Hz (C6)
      this.scheduleAlertBeep(ctx, targetComp, 1046, t, beepDur, 'triangle', 2600, 0.75, oscillators, gainNodes);
      t += beepDur + restGap;
    }

    const totalDuration = t - startTime;
    const expectedEndTime = Date.now() + Math.ceil(totalDuration * 1000);

    const session: ActiveAlertSession = {
      priority: 2,
      category: 'distraction',
      startedAt: Date.now(),
      expectedEndTime,
      oscillators,
      gainNodes,
      timerIds,
      stop: () => {},
    };

    const cleanupTimer = setTimeout(() => {
      if (this.activeAlert === session) {
        this.activeAlert = null;
      }
    }, Math.ceil(totalDuration * 1000) + 100);
    timerIds.push(cleanupTimer);

    this.activeAlert = session;
    this.markAlertPlayed('distraction');
  }

  // =========================================================================
  // 5. Face Visibility / Occlusion Alert (Driver face not detected)
  // Duration: ~4.4 seconds. Ascending triple warning chime repeated 5 times.
  // =========================================================================
  public playFaceLostAlert() {
    if (!this.shouldPlayAlert('face_absent', 2)) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    const ctx = this.ctx;
    const targetComp = this.compressorNode;
    const startTime = ctx.currentTime + 0.02;
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const timerIds: (NodeJS.Timeout | number)[] = [];

    // 6 cycles: 3 ascending tones (100ms each, 40ms gap) + 400ms rest = ~4.50s total duration
    const cycles = 6;
    const toneDur = 0.10;
    const stepGap = 0.04;
    const restGap = 0.40;
    let t = startTime;

    for (let c = 0; c < cycles; c++) {
      // 587 Hz (D5) -> 740 Hz (F#5) -> 880 Hz (A5)
      const freqs = [587.33, 739.99, 880.0];
      freqs.forEach((freq, idx) => {
        const toneStart = t + idx * (toneDur + stepGap);
        this.scheduleAlertBeep(ctx, targetComp, freq, toneStart, toneDur, 'sine', 3000, 0.70, oscillators, gainNodes);
      });
      t += freqs.length * (toneDur + stepGap) + restGap;
    }

    const totalDuration = t - startTime;
    const expectedEndTime = Date.now() + Math.ceil(totalDuration * 1000);

    const session: ActiveAlertSession = {
      priority: 2,
      category: 'face_absent',
      startedAt: Date.now(),
      expectedEndTime,
      oscillators,
      gainNodes,
      timerIds,
      stop: () => {},
    };

    const cleanupTimer = setTimeout(() => {
      if (this.activeAlert === session) {
        this.activeAlert = null;
      }
    }, Math.ceil(totalDuration * 1000) + 100);
    timerIds.push(cleanupTimer);

    this.activeAlert = session;
    this.markAlertPlayed('face_absent');
  }

  // =========================================================================
  // 6. General Warning Fallback (calls the strong ~4.5s alert)
  // =========================================================================
  public playWarning() {
    this.playDrowsinessAlert();
  }

  // =========================================================================
  // 7. Caution Alert (Two-tone pulses extended over ~4.0 seconds)
  // =========================================================================
  public playCaution() {
    if (!this.shouldPlayAlert('caution', 1)) return;
    this.initContext();
    if (!this.ctx || !this.compressorNode) return;

    const ctx = this.ctx;
    const targetComp = this.compressorNode;
    const startTime = ctx.currentTime + 0.02;
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const timerIds: (NodeJS.Timeout | number)[] = [];

    // 5 repeated caution pulses over 4.0 seconds (each cycle: 0.80s)
    const cycles = 5;
    const cycleTime = 0.80;

    for (let c = 0; c < cycles; c++) {
      const cycleStart = startTime + c * cycleTime;
      [0, 0.16].forEach((delay, idx) => {
        const toneStart = cycleStart + delay;
        const freq = idx === 0 ? 523.25 : 659.25; // C5 -> E5
        this.scheduleAlertBeep(ctx, targetComp, freq, toneStart, 0.18, 'triangle', 2200, 0.60, oscillators, gainNodes);
      });
    }

    const totalDuration = cycles * cycleTime;
    const expectedEndTime = Date.now() + Math.ceil(totalDuration * 1000);

    const session: ActiveAlertSession = {
      priority: 1,
      category: 'caution',
      startedAt: Date.now(),
      expectedEndTime,
      oscillators,
      gainNodes,
      timerIds,
      stop: () => {},
    };

    const cleanupTimer = setTimeout(() => {
      if (this.activeAlert === session) {
        this.activeAlert = null;
      }
    }, Math.ceil(totalDuration * 1000) + 100);
    timerIds.push(cleanupTimer);

    this.activeAlert = session;
    this.markAlertPlayed('caution');
  }

  // =========================================================================
  // 8. Dynamic Alert Dispatcher (Intelligently selects pattern & priority)
  // =========================================================================
  public triggerSafetyAlert(alert: {
    category?: string;
    severity?: string;
    title?: string;
  }): boolean {
    if (!this.soundEnabled) return false;

    const category = (alert.category || '').toLowerCase();
    const severity = (alert.severity || '').toLowerCase();
    const title = (alert.title || '').toLowerCase();

    // Critical checks: severe drowsiness, weapon threat, or explicit critical severity
    if (
      severity === 'critical' ||
      category === 'weapon' ||
      title.includes('microsleep') ||
      title.includes('severe')
    ) {
      this.startContinuousAlert('critical_warning');
      return true;
    }

    // Drowsiness check
    if (category === 'drowsiness' || title.includes('drowsy') || title.includes('fatigue')) {
      this.startContinuousAlert('drowsiness');
      return true;
    }

    // Distraction check
    if (category === 'distraction' || title.includes('distract') || title.includes('gaze')) {
      this.startContinuousAlert('distraction');
      return true;
    }

    // Face absent / camera check
    if (
      category === 'face_absent' ||
      category === 'camera_disconnected' ||
      title.includes('face absent') ||
      title.includes('lost')
    ) {
      this.playFaceLostAlert();
      return true;
    }

    // Fallback based on severity
    if (severity === 'high') {
      this.playWarning();
      return true;
    }

    this.playCaution();
    return true;
  }

  // =========================================================================
  // Internal Tone Synthesizer Helper
  // =========================================================================
  private scheduleAlertBeep(
    ctx: AudioContext,
    target: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    filterFreq: number,
    gainLevel: number,
    oscList: OscillatorNode[],
    gainList: GainNode[]
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const safeGain = Math.min(gainLevel, AUDIO_CONFIG.maxSafeGain);
    const attack = 0.012;
    const decay = 0.035;

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(safeGain, startTime + attack);
    gain.gain.setValueAtTime(safeGain, startTime + duration - decay);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);

    oscList.push(osc);
    gainList.push(gain);
  }
}

export const audioAlerts = new AudioAlertSystem();
