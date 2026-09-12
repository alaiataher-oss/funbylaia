import {
  corners,
  stories,
  moods,
  questions,
  quiz,
  secretThoughts,
  surpriseLines,
  HEART_UNLOCK,
  getStory,
  storiesByMood,
  storiesByCorner,
  randomItem,
} from "./data.js";
import { store } from "./store.js";
import {
  navHTML,
  bindNav,
  mountHearts,
  showToast,
  burstParticles,
  settingsStrip,
  bindClear,
  el,
} from "./ui.js";

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderInvitation(root, onRisk) {
  root.innerHTML = `
    <section class="invite-screen scene-3d" id="invite">
      <div class="scene-depth" aria-hidden="true">
        <span class="orb orb-a"></span>
        <span class="orb orb-b"></span>
        <span class="orb orb-c"></span>
        <span class="plane plane-back"></span>
        <span class="plane plane-mid"></span>
      </div>
      <div class="invite-stage" data-tilt>
        <div class="invite-card invite-card-3d">
          <p class="invite-kicker">threshold</p>
          <h1>
            <span class="line-soft">YOU ARE ABOUT TO ENTER</span>
            <span class="line-hard">A PLACE FOR THOUGHTS, QUESTIONS, AND UNNECESSARY RABBIT HOLES.</span>
          </h1>
          <p class="invite-hook">Most people skim past moments that could rewire how they see everything. This one won’t force you — but if you stay, don’t expect to leave thinking the same way.</p>
          <div class="invite-actions">
            <button class="btn btn-primary btn-3d" type="button" data-risk>I’ll take the risk</button>
            <button class="btn btn-ghost" type="button" data-skip>not now</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const screen = root.querySelector("#invite");
  const stage = root.querySelector("[data-tilt]");

  const go = () => {
    screen.classList.add("is-exiting");
    setTimeout(onRisk, 520);
  };

  root.querySelector("[data-risk]").addEventListener("click", (e) => {
    burstParticles(e.currentTarget, 12);
    go();
  });

  root.querySelector("[data-skip]").addEventListener("click", go);

  if (!window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    screen.addEventListener("pointermove", (e) => {
      const r = screen.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(24px)`;
      screen.style.setProperty("--px", `${x * 40}px`);
      screen.style.setProperty("--py", `${y * 28}px`);
    });
    screen.addEventListener("pointerleave", () => {
      stage.style.transform = "";
      screen.style.setProperty("--px", "0px");
      screen.style.setProperty("--py", "0px");
    });
  }
}

