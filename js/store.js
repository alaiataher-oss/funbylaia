import { STORAGE_KEYS, HEART_UNLOCK } from "./data.js";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  hasEntered() {
    return !!read(STORAGE_KEYS.entered, false);
  },
  setEntered() {
    write(STORAGE_KEYS.entered, true);
  },
  hasMindsetSeen() {
    return !!read(STORAGE_KEYS.mindsetSeen, false);
  },
  setMindsetSeen() {
    write(STORAGE_KEYS.mindsetSeen, true);
  },
  bumpVisit() {
    const n = read(STORAGE_KEYS.visitCount, 0) + 1;
    write(STORAGE_KEYS.visitCount, n);
    return n;
  },
  visitCount() {
    return read(STORAGE_KEYS.visitCount, 0);
  },
  greeting() {
    const n = this.visitCount();
    if (n <= 1) return "welcome in.";
    if (n < 5) return "you’re back.";
    return "familiar corner.";
  },
  foundHearts() {
    return read(STORAGE_KEYS.foundHearts, []);
  },
  heartCount() {
    return this.foundHearts().length;
  },
  hasHeart(id) {
    return this.foundHearts().includes(id);
  },
  findHeart(id) {
    const found = this.foundHearts();
    if (found.includes(id)) return { newlyFound: false, count: found.length };
    found.push(id);
    write(STORAGE_KEYS.foundHearts, found);
    write(STORAGE_KEYS.hearts, found.length);
    return { newlyFound: true, count: found.length, unlocked: found.length >= HEART_UNLOCK };
  },
  storiesRead() {
    return read(STORAGE_KEYS.storiesRead, []);
  },
  markStoryRead(id) {
    const list = this.storiesRead();
    if (!list.includes(id)) {
      list.push(id);
      write(STORAGE_KEYS.storiesRead, list);
    }
    return list.length;
  },
  readCount() {
    return this.storiesRead().length;
  },
  getThoughts(storyId) {
    const all = read(STORAGE_KEYS.thoughts, {});
    return all[storyId] || [];
  },
  addThought(storyId, text) {
    const all = read(STORAGE_KEYS.thoughts, {});
    const list = all[storyId] || [];
    list.unshift({ text, at: Date.now() });
    all[storyId] = list.slice(0, 20);
    write(STORAGE_KEYS.thoughts, all);
  },
  getSaves() {
    return read(STORAGE_KEYS.saves, []);
  },
  toggleSave(id) {
    const saves = this.getSaves();
    const i = saves.indexOf(id);
    if (i >= 0) saves.splice(i, 1);
    else saves.push(id);
    write(STORAGE_KEYS.saves, saves);
    return saves.includes(id);
  },
  isSaved(id) {
    return this.getSaves().includes(id);
  },
  setReaction(storyId, reaction) {
    const all = read(STORAGE_KEYS.reactions, {});
    all[storyId] = reaction;
    write(STORAGE_KEYS.reactions, all);
  },
  getReaction(storyId) {
    return read(STORAGE_KEYS.reactions, {})[storyId] || null;
  },
  quizDone() {
    return !!read(STORAGE_KEYS.quizDone, false);
  },
  setQuizDone(result) {
    write(STORAGE_KEYS.quizDone, result || true);
  },
  clearAll() {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
  secretUnlocked() {
    return this.heartCount() >= HEART_UNLOCK;
  },
};
