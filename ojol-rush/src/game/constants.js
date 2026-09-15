export const LANES = [-2.2, 0, 2.2];
export const BEST_KEY = "funbylaia_ojolrush_best";
export const SOUND_KEY = "funbylaia_ojolrush_sound";

export const BASE_SPEED = 17;
export const MAX_SPEED = 38;
export const SPEED_STEP_EVERY = 14;
export const SPEED_STEP = 1.55;

export const JUMP_DURATION = 0.55;
export const JUMP_HEIGHT = 1.55;
export const LANE_LERP = 9;

export const POOL_CARS = 20;
export const POOL_COINS = 24;
export const POOL_HAZARDS = 8;
export const POOL_POWERS = 6;

export function loadBest() {
  try {
    return Math.max(0, Math.floor(Number(localStorage.getItem(BEST_KEY) || 0)));
  } catch {
    return 0;
  }
}

export function saveBest(n) {
  try {
    localStorage.setItem(BEST_KEY, String(Math.floor(n)));
  } catch {
    /* ignore */
  }
}

export function loadSoundOn() {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v == null ? true : v === "1";
  } catch {
    return true;
  }
}

export function saveSoundOn(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
