import {
  publishedStories,
  getStoryBySlug,
  storyThemes,
  adjacentStories,
} from "./stories-data.js";
import { renderUndercover, startUndercover } from "./undercover.js";
import { playUndercoverJingle } from "./undercover-jingle.js";
import { playRomanticBumper } from "./romantic-bumper.js";
import { renderTicTacToe, startTicTacToe } from "./tictactoe.js";
import { playTicTacToeJingle } from "./tictactoe-jingle.js";
import { renderRsm, startRsm } from "./rsm.js";

const $ = (s, r = document) => r.querySelector(s);

function showToast(message, ms = 2400) {
  const t = $("#toast");
  if (!t) return;
  t.hidden = false;
  t.textContent = message;
  requestAnimationFrame(() => t.classList.add("is-visible"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    t.classList.remove("is-visible");
    setTimeout(() => {
      t.hidden = true;
    }, 250);
  }, ms);
}

function live(msg) {
  const el = $("#live");
  if (el) el.textContent = msg;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const LANDING_DONE_KEY = "alaiafun_landing_done";
const ENTERED_KEY = "alaiafun_entered";

function hasFinishedLanding() {
  return !!storage.get(LANDING_DONE_KEY, false);
}
function markLandingDone() {
  storage.set(LANDING_DONE_KEY, true);
  storage.set(ENTERED_KEY, true);
}

let storyFilters = {
  search: "",
  theme: "",
  sort: "newest",
};

function setMeta({ title, description }) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = description;
}

function navHTML(active) {
  return `
  <nav class="site-nav" id="site-nav" aria-label="Primary">
    <a class="nav-brand" href="#/home">♡ alaia fun</a>
    <div class="nav-links">
      <a href="#/home" class="${active === "home" ? "is-active" : ""}" ${active === "home" ? 'aria-current="page"' : ""}>Home</a>
      <a href="#/stories" class="${active === "stories" ? "is-active" : ""}" ${active === "stories" ? 'aria-current="page"' : ""}>Stories</a>
      <a href="#/games" class="${active === "games" ? "is-active" : ""}" ${active === "games" ? 'aria-current="page"' : ""}>Games</a>
    </div>
  </nav>
  <nav class="mobile-nav" aria-label="Mobile">
    <a href="#/home" class="${active === "home" ? "is-active" : ""}"><span class="nav-ico">♡</span>Home</a>
    <a href="#/stories" class="${active === "stories" ? "is-active" : ""}"><span class="nav-ico">✎</span>Stories</a>
    <a href="#/games" class="${active === "games" ? "is-active" : ""}"><span class="nav-ico">◇</span>Games</a>
  </nav>`;
}

function comingSoonMessage(btn) {
  const tip = document.createElement("span");
  tip.className = "coming-soon-tip";
  tip.textContent = "Still being prepared—check back soon.";
  tip.setAttribute("role", "status");
  btn.parentElement?.querySelector(".coming-soon-tip")?.remove();
  btn.insertAdjacentElement("afterend", tip);
  clearTimeout(comingSoonMessage._t);
  comingSoonMessage._t = setTimeout(() => tip.remove(), 2800);
  showToast("Still being prepared—check back soon.");
}

function wireComingSoon(root) {
  root.querySelectorAll("[data-coming-soon]").forEach((btn) => {
    btn.setAttribute("aria-disabled", "true");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      comingSoonMessage(btn);
    });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        comingSoonMessage(btn);
      }
    });
  });
}

