/** Virtual Stock Market — client */

const SESSION_KEY = "funbylaia_rsm_session";
const AVATARS = ["💖", "🌟", "🎯", "🌈", "🔥", "🦄", "🍀", "🎲"];

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
  const res = await fetch(`/api/rsm${path}`, {
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

function money(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(0)}`;
}

function moveLabel(pct) {
  const p = Number(pct);
  if (p >= 200) return `🚀 +${p}%`;
  if (p >= 100) return `🚀 +${p}%`;
  if (p > 0) return `📈 +${p}%`;
  if (p <= -100) return `💀 ${p}%`;
  if (p <= -80) return `💥 ${p}%`;
  return `📉 ${p}%`;
}

/**
 * @param {HTMLElement} root
 * @param {{ navHTML: Function, setMeta: Function, showToast: Function }} deps
 */
export function renderRsm(root, deps) {
  const { navHTML, setMeta, showToast } = deps;
  setMeta({
    title: "Virtual Stock Market · fun by ayaya",
    description: "Bet together. Panic together. Win the floor.",
  });

  let session = loadSession();
  let state = null;
  let view = session?.code ? "room" : "entry";
  let name = session?.name || "";
  let joinCode = "";
  let investAmt = 0;
  let busy = false;
  let pollTimer = null;
  let lastStatus = "";

  const stopPoll = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  };

  const me = () => (state?.players || []).find((p) => p.id === session?.playerId);

  const paint = () => {
    root.innerHTML = `
      ${navHTML("games")}
      <main class="page rsm-page">
        <div class="rsm-spark" aria-hidden="true"></div>
        ${view === "entry" ? entryHTML() : roomHTML()}
      </main>`;
    wire();
  };

  const entryHTML = () => `
    <header class="rsm-hero">
      <div class="rsm-hero-stage" aria-hidden="true">
        <div class="rsm-hero-ring"></div>
        <div class="rsm-hero-ring r2"></div>
        <div class="rsm-hero-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <span class="rsm-hero-chip up">+200%</span>
        <span class="rsm-hero-chip down">-80%</span>
      </div>
      <p class="rsm-kicker">📈 virtual trading floor</p>
      <h1>Virtual Stock Market</h1>
      <p class="rsm-sub">Bet together. Panic together. Survive five wild rounds.</p>
    </header>
    <div class="rsm-entry-grid">
      <form class="rsm-card rsm-card-create" data-create>
        <div class="rsm-card-badge">HOST</div>
        <h2>Create Room</h2>
        <p class="rsm-card-hint">You’ll get a code to share.</p>
        <label class="rsm-label" for="rsm-name-c">Display name</label>
        <input id="rsm-name-c" name="name" maxlength="18" required placeholder="Your name" value="${esc(name)}" />
        <button type="submit" class="btn btn-primary rsm-cta">Create Room</button>
      </form>
      <form class="rsm-card rsm-card-join" data-join>
        <div class="rsm-card-badge join">JOIN</div>
        <h2>Join Room</h2>
        <p class="rsm-card-hint">Enter their code and jump in.</p>
        <label class="rsm-label" for="rsm-name-j">Display name</label>
        <input id="rsm-name-j" name="name" maxlength="18" required placeholder="Your name" value="${esc(name)}" />
        <label class="rsm-label" for="rsm-code">Room code</label>
        <input id="rsm-code" name="code" maxlength="8" required placeholder="e.g. LOVE42" value="${esc(joinCode)}" />
        <button type="submit" class="btn btn-soft rsm-cta">Join Room</button>
      </form>
    </div>
    <a class="rsm-back" href="#/games/multiplayer">← Back to Games</a>
  `;

  const playersLockRow = (keyLocked) => {
    const players = state.players || [];
    return `<ul class="rsm-lock-list">${players
      .map((p) => {
        const locked = !!p[keyLocked];
        return `<li class="${locked ? "locked" : "waiting"}"><span class="rsm-av">${AVATARS[p.avatar % 8]}</span> ${esc(p.name)} ${locked ? "✅ Locked" : "⏳ Deciding"}</li>`;
      })
      .join("")}</ul>`;
  };

  const portfolio = () => {
    const p = me();
    if (!p) return "";
    return `
      <div class="rsm-portfolio">
        <div><span>Cash</span><strong>${money(p.cash)}</strong></div>
        <div><span>Holdings</span><strong>${money(p.position)}</strong></div>
        <div class="nw"><span>Net Worth</span><strong class="rsm-nw-value">${money(p.netWorth)}</strong></div>
      </div>`;
  };

  const roomHTML = () => {
    if (!state) return `<div class="rsm-loading">Connecting to the trading floor…</div>`;
    const status = state.status;
    const m = state.market || {};
    const p = me();

    let body = "";
    if (status === "LOBBY") {
      const n = (state.players || []).length;
      const needMore = n < 2;
      body = `
        <section class="rsm-panel">
          <div class="rsm-code-row">
            <div>
              <p class="rsm-kicker">room code</p>
              <h2 class="rsm-code">${esc(state.code)}</h2>
            </div>
            <button type="button" class="btn btn-ghost" data-copy>Copy Code</button>
          </div>
          <p class="rsm-lobby-tip">Share this code with a friend. You need <strong>at least 2 people</strong> (you + 1 more) before the market can open.</p>
          <ul class="rsm-players">${(state.players || [])
            .map(
              (pl) =>
                `<li><span class="rsm-av">${AVATARS[pl.avatar % 8]}</span> ${esc(pl.name)}${pl.id === state.hostId ? " · host" : ""}${pl.connected ? "" : " · away"}</li>`
            )
            .join("")}</ul>
          <p class="rsm-player-count">${n} / 6 players · ${needMore ? "waiting for someone to join…" : "ready to brief"}</p>
          ${
            state.youAreHost
              ? needMore
                ? `<button type="button" class="btn btn-primary rsm-cta" disabled>Start Market →</button>
                   <p class="rsm-error-hint">Can’t start yet — invite at least one more player with the code above.</p>`
                : `<button type="button" class="btn btn-primary rsm-cta" data-start>Start Market →</button>
                   <p class="muted tiny" style="text-align:center;margin-top:0.5rem">Next: a quick beginner guide, then Round 1.</p>`
              : `<p class="rsm-wait">Waiting for the host to start…</p>`
          }
        </section>`;
    } else if (status === "BRIEFING") {
      body = `
        <section class="rsm-panel rsm-briefing">
          <p class="rsm-kicker">before we trade</p>
          <h2>How this game works</h2>
          <p class="rsm-brief-lead">No finance knowledge needed. Think of it like a fun money game with your friends.</p>
          <ol class="rsm-howto">
            <li><strong>Everyone starts with $100.</strong> That’s your cash.</li>
            <li><strong>There are 5 rounds.</strong> Each round, a fake stock appears (like LOVR).</li>
            <li><strong>You secretly choose how much cash to invest</strong> — $0, a little, or almost all. Nobody sees your amount until everyone locks.</li>
            <li><strong>Then the market moves.</strong> The stock can jump up (you gain) or crash down (you lose). Clues help a bit, but nothing is guaranteed.</li>
            <li><strong>Hold or Sell:</strong> Keep your investment for the next round (risky), or sell it back into cash (safer).</li>
            <li><strong>Some rounds ask a fun question</strong> (Beach vs Mountains). The room’s answers gently nudge the market — it’s about reading your people.</li>
            <li><strong>After Round 5, everything sells automatically.</strong> Highest net worth wins <em>Wall Street Menace</em>.</li>
          </ol>
          <div class="rsm-brief-loop">
            <span>Predict</span>→<span>Bet</span>→<span>Lock</span>→<span>Reveal</span>→<span>Panic / Celebrate</span>
          </div>
          ${playersLockRow("briefingReady")}
          ${
            p?.briefingReady
              ? `<p class="rsm-locked-msg">You’re ready. Waiting for everyone…</p>`
              : `<button type="button" class="btn btn-primary rsm-cta" data-briefing-ready>I get it — let’s play</button>`
          }
        </section>`;
    } else if (status === "QUESTION" && m.question) {
      const q = m.question;
      body = `
        <section class="rsm-panel rsm-question">
          <p class="rsm-round">ROUND ${state.round} / ${state.totalRounds}</p>
          <h2>MARKET QUESTION</h2>
          <p class="rsm-prompt">${esc(q.prompt)}</p>
          <div class="rsm-choices">
            <button type="button" class="rsm-choice" data-answer="a" ${p?.answerLocked ? "disabled" : ""}>
              <span>${esc(q.a.emoji)}</span><strong>${esc(q.a.label)}</strong>
            </button>
            <button type="button" class="rsm-choice" data-answer="b" ${p?.answerLocked ? "disabled" : ""}>
              <span>${esc(q.b.emoji)}</span><strong>${esc(q.b.label)}</strong>
            </button>
          </div>
          ${playersLockRow("answerLocked")}
        </section>`;
    } else if (status === "MARKET_SIGNAL") {
      const bull = String(m.sentiment || "").toLowerCase().includes("bull");
      body = `
        <section class="rsm-panel rsm-signal ${bull ? "bull" : "bear"}">
          <p class="rsm-round">ROUND ${state.round} / ${state.totalRounds} · MARKET OPEN</p>
          <h2 class="rsm-ticker">${esc(m.ticker || "????")}</h2>
          <p class="rsm-price">Current Price: <strong>${money(m.price)}</strong></p>
          <p class="rsm-headline">“${esc(m.headline || "")}”</p>
          <div class="rsm-meta-row">
            <span>Market Sentiment: ${bull ? "🟢" : "🔴"} ${esc(m.sentiment || "Mixed")}</span>
            <span>Analyst Confidence: ${esc(String(m.confidence ?? "—"))}%</span>
          </div>
          <p class="muted tiny">Signals hint at probability — never a guarantee.</p>
          ${portfolio()}
          <p class="rsm-wait">Investing opens in a moment…</p>
        </section>`;
    } else if (status === "INVESTING") {
      const cash = Number(p?.cash || 0);
      if (!p?.investLocked && investAmt > cash) investAmt = cash;
      body = `
        <section class="rsm-panel">
          <p class="rsm-round">ROUND ${state.round} / ${state.totalRounds} · SECRET INVESTMENT</p>
          <h2 class="rsm-ticker">${esc(m.ticker)}</h2>
          <p class="rsm-price">Price ${money(m.price)}</p>
          ${portfolio()}
          ${
            p?.investLocked
              ? `<p class="rsm-locked-msg">You’re locked in at ${money(p.roundInvest)}. Waiting for everyone…</p>`
              : `<div class="rsm-invest">
                  <label class="rsm-label" for="rsm-amt">Invest available cash</label>
                  <input id="rsm-amt" type="number" min="0" max="${cash}" step="1" value="${Math.round(investAmt)}" data-amt />
                  <input type="range" min="0" max="${Math.max(cash, 0)}" step="1" value="${Math.round(investAmt)}" data-slider />
                  <div class="rsm-quicks">
                    <button type="button" data-pct="0.25">25%</button>
                    <button type="button" data-pct="0.5">50%</button>
                    <button type="button" data-pct="0.75">75%</button>
                    <button type="button" data-pct="1">ALL IN</button>
                  </div>
                  <button type="button" class="btn btn-primary rsm-cta" data-lock>LOCK INVESTMENT</button>
                </div>`
          }
          ${playersLockRow("investLocked")}
        </section>`;
    } else if (status === "INVESTMENTS_LOCKED") {
      body = `
        <section class="rsm-panel rsm-reveal">
          <h2>INVESTMENTS LOCKED 🔒</h2>
          <ul class="rsm-reveal-list">${(state.investmentReveal || [])
            .map((r) => `<li><strong>${esc(r.name)}</strong> — ${money(r.amount)}</li>`)
            .join("")}</ul>
          ${
            m.answersReveal
              ? `<div class="rsm-answers"><h3>Room answers</h3><ul>${m.answersReveal
                  .map((a) => `<li>${esc(a.name)} → ${esc(a.label)}</li>`)
                  .join("")}</ul>
                  <p>${esc(m.question?.a?.label || "A")}: <strong>${m.shareA ?? "—"}%</strong></p></div>`
              : ""
          }
          <p class="rsm-wait">Market reveal incoming…</p>
        </section>`;
    } else if (status === "MARKET_REVEAL") {
      const up = Number(m.movement) > 0;
      body = `
        <section class="rsm-panel rsm-market-move ${up ? "up" : "down"} ${Math.abs(m.movement) >= 100 ? "huge" : ""}">
          <p class="rsm-round">ROUND ${state.round} / ${state.totalRounds}</p>
          <div class="rsm-chart" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
          <h2>${esc(m.ticker)} ${moveLabel(m.movement)}</h2>
          <p class="rsm-price-flow">${money(m.priceBefore)} → ${money(m.priceAfter)}</p>
          ${portfolio()}
          <p class="rsm-pl ${Number(p?.roundPl) >= 0 ? "pos" : "neg"}">Round P/L: ${money(p?.roundPl)}</p>
        </section>`;
    } else if (status === "HOLD_OR_SELL") {
      const hasPos = Number(p?.position || 0) > 0;
      body = `
        <section class="rsm-panel">
          <p class="rsm-round">ROUND ${state.round} / ${state.totalRounds} · HOLD OR SELL</p>
          ${portfolio()}
          ${
            p?.decisionLocked
              ? `<p class="rsm-locked-msg">Decision locked. Waiting for the room…</p>`
              : hasPos
                ? `<div class="rsm-decide">
                    <button type="button" class="btn btn-primary" data-decide="SELL">SELL</button>
                    <button type="button" class="btn btn-soft" data-decide="HOLD">HOLD</button>
                  </div>`
                : `<button type="button" class="btn btn-primary rsm-cta" data-decide="CONTINUE">CONTINUE</button>`
          }
          ${playersLockRow("decisionLocked")}
        </section>`;
    } else if (status === "DECISION_REVEAL") {
      body = `
        <section class="rsm-panel rsm-reveal">
          <h2>Decisions revealed</h2>
          <ul class="rsm-reveal-list">${(state.decisionReveal || [])
            .map((d) => `<li><strong>${esc(d.name)}</strong> — ${esc(d.decision)}</li>`)
            .join("")}</ul>
        </section>`;
    } else if (status === "ROUND_COMPLETE") {
      body = `<section class="rsm-panel"><h2>Round complete</h2><p class="rsm-wait">Next round loading…</p>${portfolio()}</section>`;
    } else if (status === "FINAL_RESULTS") {
      const medals = ["🥇", "🥈", "🥉"];
      body = `
        <section class="rsm-panel rsm-final">
          <div class="rsm-confetti" aria-hidden="true"></div>
          <h2>🏆 FINAL MARKET CLOSE</h2>
          <ol class="rsm-board">${(state.leaderboard || [])
            .map(
              (row, i) =>
                `<li><span>${medals[i] || `${i + 1}.`}</span> <strong>${esc(row.name)}</strong> — ${money(row.netWorth)}</li>`
            )
            .join("")}</ol>
          ${
            state.winner
              ? `<p class="rsm-winner">${esc(state.winner.name)} wins <strong>WALL STREET MENACE 📈</strong></p>`
              : ""
          }
          <div class="rsm-awards">
            ${(state.awards || [])
              .map((a) => `<div class="rsm-award"><strong>${esc(a.title)}</strong><span>${esc(a.name)}</span><p>${esc(a.desc)}</p></div>`)
              .join("")}
          </div>
          <button type="button" class="btn btn-ghost" data-leave>Leave Game</button>
        </section>`;
    }

    return `
      <header class="rsm-room-head">
        <div>
          <p class="rsm-kicker">code ${esc(state.code)}</p>
          <p class="muted tiny">${esc(session?.name || "")}</p>
        </div>
        <button type="button" class="btn btn-ghost tiny" data-leave>Leave</button>
      </header>
      ${body}`;
  };

  const refresh = async () => {
    if (!session?.code || !session?.playerId || busy) return;
    try {
      try {
        await api(`/rooms/${session.code}/heartbeat`, {
          method: "POST",
          body: JSON.stringify({ playerId: session.playerId }),
        });
      } catch {
        /* presence best-effort */
      }
      if (busy) return;
      const data = await api(`/rooms/${session.code}?playerId=${encodeURIComponent(session.playerId)}`);
      if (busy) return;
      state = data;
      if (state.status !== lastStatus) {
        lastStatus = state.status;
        if (state.status === "INVESTING") investAmt = 0;
      }
      view = "room";
      paint();
    } catch (err) {
      if (busy) return;
      const msg = err.message || "Lost connection.";
      if (/not found|expired|abandoned|not a player/i.test(msg)) {
        clearSession();
        session = null;
        state = null;
        view = "entry";
        paint();
        showToast("That room is no longer available. Start or join a new one.");
        stopPoll();
        return;
      }
      showToast(msg);
    }
  };

  const startPoll = () => {
    stopPoll();
    pollTimer = setInterval(refresh, 900);
  };

  const wire = () => {
    root.querySelector("[data-create]")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const fd = new FormData(e.target);
      name = String(fd.get("name") || "").trim();
      if (!name) return;
      busy = true;
      try {
        const data = await api("/rooms", { method: "POST", body: JSON.stringify({ name }) });
        session = { code: data.code, playerId: data.playerId, name };
        saveSession(session);
        state = data;
        view = "room";
        paint();
        startPoll();
        showToast("Room created — share the code.");
      } catch (err) {
        showToast(err.message);
      } finally {
        busy = false;
      }
    });

    root.querySelector("[data-join]")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const fd = new FormData(e.target);
      name = String(fd.get("name") || "").trim();
      joinCode = String(fd.get("code") || "").trim().toUpperCase();
      if (!name || !joinCode) return;
      busy = true;
      try {
        const data = await api(`/rooms/${encodeURIComponent(joinCode)}/join`, {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        session = { code: data.code, playerId: data.playerId, name };
        saveSession(session);
        state = data;
        view = "room";
        paint();
        startPoll();
        showToast("Joined the room.");
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

    root.querySelector("[data-start]")?.addEventListener("click", async () => {
      if (busy || !session) return;
      busy = true;
      try {
        state = await api(`/rooms/${session.code}/start`, {
          method: "POST",
          body: JSON.stringify({ playerId: session.playerId }),
        });
        paint();
        showToast("Read the guide, then tap ready.");
      } catch (err) {
        showToast(err.message);
      } finally {
        busy = false;
      }
    });

    root.querySelector("[data-briefing-ready]")?.addEventListener("click", async () => {
      if (busy || !session) return;
      busy = true;
      try {
        state = await api(`/rooms/${session.code}/briefing-ready`, {
          method: "POST",
          body: JSON.stringify({ playerId: session.playerId }),
        });
        paint();
      } catch (err) {
        showToast(err.message);
      } finally {
        busy = false;
      }
    });

    root.querySelectorAll("[data-answer]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (busy || !session) return;
        busy = true;
        try {
          state = await api(`/rooms/${session.code}/answer`, {
            method: "POST",
            body: JSON.stringify({ playerId: session.playerId, answer: btn.getAttribute("data-answer") }),
          });
          paint();
        } catch (err) {
          showToast(err.message);
        } finally {
          busy = false;
        }
      });
    });

    const syncAmt = (v) => {
      const cash = Number(me()?.cash || 0);
      investAmt = Math.max(0, Math.min(cash, Number(v) || 0));
      const amt = root.querySelector("[data-amt]");
      const slider = root.querySelector("[data-slider]");
      if (amt) amt.value = String(Math.round(investAmt));
      if (slider) slider.value = String(Math.round(investAmt));
    };
    root.querySelector("[data-amt]")?.addEventListener("input", (e) => syncAmt(e.target.value));
    root.querySelector("[data-slider]")?.addEventListener("input", (e) => syncAmt(e.target.value));
    root.querySelectorAll("[data-pct]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cash = Number(me()?.cash || 0);
        syncAmt(cash * Number(btn.getAttribute("data-pct")));
      });
    });

    root.querySelector("[data-lock]")?.addEventListener("click", async () => {
      if (busy || !session) return;
      busy = true;
      try {
        state = await api(`/rooms/${session.code}/invest`, {
          method: "POST",
          body: JSON.stringify({ playerId: session.playerId, amount: investAmt }),
        });
        paint();
      } catch (err) {
        showToast(err.message);
      } finally {
        busy = false;
      }
    });

    root.querySelectorAll("[data-decide]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (busy || !session) return;
        busy = true;
        try {
          state = await api(`/rooms/${session.code}/decide`, {
            method: "POST",
            body: JSON.stringify({
              playerId: session.playerId,
              decision: btn.getAttribute("data-decide"),
            }),
          });
          paint();
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

  if (session?.code && session?.playerId) {
    view = "room";
    paint();
    refresh().then(startPoll);
  } else {
    view = "entry";
    paint();
  }

  root._rsmCleanup = stopPoll;
}

/** Keep session so refresh / revisit can resume. */
export function startRsm() {
  /* intentionally do not clearSession() */
}
