import { pickWordPair } from "./undercover-words.js";
import { playSelamatBermain } from "./undercover-jingle.js";

/**
 * Undercover — local pass-and-play on one phone (Indonesia).
 * Persisted in localStorage so refresh never restarts mid-game.
 */

const LS_KEY = "funbylaia_undercover_v2";

const ROLE = {
  CIVILIAN: "civilian",
  IMPOSTOR: "impostor",
  MR_WHITE: "mr_white",
};

const ROLE_LABEL = {
  civilian: "Civilian",
  impostor: "Impostor",
  mr_white: "Mr White",
};

const AVATAR_EMOJI = ["🕵️", "🦊", "🐱", "🐸", "🐼", "🦄", "🐯", "🐙", "🐧", "🦁", "🐰", "🐻"];

/** @type {null | object} */
let game = null;

/** Pending confirm action: null | { type: 'end' | 'new' | 'elim', payload?: string } */
let pendingConfirm = null;

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarFor(player, index = 0) {
  const emoji = AVATAR_EMOJI[index % AVATAR_EMOJI.length];
  return `<span class="uc-avatar" aria-hidden="true"><span class="uc-avatar-emoji">${emoji}</span><span class="uc-avatar-initials">${esc(initials(player?.name))}</span></span>`;
}

function normalizeGuess(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function freshGame() {
  return {
    version: 2,
    step: "lang",
    playerCount: 3,
    names: ["", "", ""],
    players: [],
    realWord: "",
    impostorWord: "",
    winner: null,
    winnerLabel: "",
    pendingWhiteGuess: null,
    confirmElimId: null,
    revealIndex: 0,
    /** pass | open | transition — never restore as open */
    revealPhase: "pass",
    speakingOrder: null,
    round: 1,
    eliminatedLog: [],
  };
}

function saveGame() {
  if (!game) return;
  try {
    const snapshot = structuredClone
      ? structuredClone(game)
      : JSON.parse(JSON.stringify(game));
    // Never persist an open secret card — refresh must restore hidden
    if (snapshot.step === "reveal_card" || snapshot.revealPhase === "open") {
      snapshot.step = "pass";
      snapshot.revealPhase = "pass";
    }
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore quota */
  }
}

function clearSavedGame() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    // Never restore an open secret card
    if (data.revealPhase === "open") data.revealPhase = "pass";
    return { ...freshGame(), ...data, version: 2 };
  } catch {
    return null;
  }
}

function resetGame() {
  game = freshGame();
  pendingConfirm = null;
  clearSavedGame();
}

function ensureGame() {
  if (!game) {
    game = loadGame() || freshGame();
  }
  return game;
}

function persistAndRender(root, deps) {
  saveGame();
  renderUndercover(root, deps);
}

function allocateRoles(names) {
  const pair = pickWordPair();
  const n = names.length;
  const roles = [ROLE.IMPOSTOR];
  if (n >= 4) roles.push(ROLE.MR_WHITE);
  while (roles.length < n) roles.push(ROLE.CIVILIAN);
  const assigned = shuffle(roles);
  return {
    realWord: pair.real,
    impostorWord: pair.impostor,
    players: names.map((name, i) => {
      const role = assigned[i];
      let word = null;
      if (role === ROLE.CIVILIAN) word = pair.real;
      if (role === ROLE.IMPOSTOR) word = pair.impostor;
      return {
        id: `p${i}`,
        name,
        role,
        word,
        seen: false,
        eliminated: false,
      };
    }),
  };
}

/** Build circular speaking order starting from a non–Mr White player. Once only. */
function buildSpeakingOrder() {
  if (game.speakingOrder?.length) return game.speakingOrder;
  const list = game.players;
  const eligible = list.filter((p) => p.role !== ROLE.MR_WHITE);
  const first = eligible[Math.floor(Math.random() * eligible.length)];
  const start = list.findIndex((p) => p.id === first.id);
  const order = [];
  for (let i = 0; i < list.length; i++) {
    order.push(list[(start + i) % list.length].id);
  }
  game.speakingOrder = order;
  return order;
}

function playerById(id) {
  return game.players.find((p) => p.id === id) || null;
}

function alivePlayers() {
  return game.players.filter((p) => !p.eliminated);
}