function render() {
  const app = $("#app");
  const raw = location.hash.replace(/^#\/?/, "") || "home";
  const [pathPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const route = parts[0] || "home";

  if (route !== "tictactoe" && typeof app._tttCleanup === "function") {
    app._tttCleanup();
    app._tttCleanup = null;
  }
  if (route !== "rsm" && typeof app._rsmCleanup === "function") {
    app._rsmCleanup();
    app._rsmCleanup = null;
  }

  if (!hasFinishedLanding()) {
    markLandingDone();
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    app.classList.remove("page-enter");
    void app.offsetWidth;
    app.classList.add("page-enter");
  }

  // Landing + bumper skipped
  if (route === "landing" || route === "bumper") {
    location.hash = "#/home";
    return;
  }
  // Hide unfinished QC / bank routes from visitors
  if (route === "questions" || route === "cards" || route === "bank" || route === "tbc") {
    location.hash = "#/games";
    return;
  }
  if (route === "stories") {
    document.body.classList.remove("theme-undercover", "theme-ttt", "theme-rsm");
    return renderStoriesPage(app);
  }
  if (route === "story") {
    document.body.classList.remove("theme-undercover", "theme-ttt", "theme-rsm");
    return renderStoryPage(app, parts[1]);
  }
  if (route === "games") {
    document.body.classList.remove("theme-undercover", "theme-ttt", "theme-rsm");
    return renderGamesPage(app);
  }
  if (route === "undercover") {
    document.body.classList.add("theme-undercover");
    document.body.classList.remove("theme-ttt", "theme-rsm");
    return renderUndercover(app, { navHTML, setMeta, showToast });
  }
  if (route === "tictactoe") {
    document.body.classList.remove("theme-undercover");
    document.body.classList.add("theme-ttt");
    document.body.classList.remove("theme-rsm");
    return renderTicTacToe(app, { navHTML, setMeta, showToast });
  }
  if (route === "rsm") {
    document.body.classList.remove("theme-undercover", "theme-ttt");
    document.body.classList.add("theme-rsm");
    return renderRsm(app, { navHTML, setMeta, showToast });
  }
  document.body.classList.remove("theme-undercover");
  document.body.classList.remove("theme-ttt");
  document.body.classList.remove("theme-rsm");
  return renderHome(app);
}

/* ---------- bumper (landing skipped) ---------- */
function renderBumper(root) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setMeta({
    title: "alaia fun",
    description: "A quiet corner for stories and games.",
  });
  root.innerHTML = `
    <section class="bumper-screen" id="bumper" aria-label="Opening bumper">
      <div class="film-letterbox" aria-hidden="true"></div>
      <div class="bumper-track" aria-hidden="true">
        <div class="bumper-stripe"></div>
        <div class="bumper-stripe alt"></div>
      </div>
      <div class="bumper-stage ${reduce ? "is-ready" : ""}">
        <p class="bumper-kicker">loading · soft entrance</p>
        <div class="bumper-logo" aria-hidden="true">♡</div>
        <h1 class="bumper-title">
          <span class="bumper-line">The way you change your life</span>
          <span class="bumper-line accent">is by changing the mind you meet it with.</span>
        </h1>
        <p class="bumper-sub">Not a new city. Not a new plan first.<br/>A different way of seeing — then everything else can move.</p>
        <div class="bumper-load" aria-hidden="true">
          <span class="bumper-load-bar"></span>
        </div>
        <p class="bumper-loading-label" data-load-label>Preparing your corner…</p>
        <button class="btn btn-primary btn-3d bumper-cta" type="button" data-continue ${reduce ? "" : "hidden"}>Enter</button>
        <button class="btn btn-ghost bumper-unlock" type="button" data-unlock hidden>Tap for sound ♡</button>
      </div>
    </section>`;

  const stage = root.querySelector(".bumper-stage");
  const cta = root.querySelector("[data-continue]");
  const unlock = root.querySelector("[data-unlock]");
  const label = root.querySelector("[data-load-label]");
  let finished = false;
  let soundStarted = false;

  const goHome = () => {
    if (finished) return;
    finished = true;
    markLandingDone();
    location.hash = "#/home";
  };

  const startSound = () => {
    if (soundStarted) return;
    soundStarted = true;
    playRomanticBumper();
  };

  const reveal = () => {
    stage.classList.add("is-ready");
    if (cta) cta.hidden = false;
    if (label) label.textContent = "Ready when you are";
    live("Enter when you’re ready");
  };

  // Try romantic pad immediately; if autoplay blocked, offer tap
  playRomanticBumper().then(() => {
    soundStarted = true;
  }).catch(() => {
    if (unlock) unlock.hidden = false;
  });
  // Some browsers resolve play without throwing but stay silent — offer unlock briefly
  setTimeout(() => {
    if (!soundStarted && unlock) unlock.hidden = false;
  }, 400);

  unlock?.addEventListener("click", () => {
    startSound();
    unlock.hidden = true;
  });

  // First tap anywhere also unlocks audio
  root.querySelector("#bumper")?.addEventListener(
    "pointerdown",
    () => {
      startSound();
      if (unlock) unlock.hidden = true;
    },
    { once: true }
  );

  if (reduce) {
    if (cta) cta.hidden = false;
    setTimeout(goHome, 1200);
  } else {
    setTimeout(reveal, 2600);
    // Auto-enter home after loading mood
    setTimeout(goHome, 3800);
  }

  cta.onclick = goHome;
}

/* ---------- HOME ---------- */
function renderHome(root) {
  setMeta({
    title: "alaia fun · Home",
    description:
      "Personal stories for alone time, and games to play with someone else.",
  });
  const latest = publishedStories().slice(0, 3);
  root.innerHTML = `
    ${navHTML("home")}
    <main class="page home-page home-glam">
      <header class="home-hero-glam">
        <div class="hero-glam-bg" aria-hidden="true">
          <span class="spark s1"></span>
          <span class="spark s2"></span>
          <span class="spark s3"></span>
          <span class="spark s4"></span>
        </div>
        <div class="hero-glam-top">
          <p class="home-kicker">a little corner of the internet</p>
          <span class="xoxo-stamp" aria-hidden="true">xoxo</span>
        </div>
        <h1>Your life might already feel full, but leave the door open.</h1>
        <p class="hero-lead">For someone, or a story, that could unexpectedly matter.</p>
        <p class="hero-scroll-hint">pick a door ↓</p>
      </header>

      <section class="entry-duo" aria-label="Pick a door">
        <a class="entry-card entry-stories" href="#/stories">
          <span class="entry-for">for your me time</span>
          <span class="entry-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
              <rect x="12" y="10" width="28" height="38" rx="4" stroke="currentColor" stroke-width="2.2"/>
              <path d="M18 20h16M18 28h14M18 36h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="44" cy="42" r="10" fill="currentColor" opacity="0.15"/>
              <path d="M40 42h8M44 38v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <h2>Personal Stories</h2>
          <p>Quiet reads for alone hours, the strangely familiar kind.</p>
          <span class="entry-go">Open the diary →</span>
        </a>

        <a class="entry-card entry-games" href="#/games">
          <span class="entry-for">for hangouts</span>
          <span class="entry-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
              <rect x="8" y="22" width="48" height="28" rx="10" stroke="currentColor" stroke-width="2.2"/>
              <circle cx="24" cy="36" r="4" fill="currentColor"/>
              <circle cx="40" cy="36" r="4" fill="currentColor"/>
              <path d="M24 30v12M18 36h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M38 32l4 4 4-4M38 40l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <h2>Games</h2>
          <p>When you’re with people and “what should we do?” needs a plot twist.</p>
          <span class="entry-go">Start the night →</span>
        </a>
      </section>

      ${
        latest.length
          ? `<section class="preview-section">
        <div class="section-head-row">
          <h2>Latest Stories</h2>
          <a class="btn btn-ghost tiny" href="#/stories">All stories</a>
        </div>
        <div class="story-list">${latest.map(storyCardHTML).join("")}</div>
      </section>`
          : ""
      }

      <section class="preview-section games-preview-home">
        <div class="games-mini-grid">
          <a class="game-mini undercover-mini game-mini-link" href="#/games">
            <p class="badge-soon">Playable</p>
            <h3>Undercover</h3>
            <p>Clues, accusations, a little chaos.</p>
          </a>
          <a class="game-mini cards-mini game-mini-link" href="#/games">
            <p class="badge-soon">Coming Soon</p>
            <h3>Question Cards</h3>
            <p>Prompts that make time disappear.</p>
          </a>
        </div>
      </section>
    </main>`;
}

function storyCardHTML(s) {
  return `
    <article class="story-preview">
      <div class="meta-row">
        <span class="tag">${escapeHtml(s.theme)}</span>
        <span>${s.readingTime} min read</span>
        ${s.publishedAt ? `<span>${escapeHtml(s.publishedAt)}</span>` : ""}
      </div>
      <h2>${escapeHtml(s.title)}</h2>
      <p class="muted">${escapeHtml(s.excerpt)}</p>
      <a class="btn btn-soft tiny" href="#/story/${s.slug}">Read Story</a>
    </article>`;
}

/* ---------- STORIES ---------- */
function filterStories() {
  let list = publishedStories();
  const q = storyFilters.search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q) ||
        s.theme.toLowerCase().includes(q)
    );
  }
  if (storyFilters.theme) list = list.filter((s) => s.theme === storyFilters.theme);
  if (storyFilters.sort === "oldest") list = [...list].reverse();
  if (storyFilters.sort === "shortest") list = [...list].sort((a, b) => a.readingTime - b.readingTime);
  if (storyFilters.sort === "longest") list = [...list].sort((a, b) => b.readingTime - a.readingTime);
  return list;
}