export function renderMindset(root, onContinue) {
  root.innerHTML = `
    <section class="mindset-screen scene-3d" id="mindset">
      <div class="film-letterbox" aria-hidden="true"></div>
      <div class="mindset-stage" data-tilt>
        <figure class="still-frame">
          <div class="still-chrome">
            <span>SCENE 01</span>
            <span>MINDSET</span>
            <span>00:00:07</span>
          </div>
          <div class="still-body">
            <div class="book-3d" aria-hidden="true">
              <div class="book-cover"></div>
              <div class="book-page left-page">
                <p class="page-num">47</p>
                <p class="page-print">change does not begin with a new city, a new person, or a new plan.</p>
              </div>
              <div class="book-page right-page">
                <p class="page-num">48</p>
                <p class="page-print emphasis">it begins the moment you decide the story you’re telling yourself can be rewritten.</p>
              </div>
            </div>
            <blockquote class="still-quote">
              <p>The way you change your life is not by escaping it —</p>
              <p class="still-punch">it’s by changing the mind you meet it with.</p>
            </blockquote>
            <p class="still-credit">from the quiet opening of almost every story that actually mattered</p>
          </div>
          <div class="still-grain" aria-hidden="true"></div>
        </figure>
        <button class="btn btn-primary btn-3d" type="button" data-continue>continue</button>
      </div>
    </section>
  `;

  const stage = root.querySelector("[data-tilt]");
  const screen = root.querySelector("#mindset");

  root.querySelector("[data-continue]").addEventListener("click", () => {
    store.setMindsetSeen();
    store.setEntered();
    if (store.visitCount() === 0) store.bumpVisit();
    screen.classList.add("is-exiting");
    setTimeout(onContinue, 480);
  });

  if (!window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    screen.addEventListener("pointermove", (e) => {
      const r = screen.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 7}deg)`;
      const book = root.querySelector(".book-3d");
      if (book) book.style.transform = `rotateY(${-18 + x * 16}deg) rotateX(${8 - y * 6}deg)`;
    });
  }
}

export function renderEntrance(root) {
  renderHome(root);
}

export function renderHome(root) {
  root.innerHTML = `
    ${navHTML("home")}
    <main class="page home-clean">
      <header class="home-intro">
        <p class="home-kicker">${escapeHtml(store.greeting())}</p>
        <h1>Help you get to know yourself — and someone.</h1>
        <p class="home-lede">
          A quiet place for stories and questions that change how you see your own mind,
          and how you meet another person’s.
        </p>
      </header>

      <section class="home-pillars" aria-label="Main paths">
        <a class="pillar pillar-stories" href="#/stories" data-link>
          <div class="pillar-depth" aria-hidden="true"></div>
          <p class="pillar-num">01</p>
          <h2>Stories for how you feel</h2>
          <p>Not ranked. Not chronological. Chosen by the state you’re in — comfort, curiosity, heartbreak, ambition, or the 2 a.m. version of you.</p>
          <span class="pillar-cta">enter stories →</span>
        </a>

        <a class="pillar pillar-questions" href="#/questions" data-link>
          <div class="pillar-depth" aria-hidden="true"></div>
          <p class="pillar-num">02</p>
          <h2>Question cards</h2>
          <p>For different occasions and different people — first dates, old friends, quiet nights, hard conversations. One question can open a door you didn’t know was locked.</p>
          <span class="pillar-cta">draw a card →</span>
        </a>
      </section>

      <p class="home-promise">
        You don’t need another feed.<br />
        You need one thought that stays with you after you leave.
      </p>

      <div class="home-cta-row home-secondary">
        <button class="btn btn-ghost" type="button" data-surprise>surprise me</button>
        <a class="btn btn-ghost" href="#/about" data-link>about this space</a>
      </div>

      ${settingsStrip()}
    </main>
  `;
  bindNav(root);
  bindClear(root);
}

export function renderCorner(root, cornerId) {
  const corner = corners.find((c) => c.id === cornerId);
  if (!corner) {
    renderNotFound(root);
    return;
  }
  const list = storiesByCorner(cornerId);
  root.innerHTML = `
    ${navHTML("explore")}
    <main class="page page-narrow">
      <header class="section-head">
        <p class="muted">${corner.emoji} corner</p>
        <h1>${escapeHtml(corner.title)}</h1>
        <p class="muted">${escapeHtml(corner.blurb)}</p>
        <p class="question-line">What might you recognize here?</p>
      </header>
      <div class="story-list">
        ${list.map(storyCard).join("") || emptyCorner()}
      </div>
      <div class="home-cta-row" style="margin-top:1.5rem;justify-content:flex-start">
        <a class="btn btn-ghost" href="#/home" data-link>← back to the map</a>
        <button class="btn btn-soft" type="button" data-surprise>let fate decide 🎲</button>
      </div>
    </main>
  `;
  bindNav(root);
}

export function renderStories(root, moodId = null) {
  const list = storiesByMood(moodId);
  root.innerHTML = `
    ${navHTML("stories")}
    <main class="page">
      <header class="section-head">
        <h1>Stories</h1>
        <p class="muted">Depending on how you feel — not what’s trending.</p>
        <p class="question-line">what are you in the mood for?</p>
      </header>
      <div class="mood-grid">
        <button class="chip ${!moodId ? "is-active" : ""}" data-mood="">♡ all of it</button>
        ${moods
          .map(
            (m) =>
              `<button class="chip ${moodId === m.id ? "is-active" : ""}" data-mood="${m.id}">${escapeHtml(m.label)}</button>`
          )
          .join("")}
      </div>
      <div class="story-list">
        ${list.map(storyCard).join("") || `<div class="empty-state"><p>apparently there’s nothing here yet. Maybe you’ve found a new topic.</p></div>`}
      </div>
    </main>
  `;
  bindNav(root);
  root.querySelectorAll("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-mood");
      location.hash = id ? `#/stories?mood=${id}` : "#/stories";
    });
  });
}

