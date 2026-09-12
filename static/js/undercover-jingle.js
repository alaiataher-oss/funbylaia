/**
 * Short spy / mission audio cues (Web Audio + Speech).
 * Original only — not copyrighted film/TV themes.
 */

let audioCtx = null;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(c, freq, start, dur, type = "triangle", gain = 0.08) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

/** Max ~2s: tight tense pulse + sharp sting. */
export function playUndercoverJingle() {
  try {
    const c = ctx();
    const t0 = c.currentTime + 0.02;

    // three tense ticks
    [0, 0.28, 0.56].forEach((off, i) => {
      tone(c, 65, t0 + off, 0.08, "sine", 0.11);
      tone(c, 130, t0 + off, 0.05, "triangle", 0.04);
      tone(c, 920 - i * 40, t0 + off, 0.035, "square", 0.028);
    });

    // rising sting (~0.9–1.7s)
    const sting = [
      [0.9, 247],
      [1.05, 311],
      [1.2, 370],
      [1.38, 494],
    ];
    sting.forEach(([off, f]) => {
      tone(c, f, t0 + off, 0.14, "sawtooth", 0.06);
      tone(c, f * 2, t0 + off, 0.09, "triangle", 0.025);
    });

    // short boom finish (~1.65–1.95s)
    tone(c, 52, t0 + 1.65, 0.28, "sine", 0.13);
    tone(c, 104, t0 + 1.65, 0.16, "triangle", 0.05);
  } catch {
    /* ignore */
  }
}

/** Natural pre-recorded “Selamat bermain” (Neural TTS asset), with soft TTS fallback. */
let selamatAudio = null;

export function playSelamatBermain() {
  try {
    if (!selamatAudio) {
      selamatAudio = new Audio("/static/audio/selamat-bermain.mp3");
      selamatAudio.preload = "auto";
    }
    selamatAudio.pause();
    selamatAudio.currentTime = 0;
    const play = selamatAudio.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => speakSelamatFallback());
    }
  } catch {
    speakSelamatFallback();
  }
}

function speakSelamatFallback() {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Selamat bermain");
    u.lang = "id-ID";
    u.rate = 0.92;
    u.pitch = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const id =
      voices.find((v) => /id(-|_)?ID/i.test(v.lang)) ||
      voices.find((v) => /indonesia/i.test(v.name));
    if (id) u.voice = id;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
