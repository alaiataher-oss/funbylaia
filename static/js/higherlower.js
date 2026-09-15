/** Higher or Lower — solo search-volume guessing game */

import { buildRounds, VOLUME_META } from "./higherlower-data.js";

const TOTAL_ROUNDS = 10;

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resultMessage(score) {
  if (score >= 10) return "You ARE the algorithm.";
  if (score >= 9) return "Google should hire you.";
  if (score >= 7) return "Chronically online.";
  if (score >= 4) return "You kinda know what people are searching.";
  return "The internet remains a mystery.";
}

function formatVolume(n) {
  return Math.round(n).toLocaleString("en-US");
}

function volumeLabel() {
  return `est. / mo · ${VOLUME_META.timeframeLabel}`;
}

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderHigherLower(root, deps) {
  const { navHTML, setMeta } = deps;
  setMeta({
    title: "Higher or Lower · fun by ayaya",
    description: "Which one does the internet search more?",
  });

  let phase = "intro"; // intro | playing | reveal | results
  let rounds = [];
  let roundIndex = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let pickSide = null; // "a" | "b"
  let locked = false;
  let timers = [];

  const clearTimers = () => {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  };

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
  };

  const current = () => rounds[roundIndex] || null;

  const startGame = () => {
    clearTimers();
    rounds = buildRounds(TOTAL_ROUNDS);
    roundIndex = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    pickSide = null;
    locked = false;
    phase = "playing";
    paint();
  };

  const choose = (side) => {
    if (phase !== "playing" || locked) return;
    locked = true;
    pickSide = side;
    paint(); // disable cards immediately

    later(() => {
      phase = "reveal";
      const pair = current();
      if (!pair) return;
      const [a, b] = pair;
      const higher = a.score === b.score ? "tie" : a.score > b.score ? "a" : "b";
      const correct = higher === "tie" ? true : pickSide === higher;
      if (correct) {
        score += 1;
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
      } else {
        streak = 0;
      }
      paint(correct, higher);
      animateCounts();
    }, 1000);
  };

  const nextRound = () => {
    clearTimers();
    if (roundIndex >= TOTAL_ROUNDS - 1) {
      phase = "results";
      paint();
      return;
    }
    roundIndex += 1;
    pickSide = null;
    locked = false;
    phase = "playing";
    paint();
  };

  const animateCounts = () => {
    root.querySelectorAll("[data-hl-count]").forEach((el) => {
      const target = Number(el.getAttribute("data-hl-count") || 0);
      const start = performance.now();
      const dur = 700;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - (1 - t) ** 3;
        el.textContent = formatVolume(target * eased);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = formatVolume(target);
      };
      requestAnimationFrame(tick);
    });
  };

  const searchIcon = () => `
    <svg class="hl-search-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/>
      <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;

  const introHTML = () => `
    <header class="hl-hero">
      <div class="hl-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <h1>Higher or Lower 📈</h1>
      <p class="hl-sub">Which one does the internet search more?</p>
      <p class="hl-lead">Guess which search gets more searches. Survive all 10 rounds.</p>
      <p class="hl-note">Volumes are SEO-style estimates for the <strong>last 1 month</strong> (not official Google data).</p>
      <button type="button" class="btn hl-btn-primary" data-hl-start>Start Game</button>
      <a class="hl-back" href="#/games/solo">← Back to Solo Games</a>
    </header>`;

  const hudHTML = () => `
    <div class="hl-hud" aria-live="polite">
      <span>ROUND <strong>${roundIndex + 1}/${TOTAL_ROUNDS}</strong></span>
      <span>SCORE <strong>${score}</strong></span>
      <span>🔥 STREAK <strong>${streak}</strong></span>
    </div>`;

  const cardHTML = (item, side, opts = {}) => {
    const { revealed, correctSide, picked, disabled } = opts;
    const isHigher = revealed && correctSide === side;
    const isPick = picked === side;
    const classes = [
      "hl-card",
      disabled ? "is-disabled" : "",
      revealed && isHigher ? "is-higher" : "",
      revealed && !isHigher && correctSide !== "tie" ? "is-lower" : "",
      isPick ? "is-picked" : "",
      phase === "playing" && locked && isPick ? "is-waiting" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <button type="button" class="${classes}" data-hl-pick="${side}" ${disabled ? "disabled" : ""}>
        <span class="hl-card-bar" aria-hidden="true"></span>
        <span class="hl-card-top">${searchIcon()}<span>Search</span></span>
        <span class="hl-query">“${esc(item.q)}”</span>
        ${
          revealed
            ? `<span class="hl-volume"><span data-hl-count="${item.estMonthly ?? item.score * 1000}">0</span><small>${esc(volumeLabel())}</small></span>`
            : `<span class="hl-hint">Tap if you think this is higher</span>`
        }
      </button>`;
  };

  const playHTML = (correct = null, higher = null) => {
    const pair = current();
    if (!pair) return "";
    const [a, b] = pair;
    const revealed = phase === "reveal";
    const disabled = phase !== "playing" || locked;

    return `
      ${hudHTML()}
      <div class="hl-arena ${revealed ? "is-revealed" : ""} ${locked && !revealed ? "is-suspense" : ""}">
        ${cardHTML(a, "a", { revealed, correctSide: higher, picked: pickSide, disabled })}
        <div class="hl-vs" aria-hidden="true"><span>VS</span></div>
        ${cardHTML(b, "b", { revealed, correctSide: higher, picked: pickSide, disabled })}
      </div>
      ${
        revealed
          ? `<div class="hl-feedback ${correct ? "ok" : "bad"}">
              <p>${correct ? "You got it! 📈" : "Ouch 📉"}</p>
              <button type="button" class="btn hl-btn-primary" data-hl-next>${
                roundIndex >= TOTAL_ROUNDS - 1 ? "See Results" : "Next Round"
              }</button>
            </div>`
          : locked
            ? `<p class="hl-wait">Checking the internet…</p>`
            : `<p class="hl-wait muted">Pick the search you think is bigger.</p>`
      }`;
  };

  const resultsHTML = () => `
    <section class="hl-results">
      <div class="hl-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <h2>${score}/${TOTAL_ROUNDS} Correct</h2>
      <p class="hl-streak-final">Longest Streak: <strong>${bestStreak}</strong> 🔥</p>
      <p class="hl-msg">${esc(resultMessage(score))}</p>
      <p class="hl-note">Compared SEO-style estimates for the <strong>last 1 month</strong>.</p>
      <div class="hl-end-actions">
        <button type="button" class="btn hl-btn-primary" data-hl-again>Play Again</button>
        <a class="btn hl-btn-ghost" href="#/games/solo">Back to Games</a>
      </div>
    </section>`;

  const wire = () => {
    root.querySelector("[data-hl-start]")?.addEventListener("click", startGame);
    root.querySelector("[data-hl-again]")?.addEventListener("click", startGame);
    root.querySelector("[data-hl-next]")?.addEventListener("click", nextRound);
    root.querySelectorAll("[data-hl-pick]").forEach((btn) => {
      btn.addEventListener("click", () => choose(btn.getAttribute("data-hl-pick")));
    });
  };

  const paint = (correct = null, higher = null) => {
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page hl-page">
        ${phase === "intro" ? introHTML() : ""}
        ${phase === "playing" || phase === "reveal" ? playHTML(correct, higher) : ""}
        ${phase === "results" ? resultsHTML() : ""}
      </main>`;
    wire();
  };

  paint();
  root._hlCleanup = clearTimers;
}

export function startHigherLower() {
  /* solo — nothing to clear */
}