export function renderExplore(root) {
  renderStories(root, null);
  // tweak active nav feel — explore uses same mood browser
  root.querySelector(".section-head h1").textContent = "explore by mood";
}

function storyCard(s) {
  return `
    <a class="story-preview" href="#/story/${s.id}" data-link>
      <div class="meta-row">
        <span class="tag">${s.minutes} min</span>
        ${s.interactive ? `<span class="tag">includes a prompt</span>` : ""}
        ${s.placeholder ? `<span class="tag">soft stub</span>` : ""}
      </div>
      <h2>${escapeHtml(s.title)}</h2>
      <p class="question-line">${escapeHtml(s.centralQuestion)}</p>
      <p class="muted tiny">${escapeHtml(s.kicker)}</p>
    </a>
  `;
}

function emptyCorner() {
  return `<div class="empty-state"><p class="muted">This drawer is still collecting thoughts. Try Surprise Me, or leave a question for later.</p></div>`;
}

export function renderStory(root, id) {
  const story = getStory(id);
  if (!story) {
    renderNotFound(root);
    return;
  }
  store.markStoryRead(id);
  const saved = store.isSaved(id);
  const reaction = store.getReaction(id);
  const thoughts = store.getThoughts(id);

  const body = story.paragraphs
    .map((block, idx) => {
      if (block.type === "p") return `<p>${escapeHtml(block.text)}</p>`;
      if (block.type === "h2") return `<h2 class="serif" style="font-size:1.8rem;color:var(--berry);margin:2rem 0 1rem">${escapeHtml(block.text)}</h2>`;
      if (block.type === "pull") return `<p class="pull">${escapeHtml(block.text)}</p>`;
      if (block.type === "annotation") return `<p class="annotation">${escapeHtml(block.text)}</p>`;
      if (block.type === "pause") {
        return `
          <div class="reader-pause" data-pause="${idx}">
            <h3>${escapeHtml(block.prompt)}</h3>
            <div class="pause-actions">
              ${block.options
                .map((o) => `<button class="btn btn-ghost" type="button" data-pause-opt="${escapeHtml(o)}">${escapeHtml(o)}</button>`)
                .join("")}
            </div>
            <p class="muted tiny" data-pause-note hidden style="margin:0.75rem 0 0">kept privately on this device. nothing was sent.</p>
          </div>`;
      }
      if (block.type === "constellation") {
        const stars = Array.from({ length: 18 }, (_, i) => {
          const left = 8 + ((i * 37) % 84);
          const top = 12 + ((i * 53) % 55);
          const delay = (i % 5) * 0.35;
          return `<span class="star" style="left:${left}%;top:${top}%;animation-delay:${delay}s"></span>`;
        }).join("");
        return `<div class="constellation">${stars}<div class="prompt">${escapeHtml(block.prompt)}</div></div>`;
      }
      if (block.type === "float") {
        return `<div class="floating-react"><button class="btn btn-soft" type="button" data-float>${escapeHtml(block.label)}</button></div>`;
      }
      return "";
    })
    .join("");

  const others = stories.filter((s) => s.id !== id);

  root.innerHTML = `
    ${navHTML("stories")}
    <article class="article-shell" id="article">
      <div class="article-kicker">${escapeHtml(story.kicker)}</div>
      <h1>${escapeHtml(story.title)}</h1>
      <div class="article-meta">
        <span>${story.minutes} min read</span>
        <button class="btn btn-ghost tiny" type="button" data-save>${saved ? "kept ♡" : "keep this one"}</button>
      </div>
      <div class="prose">${body}</div>

      <section class="think-alike">
        <h2>Did this make something in your brain go “WAIT. SAME.”?</h2>
        <div class="pause-actions" data-alike>
          ${["YES. EXACTLY.", "I SEE IT DIFFERENTLY.", "I NEED TO THINK ABOUT THIS.", "I HAVE A STORY ABOUT THIS."]
            .map(
              (label) =>
                `<button class="btn ${reaction === label ? "btn-primary" : "btn-ghost"}" type="button" data-alike-opt="${escapeHtml(label)}">${escapeHtml(label)}</button>`
            )
            .join("")}
        </div>
        <div class="response-box" data-share-box ${reaction ? "" : "hidden"}>
          <p class="muted">Want to leave a thought for the next person who reads this?</p>
          <textarea placeholder="what did this bring up for you?" maxlength="600"></textarea>
          <div class="pause-actions">
            <button class="btn btn-soft" type="button" data-leave-thought>leave a little thought</button>
          </div>
          <div class="saved-thoughts">
            ${thoughts
              .map((t) => `<div class="saved-thought">${escapeHtml(t.text)}</div>`)
              .join("")}
          </div>
        </div>
      </section>

      <section class="rabbit-hole">
        <h2>you’ve reached the end.</h2>
        <p class="muted">but since you’re already here…</p>
        <div class="path-grid">
          <a href="#/story/${others[0]?.id || id}" data-link>→ something connected to this</a>
          <a href="#/story/${others[others.length - 1]?.id || id}" data-link>→ something completely unrelated</a>
          <button type="button" data-surprise>→ let fate decide 🎲</button>
          <a href="#/questions" data-link>→ a question to take with you</a>
          <button type="button" data-focus-thought>→ leave a thought for the next reader</button>
        </div>
        <p class="question-line" style="margin-top:1.5rem">${escapeHtml(story.takeawayQuestion)}</p>
      </section>
      ${settingsStrip()}
    </article>
  `;

  bindNav(root);
  bindClear(root);
  mountHearts(root.querySelector("#article"), `story-${id}`);

  root.querySelectorAll("[data-pause-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.closest("[data-pause]");
      box.querySelectorAll("[data-pause-opt]").forEach((b) => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      const note = box.querySelector("[data-pause-note]");
      note.hidden = false;
      showToast("held gently. just for you.");
    });
  });

  root.querySelector("[data-float]")?.addEventListener("click", () => {
    showToast("same. that specific corner of the brain is real.");
  });

  root.querySelector("[data-save]")?.addEventListener("click", (e) => {
    const on = store.toggleSave(id);
    e.currentTarget.textContent = on ? "kept ♡" : "keep this one";
    showToast(on ? "saved on this device." : "removed from keeps.");
  });

  root.querySelectorAll("[data-alike-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = btn.getAttribute("data-alike-opt");
      store.setReaction(id, label);
      root.querySelectorAll("[data-alike-opt]").forEach((b) => {
        b.classList.toggle("btn-primary", b === btn);
        b.classList.toggle("btn-ghost", b !== btn);
      });
      root.querySelector("[data-share-box]").hidden = false;
    });
  });

  root.querySelector("[data-leave-thought]")?.addEventListener("click", () => {
    const ta = root.querySelector("[data-share-box] textarea");
    const text = ta.value.trim();
    if (!text) {
      showToast("even a tiny thought counts — write a little?");
      return;
    }
    store.addThought(id, text);
    ta.value = "";
    const list = root.querySelector(".saved-thoughts");
    list.insertAdjacentHTML("afterbegin", `<div class="saved-thought">${escapeHtml(text)}</div>`);
    showToast("left for whoever comes next. anonymous on this device.");
  });

  root.querySelector("[data-focus-thought]")?.addEventListener("click", () => {
    const box = root.querySelector("[data-share-box]");
    box.hidden = false;
    box.querySelector("textarea").focus();
  });
}

