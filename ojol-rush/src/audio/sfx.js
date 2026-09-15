/** Lightweight WebAudio SFX — no external copyrighted assets */

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(v) {
  muted = !!v;
}

export function isMuted() {
  return muted;
}

function beep({ freq = 440, dur = 0.08, type = "square", gain = 0.04, slide = 0 }) {
  if (muted) return;
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, c.currentTime + dur);
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export const sfx = {
  jump: () => beep({ freq: 320, dur: 0.1, type: "triangle", gain: 0.05, slide: 220 }),
  coin: () => beep({ freq: 880, dur: 0.07, type: "sine", gain: 0.045, slide: 200 }),
  power: () => beep({ freq: 520, dur: 0.16, type: "sawtooth", gain: 0.035, slide: 180 }),
  miss: () => beep({ freq: 180, dur: 0.09, type: "square", gain: 0.03, slide: -40 }),
  crash: () => beep({ freq: 90, dur: 0.28, type: "sawtooth", gain: 0.06, slide: -50 }),
  horn: () => beep({ freq: 420, dur: 0.12, type: "square", gain: 0.03 }),
  click: () => beep({ freq: 600, dur: 0.04, type: "triangle", gain: 0.03 }),
};

let musicNodes = null;

export function startMusic() {
  if (muted || musicNodes) return;
  const c = ac();
  const master = c.createGain();
  master.gain.value = 0.028;
  master.connect(c.destination);
  const notes = [196, 247, 294, 330, 294, 247];
  let i = 0;
  const tick = () => {
    if (!musicNodes) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = notes[i % notes.length];
    g.gain.value = 0.8;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(c.currentTime + 0.24);
    i += 1;
  };
  tick();
  const id = setInterval(tick, 280);
  musicNodes = { master, id };
}

export function stopMusic() {
  if (!musicNodes) return;
  clearInterval(musicNodes.id);
  try {
    musicNodes.master.disconnect();
  } catch {
    /* ignore */
  }
  musicNodes = null;
}
