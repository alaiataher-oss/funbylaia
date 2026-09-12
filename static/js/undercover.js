import { pickWordPair } from "./undercover-words.js";
import { playSelamatBermain } from "./undercover-jingle.js";

/**
 * Undercover — pass-and-play (Indonesia)
 * Roles: civilian (real word), impostor (impostor word, role hidden), mr_white (no word, role shown)
 * 3 players: no Mr White. 4+: 1 impostor + 1 Mr White + rest civilians.
 */

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

/** @type {null | {
 *  step: string,
 *  playerCount: number,
 *  names: string[],
 *  players: Array<{ id: string, name: string, role: string, word: string | null, seen: boolean, ready: boolean, eliminated: boolean }>,
 *  realWord: string,
 *  impostorWord: string,
 *  winner: null | string,
 *  winnerLabel: string,
 *  pendingWhiteGuess: null | string,
 *  revealPlayerId: null | string,
 *  confirmElimId: null | string,
 * }} */
let game = null;

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

function resetGame() {
  game = {
    step: "lang",
    playerCount: 3,
    names: ["", "", ""],
    players: [],
    realWord: "",
    impostorWord: "",
    winner: null,
    winnerLabel: "",
    pendingWhiteGuess: null,
    revealPlayerId: null,
    confirmElimId: null,
  };
}

function ensureGame() {
  if (!game) resetGame();
  return game;
}