export function renderQuestions(root) {
  const decks = [
    {
      id: "self",
      label: "know yourself",
      blurb: "when you’re alone with your own mind",
      items: [
        "What part of yourself took you a long time to understand?",
        "What opinion could you give a 20-minute presentation about with zero preparation?",
        "What is something you changed your mind about recently?",
        "What door are you still leaving open, just in case?",
      ],
    },
    {
      id: "someone",
      label: "know someone",
      blurb: "for the person across from you",
      items: [
        "What tiny thing instantly makes you like someone?",
        "What kind of conversation makes you forget to check your phone?",
        "Have you ever changed your mind about someone?",
        "Who has changed your life in a way they may not realize?",
      ],
    },
    {
      id: "occasion",
      label: "for the moment",
      blurb: "dates, reunions, late nights, hard talks",
      items: [
        "What stranger do you still remember?",
        "What is a small kindness you still think about?",
        "What’s something everyone seems to enjoy that you simply don’t understand?",
        "What makes you lose respect for someone?",
      ],
    },
  ];

  let deckId = "self";
  let current = decks[0].items[0];

  const draw = () => {
    const deck = decks.find((d) => d.id === deckId) || decks[0];
    const pool = deck.items.filter((q) => q !== current);
    current = randomItem(pool.length ? pool : deck.items);
    return current;
  };

  root.innerHTML = `
    ${navHTML("questions")}
    <main class="page page-narrow">
      <header class="section-head" style="text-align:center">
        <h1>Question cards</h1>
        <p class="muted">Pick an occasion. Draw one question. Let it do the work a small talk never will.</p>
      </header>

      <div class="deck-tabs" role="tablist">
        ${decks
          .map(
            (d, i) => `
          <button type="button" class="chip ${i === 0 ? "is-active" : ""}" data-deck="${d.id}">
            ${escapeHtml(d.label)}
          </button>`
          )
          .join("")}
      </div>
      <p class="deck-blurb muted tiny" id="deck-blurb" style="text-align:center;margin:-0.5rem 0 1.25rem">${escapeHtml(decks[0].blurb)}</p>

      <div class="machine question-card-3d">
        <p class="tiny muted">card</p>
        <div class="question" id="q-text">${escapeHtml(current)}</div>
        <div class="machine-actions">
          <button class="btn btn-primary" type="button" data-next>draw another</button>
          <button class="btn btn-ghost" type="button" data-save-q>keep this one</button>
        </div>
        <div class="response-box" style="margin-top:1.25rem;text-align:left">
          <textarea placeholder="answer privately if you want…" maxlength="600"></textarea>
          <button class="btn btn-soft" type="button" data-private>save private note</button>
          <p class="muted tiny" data-private-note hidden>saved on this device only.</p>
        </div>
      </div>
      ${settingsStrip()}
    </main>
  `;
  bindNav(root);
  bindClear(root);

  const qEl = root.querySelector("#q-text");
  const blurb = root.querySelector("#deck-blurb");

  root.querySelectorAll("[data-deck]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deckId = btn.getAttribute("data-deck");
      root.querySelectorAll("[data-deck]").forEach((b) => b.classList.toggle("is-active", b === btn));
      const deck = decks.find((d) => d.id === deckId);
      blurb.textContent = deck.blurb;
      current = "";
      qEl.textContent = draw();
    });
  });

  root.querySelector("[data-next]").addEventListener("click", () => {
    qEl.style.opacity = "0";
    setTimeout(() => {
      qEl.textContent = draw();
      qEl.style.opacity = "1";
    }, 180);
  });
  qEl.style.transition = "opacity 0.18s ease";

  root.querySelector("[data-save-q]").addEventListener("click", () => {
    store.addThought("prompts", current);
    showToast("card kept.");
  });

  root.querySelector("[data-private]").addEventListener("click", () => {
    const ta = root.querySelector("textarea");
    if (!ta.value.trim()) return showToast("write a little first?");
    store.addThought("private-answers", `${current} → ${ta.value.trim()}`);
    ta.value = "";
    root.querySelector("[data-private-note]").hidden = false;
    showToast("private note saved locally.");
  });
}

