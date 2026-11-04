/**
 * SoundService — Web Audio API based sound effects.
 * All sounds are generated programmatically (no audio files needed).
 * Respects user's soundEnabled and hapticEnabled settings.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private hapticEnabled = true;

  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  setEnabled(sound: boolean, haptic: boolean) {
    this.enabled = sound;
    this.hapticEnabled = haptic;
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

  /** Soft tick — played when a habit is checked off */
  playTick() {
    if (!this.enabled) return;
    try {
      this.playTone(880, 0.08, 'sine', 0.14);
    } catch {
      /* silently ignore AudioContext errors */
    }
  }

  /** Un-check sound — slightly lower pitch */
  playUncheck() {
    if (!this.enabled) return;
    try {
      this.playTone(440, 0.08, 'sine', 0.1);
    } catch {
      /**/
    }
  }

  /** Ascending celebratory arpeggio — played when all habits for the day are done */
  playCelebration() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      // C5 - E5 - G5 - C6 arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => this.playTone(freq, 0.18, 'sine', 0.16, i * 0.1, ctx));
    } catch {
      /**/
    }
  }

  /** 3-note rising chime — played on XP level-up */
  playLevelUp() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      // G4 - B4 - D5 - G5
      const notes = [392, 493.88, 587.33, 783.99];
      notes.forEach((freq, i) => this.playTone(freq, 0.22, 'triangle', 0.2, i * 0.12, ctx));
    } catch {
      /**/
    }
  }

  /** Short reward pop — for earning badges */
  playBadge() {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      this.playTone(660, 0.06, 'sine', 0.15, 0, ctx);
      this.playTone(880, 0.12, 'sine', 0.18, 0.06, ctx);
    } catch {
      /**/
    }
  }

  /** Resonant two-tone chime for hitting streak milestones (7, 14, 30, 100 days) */
  playStreakMilestone() {
    if (!this.enabled) return;
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

  /** Soft, low-pitched pop for hovering over interactive elements */
  playHover() {
    if (!this.enabled) return;
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
}

export const soundService = new SoundService();

