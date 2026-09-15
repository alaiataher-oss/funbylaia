import {
  getStoryLive,
  allStories,
  publishedStoriesLive,
  storyThemesLive,
  adjacentStoriesLive,
  upsertStory,
  deleteStory,
  blankStory,
  renderContentBlocks,
  contentToHtml,
  sanitizeStoryHtml,
  htmlToPlainText,
  hydrateFromApi,
  pushToApi,
  estimateReadingTime,
} from "./stories-store.js";
import { renderUndercover, startUndercover } from "./undercover.js";
import { playUndercoverJingle } from "./undercover-jingle.js";
import { playWelcomeBumper } from "./romantic-bumper.js";
import { renderTicTacToe, startTicTacToe } from "./tictactoe.js";
import { playTicTacToeJingle } from "./tictactoe-jingle.js";
import { renderRsm, startRsm } from "./rsm.js";
import { renderFoodChain, startFoodChain } from "./foodchain.js";
import { renderHigherLower, startHigherLower } from "./higherlower.js";
import { renderColorConfusion, startColorConfusion } from "./colorconfusion.js";
import { renderOjolRush, ensureOjolPreload, wireGameLoadButton, GAME_HREF } from "./ojolrush.js";

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
const BUMPER_SESSION_KEY = "alaiafun_bumper_seen";

