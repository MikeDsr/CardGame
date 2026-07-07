// Web Audio 实时合成音效引擎（无需任何音频素材文件）
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('jk_sound') !== '0';
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('jk_sound', this.enabled ? '1' : '0');
    return this.enabled;
  }
  // 基础音：freq 起始频率, slide 结束频率, dur 秒, type 波形, vol 音量, delay 延迟
  tone(freq, dur = 0.15, { type = 'sine', vol = 0.5, slide = null, delay = 0 } = {}) {
    if (!this.enabled) return;
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(slide, 1), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur = 0.12, { vol = 0.3, hp = 1000, delay = 0 } = {}) {
    if (!this.enabled) return;
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }
  vibrate(ms = 30) { try { navigator.vibrate && navigator.vibrate(ms); } catch {} }

  play(name) {
    if (!this.enabled) return;
    const S = {
      click: () => this.tone(700, .06, { type: 'triangle', vol: .3 }),
      select: () => this.tone(950, .05, { type: 'triangle', vol: .25 }),
      deal: () => this.noise(.09, { vol: .22, hp: 2500 }),
      card: () => { this.noise(.06, { vol: .3, hp: 1800 }); this.tone(300, .07, { type: 'triangle', vol: .2 }); },
      draw: () => this.noise(.12, { vol: .2, hp: 1200 }),
      turn: () => { this.tone(880, .1, { type: 'sine', vol: .3 }); this.tone(1320, .12, { vol: .22, delay: .09 }); this.vibrate(40); },
      pass: () => this.tone(400, .1, { type: 'sine', vol: .2, slide: 250 }),
      bomb: () => { this.tone(120, .5, { type: 'sawtooth', vol: .55, slide: 30 }); this.noise(.4, { vol: .4, hp: 200 }); this.vibrate(120); },
      win: () => { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .22, { type: 'triangle', vol: .4, delay: i * .13 })); this.vibrate([60, 40, 60]); },
      lose: () => { [440, 370, 311, 262].forEach((f, i) => this.tone(f, .25, { type: 'sine', vol: .3, delay: i * .16 })); },
      coin: () => { this.tone(1500, .07, { type: 'square', vol: .18 }); this.tone(2000, .18, { type: 'square', vol: .15, delay: .07 }); },
      dice: () => { for (let i = 0; i < 5; i++) this.noise(.04, { vol: .25, hp: 3000, delay: i * .07 }); },
      step: () => this.tone(500, .05, { type: 'triangle', vol: .22 }),
      night: () => { this.tone(196, 1.6, { type: 'sine', vol: .25, slide: 98 }); this.tone(294, 1.4, { type: 'sine', vol: .12, delay: .2, slide: 147 }); },
      day: () => { [392, 523, 659].forEach((f, i) => this.tone(f, .3, { type: 'triangle', vol: .28, delay: i * .12 })); },
      wolf: () => this.tone(300, .9, { type: 'sawtooth', vol: .18, slide: 150 }),
      shoot: () => { this.noise(.15, { vol: .5, hp: 400 }); this.tone(150, .2, { type: 'square', vol: .3, slide: 60 }); this.vibrate(80); },
      heal: () => { [523, 784].forEach((f, i) => this.tone(f, .25, { type: 'sine', vol: .3, delay: i * .1 })); },
      hurt: () => { this.tone(200, .18, { type: 'sawtooth', vol: .35, slide: 90 }); this.vibrate(60); },
      sword: () => { this.noise(.18, { vol: .35, hp: 4000 }); this.tone(1800, .1, { type: 'sawtooth', vol: .12, slide: 600 }); },
      uno: () => { [660, 880, 1100].forEach((f, i) => this.tone(f, .12, { type: 'square', vol: .25, delay: i * .09 })); },
      buy: () => { this.tone(880, .1, { type: 'square', vol: .2 }); this.tone(1174, .15, { type: 'square', vol: .2, delay: .1 }); },
      vote: () => this.tone(600, .12, { type: 'triangle', vol: .3, slide: 900 }),
      warn: () => { this.tone(220, .15, { type: 'square', vol: .25 }); this.tone(220, .15, { type: 'square', vol: .25, delay: .2 }); },
    };
    (S[name] || (() => {}))();
  }
}

export const audio = new AudioEngine();
// 任意首次触摸解锁音频上下文
window.addEventListener('pointerdown', () => audio.ensure(), { once: true });