function checkWinAfterElimination() {
  const alive = alivePlayers();
  const impostorAlive = alive.some((p) => p.role === ROLE.IMPOSTOR);
  const civiliansAlive = alive.filter((p) => p.role === ROLE.CIVILIAN);

  if (!impostorAlive) {
    game.winner = "civilians";
    game.winnerLabel = "🎉 Civilian menang!";
    game.step = "result";
    return;
  }
  if (civiliansAlive.length === 0 || (civiliansAlive.length === 1 && alive.length <= 2)) {
    game.winner = "impostor";
    game.winnerLabel = "🎉 Impostor menang!";
    game.step = "result";
  }
}

function progressStep() {
  const s = game.step;
  if (s === "lang" || s === "roles" || s === "setup") return 0;
  if (s === "pass" || s === "reveal_card" || s === "hide_pass") return 1;
  if (s === "ready_confirm") return 2;
  if (s === "speaking_order" || s === "discuss") return 3;
  if (s === "elim" || s === "elim_confirm" || s === "elim_reveal" || s === "white_guess") return 4;
  if (s === "result") return 5;
  return 0;
}

function progressHTML() {
  const labels = ["Players", "Cards", "Ready", "Clues", "Elimination", "Result"];
  const icons = ["👥", "🃏", "✅", "🎙️", "🗳️", "🎉"];
  const cur = progressStep();
  return `
    <nav class="uc-progress" aria-label="Game progress">
      ${labels
        .map((label, i) => {
          const state = i < cur ? "done" : i === cur ? "current" : "todo";
          return `<span class="uc-progress-item is-${state}" title="${esc(label)}"><span class="uc-progress-ico">${icons[i]}</span><span class="uc-progress-label">${esc(label)}</span></span>`;
        })
        .join('<span class="uc-progress-sep" aria-hidden="true"></span>')}
    </nav>`;
}

function gameChrome(extraActions = "") {
  const inActiveGame = !["lang", "roles", "setup"].includes(game.step);
  return `
    <div class="uc-chrome">
      <a class="uc-back" href="#/games/multiplayer">← Games</a>
      <div class="uc-chrome-actions">
        ${extraActions}
        ${
          inActiveGame
            ? `<button type="button" class="btn btn-ghost tiny" data-confirm-new>New Game</button>
               <button type="button" class="btn btn-ghost tiny" data-confirm-end>End Game</button>`
            : ""
        }
      </div>
    </div>
    ${progressHTML()}`;
}

function confirmModalHTML() {
  if (!pendingConfirm) return "";
  const copy =
    pendingConfirm.type === "end"
      ? { title: "End this game?", body: "Saved progress will be deleted. This cannot be undone.", ok: "End Game" }
      : pendingConfirm.type === "new"
        ? { title: "Start a new game?", body: "Current game will be cleared and you’ll set up players again.", ok: "New Game" }
        : {
            title: `Eliminate ${esc(playerById(pendingConfirm.payload)?.name || "player")}?`,
            body: "Their role will be revealed to everyone.",
            ok: "Yes, eliminate",
          };
  return `
    <div class="uc-modal uc-confirm-modal" data-confirm-modal role="dialog" aria-modal="true">
      <div class="uc-modal-card uc-confirm-card">
        <h2>${copy.title}</h2>
        <p class="muted">${copy.body}</p>
        <div class="uc-actions">
          <button type="button" class="btn btn-primary" data-confirm-yes>${copy.ok}</button>
          <button type="button" class="btn btn-ghost" data-confirm-no>Cancel</button>
        </div>
      </div>
    </div>`;
}

