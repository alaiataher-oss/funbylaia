/**
 * Welcome bumper voice + soft pad.
 * Sweet high female speech via Web Speech API (best-effort Ariana-like tone).
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

/** Soft romantic pad under the welcome line. */
export async function playRomanticBumper() {
  const c = await ctx();
  if (c.state !== "running") await c.resume();
  if (c.state !== "running") throw new Error("audio-blocked");
  const t0 = c.currentTime + 0.04;
  const chordA = [130.81, 164.81, 196.0, 246.94];
  const chordB = [146.83, 174.61, 220.0, 261.63];
  chordA.forEach((f, i) => softTone(c, f, t0, 2.1, 0.035 - i * 0.004));
  chordB.forEach((f, i) => softTone(c, f, t0 + 1.4, 1.9, 0.03 - i * 0.003));
  softTone(c, 523.25, t0 + 0.7, 1.4, 0.016);
  softTone(c, 659.25, t0 + 2.0, 1.1, 0.012);
}

function pickSweetVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;
  const prefer = [
    /samantha/i,
    /karen/i,
    /moira/i,
    /fiona/i,
    /victoria/i,
    /karen.*australia/i,
    /female/i,
    /zira/i,
    /google us english/i,
    /google uk english female/i,
    /microsoft .*aria/i,
    /microsoft .*jenny/i,
    /siri/i,
  ];
  for (const re of prefer) {
    const hit = voices.find((v) => re.test(v.name) || re.test(`${v.name} ${v.lang}`));
    if (hit) return hit;
  }
  return voices.find((v) => /en(-|_)?(us|gb|au)/i.test(v.lang)) || voices[0];
}

/** Sweet “Welcome!” line — soft, higher pitch, slightly playful. */
export function speakWelcome() {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve(false);
      return;
    }
    const run = () => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Welcome!");
        const voice = pickSweetVoice();
        if (voice) u.voice = voice;
        u.lang = voice?.lang || "en-US";
        u.pitch = 1.35; // sweeter / higher
        u.rate = 0.92;
        u.volume = 1;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        window.speechSynthesis.speak(u);
      } catch {
        resolve(false);
      }
    };
    // Chrome loads voices async
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) run();
    else {
      const once = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", once);
        run();
      };
      window.speechSynthesis.addEventListener("voiceschanged", once);
      setTimeout(run, 250);
    }
  });
}

/** Pad + welcome voice together. */
export async function playWelcomeBumper() {
  try {
    await playRomanticBumper();
  } catch {
    /* pad may be blocked until gesture */
  }
  // tiny beat so speech sits on the music
  await new Promise((r) => setTimeout(r, 280));
  await speakWelcome();
}
