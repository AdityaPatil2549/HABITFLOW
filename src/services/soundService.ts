/**
 * SoundService — Web Audio API based sound effects.
 * All sounds are generated programmatically (no audio files needed).
 * Respects user's soundEnabled and hapticEnabled settings.
 */

import type { TelemetryMode } from '@/types';

export type AcousticPackId =
  | 'default'
  | 'acoustic_switch_pack'
  | 'acoustic_chime_pack'
  | 'acoustic_pulse_pack';

const ACOUSTIC_PACK_KEY = 'habitflow_acoustic_pack';

class SoundService {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private hapticEnabled = true;
  private telemetryMode: TelemetryMode = 'scaffold';
  private activePack: AcousticPackId =
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem(ACOUSTIC_PACK_KEY) as AcousticPackId)) ||
    'default';

  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private lastHoverTime = 0;

  setEnabled(sound: boolean, haptic: boolean) {
    this.enabled = sound;
    this.hapticEnabled = haptic;
  }

  setTelemetryMode(mode: TelemetryMode) {
    this.telemetryMode = mode;
  }

  getAcousticPack(): AcousticPackId {
    return this.activePack;
  }

  setAcousticPack(pack: AcousticPackId) {
    this.activePack = pack;
    try {
      localStorage.setItem(ACOUSTIC_PACK_KEY, pack);
    } catch {
      /* ignore storage quota errors */
    }
  }

  previewPack(pack: AcousticPackId) {
    const prev = this.activePack;
    this.activePack = pack;
    this.playTick();
    setTimeout(() => {
      this.playUnlatchClick();
      this.activePack = prev;
    }, 90);
  }

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (browser auto-suspend policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.18,
    startOffset = 0,
    ctx?: AudioContext
  ) {
    const audioCtx = ctx ?? this.getCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + startOffset);

    const start = audioCtx.currentTime + startOffset;
    const end = start + duration;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.start(start);
    osc.stop(end);
  }

  /** 40ms mechanical click — tuned by equipped acoustic pack */
  playTick() {
    if (!this.enabled) return;
    try {
      if (this.activePack === 'acoustic_switch_pack') {
        this.playTone(1120, 0.04, 'triangle', 0.16);
      } else if (this.activePack === 'acoustic_chime_pack') {
        this.playTone(698.46, 0.045, 'sine', 0.14);
      } else if (this.activePack === 'acoustic_pulse_pack') {
        this.playTone(320, 0.035, 'sine', 0.09);
      } else {
        this.playTone(880, 0.04, 'sine', 0.14);
      }
    } catch {
      /* silently ignore AudioContext errors */
    }
  }

  /** Un-check sound — slightly lower pitch */
  playUncheck() {
    if (!this.enabled) return;
    try {
      this.playTone(440, 0.05, 'sine', 0.1);
    } catch {
      /**/
    }
  }

  /** Ascending celebratory arpeggio — gated to Scaffold telemetry mode */
  playCelebration() {
    if (!this.enabled || this.telemetryMode !== 'scaffold') return;
    try {
      const ctx = this.getCtx();
      // C5 - E5 - G5 - C6 arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => this.playTone(freq, 0.18, 'sine', 0.16, i * 0.08, ctx));
    } catch {
      /**/
    }
  }

  /** 3-note rising chime (~200ms) — gated to Scaffold telemetry mode */
  playLevelUp() {
    if (!this.enabled || this.telemetryMode !== 'scaffold') return;
    try {
      const ctx = this.getCtx();
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, i) => this.playTone(freq, 0.14, 'triangle', 0.18, i * 0.06, ctx));
    } catch {
      /**/
    }
  }

  /** Short reward pop — gated to Scaffold telemetry mode */
  playBadge() {
    if (!this.enabled || this.telemetryMode !== 'scaffold') return;
    try {
      const ctx = this.getCtx();
      this.playTone(660, 0.06, 'sine', 0.15, 0, ctx);
      this.playTone(880, 0.12, 'sine', 0.18, 0.06, ctx);
    } catch {
      /**/
    }
  }

  /** Resonant two-tone chime for streak milestones — gated to Scaffold telemetry mode */
  playStreakMilestone() {
    if (!this.enabled || this.telemetryMode !== 'scaffold') return;
    try {
      const ctx = this.getCtx();
      // D5 (587.33) -> A5 (880.00) resonant chime
      this.playTone(587.33, 0.14, 'sine', 0.18, 0, ctx);
      this.playTone(880.0, 0.28, 'triangle', 0.22, 0.08, ctx);
      this.haptic([25, 40, 35]);
    } catch {
      /**/
    }
  }

  /** Subtle warm harmonic swell for positive momentum velocity surges */
  playMomentumSurge() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      this.playTone(440, 0.16, 'sine', 0.1, 0, ctx);
      this.playTone(659.25, 0.22, 'sine', 0.12, 0.06, ctx);
    } catch {
      /**/
    }
  }

  /** Soft, low-pitched pop for hovering over interactive elements (throttled) */
  playHover() {
    if (!this.enabled) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastHoverTime < 120) return;
    this.lastHoverTime = now;
    try {
      this.playTone(300, 0.03, 'sine', 0.03);
    } catch {
      /* */
    }
  }

  /** Quick, airy sweep for page transitions or opening modals */
  playTransition() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';

      const start = ctx.currentTime;
      const end = start + 0.15;

      // Sweep frequency up
      osc.frequency.setValueAtTime(400, start);
      osc.frequency.exponentialRampToValueAtTime(800, end);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, end);

      osc.start(start);
      osc.stop(end);
    } catch {
      /* */
    }
  }

  /** Device haptic feedback */
  haptic(pattern: number | number[] = [30]) {
    if (!this.hapticEnabled) return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        /**/
      }
    }
  }

  // ── Ambient Soundscapes (Focus Mode) ──────────────────────────────────

  startAmbient(type: 'brown' | 'white') {
    if (!this.enabled) return;
    try {
      this.stopAmbient(); // ensure any existing is stopped

      const ctx = this.getCtx();
      const bufferSize = ctx.sampleRate * 5; // 5 seconds loop
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') {
          // Brown noise filter
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // compensate gain
        } else {
          output[i] = white * 0.15; // lower volume for white noise
        }
      }

      this.ambientSource = ctx.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      this.ambientGain = ctx.createGain();
      // Gentle fade in
      this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2); // 2 sec fade in

      this.ambientSource.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);
      this.ambientSource.start();
    } catch {
      console.warn('Failed to start ambient noise');
    }
  }

  stopAmbient() {
    if (!this.ambientSource || !this.ambientGain) return;
    try {
      const ctx = this.getCtx();
      // Gentle fade out
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); // 1 sec fade out

      this.ambientSource.stop(ctx.currentTime + 1);

      // Cleanup
      this.ambientSource = null;
      this.ambientGain = null;
    } catch {
      this.ambientSource = null;
      this.ambientGain = null;
    }
  }

  /**
   * Chrono-Atmospheric Forging Haptics:
   * 1. Binaural Sub-Bass Mechanical Thump (Physical inertia felt in ears/speakers)
   * 2. Circadian Resonant Frequency:
   *    - Dawn: 528 Hz (Solfeggio Alertness)
   *    - Zenith: 432 Hz (Deep Focus Mechanical Shutter)
   *    - Dusk: 220 Hz (Warm Rhodes Evening Harvest)
   *    - Night: 174 Hz (Parasympathetic Restorative Tone)
   * 3. Milestone Bronze Singing Bowl Gong (Optional on streaks)
   */
  playChronoForging(epoch: 'dawn' | 'zenith' | 'dusk' | 'night' = 'dusk', isMilestone = false) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;

      // Layer 1: Sub-bass 65Hz -> 32Hz physical thump
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65, t);
      sub.frequency.exponentialRampToValueAtTime(32, t + 0.12);
      subGain.gain.setValueAtTime(0.32, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(t);
      sub.stop(t + 0.12);

      // Layer 2: Circadian Resonant Harmonic
      const harmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      const baseFreq = epoch === 'dawn' ? 528 : epoch === 'zenith' ? 432 : epoch === 'dusk' ? 220 : 174;
      harmonic.type = epoch === 'zenith' ? 'square' : 'triangle';
      harmonic.frequency.setValueAtTime(baseFreq, t);

      harmonicGain.gain.setValueAtTime(epoch === 'zenith' ? 0.08 : 0.18, t);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      harmonic.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);
      harmonic.start(t);
      harmonic.stop(t + 0.32);

      // Layer 3: Milestone Bronze Gong
      if (isMilestone) {
        const gong = ctx.createOscillator();
        const gongGain = ctx.createGain();
        gong.type = 'sine';
        gong.frequency.setValueAtTime(108, t);
        gongGain.gain.setValueAtTime(0.25, t);
        gongGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        gong.connect(gongGain);
        gongGain.connect(ctx.destination);
        gong.start(t);
        gong.stop(t + 1.2);
      }
    } catch {
      /* AudioContext error fallback */
    }
  }

  /** Micro-mechanical click when scrubbing the Chrono-Dial */
  playChronoDialTick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.02);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.02);
    } catch {
      /**/
    }
  }

  /** Synaptic laser pulse traveling down stacked habit connector */
  playSynapseSpark() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {
      /**/
    }
  }

  /** Soft mechanical unlatch click when downstream habit primes */
  playUnlatchClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;

      // Click transient
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(840, t);
      click.frequency.exponentialRampToValueAtTime(420, t + 0.04);
      clickGain.gain.setValueAtTime(0.08, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(t);
      click.stop(t + 0.04);

      // Resonant harmonic chime
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(528, t + 0.02);
      chimeGain.gain.setValueAtTime(0.05, t + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(t + 0.02);
      chime.stop(t + 0.14);
    } catch {
      /**/
    }
  }
}

export const soundService = new SoundService();