function cardFaceHTML(player) {
  if (player.role === ROLE.MR_WHITE) {
    return `
      <div class="uc-flip-face uc-flip-front">
        <p class="uc-card-role">Kamu adalah</p>
        <h2 class="uc-role-title mrwhite">Mr White</h2>
        <p class="muted">Kamu tidak dapat kata. Dengarkan petunjuk, lalu tebak.</p>
      </div>`;
  }
  return `
    <div class="uc-flip-face uc-flip-front">
      <p class="uc-card-role">Kata kamu</p>
      <h2 class="uc-word">${esc(player.word)}</h2>
      <p class="muted">Jangan bilang kata ini langsung. Beri petunjuk yang cukup samar.</p>
    </div>`;
}

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderUndercover(root, deps) {
  const { navHTML, setMeta } = deps;
  ensureGame();
  setMeta({
    title: "Undercover · fun by ayaya",
    description: "Game peran tersembunyi: deskripsikan, tuduh, temukan siapa yang menyamar.",
  });

  const shell = (body) => {
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page undercover-page undercover-ops">
        <div class="uc-ops-bg" aria-hidden="true"></div>
        ${gameChrome()}
        <div class="uc-stage uc-fade-in">${body}</div>
        ${confirmModalHTML()}
      </main>`;
    wire(root, deps);
  };

  /* ---------- LANG ---------- */
  if (game.step === "lang") {
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🕵️ UNDERCOVER</p>
        <h1>Select Language</h1>
        <p class="muted">One phone. Pass it around. No accounts needed.</p>
      </header>
      <div class="uc-lang-grid">
        <button type="button" class="uc-lang-card is-ready" data-lang="id">
          <strong>Indonesia</strong>
          <span class="uc-pill ready">Ready</span>
          <p>Siap dimainkan</p>
        </button>
        <button type="button" class="uc-lang-card is-soon" data-lang="en" disabled aria-disabled="true">
          <strong>English</strong>
          <span class="uc-pill soon">Coming Soon</span>
          <p>Still being prepared</p>
        </button>
      </div>`);
    return;
  }

  /* ---------- ROLES ---------- */
  if (game.step === "roles") {
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">👥 Briefing</p>
        <h1>Tiga peran</h1>
        <p class="muted">Pahami dulu sebelum mulai.</p>
      </header>
      <div class="uc-role-cards">
        <article class="uc-role civilian">
          <h2>Civilian</h2>
          <p>Dapat kata yang sama. Kerja sama temukan yang mencurigakan.</p>
        </article>
        <article class="uc-role impostor">
          <h2>Impostor</h2>
          <p>Dapat kata yang mirip tapi beda. Menyamar. Jangan ketahuan.</p>
        </article>
        <article class="uc-role mrwhite">
          <h2>Mr White</h2>
          <p>Tidak dapat kata sama sekali. Tebak dari petunjuk orang lain.</p>
        </article>
      </div>
      <p class="tiny muted uc-note">3 pemain: tanpa Mr White. 4+ pemain: 1 Impostor + 1 Mr White.</p>
      <button type="button" class="btn btn-primary uc-cta" data-to-setup>Lanjut →</button>`);
    return;
  }

  /* ---------- SETUP ---------- */
  if (game.step === "setup") {
    const inputs = Array.from({ length: game.playerCount }, (_, i) => `
      <label class="uc-name-field">
        <span class="uc-name-label">${AVATAR_EMOJI[i % AVATAR_EMOJI.length]} Pemain ${i + 1}</span>
        <input type="text" maxlength="24" data-name-i="${i}" value="${esc(game.names[i] || "")}" placeholder="Nama…" autocomplete="off" />
      </label>`).join("");
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">👥 Add Players</p>
        <h1>Setup pemain</h1>
        <p class="muted">Minimal 3 orang. Satu HP digilir.</p>
      </header>
      <div class="uc-count">
        <span>Jumlah pemain</span>
        <div class="uc-stepper">
          <button type="button" class="btn btn-ghost" data-minus aria-label="Kurangi">−</button>
          <strong aria-live="polite">${game.playerCount}</strong>
          <button type="button" class="btn btn-ghost" data-plus aria-label="Tambah">+</button>
        </div>
      </div>
      <form class="uc-names" data-names-form>
        ${inputs}
        <button type="submit" class="btn btn-primary uc-cta">Mulai & bagikan kartu 🃏</button>
      </form>`);
    return;
  }

  /* ---------- PASS PHONE ---------- */
  if (game.step === "pass") {
    const player = game.players[game.revealIndex];
    if (!player) {
      game.step = "ready_confirm";
      persistAndRender(root, deps);
      return;
    }
    shell(`
      <header class="uc-head uc-pass-head">
        <p class="uc-kicker">📱 Pass the Phone</p>
        <div class="uc-pass-hero">
          ${avatarFor(player, game.revealIndex)}
          <h1>Pass the phone to<br/><span class="uc-glow-name">${esc(player.name)}</span></h1>
        </div>
        <p class="uc-warn">Make sure nobody else is looking 👀</p>
        <p class="tiny muted">${game.revealIndex + 1} / ${game.players.length}</p>
      </header>
      <button type="button" class="btn btn-primary uc-cta uc-cta-xl" data-reveal-card>Reveal My Card 🃏</button>`);
    return;
  }

  /* ---------- REVEAL CARD (flip) ---------- */
  if (game.step === "reveal_card") {
    const player = game.players[game.revealIndex];
    if (!player) {
      game.step = "ready_confirm";
      persistAndRender(root, deps);
      return;
    }
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🃏 Reveal Card</p>
        <h1>${esc(player.name)}</h1>
        <p class="muted">Hanya kamu yang boleh melihat.</p>
      </header>
      <div class="uc-flip-scene is-flipped" data-flip>
        <div class="uc-flip-card">
          <div class="uc-flip-face uc-flip-back">
            <span class="uc-card-back-mark">?</span>
            <p>Secret card</p>
          </div>
          ${cardFaceHTML(player)}
        </div>
      </div>
      <button type="button" class="btn btn-soft uc-cta uc-cta-xl" data-hide-card>Hide Card & Pass the Phone 🙈</button>`);
    return;
  }

  /* ---------- NEUTRAL TRANSITION ---------- */
  if (game.step === "hide_pass") {
    const next = game.players[game.revealIndex];
    const done = !next || game.players.every((p) => p.seen);
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">📱 Pass the Phone</p>
        <h1>${done ? "Semua kartu sudah dilihat" : "Kartu tersembunyi"}</h1>
        <p class="muted">${done ? "Siap lanjut ke langkah berikutnya." : "Serahkan HP ke pemain berikutnya. Jangan intip!"}</p>
      </header>
      <div class="uc-neutral-pulse" aria-hidden="true"></div>
      <button type="button" class="btn btn-primary uc-cta uc-cta-xl" data-next-pass>
        ${done ? "Lanjut ✅" : `Lanjut ke ${esc(next.name)} →`}
      </button>`);
    return;
  }

  /* ---------- READY CONFIRM ---------- */
  if (game.step === "ready_confirm") {
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">✅ Ready to Play</p>
        <h1>Everyone Has Seen Their Card!</h1>
        <p class="muted">Pass the phone back to the group and make sure everyone is ready.</p>
      </header>
      <div class="uc-ready-badge" aria-hidden="true">✅</div>
      <button type="button" class="btn btn-primary uc-cta uc-cta-xl" data-ready-play>Ready to Play 🎮</button>`);
    return;
  }

  /* ---------- SPEAKING ORDER ---------- */
  if (game.step === "speaking_order") {
    const order = buildSpeakingOrder();
    saveGame();
    const first = playerById(order[0]);
    const timeline = order
      .map((id, i) => {
        const p = playerById(id);
        const idx = game.players.findIndex((x) => x.id === id);
        return `
          <li class="uc-order-item ${i === 0 ? "is-first" : ""}">
            <span class="uc-order-num">${i + 1}</span>
            ${avatarFor(p, idx)}
            <strong>${esc(p?.name || "")}</strong>
            ${i === 0 ? `<span class="uc-order-tag">First</span>` : ""}
          </li>`;
      })
      .join("");
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🎙️ Give Your Clue</p>
        <h1>Time to Give Your Clues!</h1>
        <p class="uc-first-line"><span class="uc-glow-name">${esc(first?.name || "")}</span> goes first!</p>
      </header>
      <ol class="uc-order-list">${timeline}</ol>
      <p class="uc-clue-tip">“Berikan satu clue tanpa menyebutkan kata rahasianya. Jangan terlalu jelas, tetapi jangan terlalu mencurigakan!”</p>
      <button type="button" class="btn btn-primary uc-cta uc-cta-xl" data-start-discuss>Start Discussion 💬</button>`);
    return;
  }

  /* ---------- DISCUSSION ---------- */
  if (game.step === "discuss") {
    const order = game.speakingOrder || buildSpeakingOrder();
    const aliveIds = new Set(alivePlayers().map((p) => p.id));
    const timeline = order
      .map((id, i) => {
        const p = playerById(id);
        const idx = game.players.findIndex((x) => x.id === id);
        const out = p?.eliminated;
        return `
          <li class="uc-order-item ${i === 0 && game.round === 1 ? "is-first" : ""} ${out ? "is-out" : ""} ${!out && aliveIds.has(id) ? "is-alive" : ""}">
            <span class="uc-order-num">${i + 1}</span>
            ${avatarFor(p, idx)}
            <strong>${esc(p?.name || "")}</strong>
            ${out ? `<span class="uc-order-tag out">Out</span>` : ""}
          </li>`;
      })
      .join("");
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">💬 Discussion · Round ${game.round}</p>
        <h1>Diskusi berlangsung</h1>
        <p class="muted">Ikuti urutan clue di bawah. Tidak perlu tekan apa-apa tiap giliran — mainkan secara langsung.</p>
      </header>
      <ol class="uc-order-list">${timeline}</ol>
      <button type="button" class="btn btn-primary uc-cta uc-cta-xl" data-to-elim>Continue to Elimination 🗳️</button>`);
    return;
  }

  /* ---------- WHITE GUESS ---------- */
  if (game.step === "white_guess" || (game.step === "elim" && game.pendingWhiteGuess)) {
    const p = playerById(game.pendingWhiteGuess);
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🔍 Mr White</p>
        <h1>Mr White tersingkir!</h1>
        <p class="muted">${esc(p?.name || "Mr White")} boleh menebak kata Civilian (satu kesempatan).</p>
      </header>
      <form class="uc-guess" data-white-guess>
        <label>
          <span>Tebakan kata</span>
          <input type="text" name="guess" autocomplete="off" required placeholder="Ketik kata…" />
        </label>
        <button type="submit" class="btn btn-primary uc-cta">Tebak</button>
      </form>`);
    return;
  }

  /* ---------- ELIM CONFIRM ---------- */
  if (game.step === "elim_confirm" && game.confirmElimId) {
    const p = playerById(game.confirmElimId);
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🗳️ Elimination</p>
        <h1>Eliminate ${esc(p?.name || "")}?</h1>
        <p class="muted">Role akan dibuka setelah konfirmasi.</p>
      </header>
      <div class="uc-actions">
        <button type="button" class="btn btn-primary uc-cta" data-confirm-elim>Ya, eliminasi</button>
        <button type="button" class="btn btn-ghost" data-cancel-elim>Batal</button>
      </div>`);
    return;
  }

  /* ---------- ELIM REVEAL ---------- */
  if (game.step === "elim_reveal") {
    const last = game.eliminatedLog[game.eliminatedLog.length - 1];
    const p = last ? playerById(last.id) : null;
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🔍 Reveal Role</p>
        <h1>${esc(p?.name || "")}</h1>
      </header>
      <div class="uc-role-reveal uc-pop">
        <p class="muted">adalah</p>
        <h2 class="uc-role-title ${p?.role || ""}">${ROLE_LABEL[p?.role] || "?"}</h2>
      </div>
      <button type="button" class="btn btn-primary uc-cta" data-after-reveal>Lanjut</button>`);
    return;
  }

  /* ---------- ELIMINATION ---------- */
  if (game.step === "elim") {
    const alive = alivePlayers();
    const out = game.players.filter((p) => p.eliminated);
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🗳️ Elimination · Round ${game.round}</p>
        <h1>Pilih yang dieliminasi</h1>
        <p class="muted">Diskusi selesai — siapa yang keluar?</p>
      </header>
      <div class="uc-player-grid">
        ${alive
          .map((p, i) => {
            const idx = game.players.findIndex((x) => x.id === p.id);
            return `
            <button type="button" class="uc-player-card" data-elim="${p.id}">
              ${avatarFor(p, idx >= 0 ? idx : i)}
              <strong>${esc(p.name)}</strong>
              <span>Eliminate</span>
            </button>`;
          })
          .join("")}
      </div>
      ${
        out.length
          ? `<div class="uc-out">
          <h2>Sudah keluar</h2>
          <ul>${out
            .map((p) => `<li><strong>${esc(p.name)}</strong> · ${ROLE_LABEL[p.role]}</li>`)
            .join("")}</ul>
        </div>`
          : ""
      }`);
    return;
  }

  /* ---------- RESULT ---------- */
  if (game.step === "result") {
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">🎉 Winner</p>
        <h1>${esc(game.winnerLabel)}</h1>
        <p class="muted">Kata Civilian: <strong>${esc(game.realWord)}</strong> · Impostor: <strong>${esc(game.impostorWord)}</strong></p>
      </header>
      <ul class="uc-reveal-all">
        ${game.players
          .map((p, i) => {
            return `<li>${avatarFor(p, i)}<div><strong>${esc(p.name)}</strong><span>${ROLE_LABEL[p.role]}${p.word ? ` · ${esc(p.word)}` : ""}</span></div></li>`;
          })
          .join("")}
      </ul>
      <div class="uc-actions">
        <button type="button" class="btn btn-primary uc-cta" data-again>Main lagi</button>
        <button type="button" class="btn btn-ghost" data-confirm-end>End Game</button>
        <a class="btn btn-ghost" href="#/games/multiplayer">Keluar</a>
      </div>`);
    return;
  }

  // Fallback — unknown/corrupt step
  game.step = "setup";
  shell(`
    <header class="uc-head">
      <h1>Undercover</h1>
      <p class="muted">Lanjut setup pemain.</p>
    </header>
    <button type="button" class="btn btn-primary uc-cta" data-to-setup>Setup pemain</button>`);
}

