/** Food Chain 60 — solo word-chain (EN / ID), Fruit Merge vibe */

import { FOOD_WORDS, FOOD_SET } from "./foodchain-words.js";
import { FOOD_WORDS_ID, FOOD_SET_ID } from "./foodchain-words-id.js";

const LANG_KEY = "funbylaia_foodchain_lang";
const DURATION = 60;
const SKIP_COST = 3;

const COPY = {
  en: {
    metaTitle: "Food Chain 60 · fun by ayaya",
    metaDesc: "How many foods can you chain in 60 seconds?",
    pickTitle: "FOOD CHAIN 60 🍎",
    pickSub: "Pick a language to start",
    pickHint: "English foods · Indonesian foods",
    enBtn: "🇬🇧 English",
    idBtn: "🇮🇩 Bahasa Indonesia",
    backGames: "← Back to Games",
    howTitle: "How to play",
    howLead: "How many foods can you chain in 60 seconds?",
    howRule: "Each food must start with the last letter of the one before it.",
    howExample: "APPLE → EGG → GRAPE → EDAMAME → …",
    howBullets: [
      "English food & drink names only",
      "No repeated words in the same game",
      "Multi-word foods are OK (ice cream, apple pie)",
      `SKIP costs ${SKIP_COST} seconds and gives a new starter`,
    ],
    bestLabel: "Personal best",
    startBtn: "START GAME",
    changeLang: "Change language",
    chained: "Chained",
    nextStarts: "NEXT FOOD STARTS WITH",
    placeholder: "Type a food…",
    enter: "Enter",
    skip: `SKIP (−${SKIP_COST}s)`,
    nice: "Nice!",
    already: "Already used!",
    needs: (L) => `Needs to start with ${L}!`,
    notInDict: "Not in our food dictionary!",
    skipped: `Skipped (−${SKIP_COST}s) · new starter`,
    timesUp: "TIME'S UP! ⏰",
    foodsChained: "Foods Chained",
    longest: "Longest Chain",
    personalBest: "Personal Best",
    newBest: "New personal best!",
    playAgain: "PLAY AGAIN",
    backToGames: "BACK TO GAMES",
    ranks: [
      { min: 21, title: "Food Chain Legend", emoji: "👑" },
      { min: 16, title: "Culinary Machine", emoji: "🔥" },
      { min: 11, title: "Head Chef", emoji: "👨‍🍳" },
      { min: 6, title: "Kitchen Regular", emoji: "🍳" },
      { min: 0, title: "Hungry Beginner", emoji: "🍞" },
    ],
  },
  id: {
    metaTitle: "Food Chain 60 · fun by ayaya",
    metaDesc: "Berapa banyak makanan yang bisa kamu rangkai dalam 60 detik?",
    pickTitle: "FOOD CHAIN 60 🍎",
    pickSub: "Pilih bahasa dulu ya",
    pickHint: "Makanan Inggris · Makanan Indonesia",
    enBtn: "🇬🇧 English",
    idBtn: "🇮🇩 Bahasa Indonesia",
    backGames: "← Kembali ke Games",
    howTitle: "Cara main",
    howLead: "Berapa banyak makanan yang bisa kamu rangkai dalam 60 detik?",
    howRule: "Setiap makanan harus dimulai dengan huruf terakhir makanan sebelumnya.",
    howExample: "APEL → LUMPIA → AYAM → MANGGA → …",
    howBullets: [
      "Hanya nama makanan & minuman (kamus Indonesia)",
      "Tidak boleh mengulang kata di game yang sama",
      "Makanan multi-kata boleh (nasi goreng, es krim)",
      `SKIP mengurangi ${SKIP_COST} detik dan memberi starter baru`,
    ],
    bestLabel: "Rekor pribadi",
    startBtn: "MULAI MAIN",
    changeLang: "Ganti bahasa",
    chained: "Rangkaian",
    nextStarts: "MAKANAN BERIKUT MULAI DARI",
    placeholder: "Ketik makanan…",
    enter: "Kirim",
    skip: `SKIP (−${SKIP_COST}d)`,
    nice: "Mantap!",
    already: "Sudah dipakai!",
    needs: (L) => `Harus dimulai dengan ${L}!`,
    notInDict: "Tidak ada di kamus makanan kami!",
    skipped: `Di-skip (−${SKIP_COST}d) · starter baru`,
    timesUp: "WAKTU HABIS! ⏰",
    foodsChained: "Makanan Dirangkai",
    longest: "Rantai Terpanjang",
    personalBest: "Rekor Pribadi",
    newBest: "Rekor pribadi baru!",
    playAgain: "MAIN LAGI",
    backToGames: "KEMBALI KE GAMES",
    ranks: [
      { min: 21, title: "Legenda Food Chain", emoji: "👑" },
      { min: 16, title: "Mesin Kuliner", emoji: "🔥" },
      { min: 11, title: "Kepala Koki", emoji: "👨‍🍳" },
      { min: 6, title: "Langganan Dapur", emoji: "🍳" },
      { min: 0, title: "Pemula Lapar", emoji: "🍞" },
    ],
  },
};

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lettersOnly(word) {
  return String(word)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function firstLetter(word) {
  const s = lettersOnly(word);
  return s ? s[0] : "";
}

function lastLetter(word) {
  const s = lettersOnly(word);
  return s ? s[s.length - 1] : "";
}

function normKey(word) {
  return String(word).toLowerCase().trim().replace(/\s+/g, " ");
}

function displayWord(word) {
  return String(word)
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function bestKey(lang) {
  return `funbylaia_foodchain_best_${lang}`;
}

function loadBest(lang) {
  try {
    const n = Number(localStorage.getItem(bestKey(lang)) || 0);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}

function saveBest(lang, n) {
  try {
    localStorage.setItem(bestKey(lang), String(n));
  } catch {
    /* ignore */
  }
}

function loadLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === "id" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function bankFor(lang) {
  if (lang === "id") return { words: FOOD_WORDS_ID, set: FOOD_SET_ID };
  return { words: FOOD_WORDS, set: FOOD_SET };
}

function rankFor(lang, score) {
  const ranks = COPY[lang].ranks;
  return ranks.find((r) => score >= r.min) || ranks[ranks.length - 1];
}

function pickStart(words, exclude = new Set()) {
  const common = words.filter((w) => {
    const L = lettersOnly(w);
    return L.length >= 3 && L.length <= 12 && !exclude.has(normKey(w)) && !w.includes(" ");
  });
  const pool = common.length ? common : words.filter((w) => !exclude.has(normKey(w)));
  return pool[Math.floor(Math.random() * pool.length)] || (words[0] || "apple");
}

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderFoodChain(root, deps) {
  const { navHTML, setMeta } = deps;

  let lang = null; // en | id
  let phase = "lang"; // lang | howto | playing | results
  let chain = [];
  let used = new Set();
  let enteredCount = 0;
  let secondsLeft = DURATION;
  let timerId = null;
  let feedback = "";
  let feedbackKind = "";
  let personalBest = 0;
  let newBest = false;
  let feedbackClearId = null;

  const t = () => COPY[lang || "en"];
  const bank = () => bankFor(lang || "en");

  const stopTimer = () => {
    if (timerId) clearInterval(timerId);
    timerId = null;
  };

  const needed = () => (chain.length ? lastLetter(chain[chain.length - 1]).toUpperCase() : "?");

  const focusInput = () => {
    requestAnimationFrame(() => {
      const el = root.querySelector("[data-fc-input]");
      if (el) el.focus();
    });
  };

  const formatTime = () => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const updateTimerDom = (pulse = false) => {
    const el = root.querySelector("[data-fc-timer]");
    if (!el) return;
    el.textContent = formatTime();
    el.classList.toggle("urgent", secondsLeft <= 10);
    if (pulse && secondsLeft <= 10 && secondsLeft >= 1) {
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    }
  };

  const updateScoreDom = () => {
    const el = root.querySelector("[data-fc-score]");
    if (el) el.textContent = String(enteredCount);
  };

  const updateNextDom = () => {
    const el = root.querySelector("[data-fc-need]");
    if (el) el.textContent = needed();
  };

  const renderChainDom = (pop = false) => {
    const box = root.querySelector("[data-fc-chain]");
    if (!box) return;
    box.innerHTML = chain
      .map((w, i) => {
        const isLast = i === chain.length - 1;
        return `<span role="listitem" class="fc-pill ${isLast && pop ? "pop" : ""}">${esc(displayWord(w))}</span>${
          i < chain.length - 1 ? `<span class="fc-arrow" aria-hidden="true">→</span>` : ""
        }`;
      })
      .join("");
    box.querySelector(".fc-pill:last-of-type")?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  };

  const setFeedback = (msg, kind) => {
    feedback = msg;
    feedbackKind = kind;
    const fb = root.querySelector("[data-fc-feedback]");
    if (fb) {
      fb.className = `fc-feedback ${kind}`;
      fb.textContent = msg ? `${kind === "bad" ? "❌" : "✅"} ${msg}` : "";
    }
    if (feedbackClearId) clearTimeout(feedbackClearId);
    if (kind === "ok") {
      feedbackClearId = setTimeout(() => {
        feedback = "";
        feedbackKind = "";
        const el = root.querySelector("[data-fc-feedback]");
        if (el) {
          el.className = "fc-feedback";
          el.textContent = "";
        }
      }, 500);
    }
  };

  const endGame = () => {
    stopTimer();
    phase = "results";
    const score = enteredCount;
    if (score > personalBest) {
      personalBest = score;
      saveBest(lang, personalBest);
      newBest = true;
    } else {
      newBest = false;
    }
    paint();
  };

  const tick = () => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      secondsLeft = 0;
      endGame();
      return;
    }
    updateTimerDom(true);
  };

  const chooseLang = (next) => {
    lang = next;
    saveLang(next);
    personalBest = loadBest(next);
    const c = t();
    setMeta({ title: c.metaTitle, description: c.metaDesc });
    phase = "howto";
    paint();
  };

  const begin = () => {
    stopTimer();
    const { words } = bank();
    used = new Set();
    enteredCount = 0;
    const start = pickStart(words, used);
    chain = [start];
    used.add(normKey(start));
    secondsLeft = DURATION;
    feedback = "";
    feedbackKind = "";
    newBest = false;
    phase = "playing";
    paint();
    focusInput();
    timerId = setInterval(tick, 1000);
  };

  const fail = (msg) => {
    setFeedback(msg, "bad");
    const input = root.querySelector("[data-fc-input]");
    if (input) {
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 320);
    }
    focusInput();
  };

  const submitWord = (raw) => {
    if (phase !== "playing") return;
    const typed = normKey(raw);
    if (!typed) return;
    const c = t();
    const { set } = bank();
    const need = lastLetter(chain[chain.length - 1]);
    const start = firstLetter(typed);

    if (used.has(typed)) {
      fail(c.already);
      return;
    }
    if (start !== need) {
      fail(c.needs(need.toUpperCase()));
      return;
    }
    if (!set.has(typed)) {
      fail(c.notInDict);
      return;
    }

    chain.push(typed);
    used.add(typed);
    enteredCount += 1;

    const input = root.querySelector("[data-fc-input]");
    if (input) input.value = "";

    renderChainDom(true);
    updateScoreDom();
    updateNextDom();
    setFeedback(c.nice, "ok");
    focusInput();
  };

  const skip = () => {
    if (phase !== "playing") return;
    const c = t();
    const { words } = bank();
    secondsLeft = Math.max(0, secondsLeft - SKIP_COST);
    if (secondsLeft <= 0) {
      secondsLeft = 0;
      endGame();
      return;
    }
    let next = pickStart(words, used);
    let guard = 0;
    while (used.has(normKey(next)) && guard < 50) {
      next = pickStart(words, used);
      guard += 1;
    }
    chain.push(next);
    used.add(normKey(next));

    const input = root.querySelector("[data-fc-input]");
    if (input) input.value = "";

    updateTimerDom(false);
    renderChainDom(true);
    updateNextDom();
    setFeedback(c.skipped, "ok");
    focusInput();
  };

  const fruitDecor = () => `
    <div class="fc-fruits" aria-hidden="true">
      <span class="fc-blob b1">🍎</span>
      <span class="fc-blob b2">🍊</span>
      <span class="fc-blob b3">🍇</span>
      <span class="fc-blob b4">🍉</span>
      <span class="fc-blob b5">🍋</span>
    </div>`;

  const langHTML = () => {
    const c = COPY.en;
    return `
      ${fruitDecor()}
      <header class="fc-hero">
        <p class="fc-kicker">online · juicy · 60s</p>
        <h1>${c.pickTitle}</h1>
        <p class="fc-sub">${esc(c.pickSub)}</p>
        <p class="fc-hint">${esc(c.pickHint)} · ${esc(COPY.id.pickHint)}</p>
      </header>
      <section class="fc-card fc-lang-card">
        <button type="button" class="fc-lang-btn en" data-fc-lang="en">${c.enBtn}</button>
        <button type="button" class="fc-lang-btn id" data-fc-lang="id">${c.idBtn}</button>
        <a class="fc-back" href="#/games/solo">${esc(c.backGames)}</a>
      </section>`;
  };

  const howtoHTML = () => {
    const c = t();
    return `
      ${fruitDecor()}
      <header class="fc-hero">
        <p class="fc-kicker">${lang === "id" ? "online · 60 detik" : "online · 60 seconds"}</p>
        <h1>${esc(c.pickTitle)}</h1>
        <p class="fc-sub">${esc(c.howLead)}</p>
      </header>
      <section class="fc-card">
        <h2 class="fc-how-title">${esc(c.howTitle)}</h2>
        <p class="fc-rule"><strong>${lang === "id" ? "Aturan:" : "Rule:"}</strong> ${esc(c.howRule)}</p>
        <p class="fc-example">${esc(c.howExample)}</p>
        <ul class="fc-bullets">${c.howBullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        <p class="fc-best">${esc(c.bestLabel)}: <strong>${personalBest}</strong></p>
        <button type="button" class="btn fc-cta-juicy" data-fc-start>${esc(c.startBtn)}</button>
        <button type="button" class="fc-text-btn" data-fc-relang>${esc(c.changeLang)}</button>
        <a class="fc-back" href="#/games/solo">${esc(c.backGames)}</a>
      </section>`;
  };

  const playHTML = () => {
    const c = t();
    return `
      <div class="fc-play-top">
        <div class="fc-timer ${secondsLeft <= 10 ? "urgent" : ""}" data-fc-timer aria-live="polite">${formatTime()}</div>
        <div class="fc-score-live">${esc(c.chained)}: <strong data-fc-score>${enteredCount}</strong></div>
      </div>
      <p class="fc-next" aria-live="polite">${esc(c.nextStarts)}: <span data-fc-need>${esc(needed())}</span></p>
      <div class="fc-chain" role="list" data-fc-chain></div>
      <form class="fc-form" data-fc-form>
        <label class="sr-only" for="fc-input">${esc(c.placeholder)}</label>
        <input id="fc-input" class="fc-input" data-fc-input autocomplete="off" autocorrect="off" spellcheck="false" placeholder="${esc(c.placeholder)}" />
        <div class="fc-actions">
          <button type="submit" class="btn fc-cta-juicy">${esc(c.enter)}</button>
          <button type="button" class="btn fc-skip" data-fc-skip>${esc(c.skip)}</button>
        </div>
      </form>
      <p class="fc-feedback ${feedbackKind}" data-fc-feedback>${feedback ? (feedbackKind === "bad" ? "❌ " : "✅ ") + esc(feedback) : ""}</p>
    `;
  };

  const resultsHTML = () => {
    const c = t();
    const score = enteredCount;
    const rank = rankFor(lang, score);
    return `
      <section class="fc-card fc-results ${newBest ? "new-best" : ""}">
        ${newBest ? `<div class="fc-confetti" aria-hidden="true"></div>` : ""}
        <h2>${esc(c.timesUp)}</h2>
        <ul class="fc-stats">
          <li>🍎 ${esc(c.foodsChained)}: <strong>${score}</strong></li>
          <li>🔥 ${esc(c.longest)}: <strong>${score}</strong></li>
          <li>🏆 ${esc(c.personalBest)}: <strong>${personalBest}</strong></li>
        </ul>
        <p class="fc-rank">${esc(rank.emoji)} ${esc(rank.title)}</p>
        ${newBest ? `<p class="fc-newbest">${esc(c.newBest)}</p>` : ""}
        <div class="fc-end-actions">
          <button type="button" class="btn fc-cta-juicy" data-fc-again>${esc(c.playAgain)}</button>
          <a class="btn fc-skip" href="#/games/solo">${esc(c.backToGames)}</a>
        </div>
        <button type="button" class="fc-text-btn" data-fc-relang>${esc(c.changeLang)}</button>
      </section>`;
  };

  const wire = () => {
    root.querySelectorAll("[data-fc-lang]").forEach((btn) => {
      btn.addEventListener("click", () => chooseLang(btn.getAttribute("data-fc-lang")));
    });
    root.querySelector("[data-fc-start]")?.addEventListener("click", begin);
    root.querySelector("[data-fc-again]")?.addEventListener("click", begin);
    root.querySelector("[data-fc-skip]")?.addEventListener("click", skip);
    root.querySelectorAll("[data-fc-relang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        stopTimer();
        phase = "lang";
        lang = null;
        paint();
      });
    });

    const form = root.querySelector("[data-fc-form]");
    const input = root.querySelector("[data-fc-input]");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      submitWord(input?.value || "");
    });

    if (phase === "playing") {
      renderChainDom(true);
      focusInput();
    }
  };

  const paint = () => {
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page fc-page">
        ${phase === "lang" ? langHTML() : ""}
        ${phase === "howto" ? howtoHTML() : ""}
        ${phase === "playing" ? playHTML() : ""}
        ${phase === "results" ? resultsHTML() : ""}
      </main>`;
    wire();
  };

  setMeta({
    title: COPY.en.metaTitle,
    description: COPY.en.metaDesc,
  });

  // Always start at language pick (as requested)
  phase = "lang";
  paint();

  root._fcCleanup = () => {
    stopTimer();
    if (feedbackClearId) clearTimeout(feedbackClearId);
  };
}

export function startFoodChain() {
  /* solo online — nothing to clear */
}