function hasFinishedLanding() {
  return !!storage.get(LANDING_DONE_KEY, false);
}
function markLandingDone() {
  storage.set(LANDING_DONE_KEY, true);
  storage.set(ENTERED_KEY, true);
}
function hasSeenBumperThisSession() {
  try {
    return sessionStorage.getItem(BUMPER_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
function markBumperSeen() {
  try {
    sessionStorage.setItem(BUMPER_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  markLandingDone();
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
    <a class="nav-brand" href="#/home">♡ fun by ayaya</a>
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
  if (route !== "foodchain" && typeof app._fcCleanup === "function") {
    app._fcCleanup();
    app._fcCleanup = null;
  }
  if (route !== "higherlower" && typeof app._hlCleanup === "function") {
    app._hlCleanup();
    app._hlCleanup = null;
  }
  if (route !== "colorconfusion" && typeof app._ccCleanup === "function") {
    app._ccCleanup();
    app._ccCleanup = null;
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && route !== "bumper") {
    app.classList.remove("page-enter");
    void app.offsetWidth;
    app.classList.add("page-enter");
  }

  // Short welcome bumper once per browser session
  if (route === "landing") {
    location.hash = "#/bumper";
    return;
  }
  if (route === "bumper") {
    return renderBumper(app);
  }
  if (!hasSeenBumperThisSession()) {
    location.hash = "#/bumper";
    return;
  }
  // Hide unfinished QC / bank routes from visitors
  if (route === "questions" || route === "cards" || route === "bank" || route === "tbc") {
    location.hash = "#/games";
    return;
  }
  if (route === "stories") {
    document.body.classList.remove("theme-undercover", "theme-ttt", "theme-rsm", "theme-fc", "theme-hl", "theme-cc", "theme-games");
    if (!isStoriesViewUnlocked()) return renderStoriesGate(app);
    if (parts[1] === "new") {
      if (!isStoriesAdmin()) return renderStoriesAdminGate(app, "#/stories/new");
      return renderStoryEditor(app, "new");
    }
    return renderStoriesPage(app);
  }
  if (route === "story") {
    document.body.classList.remove("theme-undercover", "theme-ttt", "theme-rsm", "theme-fc", "theme-hl", "theme-cc", "theme-games");
    if (!isStoriesViewUnlocked()) return renderStoriesGate(app);
    if (parts[2] === "edit") {
      if (!isStoriesAdmin()) return renderStoriesAdminGate(app, `#/story/${parts[1]}/edit`);
      return renderStoryEditor(app, parts[1]);
    }
    return renderStoryPage(app, parts[1]);
  }
  if (route === "games") {
    document.body.classList.remove("theme-undercover", "theme-ttt", "theme-rsm", "theme-fc", "theme-hl", "theme-cc");
    document.body.classList.add("theme-games");
    return renderGamesPage(app, parts[1]);
  }
  if (route === "undercover") {
    document.body.classList.remove("theme-games");
    document.body.classList.add("theme-undercover");
    document.body.classList.remove("theme-ttt", "theme-rsm", "theme-fc", "theme-hl", "theme-cc");
    return renderUndercover(app, { navHTML, setMeta, showToast });
  }
  if (route === "tictactoe") {
    document.body.classList.remove("theme-games", "theme-undercover");
    document.body.classList.add("theme-ttt");
    document.body.classList.remove("theme-rsm", "theme-fc", "theme-hl", "theme-cc");
    return renderTicTacToe(app, { navHTML, setMeta, showToast });
  }
  if (route === "rsm") {
    document.body.classList.remove("theme-games", "theme-undercover", "theme-ttt", "theme-fc", "theme-hl", "theme-cc");
    document.body.classList.add("theme-rsm");
    return renderRsm(app, { navHTML, setMeta, showToast });
  }
  if (route === "foodchain") {
    document.body.classList.remove("theme-games", "theme-undercover", "theme-ttt", "theme-rsm", "theme-hl", "theme-cc");
    document.body.classList.add("theme-fc");
    return renderFoodChain(app, { navHTML, setMeta, showToast });
  }
  if (route === "higherlower") {
    document.body.classList.remove("theme-games", "theme-undercover", "theme-ttt", "theme-rsm", "theme-fc", "theme-cc");
    document.body.classList.add("theme-hl");
    return renderHigherLower(app, { navHTML, setMeta, showToast });
  }
  if (route === "colorconfusion") {
    document.body.classList.remove("theme-games", "theme-undercover", "theme-ttt", "theme-rsm", "theme-fc", "theme-hl");
    document.body.classList.add("theme-cc");
    return renderColorConfusion(app, { navHTML, setMeta, showToast });
  }
  if (route === "ojolrush") {
    document.body.classList.remove("theme-games", "theme-undercover", "theme-ttt", "theme-rsm", "theme-fc", "theme-hl", "theme-cc");
    return renderOjolRush(app, { navHTML, setMeta, showToast });
  }
  document.body.classList.remove("theme-games");
  document.body.classList.remove("theme-undercover");
  document.body.classList.remove("theme-ttt");
  document.body.classList.remove("theme-rsm");
  document.body.classList.remove("theme-fc");
  document.body.classList.remove("theme-hl");
  document.body.classList.remove("theme-cc");
  return renderHome(app);
}

/* ---------- welcome bumper ---------- */
function renderBumper(root) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setMeta({
    title: "Welcome · fun by ayaya",
    description: "A quiet corner for stories and games.",
  });
  root.innerHTML = `
    <section class="bumper-screen bumper-welcome" id="bumper" aria-label="Welcome bumper">
      <div class="welcome-glow" aria-hidden="true"></div>
      <div class="welcome-portal" aria-hidden="true"></div>
      <div class="welcome-doors" aria-hidden="true">
        <div class="welcome-door left"><span class="door-knob"></span></div>
        <div class="welcome-door right"><span class="door-knob"></span></div>
      </div>
      <div class="bumper-stage welcome-stage ${reduce ? "is-ready is-open" : ""}">
        <div class="welcome-hero">
          <div class="welcome-frame">
            <img class="welcome-photo welcome-photo-peek" src="/static/img/alaia-peek-door.png" alt="Welcome" width="480" height="640" />
            <img class="welcome-photo welcome-photo-open" src="/static/img/alaia-open-door.png" alt="" width="480" height="640" />
            <div class="welcome-sparkles" aria-hidden="true">
              <i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
        </div>
        <button class="sr-only" type="button" data-continue>Enter</button>
      </div>
    </section>`;

  const screen = root.querySelector("#bumper");
  const stage = root.querySelector(".bumper-stage");
  const cta = root.querySelector("[data-continue]");
  let finished = false;
  let soundStarted = false;

  const goHome = () => {
    if (finished) return;
    finished = true;
    markBumperSeen();
    location.hash = "#/home";
  };

  const openDoorAndEnter = () => {
    if (finished) return;
    stage?.classList.add("is-open");
    screen?.classList.add("is-door-open");
    setTimeout(() => {
      screen?.classList.add("is-entering");
    }, 900);
    setTimeout(goHome, 1750);
  };

  const startSound = async () => {
    if (soundStarted) return;
    soundStarted = true;
    try {
      await playWelcomeBumper();
    } catch {
      /* ignore */
    }
  };

  const boot = async () => {
    stage?.classList.add("is-ready");
    await startSound();
    live("Welcome");
  };

  root.querySelector("#bumper")?.addEventListener(
    "pointerdown",
    () => {
      if (!soundStarted) startSound();
    },
    { once: true }
  );

  cta.onclick = (e) => {
    e.preventDefault();
    openDoorAndEnter();
  };

  if (reduce) {
    stage?.classList.add("is-ready", "is-open");
    screen?.classList.add("is-door-open");
    setTimeout(goHome, 1100);
  } else {
    requestAnimationFrame(() => {
      stage?.classList.add("is-ready");
      screen?.classList.add("is-peeking");
    });
    setTimeout(boot, 700);
    setTimeout(openDoorAndEnter, 2400);
  }
}

/* ---------- HOME ---------- */
function renderHome(root) {
  setMeta({
    title: "fun by ayaya · Home",
    description:
      "Stories and solo games for me time, plus multiplayer games for hangouts.",
  });
  root.innerHTML = `
    ${navHTML("home")}
    <main class="page home-page home-glam home-doors-only">
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
        <p class="hero-lead">For someone, a story, or an experience that could unexpectedly matter.</p>
        <p class="hero-scroll-hint">pick a door ↓</p>
      </header>

      <div class="home-doors-row">
        <section class="home-door-section home-door-me" aria-labelledby="me-time-heading">
          <p class="home-door-kicker" id="me-time-heading">for your me time</p>
          <div class="entry-stack">
            <a class="entry-card entry-stories" href="#/stories">
              <span class="entry-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
                  <rect x="12" y="10" width="28" height="38" rx="4" stroke="currentColor" stroke-width="2.2"/>
                  <path d="M18 20h16M18 28h14M18 36h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M38 34c0-4 3-7 7-7s7 3 7 7c0 6-7 11-7 11s-7-5-7-11z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
                  <circle cx="45" cy="34" r="1.6" fill="currentColor"/>
                </svg>
              </span>
              <h2>Stories for your soul</h2>
              <p>Short reads that might hit close, or quietly steal a whole evening.</p>
              <span class="entry-go">Open the diary →</span>
            </a>

            <a class="entry-card entry-solo" href="#/games/solo">
              <span class="entry-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
                  <circle cx="32" cy="32" r="18" stroke="currentColor" stroke-width="2.2"/>
                  <circle cx="32" cy="32" r="7" fill="currentColor" opacity="0.18"/>
                  <path d="M32 18v6M32 40v6M18 32h6M40 32h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M22 22l4 4M38 38l4 4M42 22l-4 4M26 38l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <h2>Solo games</h2>
              <p>Online games you can play alone, when you want a quick fun round.</p>
              <span class="entry-go">Play solo →</span>
            </a>
          </div>
        </section>

        <section class="home-door-section home-door-hangout" aria-labelledby="hangout-heading">
          <p class="home-door-kicker" id="hangout-heading">for hangouts</p>
          <div class="entry-stack">
            <a class="entry-card entry-games entry-games-tall" href="#/games/multiplayer">
              <span class="entry-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
                  <rect x="8" y="22" width="48" height="28" rx="10" stroke="currentColor" stroke-width="2.2"/>
                  <circle cx="24" cy="36" r="4" fill="currentColor"/>
                  <circle cx="40" cy="36" r="4" fill="currentColor"/>
                  <path d="M24 30v12M18 36h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M38 32l4 4 4-4M38 40l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <h2>Multiplayer games</h2>
              <p>When you’re with people and “what should we do?” needs a plot twist.</p>
              <span class="entry-go">Start the night →</span>
            </a>
          </div>
        </section>
      </div>
    </main>`;
}

/* ---------- STORIES (reader view + admin editor) ---------- */
const STORIES_VIEW_KEY = "funbylaia_stories_view";
const STORIES_ADMIN_KEY = "funbylaia_stories_admin";
const STORIES_VIEW_PASSWORD = "123";
const STORIES_ADMIN_PASSWORD = "sushiro";

function isStoriesViewUnlocked() {
  try {
    return sessionStorage.getItem(STORIES_VIEW_KEY) === "1" || isStoriesAdmin();
  } catch {
    return false;
  }
}

function isStoriesAdmin() {
  try {
    return sessionStorage.getItem(STORIES_ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

function unlockStoriesView() {
  try {
    sessionStorage.setItem(STORIES_VIEW_KEY, "1");
    sessionStorage.removeItem(STORIES_ADMIN_KEY);
  } catch {
    /* ignore */
  }
}

function unlockStoriesAdmin() {
  try {
    sessionStorage.setItem(STORIES_VIEW_KEY, "1");
    sessionStorage.setItem(STORIES_ADMIN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function renderStoriesGate(root) {
  setMeta({
    title: "Stories — fun by ayaya",
    description: "Stories are locked for now.",
  });
  root.innerHTML = `
    ${navHTML("stories")}
    <main class="page page-narrow stories-gate">
      <header class="section-head">
        <h1>Stories are locked for now</h1>
        <p class="muted">Choose how you want to enter.</p>
      </header>
      <div class="stories-gate-choices">
        <section class="stories-gate-choice" data-gate-panel="readers">
          <h2>Readers view</h2>
          <p class="muted">Browse and read stories.</p>
          <form class="stories-gate-form" data-gate="readers" novalidate>
            <label class="sr-only" for="stories-pass-readers">Readers password</label>
            <input id="stories-pass-readers" name="password" type="password" autocomplete="current-password" placeholder="Password" required />
            <button type="submit" class="btn btn-primary">Enter as reader</button>
            <p class="stories-gate-error muted" data-gate-error hidden>Wrong password. Try again.</p>
          </form>
        </section>
        <section class="stories-gate-choice" data-gate-panel="admin">
          <h2>Admin view</h2>
          <p class="muted">Write and edit stories.</p>
          <form class="stories-gate-form" data-gate="admin" novalidate>
            <label class="sr-only" for="stories-pass-admin">Admin password</label>
            <input id="stories-pass-admin" name="password" type="password" autocomplete="current-password" placeholder="Password" required />
            <button type="submit" class="btn btn-soft">Enter as admin</button>
            <p class="stories-gate-error muted" data-gate-error hidden>Wrong password. Try again.</p>
          </form>
        </section>
      </div>
      <p class="stories-gate-back"><a href="#/">← Back home</a></p>
    </main>`;

  const wireGate = (selector, expected, unlock) => {
    const form = root.querySelector(selector);
    const err = form?.querySelector("[data-gate-error]");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input[name='password']");
      const value = String(input?.value || "").trim();
      if (value === expected) {
        unlock();
        await hydrateFromApi();
        render();
        return;
      }
      if (err) err.hidden = false;
      if (input) {
        input.value = "";
        input.focus();
      }
    });
  };

  wireGate("[data-gate='readers']", STORIES_VIEW_PASSWORD, unlockStoriesView);
  wireGate("[data-gate='admin']", STORIES_ADMIN_PASSWORD, unlockStoriesAdmin);
}

function renderStoriesAdminGate(root, nextHash = "#/stories") {
  setMeta({
    title: "Admin — fun by ayaya",
    description: "Admin unlock for stories.",
  });
  root.innerHTML = `
    ${navHTML("stories")}
    <main class="page page-narrow stories-gate">
      <header class="section-head">
        <h1>Admin only</h1>
        <p class="muted">Editing requires the admin password.</p>
      </header>
      <form class="stories-gate-form" data-admin-gate novalidate>
        <label class="sr-only" for="stories-admin-pass">Admin password</label>
        <input id="stories-admin-pass" name="password" type="password" autocomplete="current-password" placeholder="Admin password" required />
        <button type="submit" class="btn btn-primary">Unlock editing</button>
        <p class="stories-gate-error muted" data-gate-error hidden>Wrong password. Try again.</p>
      </form>
      <p class="stories-gate-back"><a href="#/stories">← Back to Stories</a></p>
    </main>`;

  const form = root.querySelector("[data-admin-gate]");
  const err = root.querySelector("[data-gate-error]");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("#stories-admin-pass");
    const value = String(input?.value || "").trim();
    if (value === STORIES_ADMIN_PASSWORD) {
      unlockStoriesAdmin();
      await hydrateFromApi();
      location.hash = nextHash;
      render();
      return;
    }
    if (err) err.hidden = false;
    if (input) {
      input.value = "";
      input.focus();
    }
  });
}

function filterStories() {
  let list = (isStoriesAdmin() ? allStories() : publishedStoriesLive()).sort((a, b) =>
    (b.publishedAt || "").localeCompare(a.publishedAt || "")
  );
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

function storyCardHTML(s) {
  const admin = isStoriesAdmin();
  return `
    <article class="story-card">
      <div class="story-card-meta">
        <span class="tag">${escapeHtml(s.theme)}</span>
        ${admin && s.status === "draft" ? `<span class="tag">Draft</span>` : ""}
        <span>${s.readingTime} min</span>
        ${s.publishedAt ? `<span>${escapeHtml(s.publishedAt)}</span>` : ""}
      </div>
      <h2>${escapeHtml(s.title)}</h2>
      <p class="muted">${escapeHtml(s.excerpt)}</p>
      <div class="story-card-actions">
        <a class="btn btn-soft tiny" href="#/story/${s.slug}">Read Story</a>
        ${admin ? `<a class="btn btn-ghost tiny" href="#/story/${s.slug}/edit" data-edit-story>Edit</a>` : ""}
      </div>
    </article>`;
}

function renderStoriesPage(root) {
  setMeta({
    title: "Stories — fun by ayaya",
    description: "Stories for the moments you thought only you understood.",
  });
  const admin = isStoriesAdmin();
  const themes = storyThemesLive();
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
          ${
            admin
              ? `<a class="btn btn-primary tiny" href="#/stories/new">+ New Story</a>
                 <button type="button" class="btn btn-ghost tiny" data-sync-stories>Sync to server</button>`
              : ""
          }
          <span class="tiny muted" aria-live="polite">${list.length} ${list.length === 1 ? "story" : "stories"}</span>
        </div>
      </div>
      <div class="story-list" id="story-results">
        ${
          list.length
            ? list.map(storyCardHTML).join("")
            : `<div class="empty-state"><p>No stories match those filters. Try clearing them.</p></div>`
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
  $("[data-sync-stories]", root)?.addEventListener("click", async () => {
    try {
      await pushToApi(STORIES_ADMIN_PASSWORD);
      showToast("Stories synced to server.");
    } catch (err) {
      showToast(err.message || "Sync failed — saved on this device only.");
    }
  });
}

function renderStoryPage(root, slug) {
  const story = getStoryLive(slug);
  const canRead = story && (story.status === "published" || isStoriesAdmin());
  if (!canRead) {
    setMeta({ title: "Story not found — fun by ayaya", description: "This story isn’t here." });
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
    title: `${story.title} — fun by ayaya`,
    description: story.excerpt,
  });
  const { prev, next } = adjacentStoriesLive(story.slug);
  const admin = isStoriesAdmin();
  root.innerHTML = `
    ${navHTML("stories")}
    <article class="article-shell story-read">
      <p class="article-kicker">${escapeHtml(story.theme)} · ${story.readingTime} min read${story.publishedAt ? ` · ${escapeHtml(story.publishedAt)}` : ""}${admin && story.status === "draft" ? " · Draft" : ""}</p>
      <h1>${escapeHtml(story.title)}</h1>
      ${story.subtitle ? `<p class="story-subtitle">${escapeHtml(story.subtitle)}</p>` : ""}
      <div class="prose">
        ${renderContentBlocks(story.content)}
      </div>
      <section class="story-end">
        <p class="question-line">Did any part of this feel familiar?</p>
        <div class="home-cta-row" style="justify-content:flex-start;margin-top:1rem">
          <a class="btn btn-soft" href="#/stories">Read Another Story</a>
          ${admin ? `<a class="btn btn-ghost" href="#/story/${story.slug}/edit">Edit Story</a>` : ""}
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

function renderStoryEditor(root, slugOrNew) {
  const isNew = slugOrNew === "new" || !slugOrNew;
  let draft = isNew ? blankStory() : getStoryLive(slugOrNew);
  if (!draft) {
    showToast("Story not found.");
    location.hash = "#/stories";
    return;
  }
  draft = JSON.parse(JSON.stringify(draft));

  setMeta({
    title: `${isNew ? "New story" : "Edit"} — fun by ayaya`,
    description: "Edit stories.",
  });

  const initialHtml = contentToHtml(draft.content);

  root.innerHTML = `
    ${navHTML("stories")}
    <main class="page page-narrow story-editor">
      <header class="section-head">
        <h1>${isNew ? "New story" : "Edit story"}</h1>
        <p class="muted">Type like a doc — Enter for a new paragraph. Use the toolbar for bold, italic, underline, and size.</p>
      </header>
      <form class="story-editor-form" data-story-form>
        <label>Title
          <input name="title" required value="${escapeHtml(draft.title)}" />
        </label>
        <label>Subtitle
          <input name="subtitle" value="${escapeHtml(draft.subtitle || "")}" />
        </label>
        <label>Excerpt
          <textarea name="excerpt" rows="2">${escapeHtml(draft.excerpt || "")}</textarea>
        </label>
        <div class="story-editor-row">
          <label>Theme
            <input name="theme" value="${escapeHtml(draft.theme || "")}" list="theme-list" />
            <datalist id="theme-list">${storyThemesLive().map((t) => `<option value="${escapeHtml(t)}"></option>`).join("")}</datalist>
          </label>
          <label>Published
            <input name="publishedAt" type="date" value="${escapeHtml(draft.publishedAt || "")}" />
          </label>
          <label>Status
            <select name="status">
              <option value="published" ${draft.status === "published" ? "selected" : ""}>Published</option>
              <option value="draft" ${draft.status === "draft" ? "selected" : ""}>Draft</option>
            </select>
          </label>
        </div>
        <label class="story-check"><input type="checkbox" name="featured" ${draft.featured ? "checked" : ""} /> Featured</label>

        <h2 class="story-blocks-title">Content</h2>
        <div class="story-rich-wrap">
          <div class="story-rich-toolbar" role="toolbar" aria-label="Text formatting">
            <button type="button" class="story-rich-btn" data-cmd="bold" title="Bold"><b>B</b></button>
            <button type="button" class="story-rich-btn" data-cmd="italic" title="Italic"><i>I</i></button>
            <button type="button" class="story-rich-btn" data-cmd="underline" title="Underline"><u>U</u></button>
            <label class="story-rich-size">
              <span class="sr-only">Font size</span>
              <select data-font-size>
                <option value="">Size</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
                <option value="28px">28</option>
              </select>
            </label>
            <button type="button" class="story-rich-btn" data-insert="link" title="Link">Link</button>
            <button type="button" class="story-rich-btn" data-insert="image" title="Image">Image</button>
          </div>
          <div
            class="story-rich-editor prose"
            data-rich-editor
            contenteditable="true"
            role="textbox"
            aria-multiline="true"
            aria-label="Story content"
          ></div>
        </div>

        <div class="story-editor-actions">
          <button type="submit" class="btn btn-primary">Save story</button>
          <a class="btn btn-ghost" href="${isNew ? "#/stories" : `#/story/${draft.slug}`}">Cancel</a>
          ${!isNew ? `<button type="button" class="btn btn-ghost" data-delete-story>Delete</button>` : ""}
        </div>
      </form>
    </main>`;

  const form = root.querySelector("[data-story-form]");
  const editor = root.querySelector("[data-rich-editor]");
  if (editor) editor.innerHTML = initialHtml || "<p><br></p>";

  const focusEditor = () => {
    editor?.focus();
  };

  const applyCmd = (cmd) => {
    focusEditor();
    document.execCommand(cmd, false, null);
  };

  const applyFontSize = (size) => {
    if (!size || !editor) return;
    focusEditor();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) {
      showToast("Select text first, then pick a size.");
      return;
    }
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, "7");
    editor.querySelectorAll("font[size='7']").forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = size;
      while (el.firstChild) span.appendChild(el.firstChild);
      el.replaceWith(span);
    });
    editor.querySelectorAll("span").forEach((el) => {
      const fs = (el.style && el.style.fontSize) || "";
      if (fs === "xxx-large" || fs === "-webkit-xxx-large" || fs === "xx-large") {
        el.style.fontSize = size;
      }
    });
  };

  root.querySelectorAll("[data-cmd]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => applyCmd(btn.getAttribute("data-cmd")));
  });

  root.querySelector("[data-font-size]")?.addEventListener("change", (e) => {
    applyFontSize(e.target.value);
    e.target.value = "";
  });

  root.querySelector('[data-insert="link"]')?.addEventListener("click", () => {
    focusEditor();
    const href = prompt("Link URL (https://…)");
    if (!href) return;
    const safe = href.trim();
    if (!/^https?:\/\//i.test(safe) && !safe.startsWith("mailto:") && !safe.startsWith("#")) {
      showToast("Use a full https:// link.");
      return;
    }
    const label = window.getSelection()?.toString() || prompt("Link text") || safe;
    document.execCommand("insertHTML", false, `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
  });

  root.querySelector('[data-insert="image"]')?.addEventListener("click", () => {
    focusEditor();
    const url = prompt("Image URL (https://…)");
    if (!url) return;
    const safe = url.trim();
    if (!/^https?:\/\//i.test(safe)) {
      showToast("Use a full https:// image URL.");
      return;
    }
    const alt = prompt("Image caption (optional)") || "";
    document.execCommand(
      "insertHTML",
      false,
      `<figure class="story-figure"><img src="${escapeHtml(safe)}" alt="${escapeHtml(alt)}" /><figcaption>${escapeHtml(alt)}</figcaption></figure><p><br></p>`
    );
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    draft.title = String(fd.get("title") || "");
    draft.subtitle = String(fd.get("subtitle") || "");
    draft.excerpt = String(fd.get("excerpt") || "");
    draft.theme = String(fd.get("theme") || "");
    draft.publishedAt = String(fd.get("publishedAt") || "");
    draft.status = String(fd.get("status") || "published");
    draft.featured = !!form.querySelector('[name="featured"]')?.checked;
    if (!draft.title.trim()) {
      showToast("Title is required.");
      return;
    }
    const html = sanitizeStoryHtml(editor?.innerHTML || "");
    const plain = htmlToPlainText(html);
    if (!plain && !html.includes("<img")) {
      showToast("Write some content first.");
      return;
    }
    draft.content = [{ type: "html", html }];
    if (!draft.excerpt.trim()) draft.excerpt = plain.slice(0, 180);
    draft.readingTime = estimateReadingTime(draft.content);
    const saved = upsertStory(draft);
    try {
      await pushToApi(STORIES_ADMIN_PASSWORD);
      showToast("Saved & synced.");
    } catch {
      showToast("Saved on this device.");
    }
    location.hash = `#/story/${saved.slug}`;
  });

  root.querySelector("[data-delete-story]")?.addEventListener("click", async () => {
    if (!confirm("Delete this story? Seed stories will hide until you clear overrides.")) return;
    deleteStory(draft.id);
    try {
      await pushToApi(STORIES_ADMIN_PASSWORD);
    } catch {
      /* local only */
    }
    showToast("Story deleted.");
    location.hash = "#/stories";
  });
}

/* ---------- GAMES ---------- */
function gameCardUndercover() {
  return `
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
        </article>`;
}

function gameCardTtt() {
  return `
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
        </article>`;
}

function gameCardRsm() {
  return `
        <article class="game-card game-rsm">
          <div class="rsm-card-art" aria-hidden="true">
            <div class="rsm-art-grid"></div>
            <div class="rsm-mini-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <svg class="rsm-sparkline" viewBox="0 0 120 40" width="120" height="40">
              <path d="M0 28 L18 24 L32 30 L48 12 L64 18 L80 8 L96 14 L120 4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <div class="rsm-float-chip c1">+$48</div>
            <div class="rsm-float-chip c2">🚀</div>
            <div class="rsm-float-chip c3">-12%</div>
            <span class="rsm-art-ticker"><b>VSM</b> · LIVE +200%</span>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live rsm-live-badge">PLAYABLE · 2–6</span>
              <span class="badge-mode badge-online" aria-label="Online multiplayer">ONLINE</span>
            </div>
            <span class="rsm-stamp" aria-hidden="true">📈 LIVE</span>
          </div>
          <div class="rsm-card-icons" aria-hidden="true">
            <span>📊</span><span>💸</span><span>🏆</span>
          </div>
          <h2>Virtual Stock Market</h2>
          <p class="rsm-card-tagline">Bet together. Panic together. Win the floor.</p>
          <p>Five rounds of secret investments, wild market swings, hold-or-sell drama, and reading the room.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Couples, friend groups, game nights</li>
            <li><strong>Players:</strong> 2–6</li>
            <li><strong>Mood:</strong> Chaotic, social, replayable</li>
          </ul>
          <a class="btn btn-rsm-cta" href="#/rsm" data-start-rsm>
            <span class="rsm-cta-pulse" aria-hidden="true"></span>
            <span aria-hidden="true">▶</span>
            OPEN THE MARKET
          </a>
        </article>`;
}

function gameCardFoodChain() {
  return `
        <article class="game-card game-fc">
          <div class="fc-card-art" aria-hidden="true">
            <div class="fc-art-chain">
              <span>APPLE</span><i>→</i><span>EGG</span><i>→</i><span>GRAPE</span>
            </div>
            <div class="fc-art-timer">60</div>
            <span class="fc-art-apple">🍎</span>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live">PLAYABLE · EN/ID</span>
              <span class="badge-mode badge-online" aria-label="Online game">ONLINE</span>
            </div>
            <span class="fc-stamp" aria-hidden="true">🍎 60s</span>
          </div>
          <h2>Food Chain 60 🍎</h2>
          <p class="fc-card-tagline">Juicy word chains in 60 seconds.</p>
          <p>Pick English or Indonesian, learn the rule, then race the clock. Each food starts with the last letter of the one before.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Quick solo rounds, waiting rooms, brain warm-ups</li>
            <li><strong>Players:</strong> 1 · EN / ID</li>
            <li><strong>Mood:</strong> Juicy, fast, snack-brained</li>
          </ul>
          <a class="btn btn-fc-cta" href="#/foodchain" data-start-fc>
            <span aria-hidden="true">▶</span>
            PLAY ONLINE
          </a>
        </article>`;
}

function gameCardHigherLower() {
  return `
        <article class="game-card game-hl">
          <div class="hl-card-art" aria-hidden="true">
            <div class="hl-art-row">
              <span class="hl-art-chip">How to cook rice</span>
              <span class="hl-art-vs">VS</span>
              <span class="hl-art-chip">How to quit my job</span>
            </div>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live">PLAYABLE · 10 ROUNDS</span>
              <span class="badge-mode badge-online" aria-label="Online game">ONLINE</span>
            </div>
            <span class="fc-stamp" aria-hidden="true">📈</span>
          </div>
          <h2>Higher or Lower 📈</h2>
          <p class="hl-card-tagline">Which one does the internet search more?</p>
          <p>Two search queries. Pick the bigger one. Volumes are SEO-style estimates for the last 1 month.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Quick solo brain snacks</li>
            <li><strong>Players:</strong> 1</li>
            <li><strong>Mood:</strong> Curious, competitive, scroll-culture</li>
          </ul>
          <a class="btn btn-hl-cta" href="#/higherlower" data-start-hl>
            <span aria-hidden="true">▶</span>
            START GAME
          </a>
        </article>`;
}

function gameCardQuestionCards() {
  return `
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
        </article>`;
}

function gameCardColorConfusion() {
  return `
        <article class="game-card game-cc">
          <div class="cc-card-art" aria-hidden="true">
            <span class="cc-art-word">BLUE</span>
            <span class="cc-art-hint">word says blue · color is red</span>
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live">PLAYABLE · 30s</span>
              <span class="badge-mode badge-online" aria-label="Online game">ONLINE</span>
            </div>
            <span class="fc-stamp" aria-hidden="true">🎨</span>
          </div>
          <h2>Color Confusion 🎨</h2>
          <p class="cc-card-tagline">Don’t read the word. Trust your eyes.</p>
          <p>A color word appears in the wrong font color. Pick the real color as fast as you can. 30 seconds. No mercy.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Brain warm-ups and rapid-fire rounds</li>
            <li><strong>Players:</strong> 1</li>
            <li><strong>Mood:</strong> Fast, tricky, slightly chaotic</li>
          </ul>
          <a class="btn btn-cc-cta" href="#/colorconfusion" data-start-cc>
            <span aria-hidden="true">▶</span>
            START GAME
          </a>
        </article>`;
}

function gameCardOjolRush() {
  return `
        <article class="game-card game-ojol">
          <div class="ojol-card-hero">
            <img src="/static/img/ojol-rush-card-hero.png" alt="" width="960" height="540" loading="lazy" />
          </div>
          <div class="game-card-top">
            <div class="game-card-badges">
              <span class="badge-soon badge-live">PLAYABLE · 3D</span>
              <span class="badge-mode badge-online" aria-label="Online game">ONLINE</span>
            </div>
            <span class="fc-stamp" aria-hidden="true">🛵</span>
          </div>
          <h2>Ojol Rush: Sudirman</h2>
          <p class="ojol-card-tagline">Endless runner through Sudirman traffic.</p>
          <p>Three lanes, jump, dodge cars and buses, grab coins and power-ups. How far can you ride?</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Quick adrenaline solo runs</li>
            <li><strong>Players:</strong> 1</li>
            <li><strong>Mood:</strong> Fast, colorful, Jakarta morning rush</li>
          </ul>
          <a class="btn btn-ojol-cta btn-game-load is-loading" data-ojol-cta data-start-ojol role="button" aria-busy="true" aria-disabled="true">
            <span class="btn-load-fill" data-load-fill style="width:0%"></span>
            <span class="btn-load-label" data-load-label>Loading 0%</span>
          </a>
          <p class="ojol-load-hint" data-ojol-hint>Preparing 3D assets…</p>
        </article>`;
}

function wireGamesActions(root) {
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
  root.querySelector("[data-start-fc]")?.addEventListener("click", () => {
    startFoodChain();
  });
  root.querySelector("[data-start-hl]")?.addEventListener("click", () => {
    startHigherLower();
  });
  root.querySelector("[data-start-cc]")?.addEventListener("click", () => {
    startColorConfusion();
  });
  const ojolBtn = root.querySelector("[data-ojol-cta]");
  if (ojolBtn) {
    const hint = root.querySelector("[data-ojol-hint]");
    wireGameLoadButton(ojolBtn, {
      key: "ojol-rush",
      ensure: ensureOjolPreload,
      href: GAME_HREF,
      readyLabel: "▶ START RIDE",
      loadingLabel: (p) => `Loading ${p}%`,
      errorLabel: "Retry load",
    });
    ensureOjolPreload(({ status, progress }) => {
      if (!hint) return;
      if (status === "ready") hint.textContent = "Ready when you are.";
      else if (status === "error") hint.textContent = "Load failed — tap to retry.";
      else hint.textContent = `Downloading 3D ride… ${progress}%`;
    });
  }
}

function renderGamesChooser(root) {
  setMeta({
    title: "Games · fun by ayaya",
    description: "Choose solo online games or multiplayer hangout games.",
  });
  root.innerHTML = `
    ${navHTML("games")}
    <main class="page games-page">
      <header class="section-head">
        <h1>What kind of game night is this?</h1>
        <p class="muted">Solo first if it’s just you. Multiplayer if you’re with someone.</p>
        <p class="question-line">Pick a lane, then choose a game.</p>
      </header>

      <div class="games-mode-duo" aria-label="Choose game mode">
        <a class="games-mode-card mode-solo" href="#/games/solo">
          <span class="games-mode-badge">all online</span>
          <span class="games-mode-ico" aria-hidden="true">🍎</span>
          <h2>Solo</h2>
          <p>Quick online games for me time. Race the clock, beat your own best.</p>
          <span class="entry-go">Open solo menu →</span>
        </a>
        <a class="games-mode-card mode-multi" href="#/games/multiplayer">
          <span class="games-mode-badge">together</span>
          <span class="games-mode-ico" aria-hidden="true">◇</span>
          <h2>Multiplayer</h2>
          <p>Hangout games for couples, friends, and groups who want a plot twist.</p>
          <span class="entry-go">Open multiplayer menu →</span>
        </a>
      </div>
    </main>`;
}

function renderGamesPage(root, mode) {
  const m = String(mode || "").toLowerCase();
  if (m !== "solo" && m !== "multiplayer") {
    return renderGamesChooser(root);
  }

  const isSolo = m === "solo";
  setMeta({
    title: isSolo ? "Solo Games · fun by ayaya" : "Multiplayer Games · fun by ayaya",
    description: isSolo
      ? "Online solo games for me time."
      : "Multiplayer games for hangouts and shared nights.",
  });

  const cards = isSolo
    ? [gameCardFoodChain(), gameCardHigherLower(), gameCardColorConfusion(), gameCardOjolRush()].join("\n")
    : [gameCardUndercover(), gameCardTtt(), gameCardRsm(), gameCardQuestionCards()].join("\n");

  root.innerHTML = `
    ${navHTML("games")}
    <main class="page games-page">
      <header class="section-head">
        <p class="games-back-row"><a class="games-back-link" href="#/games">← All games</a></p>
        <h1>${isSolo ? "Solo games" : "Multiplayer games"}</h1>
        <p class="muted">${
          isSolo
            ? "All online. Pick a language, learn the rule, then play."
            : "Play with friends, family, someone you love, or someone you’re still figuring out."
        }</p>
        <p class="question-line">${isSolo ? "One player. Full focus." : "Pick the kind of moment you want to create."}</p>
      </header>

      <div class="games-grid">
        ${cards}
      </div>
    </main>`;
  wireGamesActions(root);
}

window.addEventListener("hashchange", render);
if (!location.hash || location.hash === "#" || location.hash === "#/landing") {
  location.hash = hasSeenBumperThisSession() ? "#/home" : "#/bumper";
} else if (location.hash === "#/bumper" && hasSeenBumperThisSession()) {
  location.hash = "#/home";
}
(async () => {
  if (isStoriesViewUnlocked()) await hydrateFromApi();
  render();
})();
