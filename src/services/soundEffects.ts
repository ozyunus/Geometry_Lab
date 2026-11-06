/**
 * PatternLab Web Audio Synthesizer & Sound FX Engine
 * 
 * Provides crisp, zero-latency sound effects and soothing ambient music
 * with 0 external asset dependencies (100% offline-ready, synthesized in real-time).
 * Respects user preferences and modern browser autoplay policies.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private bgMusicEnabled: boolean = false;
  private bgInterval: number | null = null;
  private isPlayingBg: boolean = false;

  constructor() {
    // Load persisted audio preferences
    try {
      const savedSfx = localStorage.getItem('patternlab_sfx_enabled');
      if (savedSfx !== null) {
        this.sfxEnabled = savedSfx === 'true';
      }
      const savedBg = localStorage.getItem('patternlab_bg_music_enabled');
      if (savedBg !== null) {
        this.bgMusicEnabled = savedBg === 'true';
      }
    } catch {
      // safe fallback
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public isBgMusicEnabled(): boolean {
    return this.bgMusicEnabled;
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    try {
      localStorage.setItem('patternlab_sfx_enabled', String(enabled));
    } catch {}
  }

  public setBgMusicEnabled(enabled: boolean) {
    this.bgMusicEnabled = enabled;
    try {
      localStorage.setItem('patternlab_bg_music_enabled', String(enabled));
    } catch {}

    if (enabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  /**
   * Soft, warm dot / tap pop (pleasant wooden sound)
   */
  public playDot() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Snap sound when line connects between 2 vertices
   */
  public playLineSnap() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /**
   * Warm celebratory arpeggio when a step is completed
   */
  public playStepSuccess() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      // Pentatonic warm chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.46);
      });
    } catch {}
  }

  /**
   * Star sparkle chime
   */
  public playStarSparkle() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const freqs = [880, 1174.66, 1318.51, 1760];
      freqs.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      });
    } catch {}
  }

  /**
   * Gentle soft descending note for Undo
   */
  public playUndo() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Grand Royal Victory Chime (for completing Stage 20)
   */
  public playCrownFanfare() {
    if (!this.sfxEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      // Fanfare notes: C5, E5, G5, C6, G5, C6
      const notes = [
        { f: 523.25, d: 0.12, t: 0.0 },
        { f: 659.25, d: 0.12, t: 0.12 },
        { f: 783.99, d: 0.15, t: 0.24 },
        { f: 1046.5, d: 0.5, t: 0.42 },
      ];

      notes.forEach(({ f, d, t }) => {
        const now = ctx.currentTime + t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + d + 0.05);
      });
    } catch {}
  }

  /**
   * Ambient generative gentle background music
   * Kalimba / gentle music box in 432Hz pentatonic scale (soothing, relaxing, non-annoying).
   */
  public startAmbientMusic() {
    if (this.isPlayingBg) return;
    const ctx = this.initContext();
    if (!ctx) return;

    this.isPlayingBg = true;

    // Peaceful pentatonic frequencies (D major / B minor pentatonic notes)
    const scale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99];

    const playNextNote = () => {
      if (!this.isPlayingBg || !this.bgMusicEnabled) return;
      const currentCtx = this.initContext();
      if (!currentCtx) return;

      try {
        const freq = scale[Math.floor(Math.random() * scale.length)];
        const now = currentCtx.currentTime;
        const osc = currentCtx.createOscillator();
        const gain = currentCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Very soft volume
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(currentCtx.destination);

        osc.start(now);
        osc.stop(now + 1.9);
      } catch {}
    };

    // Play initial note
    playNextNote();
    // Schedule notes at relaxing random intervals (1.2s - 2.4s)
    this.bgInterval = window.setInterval(() => {
      if (Math.random() > 0.15) {
        playNextNote();
      }
    }, 1400);
  }

  public stopAmbientMusic() {
    this.isPlayingBg = false;
    if (this.bgInterval !== null) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
  }
}

export const soundEffects = new SoundEffectsService();
export default soundEffects;