export function renderAbout(root) {
  root.innerHTML = `
    ${navHTML("about")}
    <main class="page page-narrow">
      <header class="section-head">
        <h1>If You Ever Wanna Get to Know Me</h1>
      </header>
      <div class="about-block">
        <p>I take my connections slow-burn.</p>
        <p>When I first meet someone, I’m much more interested in how you think than how much I know about you.</p>
        <p>Tell me what makes you change your mind. What kind of people you admire. What makes you lose respect for someone? Give me your weirdly specific opinions and the tiny experiences that shaped the way you see the world.</p>
        <p>I think there’s a difference between knowing a lot about someone and actually knowing someone.</p>
        <p>Some of the people I love most today weren’t people I immediately clicked with. Some I genuinely despised after our first and second meetings, only for something they did on the third to unexpectedly touch my heart and completely change the way I saw them.</p>
        <p class="annotation">Have you ever changed your mind about someone?</p>
        <p>So I don’t need us to instantly become close.</p>
        <p>I’d rather discover you slowly,</p>
        <p><strong>and leave room for you to discover yourself too.</strong></p>
        <p>Maybe we’ll have one really good conversation and go on with our lives.</p>
        <p>Maybe something here will stay with you for longer than either of us expects.</p>
      </div>
      <div class="closing-line">
        <h2>A life can already feel full.</h2>
        <p>And still have room for something unexpected. ♡</p>
      </div>
      <div class="reader-pause">
        <h3>What is something about you that people only understand after knowing you for a while?</h3>
        <div class="response-box">
          <textarea placeholder="optional. private unless you keep it here." maxlength="600"></textarea>
          <button class="btn btn-soft" type="button" data-about-save>keep this thought</button>
        </div>
      </div>
      <div class="home-cta-row" style="justify-content:flex-start;margin-top:1.5rem">
        <a class="btn btn-ghost" href="#/story/already-full" data-link>read the first story</a>
        <button class="btn btn-primary" type="button" data-surprise>surprise me</button>
      </div>
      ${settingsStrip()}
    </main>
  `;
  bindNav(root);
  bindClear(root);
  mountHearts(root.querySelector("main"), "about");
  root.querySelector("[data-about-save]").addEventListener("click", () => {
    const ta = root.querySelector("textarea");
    if (!ta.value.trim()) return showToast("even a fragment is enough.");
    store.addThought("about", ta.value.trim());
    ta.value = "";
    showToast("kept on this device.");
  });
}

