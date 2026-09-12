/** Tic-Tac-Toe for Long Distance — client */

const SESSION_KEY = "funbylaia_ttt_session";

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
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
    title: "Tic-Tac-Toe for Long Distance · alaia fun",
    description: "Miles apart, one move away.",
  });

  let session = loadSession();
  let pollTimer = null;
  let state = null;
  let view = session?.code ? "room" : "entry";
  let joinCode = "";
  let busy = false;
  let startArmed = false;
  let startPlayed = false;

  const stopPoll = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };

  const paint = () => {
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page ttt-page">
        ${view === "entry" ? entryHTML() : roomHTML()}
      </main>`;
    wire();
  };

  const entryHTML = () => `
    <header class="ttt-hero">
      <p class="ttt-kicker">${ICONS.heart} long distance</p>
      <h1>Tic-Tac-Toe for Long Distance</h1>
      <p class="ttt-sub">Miles apart, one move away. ♡</p>
    </header>
    <div class="ttt-entry-grid">
      <button type="button" class="ttt-door ttt-door-start" data-start>
        <span class="ttt-door-label">Start a New Game</span>
        <span class="ttt-door-hint">Generate a code and wait for them</span>
      </button>
      <div class="ttt-door ttt-door-join">
        <span class="ttt-door-label">Enter a Game Code</span>
        <form class="ttt-join-form" data-join-form>
          <label class="sr-only" for="ttt-code">Room code</label>
          <input id="ttt-code" name="code" maxlength="8" autocomplete="off" placeholder="e.g. LOVE42" value="${esc(joinCode)}" required />
          <button type="submit" class="btn btn-primary">Join</button>
        </form>
      </div>
    </div>
    <a class="ttt-back" href="#/games">← Back to Games</a>
  `;

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
    const bothIn =
      (state.players.X.joined ?? state.players.X.connected) &&
      (state.players.O.joined ?? state.players.O.connected);
    const finished = state.status === "finished";
    const abandoned = state.status === "abandoned";
    const playing = state.status === "playing";
    const lobby = state.status === "lobby" || state.status === "waiting";
    const pill = (mark) => {
      const p = state.players[mark];
      const joined = p.joined ?? !!p.connected;
      if (!joined) return `${mark} waiting`;
      const link = p.connected ? "online" : "reconnecting…";
      return `${mark} ${link}${p.ready ? " · ready" : ""}`;
    };

    return `
      <header class="ttt-room-head">
        <div>
          <p class="ttt-kicker">room</p>
          <h1 class="ttt-code-line">
            <span class="ttt-code">${esc(state.code)}</span>
            <button type="button" class="btn btn-ghost tiny ttt-copy" data-copy aria-label="Copy code">${ICONS.copy} Copy Code</button>
          </h1>
          <p class="muted tiny">Share this code with your person.</p>
        </div>
        <div class="ttt-score" aria-label="Scoreboard">
          <div><strong>Player 1${state.youAreHost ? " · you" : ""}</strong><span>${scores.player1}</span></div>
          <div><strong>Player 2${!state.youAreHost && you ? " · you" : ""}</strong><span>${scores.player2}</span></div>
          <div><strong>Draws</strong><span>${scores.draws || 0}</span></div>
        </div>
      </header>

      <div class="ttt-status-row">
        <span class="ttt-pill ${state.players.X.connected ? "on" : ""}">${pill("X")}</span>
        <span class="ttt-pill ${state.players.O.connected ? "on" : ""}">${pill("O")}</span>
      </div>

      ${
        abandoned
          ? `<p class="ttt-banner">Partner left the room.</p>`
          : ""
      }

      ${
        lobby
          ? `<section class="ttt-lobby">
              <p>${bothIn ? "You’re both here. Click ready when you are." : "Waiting for your partner to enter the code…"}</p>
              <button type="button" class="btn btn-primary" data-ready ${!bothIn || (you && state.players[you]?.ready) ? "disabled" : ""}>
                ${you && state.players[you]?.ready ? "Ready ✓ — waiting for them" : "I’m Ready"}
              </button>
            </section>`
          : ""
      }

      ${
        playing || finished
          ? `<p class="ttt-turn" aria-live="polite">${
              finished
                ? "Game over"
                : state.turn === you
                  ? "Your turn"
                  : "Their turn"
            }</p>
            <div class="ttt-board" role="grid" aria-label="Tic tac toe board">
              ${state.board
                .map((cell, i) => {
                  const win = finished && state.winningLine?.includes(i);
                  const can =
                    playing && state.turn === you && cell == null && !busy;
                  return `<button type="button" role="gridcell" class="ttt-cell ${cell ? "filled" : ""} ${win ? "win" : ""}" data-cell="${i}" ${can ? "" : "disabled"} aria-label="Cell ${i + 1}${cell ? `, ${cell}` : ""}">${cell === "X" ? "✕" : cell === "O" ? "◯" : ""}</button>`;
                })
                .join("")}
            </div>`
          : ""
      }

      <div class="ttt-actions">
        <button type="button" class="btn btn-ghost" data-leave>Leave Game</button>
        ${finished ? `<button type="button" class="btn btn-soft" data-rematch>${you && state.rematch?.[you] ? "Waiting for rematch…" : "Play Again"}</button>` : ""}
      </div>

      ${finished ? resultModalHTML() : ""}
    `;
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

  const maybePlayStart = (data) => {
    if (startPlayed) return;
    if (data?.startSound || (startArmed && data?.status === "playing")) {
      playLetTheGameBegin();
      startPlayed = true;
      startArmed = false;
    }
  };

  const refresh = async () => {
    if (!session?.code || !session?.playerId) return;
    try {
      const prevStatus = state?.status;
      state = await api(`/rooms/${session.code}?playerId=${encodeURIComponent(session.playerId)}`);
      if (state.you) {
        session.mark = state.you;
        saveSession(session);
      }
      if (state.status === "lobby" && (prevStatus === "finished" || prevStatus === "playing")) {
        startPlayed = false;
      }
      maybePlayStart(state);
      paint();
    } catch (err) {
      showToast(err.message || "Lost connection.");
    }
  };

  const startPoll = () => {
    stopPoll();
    pollTimer = setInterval(refresh, 900);
  };

  const wire = () => {
    root.querySelector("[data-start]")?.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      try {
        const data = await api("/rooms", { method: "POST" });
        session = { code: data.code, playerId: data.playerId, mark: data.you || data.mark };
        saveSession(session);
        state = data;
        view = "room";
        paint();
        startPoll();
        showToast("Room created. Share your code.");
      } catch (err) {
        showToast(err.message);
      } finally {
        busy = false;
      }
    });

    root.querySelector("[data-join-form]")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const fd = new FormData(e.target);
      const code = String(fd.get("code") || "").trim().toUpperCase();
      joinCode = code;
      if (!code) return;
      busy = true;
      try {
        const data = await api(`/rooms/${encodeURIComponent(code)}/join`, { method: "POST", body: "{}" });
        session = { code: data.code, playerId: data.playerId, mark: data.you || data.mark };
        saveSession(session);
        state = data;
        view = "room";
        paint();
        startPoll();
        showToast("Joined. Say hi — then get ready.");
      } catch (err) {
        showToast(err.message);
        paint();
      } finally {
        busy = false;
      }
    });

    root.querySelector("[data-copy]")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(state.code);
        showToast("Code copied.");
      } catch {
        showToast(state.code);
      }
    });

    root.querySelectorAll("[data-ready]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (busy || !session) return;
        busy = true;
        try {
          const data = await api(`/rooms/${session.code}/ready`, {
            method: "POST",
            body: JSON.stringify({ playerId: session.playerId }),
          });
          state = data;
          startArmed = true;
          maybePlayStart(data);
          paint();
        } catch (err) {
          showToast(err.message);
        } finally {
          busy = false;
        }
      });
    });

    root.querySelectorAll("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (busy || !session) return;
        const cell = Number(btn.getAttribute("data-cell"));
        busy = true;
        try {
          state = await api(`/rooms/${session.code}/move`, {
            method: "POST",
            body: JSON.stringify({ playerId: session.playerId, cell }),
          });
          paint();
        } catch (err) {
          showToast(err.message);
        } finally {
          busy = false;
        }
      });
    });

    root.querySelectorAll("[data-rematch]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (busy || !session) return;
        busy = true;
        try {
          state = await api(`/rooms/${session.code}/rematch`, {
            method: "POST",
            body: JSON.stringify({ playerId: session.playerId }),
          });
          if (state.status === "lobby") startPlayed = false;
          paint();
          showToast(state.status === "lobby" ? "New round — ready up again." : "Rematch requested.");
        } catch (err) {
          showToast(err.message);
        } finally {
          busy = false;
        }
      });
    });

    root.querySelectorAll("[data-leave]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        stopPoll();
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
        paint();
      });
    });
  };

  // boot
  if (session?.code) {
    view = "room";
    paint();
    refresh().then(startPoll);
  } else {
    paint();
  }

  // cleanup when navigating away is handled by full re-render of app
  root._tttCleanup = stopPoll;
}

export function startTicTacToe() {
  clearSession();
}