function renderStoriesPage(root) {
  setMeta({
    title: "Stories — alaia fun",
    description: "Stories for the moments you thought only you understood.",
  });
  const themes = storyThemes();
  const list = filterStories();
  root.innerHTML = `
    ${navHTML("stories")}
    <main class="page">
      <header class="section-head">
        <h1>Stories for the moments you thought only you understood.</h1>
        <p class="muted">Things I’ve experienced, questioned, overthought, outgrown, or am still trying to understand. They may not be your exact stories, but maybe something in them will feel familiar.</p>
      </header>
      <div class="stories-toolbar">
        <label class="sr-only" for="story-search">Search stories</label>
        <input id="story-search" type="search" placeholder="Search by title, excerpt, or theme…" value="${escapeHtml(storyFilters.search)}" data-search />
        <div class="chip-row">
          <label class="sr-only" for="story-theme">Theme</label>
          <select id="story-theme" data-theme>
            <option value="">All themes</option>
            ${themes.map((t) => `<option value="${escapeHtml(t)}" ${storyFilters.theme === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
          </select>
          <label class="sr-only" for="story-sort">Sort</label>
          <select id="story-sort" data-sort>
            <option value="newest" ${storyFilters.sort === "newest" ? "selected" : ""}>Newest</option>
            <option value="oldest" ${storyFilters.sort === "oldest" ? "selected" : ""}>Oldest</option>
            <option value="shortest" ${storyFilters.sort === "shortest" ? "selected" : ""}>Shortest read</option>
            <option value="longest" ${storyFilters.sort === "longest" ? "selected" : ""}>Longest read</option>
          </select>
          <button type="button" class="btn btn-ghost tiny" data-clear>Clear Filters</button>
          <span class="tiny muted" aria-live="polite">${list.length} ${list.length === 1 ? "story" : "stories"}</span>
        </div>
      </div>
      <div class="story-list" id="story-results">
        ${
          list.length
            ? list.map(storyCardHTML).join("")
            : `<div class="empty-state"><p>No stories match those filters. Try clearing them — or come back when there’s something new to read.</p></div>`
        }
      </div>
    </main>`;

  const rerender = () => renderStoriesPage(root);
  $("[data-search]", root).oninput = (e) => {
    storyFilters.search = e.target.value;
    clearTimeout(rerender._t);
    rerender._t = setTimeout(rerender, 180);
  };
  $("[data-theme]", root).onchange = (e) => {
    storyFilters.theme = e.target.value;
    rerender();
  };
  $("[data-sort]", root).onchange = (e) => {
    storyFilters.sort = e.target.value;
    rerender();
  };
  $("[data-clear]", root).onclick = () => {
    storyFilters = { search: "", theme: "", sort: "newest" };
    rerender();
  };
}

function renderStoryPage(root, slug) {
  const story = getStoryBySlug(slug);
  if (!story) {
    setMeta({ title: "Story not found — alaia fun", description: "This story isn’t here." });
    root.innerHTML = `
      ${navHTML("stories")}
      <main class="page page-narrow empty-state">
        <h1>This story isn’t here.</h1>
        <p class="muted">It may have moved, or it hasn’t been published yet.</p>
        <a class="btn btn-soft" href="#/stories">Back to Stories</a>
      </main>`;
    return;
  }
  setMeta({
    title: `${story.title} — alaia fun`,
    description: story.excerpt,
  });
  const { prev, next } = adjacentStories(story.slug);
  root.innerHTML = `
    ${navHTML("stories")}
    <article class="article-shell story-read">
      <p class="article-kicker">${escapeHtml(story.theme)} · ${story.readingTime} min read${story.publishedAt ? ` · ${escapeHtml(story.publishedAt)}` : ""}</p>
      <h1>${escapeHtml(story.title)}</h1>
      ${story.subtitle ? `<p class="story-subtitle">${escapeHtml(story.subtitle)}</p>` : ""}
      <div class="prose">
        ${story.content.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </div>
      <section class="story-end">
        <p class="question-line">Did any part of this feel familiar?</p>
        <div class="home-cta-row" style="justify-content:flex-start;margin-top:1rem">
          <a class="btn btn-soft" href="#/stories">Read Another Story</a>
          <button type="button" class="btn btn-ghost" data-share>Share Story</button>
        </div>
      </section>
      <nav class="story-pager" aria-label="Story navigation">
        <a class="btn btn-ghost" href="#/stories">← Back to Stories</a>
        <div class="pager-links">
          ${prev ? `<a href="#/story/${prev.slug}">← Previous</a>` : `<span class="muted">← Previous</span>`}
          ${next ? `<a href="#/story/${next.slug}">Next →</a>` : `<span class="muted">Next →</span>`}
        </div>
      </nav>
    </article>`;
  $("[data-share]", root)?.addEventListener("click", async () => {
    const text = `${story.title}\n${location.origin}${location.pathname}#/story/${story.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: story.title, text: story.excerpt, url: location.href });
      else {
        await navigator.clipboard.writeText(text);
        showToast("Link copied.");
      }
    } catch {
      /* cancelled */
    }
  });
}

