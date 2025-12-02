// Notification Sound Utility using Web Audio API
// Generates pleasant notification sounds without requiring audio files

class NotificationSoundManager {
  constructor() {
    this.audioContext = null;
    this.volume = 0.8;
    this.enabled = true;
  }

  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume / 100));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Sound generators for different notification sounds
  sounds = {
    default: (ctx, gainNode) => {
      // Pleasant two-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc2.frequency.setValueAtTime(1320, ctx.currentTime); // E6
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.5);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.1);
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.5);
    },

    chime: (ctx, gainNode) => {
      // Three-note ascending chime
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(gainNode);
        gainNode.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime + i * 0.15);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    },

    bell: (ctx, gainNode) => {
      // Bell-like sound with harmonics
      const fundamental = 440;
      const harmonics = [1, 2, 3, 4.2, 5.4];
      harmonics.forEach((harmonic, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * harmonic, ctx.currentTime);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(this.volume * 0.15 / (i + 1), ctx.currentTime);
        oscGain.gain.exponentialDecayTo(0.001, ctx.currentTime + 1);
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1);
      });
    },

    ping: (ctx, gainNode) => {
      // Quick high-pitched ping
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    },

    pop: (ctx, gainNode) => {
      // Bubble pop sound
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
      gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    },

    ding: (ctx, gainNode) => {
      // Simple ding sound
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1047, ctx.currentTime); // C6
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    },

    alert: (ctx, gainNode) => {
      // Attention-grabbing two-tone alert
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      osc2.frequency.setValueAtTime(600, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);

      gainNode.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      gainNode.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime + 0.15);
      gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.3);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.3);
    },

    gentle: (ctx, gainNode) => {
      // Soft, gentle notification
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, ctx.currentTime); // G4
      osc.frequency.linearRampToValueAtTime(523.25, ctx.currentTime + 0.3); // C5
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, ctx.currentTime + 0.1);
      gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    },

    none: () => {
      // Silent - no sound
    },
  };

  play(soundId = 'default') {
    if (!this.enabled || soundId === 'none') {
      return;
    }

    try {
      const ctx = this.initAudioContext();
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      // Add exponentialDecayTo helper
      gainNode.gain.exponentialDecayTo = function(value, endTime) {
        this.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
      };

      const soundFn = this.sounds[soundId] || this.sounds.default;
      soundFn(ctx, gainNode);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Preview sound for settings
  preview(soundId, volume) {
    const originalVolume = this.volume;
    if (volume !== undefined) {
      this.setVolume(volume);
    }
    this.play(soundId);
    this.volume = originalVolume;
  }
}

// Singleton instance
export const notificationSound = new NotificationSoundManager();

// Export available sounds for UI
export const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Default' },
  { id: 'chime', name: 'Chime' },
  { id: 'bell', name: 'Bell' },
  { id: 'ping', name: 'Ping' },
  { id: 'pop', name: 'Pop' },
  { id: 'ding', name: 'Ding' },
  { id: 'alert', name: 'Alert' },
  { id: 'gentle', name: 'Gentle' },
  { id: 'none', name: 'None (Silent)' },
];

export default notificationSound;