function allocateRoles(names) {
  const pair = pickWordPair();
  const n = names.length;
  const roles = [];
  roles.push(ROLE.IMPOSTOR);
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
        ready: false,
        eliminated: false,
      };
    }),
  };
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
    game.winnerLabel = "Civilian menang!";
    game.step = "result";
    return;
  }
  // Impostor wins if civilians are outnumbered or only 1 civilian left with threats
  if (civiliansAlive.length === 0 || (civiliansAlive.length === 1 && alive.length <= 2)) {
    game.winner = "impostor";
    game.winnerLabel = "Impostor menang!";
    game.step = "result";
  }
}

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderUndercover(root, deps) {
  const { navHTML, setMeta, showToast } = deps;
  ensureGame();
  setMeta({
    title: "Undercover · alaia fun",
    description: "Game peran tersembunyi: deskripsikan, tuduh, temukan siapa yang menyamar.",
  });

  const shell = (body) => {
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page undercover-page undercover-ops">
        <div class="uc-ops-bg" aria-hidden="true"></div>
        <a class="uc-back" href="#/games">← Abort to Games</a>
        ${body}
      </main>`;
    wire(root, deps);
  };

  if (game.step === "lang") {
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">FILE // UNDERCOVER</p>
        <h1>SELECT LANGUAGE</h1>
        <p class="muted uc-mono">Choose protocol before briefing begins.</p>
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

  if (game.step === "roles") {
    shell(`
      <header class="uc-head">
        <p class="uc-kicker">Undercover</p>
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
      <button type="button" class="btn btn-primary" data-to-setup>Lanjut →</button>`);
    return;
  }

  if (game.step === "setup") {
    const inputs = Array.from({ length: game.playerCount }, (_, i) => `
      <label class="uc-name-field">
        <span>Pemain ${i + 1}</span>
        <input type="text" maxlength="24" data-name-i="${i}" value="${esc(game.names[i] || "")}" placeholder="Nama…" autocomplete="off" />
      </label>`).join("");
    shell(`
      <header class="uc-head">
        <h1>Setup pemain</h1>
        <p class="muted">Minimal 3 orang. Giliran pakai satu HP.</p>
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
        <button type="submit" class="btn btn-primary">Simpan & mulai alokasi</button>
      </form>`);
    return;
  }

  if (game.step === "reveal") {
    const list = game.players
      .map((p) => {
        let status = "Ketuk untuk buka kartu";
        let action = "open";
        if (p.seen && !p.ready) {
          status = "Sudah lihat · ketuk Ready";
          action = "ready";
        }
        if (p.ready) {
          status = "Ready ✓";
          action = "";
        }
        return `
        <button type="button" class="uc-player-btn ${p.ready ? "is-ready" : ""} ${p.seen ? "is-seen" : ""}"
          ${p.ready ? "disabled" : ""}
          data-action="${action}" data-pid="${p.id}">
          <strong>${esc(p.name)}</strong>
          <span>${status}</span>
        </button>`;
      })
      .join("");
    const allReady = game.players.every((p) => p.ready);
    shell(`
      <header class="uc-head">
        <h1>Buka kartu giliran</h1>
        <p class="muted">Giliran satu orang. Kartu hanya sekali. Tutup dulu, baru Ready.</p>
      </header>
      <div class="uc-player-list">${list}</div>
      ${
        allReady
          ? `<button type="button" class="btn btn-primary" data-to-play>Semua ready · mulai main</button>`
          : `<p class="tiny muted">Menunggu semua pemain ready…</p>`
      }
      <div class="uc-modal" data-modal hidden>
        <div class="uc-modal-card" role="dialog" aria-modal="true">
          <div data-modal-body></div>
          <button type="button" class="btn btn-soft" data-close-card>Tutup kartu</button>
        </div>
      </div>`);
    return;
  }

  if (game.step === "play") {
    if (game.pendingWhiteGuess) {
      const p = game.players.find((x) => x.id === game.pendingWhiteGuess);
      shell(`
        <header class="uc-head">
          <h1>Mr White tersingkir!</h1>
          <p class="muted">${esc(p?.name || "Mr White")} boleh menebak kata Civilian.</p>
        </header>
        <form class="uc-guess" data-white-guess>
          <label>
            <span>Tebakan kata</span>
            <input type="text" name="guess" autocomplete="off" required placeholder="Ketik kata…" />
          </label>
          <button type="submit" class="btn btn-primary">Tebak</button>
        </form>`);
      return;
    }

    if (game.confirmElimId) {
      const p = game.players.find((x) => x.id === game.confirmElimId);
      shell(`
        <header class="uc-head">
          <h1>Eliminasi ${esc(p?.name || "")}?</h1>
          <p class="muted">Role akan dibuka setelah ini.</p>
        </header>
        <div class="uc-actions">
          <button type="button" class="btn btn-primary" data-confirm-elim>Ya, eliminasi</button>
          <button type="button" class="btn btn-ghost" data-cancel-elim>Batal</button>
        </div>`);
      return;
    }

    const alive = alivePlayers();
    const out = game.players.filter((p) => p.eliminated);
    shell(`
      <header class="uc-head">
        <h1>Eliminasi</h1>
        <p class="muted">Diskusi dulu, lalu pilih siapa yang keluar.</p>
      </header>
      <div class="uc-player-list">
        ${alive
          .map(
            (p) => `
          <button type="button" class="uc-player-btn danger" data-elim="${p.id}">
            <strong>${esc(p.name)}</strong>
            <span>Eliminasi</span>
          </button>`
          )
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

  if (game.step === "result") {
    shell(`
      <header class="uc-head">
        <h1>${esc(game.winnerLabel)}</h1>
        <p class="muted">Kata Civilian: <strong>${esc(game.realWord)}</strong> · Impostor: <strong>${esc(game.impostorWord)}</strong></p>
      </header>
      <ul class="uc-reveal-all">
        ${game.players
          .map(
            (p) =>
              `<li><strong>${esc(p.name)}</strong> · ${ROLE_LABEL[p.role]}${p.word ? ` (${esc(p.word)})` : ""}</li>`
          )
          .join("")}
      </ul>
      <div class="uc-actions">
        <button type="button" class="btn btn-primary" data-again>Main lagi</button>
        <a class="btn btn-ghost" href="#/games">Keluar</a>
      </div>`);
  }
}

function cardBodyFor(player) {
  if (player.role === ROLE.MR_WHITE) {
    return `
      <p class="uc-card-role">Kamu adalah</p>
      <h2>Mr White</h2>
      <p class="muted">Kamu tidak dapat kata. Dengarkan petunjuk orang lain, lalu tebak.</p>`;
  }
  // Impostor & civilian: word only, no role label
  return `
    <p class="uc-card-role">Kata kamu</p>
    <h2 class="uc-word">${esc(player.word)}</h2>
    <p class="muted">Jangan bilang kata ini langsung. Beri petunjuk.</p>`;
}

function wire(root, deps) {
  const { showToast } = deps;

  root.querySelector("[data-lang=id]")?.addEventListener("click", () => {
    playSelamatBermain();
    game.step = "roles";
    renderUndercover(root, deps);
  });

  root.querySelector("[data-to-setup]")?.addEventListener("click", () => {
    game.step = "setup";
    renderUndercover(root, deps);
  });

  root.querySelector("[data-minus]")?.addEventListener("click", () => {
    if (game.playerCount <= 3) {
      showToast("Minimal 3 pemain.");
      return;
    }
    game.playerCount -= 1;
    game.names = game.names.slice(0, game.playerCount);
    renderUndercover(root, deps);
  });

  root.querySelector("[data-plus]")?.addEventListener("click", () => {
    if (game.playerCount >= 12) {
      showToast("Maksimal 12 pemain.");
      return;
    }
    game.playerCount += 1;
    game.names.push("");
    renderUndercover(root, deps);
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
    game.step = "reveal";
    showToast("Peran dialokasikan secara acak.");
    renderUndercover(root, deps);
  });

  root.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-pid");
      const action = btn.getAttribute("data-action");
      const player = game.players.find((p) => p.id === id);
      if (!player || player.ready) return;

      if (action === "ready") {
        if (!player.seen) return;
        player.ready = true;
        renderUndercover(root, deps);
        return;
      }

      if (action === "open") {
        if (player.seen) return;
        const modal = root.querySelector("[data-modal]");
        const body = root.querySelector("[data-modal-body]");
        if (!modal || !body) return;
        body.innerHTML = cardBodyFor(player);
        modal.hidden = false;
        game.revealPlayerId = id;
        player.seen = true;
      }
    });
  });

  root.querySelector("[data-close-card]")?.addEventListener("click", () => {
    const modal = root.querySelector("[data-modal]");
    if (modal) modal.hidden = true;
    game.revealPlayerId = null;
    renderUndercover(root, deps);
  });

  root.querySelector("[data-to-play]")?.addEventListener("click", () => {
    game.step = "play";
    renderUndercover(root, deps);
  });

  root.querySelectorAll("[data-elim]").forEach((btn) => {
    btn.addEventListener("click", () => {
      game.confirmElimId = btn.getAttribute("data-elim");
      renderUndercover(root, deps);
    });
  });

  root.querySelector("[data-cancel-elim]")?.addEventListener("click", () => {
    game.confirmElimId = null;
    renderUndercover(root, deps);
  });

  root.querySelector("[data-confirm-elim]")?.addEventListener("click", () => {
    const id = game.confirmElimId;
    game.confirmElimId = null;
    const player = game.players.find((p) => p.id === id);
    if (!player || player.eliminated) return;
    player.eliminated = true;
    if (player.role === ROLE.MR_WHITE) {
      game.pendingWhiteGuess = player.id;
      showToast(`${player.name} adalah Mr White!`);
      renderUndercover(root, deps);
      return;
    }
    showToast(`${player.name} adalah ${ROLE_LABEL[player.role]}.`);
    checkWinAfterElimination();
    renderUndercover(root, deps);
  });

  root.querySelector("[data-white-guess]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const guess = String(fd.get("guess") || "").trim().toLowerCase();
    const answer = game.realWord.trim().toLowerCase();
    game.pendingWhiteGuess = null;
    if (guess === answer) {
      game.winner = "mr_white";
      game.winnerLabel = "Mr White menang!";
      game.step = "result";
      showToast("Tebakan benar!");
    } else {
      showToast("Salah. Mr White gagal.");
      checkWinAfterElimination();
      if (game.step !== "result") game.step = "play";
    }
    renderUndercover(root, deps);
  });

  root.querySelector("[data-again]")?.addEventListener("click", () => {
    const count = game.playerCount;
    const names = [...game.names];
    resetGame();
    game.step = "setup";
    game.playerCount = count;
    game.names = names;
    renderUndercover(root, deps);
  });
}

export function startUndercover() {
  resetGame();
}
