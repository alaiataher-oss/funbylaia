/** Tic-Tac-Toe for Long Distance — client */

import {
  playMoveChime,
  playSoftPop,
  playWinSparkle,
} from "./tictactoe-jingle.js";

const SESSION_KEY = "funbylaia_ttt_session";
const POLL_MS = 550;
const REALTIME_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null";
    const data = JSON.parse(raw);
    if (data?.code && data?.playerId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      sessionStorage.removeItem(SESSION_KEY);
    }
    return data;
  } catch {
    return null;
  }
}

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

async function api(path, opts = {}) {
  const res = await fetch(`/api/ttt${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.message || "Something went wrong.";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

function playLetTheGameBegin() {
  try {
    const a = new Audio("/static/audio/let-the-game-begin.mp3");
    a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

function structureOf(s) {
  if (!s) return "loading";
  if (s.status === "abandoned") return "abandoned";
  if (s.status === "waiting" || s.status === "lobby") return "lobby";
  if (s.status === "playing") return "playing";
  if (s.status === "finished") return "finished";
  return String(s.status || "unknown");
}

function snapOf(s) {
  if (!s) return "null";
  return JSON.stringify({
    st: s.status,
    b: s.board,
    t: s.turn,
    w: s.winner,
    wl: s.winningLine,
    sc: s.scores,
    sb: s.scoreboard,
    rm: s.rematch,
    you: s.you,
    host: s.youAreHost,
    X: {
      j: s.players?.X?.joined ?? !!s.players?.X?.connected,
      c: !!s.players?.X?.connected,
      r: !!s.players?.X?.ready,
    },
    O: {
      j: s.players?.O?.joined ?? !!s.players?.O?.connected,
      c: !!s.players?.O?.connected,
      r: !!s.players?.O?.ready,
    },
  });
}

function cloneState(s) {
  try {
    return structuredClone(s);
  } catch {
    return JSON.parse(JSON.stringify(s));
  }
}

const ICONS = {
  heart: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 21s-6.7-4.35-9.33-8.1C.8 10.2 1.5 6.8 4.4 5.4c1.9-.9 4.1-.3 5.4 1.3C11.1 5.1 13.3 4.5 15.2 5.4c2.9 1.4 3.6 4.8 1.73 7.5C18.7 16.65 12 21 12 21z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M6 16V6a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="currentColor" d="M7 4h10v2a5 5 0 01-4 4.9V13h3v2H8v-2h3v-2.1A5 5 0 017 6V4zm-2 1H3v2a3 3 0 003 3V6H5V5zm14 0h-2v1h-1v4a3 3 0 003-3V5zM9 19h6v2H9z"/></svg>`,
  letter: `<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="currentColor" d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm8 6.5L5.5 8v8h13V8L12 12.5z"/></svg>`,
  handshake: `<svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path fill="currentColor" d="M11 10l2-2 4 4-2 2-4-4zm-1.5 1.5L7 14l4 4 2.5-2.5-4-4zM3 9l3-3h3l1 1-4 4L3 9zm18 0l-3 3-3-3 1-1h3l2 1z"/></svg>`,
};

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderTicTacToe(root, deps) {
  const { navHTML, setMeta, showToast } = deps;
  setMeta({
    title: "Tic-Tac-Toe for Long Distance · fun by ayaya",
    description: "Miles apart, one move away.",
  });

  let session = loadSession();
  let pollTimer = null;
  let state = null;
  let view = session?.code ? "room" : "entry";
  let joinCode = "";
  /** @type {false | string} */
  let actionLock = false;
  let startArmed = false;
  let startPlayed = false;
  let lastWinnerKey = "";
  let pollSeq = 0;
  let lastSnap = "";
  let lastStructure = "";
  let realtimeUnsub = null;
  let eventCueTimer = null;
  let pendingCue = null; // { text, kind }
  let refreshInFlight = false;
  let pendingRefresh = false;

  const stopPoll = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };

  const markGlyph = (cell) => (cell === "X" ? "✕" : cell === "O" ? "◯" : "");

  const bothJoined = (s = state) =>
    !!(s?.players?.X && s?.players?.O) &&
    (s.players.X.joined ?? !!s.players.X.connected) &&
    (s.players.O.joined ?? !!s.players.O.connected);

  const canPlayCell = (i) => {
    if (!state || actionLock === "move") return false;
    if (state.status !== "playing") return false;
    if (state.turn !== state.you) return false;
    if (state.board?.[i] != null) return false;
    return true;
  };

  const entryHTML = () => `
    <header class="ttt-hero">
      <div class="ttt-hero-art" aria-hidden="true">
        <div class="ttt-orbit"></div>
        <div class="ttt-orbit ttt-orbit-2"></div>
        <span class="ttt-float-mark x">✕</span>
        <span class="ttt-float-mark o">◯</span>
        <span class="ttt-float-heart">${ICONS.heart}</span>
      </div>
      <p class="ttt-kicker">${ICONS.heart} long distance</p>
      <h1>Tic-Tac-Toe for Long Distance</h1>
      <p class="ttt-sub">Miles apart, one move away. ♡</p>
    </header>
    <div class="ttt-entry-grid">
      <button type="button" class="ttt-door ttt-door-start" data-start>
        <span class="ttt-door-ico" aria-hidden="true">✦</span>
        <span class="ttt-door-label">Start a New Game</span>
        <span class="ttt-door-hint">Generate a code and wait for them</span>
      </button>
      <div class="ttt-door ttt-door-join">
        <span class="ttt-door-ico" aria-hidden="true">♡</span>
        <span class="ttt-door-label">Enter a Game Code</span>
        <form class="ttt-join-form" data-join-form>
          <label class="sr-only" for="ttt-code">Room code</label>
          <input id="ttt-code" name="code" maxlength="8" autocomplete="off" placeholder="e.g. LOVE42" value="${esc(joinCode)}" required />
          <button type="submit" class="btn btn-primary">Join</button>
        </form>
      </div>
    </div>
    <a class="ttt-back" href="#/games/multiplayer">← Back to Games</a>
  `;

  const pillText = (mark) => {
    const p = state.players[mark];
    const joined = p.joined ?? !!p.connected;
    if (!joined) return `${mark} waiting`;
    const link = p.connected ? "online" : "reconnecting…";
    return `${mark} ${link}${p.ready ? " · ready" : ""}`;
  };

  const turnText = () => {
    if (!state) return "";
    if (state.status === "finished") return "Game over";
    if (state.status !== "playing") return "";
    return state.turn === state.you ? "Your turn — make a move" : "Their turn — hang tight";
  };

  const lobbyTitle = () => {
    const both = bothJoined();
    if (both && state.players.X.ready && state.players.O.ready) return "Starting…";
    if (both) return "You’re both here";
    return "Waiting for your person…";
  };

  const lobbyCopy = () => {
    const both = bothJoined();
    if (both && state.players.X.ready && state.players.O.ready) {
      return "Both ready — kicking off the board.";
    }
    if (both) return "Tap ready when you are — starts when you’re both set. No refresh needed.";
    return "Share the code. They’ll land here automatically.";
  };

  const readyLabel = () => {
    const both = bothJoined();
    const you = state.you;
    if (!both) return "Waiting for partner…";
    if (state.players.X.ready && state.players.O.ready) return "Starting…";
    if (you && state.players[you]?.ready) return "Ready ✓ — waiting for them";
    return "I’m Ready";
  };

  const resultModalHTML = () => {
    const you = state.you;
    const w = state.winner;
    let title = "It’s a draw—you’re perfectly matched! 🤝♡";
    let icon = ICONS.handshake;
    let cls = "draw";
    if (w === "draw") {
      /* keep */
    } else if (w === you) {
      title = "Congrats, you won! 🏆✨";
      icon = ICONS.trophy;
      cls = "win";
    } else {
      title = "Better luck next time! 💌";
      icon = ICONS.letter;
      cls = "lose";
    }
    return `
      <div class="ttt-modal" role="dialog" aria-modal="true" aria-label="Result">
        <div class="ttt-modal-card ${cls}">
          <div class="ttt-confetti" aria-hidden="true"></div>
          <div class="ttt-result-ico">${icon}</div>
          <h2>${esc(title)}</h2>
          <div class="ttt-modal-actions">
            <button type="button" class="btn btn-primary" data-rematch>${you && state.rematch?.[you] ? "Waiting…" : "Play Again"}</button>
            <button type="button" class="btn btn-ghost" data-leave>Leave Game</button>
          </div>
        </div>
      </div>`;
  };

  const boardCellsHTML = () => {
    const finished = state.status === "finished";
    const playing = state.status === "playing";
    const you = state.you;
    return state.board
      .map((cell, i) => {
        const win = finished && state.winningLine?.includes(i);
        const can = playing && state.turn === you && cell == null;
        const markCls = cell === "X" ? "is-x" : cell === "O" ? "is-o" : "empty";
        return `<button type="button" role="gridcell" class="ttt-cell ${markCls} ${cell ? "filled" : ""} ${win ? "win" : ""} ${can ? "playable" : "is-waiting"}" data-cell="${i}" aria-disabled="${can ? "false" : "true"}" aria-label="Cell ${i + 1}${cell ? `, ${cell}` : ""}"><span>${markGlyph(cell)}</span></button>`;
      })
      .join("");
  };

  const roomHTML = () => {
    if (!state) {
      return `<div class="ttt-loading">Connecting to your room…</div>`;
    }
    const you = state.you;
    const scores = state.scoreboard || {
      player1: state.scores?.X || 0,
      player2: state.scores?.O || 0,
      draws: state.scores?.draws || 0,
    };
    const finished = state.status === "finished";
    const abandoned = state.status === "abandoned";
    const playing = state.status === "playing";
    const lobby = state.status === "lobby" || state.status === "waiting";
    const youMark = you ? (you === "X" ? "✕" : "◯") : "·";

    return `
      <header class="ttt-room-head">
        <div>
          <p class="ttt-kicker">room</p>
          <h1 class="ttt-code-line">
            <span class="ttt-code">${esc(state.code)}</span>
            <button type="button" class="btn btn-ghost tiny ttt-copy" data-copy aria-label="Copy code">${ICONS.copy} Copy Code</button>
          </h1>
          <p class="muted tiny">Share this code with your person — updates live, no refresh.</p>
          ${
            you
              ? `<p class="ttt-you-are" data-you-are>You are <strong>${youMark}</strong> (${esc(you)})</p>`
              : `<p class="ttt-you-are" data-you-are>Assigning your mark…</p>`
          }
        </div>
        <div class="ttt-score" aria-label="Scoreboard" data-scoreboard>
          <div><strong>Player 1${state.youAreHost ? " · you" : ""}</strong><span data-score-p1>${scores.player1}</span></div>
          <div><strong>Player 2${!state.youAreHost && you ? " · you" : ""}</strong><span data-score-p2>${scores.player2}</span></div>
          <div><strong>Draws</strong><span data-score-draws>${scores.draws || 0}</span></div>
        </div>
      </header>

      <div class="ttt-status-row" data-status-row>
        <span class="ttt-pill ${state.players.X.connected ? "on" : ""}" data-pill="X">${pillText("X")}</span>
        <span class="ttt-pill ${state.players.O.connected ? "on" : ""}" data-pill="O">${pillText("O")}</span>
      </div>
      <div class="ttt-event-cue" data-event-cue hidden role="status" aria-live="assertive"></div>
      <p class="ttt-live-hint" data-live-hint>Live sync on · waiting for updates…</p>
      <button type="button" class="ttt-sync-now" data-sync-now>Sync now</button>

      <div data-banner-slot>
        ${abandoned ? `<p class="ttt-banner">Partner left the room.</p>` : ""}
      </div>

      <div data-lobby-slot>
      ${
        lobby
          ? `<section class="ttt-lobby">
              <div class="ttt-lobby-pulse" aria-hidden="true"></div>
              <p class="ttt-lobby-title" data-lobby-title>${lobbyTitle()}</p>
              <p class="ttt-lobby-copy" data-lobby-copy>${lobbyCopy()}</p>
              <button type="button" class="btn btn-primary ttt-ready-btn" data-ready ${!bothJoined() || (you && state.players[you]?.ready) ? "disabled" : ""}>
                <span data-ready-label>${readyLabel()}</span>
              </button>
            </section>`
          : ""
      }
      </div>

      <div data-play-slot>
      ${
        playing || finished
          ? `<p class="ttt-turn ${finished ? "over" : state.turn === you ? "yours" : "theirs"}" data-turn aria-live="polite">${turnText()}</p>
            <div class="ttt-board-wrap">
              <div class="ttt-board" role="grid" aria-label="Tic tac toe board" data-board>
              ${boardCellsHTML()}
              </div>
            </div>`
          : ""
      }
      </div>

      <div class="ttt-actions" data-actions>
        <button type="button" class="btn btn-ghost" data-leave>Leave Game</button>
        ${
          finished
            ? `<button type="button" class="btn btn-soft" data-rematch>${you && state.rematch?.[you] ? "Waiting for rematch…" : "Play Again"}</button>`
            : ""
        }
      </div>

      <div data-modal-slot>${finished ? resultModalHTML() : ""}</div>
    `;
  };

  const setLiveHint = (msg) => {
    const el = root.querySelector("[data-live-hint]");
    if (el) el.textContent = msg;
  };

  const setEventCue = (text, kind = "") => {
    pendingCue = text ? { text, kind } : null;
    const el = root.querySelector("[data-event-cue]");
    if (!el) return;
    el.hidden = !text;
    el.className = `ttt-event-cue${kind ? ` is-${kind}` : ""}${text ? " is-on" : ""}`;
    el.textContent = text || "";
    clearTimeout(eventCueTimer);
    if (text) {
      eventCueTimer = setTimeout(() => {
        if (pendingCue?.text === text) pendingCue = null;
        const cur = root.querySelector("[data-event-cue]");
        if (cur && cur.textContent === text) {
          cur.hidden = true;
          cur.classList.remove("is-on");
        }
      }, 8000);
    }
  };

  const restoreEventCue = () => {
    if (!pendingCue) return;
    const el = root.querySelector("[data-event-cue]");
    if (!el) return;
    el.hidden = false;
    el.className = `ttt-event-cue${pendingCue.kind ? ` is-${pendingCue.kind}` : ""} is-on`;
    el.textContent = pendingCue.text;
  };

  const boardFilled = (board) => (board || []).filter((c) => c != null).length;

  const patchCells = () => {
    const board = root.querySelector("[data-board]");
    if (!board || !state) return;
    const finished = state.status === "finished";
    const playing = state.status === "playing";
    const you = state.you;
    state.board.forEach((cell, i) => {
      const btn = board.querySelector(`[data-cell="${i}"]`);
      if (!btn) return;
      const win = finished && state.winningLine?.includes(i);
      const can = playing && state.turn === you && cell == null;
      const markCls = cell === "X" ? "is-x" : cell === "O" ? "is-o" : "empty";
      const span = btn.querySelector("span");
      const nextGlyph = markGlyph(cell);
      if (span && span.textContent !== nextGlyph) {
        span.textContent = nextGlyph;
        span.style.animation = "none";
        void span.offsetHeight;
        span.style.animation = "";
      }
      btn.className = `ttt-cell ${markCls} ${cell ? "filled" : ""} ${win ? "win" : ""} ${can ? "playable" : "is-waiting"}`;
      btn.setAttribute("aria-disabled", can ? "false" : "true");
      btn.setAttribute("aria-label", `Cell ${i + 1}${cell ? `, ${cell}` : ""}`);
    });
  };

  const patchRoom = () => {
    if (!state) return;
    const you = state.you;
    const scores = state.scoreboard || {
      player1: state.scores?.X || 0,
      player2: state.scores?.O || 0,
      draws: state.scores?.draws || 0,
    };

    const youAre = root.querySelector("[data-you-are]");
    if (youAre && you) {
      const glyph = you === "X" ? "✕" : "◯";
      youAre.innerHTML = `You are <strong>${glyph}</strong> (${esc(you)})`;
    }

    const p1 = root.querySelector("[data-score-p1]");
    const p2 = root.querySelector("[data-score-p2]");
    const dr = root.querySelector("[data-score-draws]");
    if (p1) p1.textContent = String(scores.player1);
    if (p2) p2.textContent = String(scores.player2);
    if (dr) dr.textContent = String(scores.draws || 0);

    ["X", "O"].forEach((mark) => {
      const pill = root.querySelector(`[data-pill="${mark}"]`);
      if (!pill) return;
      pill.textContent = pillText(mark);
      pill.classList.toggle("on", !!state.players[mark].connected);
    });

    const lobby = state.status === "lobby" || state.status === "waiting";
    const playing = state.status === "playing";
    const finished = state.status === "finished";

    const title = root.querySelector("[data-lobby-title]");
    const copy = root.querySelector("[data-lobby-copy]");
    const readyBtn = root.querySelector("[data-ready]");
    const readyLbl = root.querySelector("[data-ready-label]");
    if (lobby && title) title.textContent = lobbyTitle();
    if (lobby && copy) copy.textContent = lobbyCopy();
    if (lobby && readyBtn) {
      const both = bothJoined();
      const already = !!(you && state.players[you]?.ready);
      const starting = !!(state.players.X.ready && state.players.O.ready);
      readyBtn.disabled = !both || already || starting;
      if (readyLbl) readyLbl.textContent = readyLabel();
    }

    const turn = root.querySelector("[data-turn]");
    if (turn && (playing || finished)) {
      turn.textContent = turnText();
      turn.className = `ttt-turn ${finished ? "over" : state.turn === you ? "yours" : "theirs"}`;
    }

    if (playing || finished) patchCells();

    root.querySelectorAll("[data-rematch]").forEach((btn) => {
      btn.textContent =
        you && state.rematch?.[you]
          ? btn.classList.contains("btn-primary")
            ? "Waiting…"
            : "Waiting for rematch…"
          : "Play Again";
    });
  };

  const paint = (force = false) => {
    const struct = view === "entry" ? "entry" : structureOf(state);
    const snap = view === "entry" ? "entry" : snapOf(state);

    const needFull =
      force ||
      view === "entry" ||
      !root.querySelector(".ttt-page") ||
      !root.querySelector("[data-lobby-slot]") ||
      lastStructure !== struct;

    if (!needFull && snap === lastSnap) {
      setLiveHint("Live sync on · up to date");
      return;
    }

    if (!needFull && view === "room" && state && root.querySelector("[data-lobby-slot]")) {
      lastSnap = snap;
      patchRoom();
      restoreEventCue();
      setLiveHint("Live sync on · just updated");
      return;
    }

    lastStructure = struct;
    lastSnap = snap;
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page ttt-page">
        <div class="ttt-aurora" aria-hidden="true"></div>
        ${view === "entry" ? entryHTML() : roomHTML()}
      </main>`;
    restoreEventCue();
    setLiveHint(state ? "Live sync on · connected" : "Connecting…");
  };

  const announce = (prev, next) => {
    if (!prev || !next) return;
    const other = next.you === "X" ? "O" : next.you === "O" ? "X" : null;
    const prevBoth =
      (prev.players?.X?.joined ?? !!prev.players?.X?.connected) &&
      (prev.players?.O?.joined ?? !!prev.players?.O?.connected);
    const nextBoth =
      (next.players?.X?.joined ?? !!next.players?.X?.connected) &&
      (next.players?.O?.joined ?? !!next.players?.O?.connected);

    if (!prevBoth && nextBoth) {
      setEventCue("They’re in the room — say hi ♡", "join");
      showToast("They’re in the room — say hi ♡", 4200);
      playSoftPop();
    }

    if (other && !prev.players?.[other]?.ready && next.players?.[other]?.ready && next.status === "lobby") {
      if (next.you && next.players[next.you]?.ready) {
        setEventCue("They’re ready too — starting…", "start");
        showToast("They’re ready too — starting…", 4200);
      } else {
        setEventCue("They’re ready — tap I’m Ready!", "ready");
        showToast("They’re ready — tap I’m Ready!", 4500);
      }
      playSoftPop();
    }

    if (prev.status !== "playing" && next.status === "playing") {
      const msg =
        next.turn === next.you ? "Game on — you choose first!" : "Game on — they go first.";
      setEventCue(msg, next.turn === next.you ? "your-turn" : "wait");
      showToast(msg, 4500);
    }

    const prevMarks = boardFilled(prev.board);
    const nextMarks = boardFilled(next.board);
    const boardGrew = nextMarks > prevMarks;
    if (
      boardGrew &&
      next.status === "playing" &&
      next.turn === next.you &&
      prev.turn !== next.you
    ) {
      setEventCue("They chose a cell — your turn!", "your-turn");
      showToast("They chose a cell — your turn!", 4500);
      playSoftPop();
    }

    if (prev.status === "playing" && next.status === "finished") {
      const msg =
        next.winner === next.you
          ? "You won!"
          : next.winner === "draw"
            ? "It’s a draw!"
            : "They won this round.";
      setEventCue(msg, "over");
    }

    if (other && !prev.rematch?.[other] && next.rematch?.[other] && next.status === "finished") {
      setEventCue("They want a rematch — tap Play Again!", "ready");
      showToast("They want a rematch — tap Play Again!", 4500);
      playSoftPop();
    }

    if ((prev.status === "finished" || prev.status === "playing") && next.status === "lobby") {
      setEventCue("New round — ready up when you are.", "ready");
      showToast("New round — ready up when you are.", 4000);
    }
  };

  const maybePlayStart = (data) => {
    if (startPlayed) return;
    if (data?.startSound || (startArmed && data?.status === "playing")) {
      playLetTheGameBegin();
      startPlayed = true;
      startArmed = false;
    }
  };

  const applyState = (data, { announceFrom } = {}) => {
    if (announceFrom) announce(announceFrom, data);
    const prevStatus = announceFrom?.status ?? state?.status;
    state = data;
    if (state.you) {
      session.mark = state.you;
      saveSession(session);
    }
    if (state.status === "lobby" && (prevStatus === "finished" || prevStatus === "playing")) {
      startPlayed = false;
    }
    maybePlayStart(state);
    if (state.status === "finished") {
      const key = `${state.code}-${state.winner}-${(state.scores && JSON.stringify(state.scores)) || ""}`;
      if (key !== lastWinnerKey) {
        lastWinnerKey = key;
        if (state.winner && state.winner !== "draw" && state.winner === state.you) {
          playWinSparkle();
        } else {
          playSoftPop();
        }
      }
    }
    view = "room";
    paint();
  };

  const refresh = async ({ quiet } = {}) => {
    if (!session?.code || !session?.playerId) return;
    if (refreshInFlight) {
      pendingRefresh = true;
      return;
    }
    refreshInFlight = true;
    const seq = ++pollSeq;
    try {
      const prev = state ? cloneState(state) : null;
      // One round-trip: presence + full room state
      const data = await api(
        `/rooms/${session.code}?playerId=${encodeURIComponent(session.playerId)}&pulse=1`
      );
      if (seq !== pollSeq) return;

      // Don't clobber an optimistic local move with a stale behind-server response
      if (actionLock === "move" && state?.board && boardFilled(data.board) < boardFilled(state.board)) {
        return;
      }

      applyState(data, { announceFrom: prev });
      setLiveHint("Live sync on · just updated");
    } catch (err) {
      if (seq !== pollSeq) return;
      const msg = err.message || "Lost connection.";
      if (/not found|expired|abandoned|not a player/i.test(msg)) {
        clearSession();
        session = null;
        state = null;
        view = "entry";
        lastStructure = "";
        lastSnap = "";
        paint(true);
        showToast("That room is no longer available. Start or join a new one.");
        stopPoll();
        stopRealtime();
        return;
      }
      setLiveHint("Connection slow — retrying…");
      if (!quiet) showToast(msg);
    } finally {
      refreshInFlight = false;
      if (pendingRefresh) {
        pendingRefresh = false;
        refresh({ quiet: true });
      }
    }
  };

  const stopRealtime = () => {
    if (typeof realtimeUnsub === "function") {
      try {
        realtimeUnsub();
      } catch {
        /* ignore */
      }
    }
    realtimeUnsub = null;
  };

  const startRealtime = async () => {
    stopRealtime();
    if (!session?.code) return;
    try {
      const cfg = await api("/config");
      if (!cfg?.realtime || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        setLiveHint("Live sync on · polling");
        return;
      }
      const mod = await import(/* @vite-ignore */ REALTIME_CDN);
      const createClient = mod.createClient;
      const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const code = session.code.toUpperCase();
      const channel = sb
        .channel(`ttt-room-${code}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ttt_rooms",
            filter: `code=eq.${code}`,
          },
          () => {
            setLiveHint("Partner update · syncing…");
            refresh({ quiet: true });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setLiveHint("Live sync on · realtime");
        });
      realtimeUnsub = () => {
        try {
          sb.removeChannel(channel);
        } catch {
          /* ignore */
        }
      };
    } catch {
      setLiveHint("Live sync on · polling");
    }
  };

  const startPoll = () => {
    stopPoll();
    pollTimer = setInterval(() => refresh({ quiet: true }), POLL_MS);
    startRealtime();
  };

  const onStart = async () => {
    if (actionLock) return;
    actionLock = "start";
    try {
      const data = await api("/rooms", { method: "POST" });
      session = { code: data.code, playerId: data.playerId, mark: data.you || data.mark };
      saveSession(session);
      lastStructure = "";
      lastSnap = "";
      applyState(data);
      startPoll();
      showToast("Room created. Share your code — they’ll appear here live.");
    } catch (err) {
      showToast(err.message);
    } finally {
      actionLock = false;
    }
  };

  const onJoin = async (code) => {
    if (actionLock) return;
    joinCode = code;
    if (!code) return;
    actionLock = "join";
    playSoftPop();
    try {
      const data = await api(`/rooms/${encodeURIComponent(code)}/join`, {
        method: "POST",
        body: "{}",
      });
      session = { code: data.code, playerId: data.playerId, mark: data.you || data.mark };
      saveSession(session);
      lastStructure = "";
      lastSnap = "";
      applyState(data);
      startPoll();
      showToast("Joined — updates sync automatically.");
    } catch (err) {
      showToast(err.message);
      paint(true);
    } finally {
      actionLock = false;
    }
  };

  const onReady = async () => {
    if (actionLock || !session || !state) return;
    const you = state.you;
    if (!you || !bothJoined()) {
      showToast("Waiting for your partner to join first.");
      return;
    }
    if (state.players[you]?.ready) return;
    actionLock = "ready";
    playSoftPop();
    state.players[you].ready = true;
    paint();
    try {
      const data = await api(`/rooms/${session.code}/ready`, {
        method: "POST",
        body: JSON.stringify({ playerId: session.playerId }),
      });
      startArmed = true;
      applyState(data);
      // Pull again quickly so partner sees us / we see start
      setTimeout(() => refresh({ quiet: true }), 120);
      setTimeout(() => refresh({ quiet: true }), 400);
    } catch (err) {
      if (state?.players?.[you]) state.players[you].ready = false;
      paint(true);
      showToast(err.message);
    } finally {
      actionLock = false;
    }
  };

  const onCell = async (cell) => {
    if (!session || !canPlayCell(cell)) return;
    actionLock = "move";
    const mark = state.you;
    const prevBoard = state.board.slice();
    const prevTurn = state.turn;
    state.board[cell] = mark;
    state.turn = mark === "X" ? "O" : "X";
    patchCells();
    const turnEl = root.querySelector("[data-turn]");
    if (turnEl) {
      turnEl.textContent = "Their turn — hang tight";
      turnEl.className = "ttt-turn theirs";
    }
    playMoveChime(session.mark || mark);
    try {
      const data = await api(`/rooms/${session.code}/move`, {
        method: "POST",
        body: JSON.stringify({ playerId: session.playerId, cell }),
      });
      applyState(data);
      if (data.status === "finished" && data.winner === data.you) playWinSparkle();
      setTimeout(() => refresh({ quiet: true }), 250);
      setTimeout(() => refresh({ quiet: true }), 700);
    } catch (err) {
      state.board = prevBoard;
      state.turn = prevTurn;
      patchCells();
      if (turnEl) {
        turnEl.textContent = turnText();
        turnEl.className = `ttt-turn ${state.turn === state.you ? "yours" : "theirs"}`;
      }
      showToast(err.message);
    } finally {
      actionLock = false;
    }
  };

  const onRematch = async () => {
    if (actionLock || !session) return;
    actionLock = "rematch";
    try {
      const data = await api(`/rooms/${session.code}/rematch`, {
        method: "POST",
        body: JSON.stringify({ playerId: session.playerId }),
      });
      if (data.status === "lobby") startPlayed = false;
      lastStructure = "";
      applyState(data);
      showToast(data.status === "lobby" ? "New round — ready up again." : "Rematch requested.");
    } catch (err) {
      showToast(err.message);
    } finally {
      actionLock = false;
    }
  };

  const onLeave = async () => {
    stopPoll();
    stopRealtime();
    actionLock = "leave";
    if (session) {
      try {
        await api(`/rooms/${session.code}/leave`, {
          method: "POST",
          body: JSON.stringify({ playerId: session.playerId }),
        });
      } catch {
        /* ignore */
      }
    }
    clearSession();
    session = null;
    state = null;
    view = "entry";
    lastStructure = "";
    lastSnap = "";
    actionLock = false;
    paint(true);
  };

  const onRootClick = async (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (t.closest("[data-start]")) {
      e.preventDefault();
      onStart();
      return;
    }
    if (t.closest("[data-copy]")) {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(state.code);
        playSoftPop();
        showToast("Code copied.");
      } catch {
        showToast(state?.code || "");
      }
      return;
    }
    if (t.closest("[data-sync-now]")) {
      e.preventDefault();
      setLiveHint("Syncing now…");
      setEventCue("Checking for their move…", "wait");
      refresh({ quiet: false });
      return;
    }
    if (t.closest("[data-ready]")) {
      e.preventDefault();
      onReady();
      return;
    }
    const cellBtn = t.closest("[data-cell]");
    if (cellBtn && root.contains(cellBtn)) {
      e.preventDefault();
      onCell(Number(cellBtn.getAttribute("data-cell")));
      return;
    }
    if (t.closest("[data-rematch]")) {
      e.preventDefault();
      onRematch();
      return;
    }
    if (t.closest("[data-leave]")) {
      e.preventDefault();
      onLeave();
    }
  };

  const onRootSubmit = (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-join-form]")) return;
    e.preventDefault();
    const fd = new FormData(form);
    const code = String(fd.get("code") || "").trim().toUpperCase();
    onJoin(code);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible" && session?.code) {
      setLiveHint("Back — syncing…");
      refresh({ quiet: true });
    }
  };

  root.addEventListener("click", onRootClick);
  root.addEventListener("submit", onRootSubmit);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);

  if (session?.code && session?.playerId) {
    view = "room";
    paint(true);
    refresh().then(startPoll);
  } else {
    view = "entry";
    paint(true);
  }

  root._tttCleanup = () => {
    stopPoll();
    stopRealtime();
    clearTimeout(eventCueTimer);
    root.removeEventListener("click", onRootClick);
    root.removeEventListener("submit", onRootSubmit);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
  };
}

/** Navigate into TTT — keep existing session so refresh/resume still works. */
export function startTicTacToe() {
  /* intentionally do not clearSession() */
}
