// Web Audio API Retro Chiptune Sound Synthesizer
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmNode = null;
    this.bgmTimer = null;
    this.isPlayingBGM = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else if (this.isPlayingBGM) {
      this.startBGM();
    }
    return this.enabled;
  }

  // --- Sound Effects Generators ---

  playTone(freq, type = 'square', duration = 0.1, gainVal = 0.2, freqSlide = null) {
    if (!this.enabled) return;
    this.init();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      if (freqSlide) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(10, freqSlide),
          this.ctx.currentTime + duration
        );
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  playNoise(duration = 0.1, gainVal = 0.2) {
    if (!this.enabled) return;
    this.init();

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      whiteNoise.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  // Specific Game SFX
  playHit() {
    this.playTone(180, 'square', 0.08, 0.25, 40);
    this.playNoise(0.06, 0.15);
  }

  playHeavyHit() {
    this.playTone(120, 'sawtooth', 0.2, 0.35, 20);
    this.playNoise(0.18, 0.3);
  }

  playEnemyDeath() {
    // Meaty impact then a descending "drop dead" whine
    this.playTone(160, 'square', 0.28, 0.3, 40);
    this.playNoise(0.14, 0.28);
    setTimeout(() => this.playTone(90, 'sawtooth', 0.22, 0.2, 30), 60);
  }

  playThud() {
    // Low body-hits-the-floor impact
    this.playTone(70, 'sine', 0.16, 0.35, 45);
    this.playNoise(0.1, 0.22);
  }

  playSwing() {
    this.playTone(300, 'triangle', 0.06, 0.1, 100);
  }

  playJump() {
    this.playTone(150, 'square', 0.12, 0.15, 450);
  }

  playSpecial() {
    this.playTone(220, 'sawtooth', 0.4, 0.25, 880);
    setTimeout(() => this.playTone(440, 'square', 0.3, 0.2, 1100), 100);
  }

  playFreeze() {
    this.playTone(880, 'sine', 0.3, 0.2, 220);
    this.playTone(1320, 'triangle', 0.4, 0.15, 330);
  }

  playPtoPickup() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'square', 0.12, 0.2), idx * 80);
    });
  }

  playBossWarning() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(440, 'sawtooth', 0.2, 0.3, 220);
      }, i * 250);
    }
  }

  playVictory() {
    const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    arpeggio.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.25), i * 120);
    });
  }

  playGameOver() {
    const notes = [400, 350, 300, 200];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.3, 0.25), i * 180);
    });
  }

  // --- Background Arcade Synth Music Loop ---
  startBGM() {
    this.isPlayingBGM = true;
    if (!this.enabled) return;
    this.init();
    if (this.bgmTimer) clearInterval(this.bgmTimer);

    // Chiptune Bassline & Lead loop
    const bassline = [110, 110, 130, 110, 146, 130, 110, 98];
    const melody = [220, 0, 261, 293, 329, 293, 261, 220, 329, 392, 440, 392, 329, 293, 261, 0];
    let step = 0;

    this.bgmTimer = setInterval(() => {
      if (!this.enabled || !this.isPlayingBGM) return;

      // Bass note
      const bassFreq = bassline[step % bassline.length];
      if (bassFreq > 0) {
        this.playTone(bassFreq, 'sawtooth', 0.12, 0.08);
      }

      // Lead note
      const leadFreq = melody[step % melody.length];
      if (leadFreq > 0) {
        this.playTone(leadFreq, 'square', 0.1, 0.06);
      }

      // Hi-hat noise on even beats
      if (step % 2 === 0) {
        this.playNoise(0.02, 0.03);
      }

      step++;
    }, 160); // ~187 BPM arcade tempo
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const sound = new SoundEngine();