export function renderSecret(root) {
  if (!store.secretUnlocked()) {
    root.innerHTML = `
      ${navHTML("home")}
      <main class="page page-narrow empty-state">
        <h1>not yet.</h1>
        <p class="muted">The quiet corner opens after ${HEART_UNLOCK} tiny discoveries. You’ve found ${store.heartCount()}.</p>
        <a class="btn btn-soft" href="#/home" data-link>keep exploring</a>
      </main>
    `;
    bindNav(root);
    return;
  }

  root.innerHTML = `
    ${navHTML("home")}
    <main class="page page-narrow">
      <header class="secret-hero">
        <p class="muted">small discovery unlocked</p>
        <h1>you found the quiet corner. ♡</h1>
        <p>You clicked on the things most people might have missed.</p>
        <p class="muted">Maybe you’re observant. Maybe you’re curious. Maybe you just like clicking things.</p>
        <p>Either way, you’re welcome here.</p>
      </header>
      ${secretThoughts
        .map(
          (block) => `
        <section style="margin-bottom:2rem">
          <h2 class="serif" style="color:var(--berry);font-size:1.8rem">${escapeHtml(block.title)}</h2>
          <div class="story-list" style="margin-top:1rem">
            ${block.items
              .map(
                (item) => `
              <div class="story-preview" style="cursor:default">
                <p class="question-line" style="margin:0">${escapeHtml(item)}</p>
              </div>`
              )
              .join("")}
          </div>
        </section>`
        )
        .join("")}
      <div class="reader-pause">
        <h3>what are you noticing in yourself today?</h3>
        <div class="response-box">
          <textarea maxlength="600" placeholder="no audience. just a quiet place to put it."></textarea>
          <button class="btn btn-soft" type="button" data-secret-save>leave it here</button>
        </div>
      </div>
    </main>
  `;
  bindNav(root);
  root.querySelector("[data-secret-save]").addEventListener("click", () => {
    const ta = root.querySelector("textarea");
    if (!ta.value.trim()) return;
    store.addThought("secret", ta.value.trim());
    ta.value = "";
    showToast("held in the quiet corner.");
  });
}

