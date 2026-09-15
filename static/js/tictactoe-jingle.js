/**
 * Soft romantic audio cue for Tic-Tac-Toe (Web Audio).
 * Plays once on Play Together — ~2 seconds, music-box feel.
 */

let audioCtx = null;
let jinglePlayed = false;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(c, freq, start, dur, type = "sine", gain = 0.05, attack = 0.04) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function heartPulse(c, t0, off, gain = 0.035) {
  tone(c, 110, t0 + off, 0.18, "sine", gain, 0.05);
  tone(c, 164.8, t0 + off + 0.1, 0.15, "sine", gain * 0.7, 0.05);
}

/** Play Together only — once per visit, ~2s. */
export function playTicTacToeJingle() {
  if (jinglePlayed) return;
  jinglePlayed = true;
  try {
    const c = ctx();
    const t0 = c.currentTime + 0.02;

    heartPulse(c, t0, 0, 0.038);
    heartPulse(c, t0, 0.42, 0.034);

    // short music-box phrase, ends by ~2.0s
    const melody = [
      [0.75, 329.63],
      [0.95, 415.3],
      [1.15, 493.88],
      [1.38, 554.37],
      [1.62, 493.88],
      [1.82, 415.3],
    ];
    melody.forEach(([off, f], i) => {
      const g = 0.042 - i * 0.002;
      tone(c, f, t0 + off, 0.28, "sine", g, 0.05);
      tone(c, f * 2, t0 + off, 0.2, "triangle", g * 0.25, 0.06);
    });
  } catch {
    /* ignore */
  }
}

/** Soft romantic tap when placing a mark. */
export function playMoveChime(mark = "X") {
  try {
    const c = ctx();
    const t0 = c.currentTime;
    const base = mark === "O" ? 349.23 : 440;
    tone(c, base, t0, 0.22, "sine", 0.045, 0.03);
    tone(c, base * 1.5, t0 + 0.05, 0.2, "triangle", 0.022, 0.04);
  } catch {
    /* ignore */
  }
}

/** Tiny blush shimmer for ready / copy. */
export function playSoftPop() {
  try {
    const c = ctx();
    const t0 = c.currentTime;
    tone(c, 523.25, t0, 0.16, "sine", 0.038, 0.03);
    tone(c, 659.25, t0 + 0.08, 0.2, "triangle", 0.028, 0.04);
  } catch {
    /* ignore */
  }
}

/** Win — soft ascending love arpeggio. */
export function playWinSparkle() {
  try {
    const c = ctx();
    const t0 = c.currentTime;
    [329.63, 415.3, 493.88, 659.25].forEach((f, i) => {
      tone(c, f, t0 + i * 0.12, 0.35, "sine", 0.042, 0.05);
      tone(c, f * 2, t0 + i * 0.12, 0.22, "triangle", 0.016, 0.06);
    });
    tone(c, 329.63, t0 + 0.55, 0.55, "sine", 0.035, 0.1);
  } catch {
    /* ignore */
  }
}