function wire(root, deps) {
  const { showToast } = deps;

  const go = () => persistAndRender(root, deps);

  root.querySelector("[data-lang=id]")?.addEventListener("click", () => {
    playSelamatBermain();
    game.step = "roles";
    go();
  });

  root.querySelector("[data-to-setup]")?.addEventListener("click", () => {
    game.step = "setup";
    go();
  });

  root.querySelector("[data-minus]")?.addEventListener("click", () => {
    if (game.playerCount <= 3) {
      showToast("Minimal 3 pemain.");
      return;
    }
    game.playerCount -= 1;
    game.names = game.names.slice(0, game.playerCount);
    go();
  });

  root.querySelector("[data-plus]")?.addEventListener("click", () => {
    if (game.playerCount >= 12) {
      showToast("Maksimal 12 pemain.");
      return;
    }
    game.playerCount += 1;
    game.names.push("");
    go();
  });

  root.querySelector("[data-names-form]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const names = [];
    for (let i = 0; i < game.playerCount; i++) {
      const el = root.querySelector(`[data-name-i="${i}"]`);
      const v = (el?.value || "").trim();
      if (!v) {
        showToast(`Isi nama pemain ${i + 1}.`);
        el?.focus();
        return;
      }
      names.push(v);
    }
    const unique = new Set(names.map((n) => n.toLowerCase()));
    if (unique.size !== names.length) {
      showToast("Nama pemain harus unik.");
      return;
    }
    game.names = names;
    const alloc = allocateRoles(names);
    game.realWord = alloc.realWord;
    game.impostorWord = alloc.impostorWord;
    game.players = alloc.players;
    game.revealIndex = 0;
    game.revealPhase = "pass";
    game.speakingOrder = null;
    game.round = 1;
    game.eliminatedLog = [];
    game.winner = null;
    game.winnerLabel = "";
    game.pendingWhiteGuess = null;
    game.confirmElimId = null;
    game.step = "pass";
    showToast("Peran dialokasikan. Mulai giliran kartu.");
    go();
  });

  root.querySelector("[data-reveal-card]")?.addEventListener("click", () => {
    const player = game.players[game.revealIndex];
    if (!player) return;
    player.seen = true;
    game.revealPhase = "open";
    game.step = "reveal_card";
    go();
  });

  root.querySelector("[data-hide-card]")?.addEventListener("click", () => {
    game.revealPhase = "transition";
    game.revealIndex += 1;
    if (game.revealIndex >= game.players.length) {
      game.step = "ready_confirm";
      game.revealPhase = "pass";
    } else {
      game.step = "hide_pass";
    }
    go();
  });

  root.querySelector("[data-next-pass]")?.addEventListener("click", () => {
    if (game.players.every((p) => p.seen) && game.revealIndex >= game.players.length) {
      game.step = "ready_confirm";
    } else {
      game.step = "pass";
      game.revealPhase = "pass";
    }
    go();
  });

  root.querySelector("[data-ready-play]")?.addEventListener("click", () => {
    buildSpeakingOrder();
    game.step = "speaking_order";
    go();
  });

  root.querySelector("[data-start-discuss]")?.addEventListener("click", () => {
    game.step = "discuss";
    go();
  });

  root.querySelector("[data-to-elim]")?.addEventListener("click", () => {
    game.step = "elim";
    game.confirmElimId = null;
    go();
  });

  root.querySelectorAll("[data-elim]").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.confirmElimId = btn.getAttribute("data-elim");
      game.step = "elim_confirm";
      go();
    });
  });

  root.querySelector("[data-cancel-elim]")?.addEventListener("click", () => {
    game.confirmElimId = null;
    game.step = "elim";
    go();
  });

  root.querySelector("[data-confirm-elim]")?.addEventListener("click", () => {
    const id = game.confirmElimId;
    game.confirmElimId = null;
    const player = playerById(id);
    if (!player || player.eliminated) {
      game.step = "elim";
      go();
      return;
    }
    player.eliminated = true;
    game.eliminatedLog.push({ id: player.id, role: player.role, round: game.round });
    game.step = "elim_reveal";
    go();
  });

  root.querySelector("[data-after-reveal]")?.addEventListener("click", () => {
    const last = game.eliminatedLog[game.eliminatedLog.length - 1];
    const player = last ? playerById(last.id) : null;
    if (player?.role === ROLE.MR_WHITE) {
      game.pendingWhiteGuess = player.id;
      game.step = "white_guess";
      go();
      return;
    }
    checkWinAfterElimination();
    if (game.step === "result") {
      go();
      return;
    }
    game.round += 1;
    game.step = "discuss";
    go();
  });

  root.querySelector("[data-white-guess]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const guess = normalizeGuess(fd.get("guess"));
    const answer = normalizeGuess(game.realWord);
    game.pendingWhiteGuess = null;
    if (guess && guess === answer) {
      game.winner = "mr_white";
      game.winnerLabel = "🎉 Mr White menang!";
      game.step = "result";
      showToast("Tebakan benar!");
    } else {
      showToast("Salah. Mr White gagal.");
      checkWinAfterElimination();
      if (game.step !== "result") {
        game.round += 1;
        game.step = "discuss";
      }
    }
    go();
  });

  root.querySelector("[data-again]")?.addEventListener("click", () => {
    const count = game.playerCount;
    const names = [...game.names];
    resetGame();
    game.step = "setup";
    game.playerCount = count;
    game.names = names;
    saveGame();
    renderUndercover(root, deps);
  });

  root.querySelectorAll("[data-confirm-end]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingConfirm = { type: "end" };
      renderUndercover(root, deps);
    });
  });

  root.querySelectorAll("[data-confirm-new]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingConfirm = { type: "new" };
      renderUndercover(root, deps);
    });
  });

  root.querySelector("[data-confirm-no]")?.addEventListener("click", () => {
    pendingConfirm = null;
    renderUndercover(root, deps);
  });

  root.querySelector("[data-confirm-yes]")?.addEventListener("click", () => {
    const type = pendingConfirm?.type;
    pendingConfirm = null;
    if (type === "end") {
      resetGame();
      location.hash = "#/games/multiplayer";
      return;
    }
    if (type === "new") {
      resetGame();
      game.step = "setup";
      saveGame();
      renderUndercover(root, deps);
      return;
    }
    renderUndercover(root, deps);
  });
}

/** Enter Undercover without wiping a saved in-progress game. */
export function startUndercover() {
  const saved = loadGame();
  if (saved && saved.players?.length && !["lang", "roles", "setup"].includes(saved.step)) {
    game = saved;
    if (game.revealPhase === "open") {
      game.revealPhase = "pass";
      game.step = "pass";
    }
    return;
  }
  if (saved && ["lang", "roles", "setup"].includes(saved.step)) {
    game = saved;
    return;
  }
  resetGame();
}