export function renderQuiz(root) {
  const answers = [];
  root.innerHTML = `
    ${navHTML("explore")}
    <main class="page page-narrow">
      <header class="section-head">
        <p class="muted">okay. you’ve been here a while.</p>
        <h1>what stayed with you?</h1>
        <p class="muted">not a test of memory — more like a soft mirror.</p>
      </header>
      <div id="quiz-area">
        ${quiz
          .map(
            (item, qi) => `
          <div class="quiz-card" data-qi="${qi}">
            <h3>${escapeHtml(item.q)}</h3>
            <div class="quiz-options">
              ${item.options
                .map(
                  (opt, oi) =>
                    `<button type="button" data-qi="${qi}" data-oi="${oi}">${escapeHtml(opt)}</button>`
                )
                .join("")}
            </div>
          </div>`
          )
          .join("")}
        <button class="btn btn-primary" type="button" data-finish>see a reflection</button>
      </div>
      <div id="quiz-result" hidden></div>
    </main>
  `;
  bindNav(root);

  root.querySelectorAll(".quiz-options button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qi = Number(btn.dataset.qi);
      const card = btn.closest(".quiz-card");
      card.querySelectorAll("button").forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      answers[qi] = Number(btn.dataset.oi);
    });
  });

  root.querySelector("[data-finish]").addEventListener("click", () => {
    if (answers.filter((a) => a != null).length < quiz.length) {
      showToast("answer what you want — or finish the ones that tug at you.");
    }
    store.setQuizDone(answers);
    const result = root.querySelector("#quiz-result");
    root.querySelector("#quiz-area").hidden = true;
    result.hidden = false;
    result.innerHTML = `
      <div class="closing-line">
        <h2>your answers suggest you’re curious about complexity.</h2>
        <p>Or maybe you just clicked the options that sounded nicest. Either way, there’s another story waiting.</p>
      </div>
      <div class="path-grid">
        <a href="#/story/already-full" data-link>→ something about open doors</a>
        <a href="#/questions" data-link>→ a question instead</a>
        <button type="button" data-surprise>→ let fate decide 🎲</button>
      </div>
    `;
  });
}

export function renderNotFound(root) {
  root.innerHTML = `
    ${navHTML()}
    <main class="page page-narrow empty-state">
      <h1>you found absolutely nothing.</h1>
      <p class="muted">Which is impressive considering how much unnecessary stuff exists on the internet.</p>
      <button class="btn btn-primary" type="button" data-surprise>take me somewhere interesting</button>
    </main>
  `;
  bindNav(root);
}

export function runSurprise() {
  const overlay = el(`
    <div class="surprise-overlay" role="status">
      <div>
        <h2>${escapeHtml(randomItem(surpriseLines))}</h2>
        <p class="muted">maybe this one is for you.</p>
      </div>
    </div>
  `);
  document.body.appendChild(overlay);

  const pool = [
    ...stories.map((s) => `#/story/${s.id}`),
    "#/questions",
    "#/about",
    ...(store.secretUnlocked() ? ["#/secret"] : []),
    "#/corner/mirror",
    "#/corner/connection",
  ];

  // occasional easter egg
  if (Math.random() < 0.12) {
    setTimeout(() => {
      overlay.querySelector("h2").textContent = "a tiny easter egg, because you asked for fate.";
      overlay.querySelector("p").textContent =
        "You don’t have to collect everything. Curiosity without pressure still counts.";
      setTimeout(() => {
        overlay.remove();
        location.hash = "#/questions";
      }, 1400);
    }, 900);
    return;
  }

  const dest = randomItem(pool);
  setTimeout(() => {
    overlay.querySelector("h2").textContent = "Maybe this one is for you.";
    setTimeout(() => {
      overlay.remove();
      location.hash = dest;
    }, 700);
  }, 1100);
}

