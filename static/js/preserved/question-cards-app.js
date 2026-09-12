import {
  publishedStories,
  getStoryBySlug,
  storyThemes,
  adjacentStories,
} from "./stories-data.js";

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

  if (!hasFinishedLanding() && route !== "landing" && route !== "bumper") {
    location.hash = "#/landing";
    return;
  }

  if (route === "landing") return renderLanding(app);
  if (route === "bumper") return renderBumper(app);
  // Hide unfinished QC / bank routes from visitors
  if (route === "questions" || route === "cards" || route === "bank" || route === "tbc") {
    location.hash = "#/games";
    return;
  }
  if (route === "stories") return renderStoriesPage(app);
  if (route === "story") return renderStoryPage(app, parts[1]);
  if (route === "games") return renderGamesPage(app);
  return renderHome(app);
}

/* ---------- landing / bumper (kept) ---------- */
function renderLanding(root) {
  setMeta({
    title: "alaia fun — a quiet corner of the internet",
    description: "Stories for alone time, and games for the moments you share.",
  });
  root.innerHTML = `
    <section class="invite-screen scene-3d" id="landing">
      <div class="scene-depth" aria-hidden="true">
        <span class="orb orb-a"></span>
        <span class="orb orb-b"></span>
        <span class="orb orb-c"></span>
      </div>
      <div class="invite-stage" data-tilt>
        <div class="invite-card invite-card-3d">
          <p class="invite-kicker">threshold</p>
          <h1>
            <span class="line-soft">YOU ARE ABOUT TO ENTER</span>
            <span class="line-hard">A PLACE FOR THOUGHTS, QUESTIONS, AND UNNECESSARY RABBIT HOLES.</span>
          </h1>
          <p class="invite-hook">Most people skim past moments that could rewire how they see everything. Stay for one thought — don’t expect to leave thinking the same way.</p>
          <div class="invite-actions">
            <button class="btn btn-primary btn-3d" type="button" data-enter>I’ll take the risk</button>
            <button class="btn btn-ghost" type="button" data-skip>not now</button>
          </div>
        </div>
      </div>
    </section>`;
  const go = () => {
    location.hash = "#/bumper";
  };
  root.querySelector("[data-enter]").onclick = go;
  root.querySelector("[data-skip]").onclick = go;
}

function renderBumper(root) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.innerHTML = `
    <section class="bumper-screen" id="bumper" aria-label="Opening bumper">
      <div class="film-letterbox" aria-hidden="true"></div>
      <div class="bumper-track" aria-hidden="true">
        <div class="bumper-stripe"></div>
        <div class="bumper-stripe alt"></div>
      </div>
      <div class="bumper-stage ${reduce ? "is-ready" : ""}">
        <p class="bumper-kicker">scene 01 · mindset</p>
        <div class="bumper-logo" aria-hidden="true">♡</div>
        <h1 class="bumper-title">
          <span class="bumper-line">The way you change your life</span>
          <span class="bumper-line accent">is by changing the mind you meet it with.</span>
        </h1>
        <p class="bumper-sub">Not a new city. Not a new plan first.<br/>A different way of seeing — then everything else can move.</p>
        <button class="btn btn-primary btn-3d bumper-cta" type="button" data-continue ${reduce ? "" : "hidden"}>Continue</button>
      </div>
    </section>`;
  const stage = root.querySelector(".bumper-stage");
  const cta = root.querySelector("[data-continue]");
  const reveal = () => {
    stage.classList.add("is-ready");
    cta.hidden = false;
    live("Continue when you’re ready");
  };
  if (reduce) cta.hidden = false;
  else setTimeout(reveal, 2800);
  cta.onclick = () => {
    markLandingDone();
    location.hash = "#/home";
  };
}

