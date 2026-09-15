/** Color Confusion — 30s Stroop-style solo game */

const BEST_KEY = "funbylaia_colorconfusion_best";
const DURATION = 30;
const FEEDBACK_MS = 220;

const COLORS = [
  { name: "Red", hex: "#e53935" },
  { name: "Blue", hex: "#1e88e5" },
  { name: "Green", hex: "#43a047" },
  { name: "Yellow", hex: "#f9a825" },
  { name: "Purple", hex: "#8e24aa" },
  { name: "Orange", hex: "#fb8c00" },
  { name: "Pink", hex: "#ec407a" },
  { name: "Black", hex: "#212121" },
];

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadBest() {
  try {
    const n = Number(localStorage.getItem(BEST_KEY) || 0);
    return Number.isFinite(n) ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function saveBest(n) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resultMessage(score) {
  if (score >= 30) return "Are you even human?";
  if (score >= 21) return "Color master 🎨";
  if (score >= 13) return "Fast brain detected ⚡";
  if (score >= 6) return "Not bad. Your eyes are catching up.";
  return "Your brain believed the words 😭";
}

function accuracyPct(correct, wrong) {
  const total = correct + wrong;
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderColorConfusion(root, deps) {
  const { navHTML, setMeta } = deps;
  setMeta({
    title: "Color Confusion · fun by ayaya",
    description: "Don’t read the word. Trust your eyes.",
  });

  let phase = "intro"; // intro | playing | results
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let answered = 0;
  let timeLeft = DURATION;
  let question = null;
  let lastCombo = "";
  let locked = false;
  let feedback = null; // "ok" | "bad" | null
  let personalBest = loadBest();
  let timerId = null;
  let feedbackTimer = null;
  let endAt = 0;

  const clearTimers = () => {
    if (timerId != null) {
      clearInterval(timerId);
      timerId = null;
    }
    if (feedbackTimer != null) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
  };

  const makeQuestion = () => {
    let word;
    let ink;
    let combo = "";
    let guard = 0;
    do {
      word = pick(COLORS);
      const others = COLORS.filter((c) => c.name !== word.name);
      ink = Math.random() < 0.88 ? pick(others) : pick(COLORS);
      combo = `${word.name}|${ink.name}`;
      guard += 1;
    } while (combo === lastCombo && guard < 12);

    lastCombo = combo;

    const distractors = shuffle(
      COLORS.filter((c) => c.name !== ink.name).map((c) => c.name)
    ).slice(0, 2);
    const choices = shuffle([ink.name, ...distractors]);

    return {
      word: word.name,
      ink: ink.name,
      hex: ink.hex,
      choices,
      answerIndex: choices.indexOf(ink.name),
    };
  };

  const finish = () => {
    clearTimers();
    locked = true;
    phase = "results";
    if (score > personalBest) {
      personalBest = score;
      saveBest(personalBest);
    }
    paint();
  };

  const tick = () => {
    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    timeLeft = left;
    const timeEl = root.querySelector("[data-cc-time]");
    if (timeEl) timeEl.textContent = String(left);
    if (left <= 0) finish();
  };

  const startGame = () => {
    clearTimers();
    score = 0;
    correct = 0;
    wrong = 0;
    answered = 0;
    timeLeft = DURATION;
    lastCombo = "";
    locked = false;
    feedback = null;
    question = makeQuestion();
    phase = "playing";
    endAt = Date.now() + DURATION * 1000;
    paint();
    timerId = setInterval(tick, 100);
  };

  const answer = (index) => {
    if (phase !== "playing" || locked || !question) return;
    if (Date.now() >= endAt) {
      finish();
      return;
    }

    locked = true;
    answered += 1;
    const isCorrect = index === question.answerIndex;
    if (isCorrect) {
      score += 1;
      correct += 1;
      feedback = "ok";
    } else {
      score -= 1;
      wrong += 1;
      feedback = "bad";
    }

    // Fast HUD update without full remount delay feel
    paintPlaying(true);

    feedbackTimer = setTimeout(() => {
      feedbackTimer = null;
      if (phase !== "playing") return;
      if (Date.now() >= endAt) {
        finish();
        return;
      }
      question = makeQuestion();
      feedback = null;
      locked = false;
      paint();
    }, FEEDBACK_MS);
  };

  const onKey = (e) => {
    if (phase !== "playing" || locked) return;
    const key = e.key.toLowerCase();
    const map = { a: 0, "1": 0, b: 1, "2": 1, c: 2, "3": 2 };
    if (key in map) {
      e.preventDefault();
      answer(map[key]);
    }
  };

  const introHTML = () => `
    <header class="cc-hero">
      <div class="cc-swatches" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
      <h1>Color Confusion 🎨</h1>
      <p class="cc-sub">Don’t read the word. Trust your eyes.</p>
      <p class="cc-lead">You have 30 seconds. Pick the COLOR of the text, not what the word says.</p>
      <ul class="cc-rules">
        <li>Correct: <strong>+1</strong></li>
        <li>Wrong: <strong>−1</strong></li>
      </ul>
      <p class="cc-best">Personal Best: <strong>${personalBest}</strong> 🏆</p>
      <button type="button" class="btn cc-btn-primary" data-cc-start>Start Game</button>
      <a class="cc-back" href="#/games/solo">← Back to Solo Games</a>
    </header>`;

  const playHTML = () => {
    const q = question;
    const flash = feedback === "ok" ? "is-ok" : feedback === "bad" ? "is-bad" : "";
    return `
      <div class="cc-hud" aria-live="polite">
        <span>TIME <strong data-cc-time>${timeLeft}</strong>s</span>
        <span>SCORE <strong data-cc-score>${score}</strong></span>
        <span>ANSWERED <strong data-cc-answered>${answered}</strong></span>
      </div>
      <div class="cc-arena ${flash}">
        <p class="cc-prompt">What COLOR is the text?</p>
        <p class="cc-word" style="color:${q.hex}" aria-label="Color word">${esc(q.word.toUpperCase())}</p>
        <div class="cc-choices" role="group" aria-label="Answer choices">
          ${q.choices
            .map(
              (name, i) => `
            <button type="button" class="cc-choice" data-cc-pick="${i}" ${locked ? "disabled" : ""}>
              <span class="cc-key">${String.fromCharCode(65 + i)}</span>
              <span>${esc(name.toUpperCase())}</span>
            </button>`
            )
            .join("")}
        </div>
        <p class="cc-keys-hint">Keyboard: A B C · or 1 2 3</p>
      </div>`;
  };

  const resultsHTML = () => {
    const total = answered;
    const acc = accuracyPct(correct, wrong);
    const newBest = score >= personalBest && score > 0;
    return `
      <section class="cc-results">
        <div class="cc-swatches" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <h2>TIME’S UP! ⏰</h2>
        <p class="cc-scoreline">Score: <strong>${score}</strong></p>
        <ul class="cc-stats">
          <li>Correct: <strong>${correct}</strong></li>
          <li>Wrong: <strong>${wrong}</strong></li>
          <li>Total Answered: <strong>${total}</strong></li>
          <li>Accuracy: <strong>${acc}%</strong></li>
        </ul>
        <p class="cc-msg">${esc(resultMessage(score))}</p>
        <p class="cc-best">Personal Best: <strong>${personalBest}</strong> 🏆${newBest ? " · New best!" : ""}</p>
        <div class="cc-end-actions">
          <button type="button" class="btn cc-btn-primary" data-cc-again>Play Again</button>
          <a class="btn cc-btn-ghost" href="#/games/solo">Back to Games</a>
        </div>
      </section>`;
  };

  const paintPlaying = (keepWord) => {
    const scoreEl = root.querySelector("[data-cc-score]");
    const ansEl = root.querySelector("[data-cc-answered]");
    const arena = root.querySelector(".cc-arena");
    if (scoreEl) scoreEl.textContent = String(score);
    if (ansEl) ansEl.textContent = String(answered);
    if (arena) {
      arena.classList.remove("is-ok", "is-bad");
      if (feedback === "ok") arena.classList.add("is-ok");
      if (feedback === "bad") arena.classList.add("is-bad");
    }
    root.querySelectorAll("[data-cc-pick]").forEach((btn) => {
      btn.disabled = locked;
    });
    if (!keepWord) paint();
  };

  const wire = () => {
    root.querySelector("[data-cc-start]")?.addEventListener("click", startGame);
    root.querySelector("[data-cc-again]")?.addEventListener("click", startGame);
    root.querySelectorAll("[data-cc-pick]").forEach((btn) => {
      btn.addEventListener("click", () => answer(Number(btn.getAttribute("data-cc-pick"))));
    });
  };

  const paint = () => {
    const body =
      phase === "intro" ? introHTML() : phase === "playing" ? playHTML() : resultsHTML();
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page cc-page">${body}</main>`;
    wire();
  };

  window.addEventListener("keydown", onKey);
  clearTimers();
  paint();

  root._ccCleanup = () => {
    clearTimers();
    window.removeEventListener("keydown", onKey);
  };
}

export function startColorConfusion() {
  /* route navigation handles render */
}
