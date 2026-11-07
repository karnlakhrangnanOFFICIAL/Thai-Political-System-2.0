class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
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

  playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', volume = 0.06) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Ignore audio errors in restricted environments
    }
  }

  playCardPlay(enabled: boolean) {
    if (!enabled) return;
    this.playTone(520, 0.09, 'triangle', 0.06);
    setTimeout(() => this.playTone(680, 0.11, 'triangle', 0.05), 55);
  }

  playGavel(enabled: boolean) {
    if (!enabled) return;
    this.playTone(190, 0.14, 'square', 0.05);
    setTimeout(() => this.playTone(170, 0.18, 'square', 0.05), 130);
  }

  playTurnAdvance(enabled: boolean) {
    if (!enabled) return;
    this.playTone(440, 0.1, 'sine', 0.05);
    setTimeout(() => this.playTone(554, 0.12, 'sine', 0.05), 80);
    setTimeout(() => this.playTone(659, 0.16, 'sine', 0.05), 160);
  }

  playDenied(enabled: boolean) {
    if (!enabled) return;
    this.playTone(220, 0.15, 'sawtooth', 0.04);
  }

  playAchievementUnlock(enabled: boolean) {
    if (!enabled) return;
    this.playTone(523.25, 0.1, 'triangle', 0.06);
    setTimeout(() => this.playTone(659.25, 0.1, 'triangle', 0.06), 75);
    setTimeout(() => this.playTone(783.99, 0.12, 'triangle', 0.06), 150);
    setTimeout(() => this.playTone(1046.5, 0.22, 'sine', 0.07), 235);
  }

  playScandalAlert(enabled: boolean) {
    if (!enabled) return;
    this.playTone(330, 0.14, 'sawtooth', 0.06);
    setTimeout(() => this.playTone(247, 0.18, 'sawtooth', 0.06), 130);
    setTimeout(() => this.playTone(185, 0.24, 'square', 0.06), 280);
  }
}

export const soundFX = new SoundSynthesizer();