/* ---------- HOME ---------- */
function renderHome(root) {
  setMeta({
    title: "alaia fun — Home",
    description:
      "A personal corner for stories when you’re alone, and games when you’re with someone.",
  });
  const latest = publishedStories().slice(0, 3);
  root.innerHTML = `
    ${navHTML("home")}
    <main class="page home-page">
      <header class="home-hero-block">
        <p class="home-kicker">a personal corner of the internet</p>
        <h1>My Life Is Already Full, but I Never Want to Close the Door on Someone Who Could Unexpectedly Matter.</h1>
        <div class="home-hero-copy">
          <p>I’m perfectly happy with the people I already have in my life. I have friends I love, people I trust, and connections I’m incredibly grateful for.</p>
          <p>But I also think it’s kind of incredible how meeting just one person—or finding one story at exactly the right time—can unexpectedly change the trajectory of your life.</p>
          <p>So I made this little corner of the internet for both kinds of moments: the ones you spend with yourself, and the ones you share with other people.</p>
        </div>
        <div class="home-cta-row">
          <a class="btn btn-primary" href="#/stories">Read a Story</a>
          <a class="btn btn-ghost" href="#/games">Play Something Together</a>
        </div>
      </header>

      <section class="two-ways" aria-label="Two ways to use this page">
        <article class="way-panel way-alone">
          <p class="way-label">When you’re here by yourself</p>
          <h2>Quiet company</h2>
          <p>Read the things I’ve lived through, overthought, learned too late, or never quite knew how to say out loud. Maybe one of them will feel strangely familiar.</p>
          <a class="btn btn-soft" href="#/stories">Explore My Stories</a>
        </article>
        <article class="way-panel way-together">
          <p class="way-label">When you’re here with someone</p>
          <h2>Shared moments</h2>
          <p>Pick a game, ask better questions, laugh at something unexpected, or find out what the people around you have somehow never told you.</p>
          <a class="btn btn-primary" href="#/games">Explore the Games</a>
        </article>
      </section>

      <section class="about-prose">
        <h2>Why I made this page</h2>
        <p>You can have so many people to talk to and still occasionally think, “Wait, who do I talk to about this?”</p>
        <p>Not because your friendships are lacking. Maybe one friend is busy, another finds the topic sensitive, and the others simply do not care about this one very specific thing—and that’s completely okay. Different people meet different parts of us.</p>
        <p>Sometimes that connection begins through a conversation. Sometimes it begins because you read someone’s story and realize you’ve felt the same thing too.</p>
        <p>Life can already feel full while still leaving room for people not yet met — and for stories that arrive at exactly the right time.</p>
      </section>

      <section class="about-prose">
        <h2>How I connect with people</h2>
        <p><strong>I take my connections slow-burn.</strong></p>
        <p>When I first meet someone, I’m much more interested in how you think than in knowing everything that has ever happened to you. Some of the people I love most today weren’t people I immediately clicked with. Some surprised me on the third meeting. A first impression doesn’t have to become a permanent conclusion.</p>
        <p>I’d rather discover you slowly — and leave room for you to discover yourself too.</p>
      </section>

      <section class="preview-section">
        <div class="section-head-row">
          <h2>Latest Stories</h2>
          <a class="btn btn-ghost tiny" href="#/stories">All stories</a>
        </div>
        ${
          latest.length
            ? `<div class="story-list">${latest.map(storyCardHTML).join("")}</div>`
            : `<p class="muted">No published stories yet. Check back soon.</p>`
        }
      </section>

      <section class="preview-section games-preview-home">
        <h2>Games for the moments you share with other people.</h2>
        <p class="muted">For conversations that go somewhere, inside jokes waiting to happen, and moments when “What should we do?” deserves a better answer.</p>
        <div class="games-mini-grid">
          <article class="game-mini undercover-mini">
            <p class="badge-soon">Coming Soon</p>
            <h3>Undercover</h3>
            <p>A hidden-role game for groups who enjoy clues, accusations, and a little chaos.</p>
          </article>
          <article class="game-mini cards-mini">
            <p class="badge-soon">Coming Soon</p>
            <h3>Question Cards</h3>
            <p>Conversation prompts for moments when you want to laugh, reconnect, or know someone more deeply.</p>
          </article>
        </div>
        <div class="home-cta-row" style="margin-top:1.25rem">
          <a class="btn btn-primary" href="#/games">Explore Upcoming Games</a>
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
    title: "Games — alaia fun",
    description: "Games for people who want to know each other beyond the usual questions. Coming soon.",
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
          <div class="game-card-top">
            <span class="badge-soon" aria-label="Coming soon">Coming Soon</span>
            <div class="game-motif" aria-hidden="true">⌕</div>
          </div>
          <h2>Undercover</h2>
          <p>Everyone seems to know what’s going on—except the person secretly trying to blend in. Describe, guess, accuse, and figure out who is hiding among you.</p>
          <ul class="game-meta">
            <li><strong>Best for:</strong> Parties, reunions, road trips, and group hangouts</li>
            <li><strong>Players:</strong> 3+ people</li>
            <li><strong>Mood:</strong> Playful, suspicious, and slightly chaotic</li>
          </ul>
          <button type="button" class="btn btn-ghost is-disabled-look" data-coming-soon aria-disabled="true">Undercover — Coming Soon</button>
        </article>

        <article class="game-card game-question-cards">
          <div class="game-card-top">
            <span class="badge-soon" aria-label="Coming soon">Coming Soon</span>
            <div class="game-motif cards-motif" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
          </div>
          <h2>Question Cards</h2>
          <p>Find the right question for the people you’re with—from easy icebreakers to the kind of conversation that makes time disappear.</p>
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
}

window.addEventListener("hashchange", render);
if (!hasFinishedLanding()) location.hash = "#/landing";
else if (!location.hash || location.hash === "#") location.hash = "#/home";
render();
