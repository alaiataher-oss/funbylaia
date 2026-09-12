/**
 * Soft romantic bumper pad (original Web Audio — not a copyrighted song).
 * Warm, gentle, ~3.5s.
 */

let audioCtx = null;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") return audioCtx.resume().then(() => audioCtx);
  return Promise.resolve(audioCtx);
}

function softTone(c, freq, start, dur, gain = 0.045) {
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, start);
  f.type = "lowpass";
  f.frequency.setValueAtTime(1800, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.35);
  g.gain.exponentialRampToValueAtTime(gain * 0.7, start + dur * 0.65);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(f);
  f.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** Romantic loading atmosphere for the bumper. */
export async function playRomanticBumper() {
  const c = await ctx();
  if (c.state !== "running") {
    await c.resume();
  }
  if (c.state !== "running") {
    throw new Error("audio-blocked");
  }
  const t0 = c.currentTime + 0.04;
  // Cmaj7-ish warm cloud (gentle, original)
  const chordA = [130.81, 164.81, 196.0, 246.94];
  const chordB = [146.83, 174.61, 220.0, 261.63];
  chordA.forEach((f, i) => softTone(c, f, t0, 2.1, 0.04 - i * 0.004));
  chordB.forEach((f, i) => softTone(c, f, t0 + 1.5, 2.0, 0.035 - i * 0.003));
  softTone(c, 523.25, t0 + 0.8, 1.6, 0.018);
  softTone(c, 659.25, t0 + 2.2, 1.2, 0.014);
}