/* ---------- GAMES ---------- */
function renderGamesPage(root) {
  setMeta({
    title: "Games · alaia fun",
    description: "Games for people who want to know each other beyond the usual questions.",
  });
  root.innerHTML = `
    ${navHTML("games")}
    <main class="page games-page">
      <header class="section-head">
        <h1>Games for people who want to know each other beyond the usual questions.</h1>
        <p class="muted">Play with friends, family, someone you love, or someone you’re still figuring out.</p>
        <p class="question-line">Pick the kind of moment you want to create.</p>
      </header>

      <div class="games-grid">
        <article class="game-card game-undercover">
          <div class="uc-card-art" aria-hidden="true">
            <img src="/static/img/undercover-agent.png" alt="" width="480" height="360" loading="lazy" />
            <div class="uc-card-scan"></div>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live" aria-label="Ready to play">CLASSIFIED · PLAYABLE</span>
              <span class="badge-mode badge-offline" aria-label="Offline game">OFFLINE</span>
            </div>
            <span class="uc-classified-stamp" aria-hidden="true">TOP SECRET</span>
          </div>
          <div class="uc-card-icons" aria-hidden="true">
            <svg class="uc-ico" viewBox="0 0 40 40" width="28" height="28"><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 20h16M20 12v16" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="currentColor"/></svg>
            <svg class="uc-ico" viewBox="0 0 40 40" width="28" height="28"><path d="M8 28c4-10 20-10 24 0" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="20" cy="18" rx="10" ry="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="18" r="1.5" fill="currentColor"/><circle cx="24" cy="18" r="1.5" fill="currentColor"/></svg>
            <svg class="uc-ico" viewBox="0 0 40 40" width="28" height="28"><rect x="10" y="8" width="20" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14h12M14 20h12M14 26h8" stroke="currentColor" stroke-width="2"/></svg>
          </div>
          <h2>UNDERCOVER</h2>
          <p class="uc-tagline">Mission brief: find the impostor before they vanish into the crowd.</p>
          <p>Everyone seems to know what’s going on, except the person secretly trying to blend in. Describe, guess, accuse, and figure out who is hiding among you.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Parties, reunions, road trips, and group hangouts</li>
            <li><strong>Players:</strong> 3+ agents</li>
            <li><strong>Mood:</strong> Playful, suspicious, and slightly chaotic</li>
          </ul>
          <a class="btn btn-uc-cta" href="#/undercover" data-start-undercover>
            <span class="uc-cta-ico" aria-hidden="true">▶</span>
            CONTINUE MISSION
          </a>
        </article>

        <article class="game-card game-ttt">
          <div class="ttt-card-art" aria-hidden="true">
            <div class="ttt-card-board">
              <span class="ttt-mark-x">✕</span>
              <span></span>
              <span class="ttt-mark-o">◯</span>
              <span></span>
              <span class="ttt-mark-heart">♡</span>
              <span></span>
              <span class="ttt-mark-o">◯</span>
              <span></span>
              <span class="ttt-mark-x">✕</span>
            </div>
            <div class="ttt-card-glow"></div>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live ttt-live-badge">PLAYABLE · 2 PLAYERS</span>
              <span class="badge-mode badge-online" aria-label="Online multiplayer">ONLINE</span>
            </div>
            <span class="ttt-love-stamp" aria-hidden="true">LD ♡</span>
          </div>
          <div class="ttt-card-icons" aria-hidden="true">
            <svg class="ttt-ico" viewBox="0 0 40 40" width="28" height="28"><path fill="currentColor" d="M20 34s-11-7.2-15.4-13.4C2.2 16.8 3.4 11.2 8.2 8.9c3.1-1.5 6.8-.5 9 2.1 2.2-2.6 5.9-3.6 9-2.1 4.8 2.3 6 7.9 3.6 11.7C31 26.8 20 34 20 34z"/></svg>
            <svg class="ttt-ico" viewBox="0 0 40 40" width="28" height="28"><path fill="none" stroke="currentColor" stroke-width="2" d="M8 8h10v10H8zM22 8h10v10H22zM8 22h10v10H8zM22 22h10v10H22z"/></svg>
            <svg class="ttt-ico" viewBox="0 0 40 40" width="28" height="28"><circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M14 20h12M20 14v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <h2>Tic-Tac-Toe for Long Distance</h2>
          <p class="ttt-card-tagline">Miles apart, one move away. ♡</p>
          <p>Create a code, send it to your person, both tap ready, then take turns — even across time zones.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Long-distance couples &amp; faraway friends</li>
            <li><strong>Players:</strong> 2</li>
            <li><strong>Mood:</strong> Soft, playful, connected</li>
          </ul>
          <a class="btn btn-ttt-cta" href="#/tictactoe" data-start-ttt>
            <span class="ttt-cta-ico" aria-hidden="true">▶</span>
            PLAY TOGETHER
          </a>
        </article>

        <article class="game-card game-rsm">
          <div class="rsm-card-art" aria-hidden="true">
            <div class="rsm-mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <span class="rsm-art-ticker">LOVR +200%</span>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live rsm-live-badge">PLAYABLE · 2–6</span>
              <span class="badge-mode badge-online" aria-label="Online multiplayer">ONLINE</span>
            </div>
            <span class="rsm-stamp" aria-hidden="true">📈 OPEN</span>
          </div>
          <h2>Relationship Stock Market</h2>
          <p class="rsm-card-tagline">Predict your people. Bet your cash. Panic together.</p>
          <p>Five rounds of secret investments, market chaos, hold-or-sell drama, and friendship-based stock tips.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Couples, friend groups, game nights</li>
            <li><strong>Players:</strong> 2–6</li>
            <li><strong>Mood:</strong> Chaotic, social, replayable</li>
          </ul>
          <a class="btn btn-rsm-cta" href="#/rsm" data-start-rsm>
            <span aria-hidden="true">▶</span>
            OPEN THE MARKET
          </a>
        </article>

        <article class="game-card game-question-cards">
          <div class="game-card-top">
            <span class="badge-soon" aria-label="Coming soon">Coming Soon</span>
            <div class="game-motif cards-motif" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
          </div>
          <h2>Question Cards</h2>
          <p>Find the right question for the people you’re with, from easy icebreakers to the kind of conversation that makes time disappear.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Friends, couples, family, dates, and one-on-one conversations</li>
            <li><strong>Players:</strong> 2 people or a group</li>
            <li><strong>Mood:</strong> Curious, meaningful, and unexpectedly personal</li>
          </ul>
          <button type="button" class="btn btn-soft is-disabled-look" data-coming-soon aria-disabled="true">Question Cards — Coming Soon</button>
        </article>
      </div>
    </main>`;
  wireComingSoon(root);
  root.querySelector("[data-start-undercover]")?.addEventListener("click", () => {
    playUndercoverJingle();
    startUndercover();
  });
  root.querySelector("[data-start-ttt]")?.addEventListener("click", () => {
    playTicTacToeJingle();
    startTicTacToe();
  });
  root.querySelector("[data-start-rsm]")?.addEventListener("click", () => {
    startRsm();
  });
}

window.addEventListener("hashchange", render);
if (!location.hash || location.hash === "#" || location.hash === "#/landing" || location.hash === "#/bumper") {
  location.hash = "#/home";
}
if (!hasFinishedLanding()) markLandingDone();
render();
