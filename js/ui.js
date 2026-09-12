import { heartMessages, randomItem } from "./data.js";
import { store } from "./store.js";

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function showToast(message, ms = 2200) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.hidden = false;
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, ms);
}

export function burstParticles(originEl, count = 14) {
  const layer = el(`<div class="particle-burst"></div>`);
  const host = originEl.closest(".invite-screen") || document.body;
  host.appendChild(layer);
  const rect = originEl.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - hostRect.left;
  const cy = rect.top + rect.height / 2 - hostRect.top;
  for (let i = 0; i < count; i++) {
    const p = el(`<span class="particle"></span>`);
    const angle = (Math.PI * 2 * i) / count;
    const dist = 40 + Math.random() * 90;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    p.style.background = i % 2 ? "#e986ae" : "#f3b6cf";
    layer.appendChild(p);
  }
  setTimeout(() => layer.remove(), 1000);
}

export function navHTML(active = "") {
  const count = String(store.heartCount()).padStart(2, "0");
  const secret = store.secretUnlocked();
  return `
    <nav class="site-nav" id="site-nav">
      <a class="nav-brand" href="#/home" data-link>♡ alaia fun</a>
      <div class="nav-links">
        <a href="#/home" data-link class="${active === "home" ? "is-active" : ""}">home</a>
        <a href="#/stories" data-link class="${active === "stories" ? "is-active" : ""}">stories</a>
        <button type="button" data-surprise>surprise me</button>
        <a href="#/questions" data-link class="${active === "questions" ? "is-active" : ""}">questions</a>
        <a href="#/about" data-link class="${active === "about" ? "is-active" : ""}">about</a>
      </div>
      <div class="nav-meta">
        <a class="heart-counter" href="${secret ? "#/secret" : "#/home"}" data-link title="small discoveries">
          ♡ <strong id="heart-count">${count}</strong>
        </a>
      </div>
    </nav>
    <nav class="mobile-nav" aria-label="Mobile">
      <a href="#/home" data-link class="${active === "home" ? "is-active" : ""}"><span class="nav-ico">♡</span>home</a>
      <a href="#/stories" data-link class="${active === "stories" ? "is-active" : ""}"><span class="nav-ico">✎</span>stories</a>
      <button type="button" data-surprise class="${active === "surprise" ? "is-active" : ""}"><span class="nav-ico">🎲</span>surprise</button>
      <a href="#/questions" data-link class="${active === "questions" ? "is-active" : ""}"><span class="nav-ico">?</span>ask</a>
      <a href="#/about" data-link class="${active === "about" ? "is-active" : ""}"><span class="nav-ico">◌</span>about</a>
    </nav>
  `;
}

export function bindNav(root) {
  const nav = $("#site-nav", root) || root;
  const onScroll = () => {
    const siteNav = $("#site-nav");
    if (!siteNav) return;
    siteNav.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

export function mountHearts(container, prefix = "page") {
  const spots = [
    { top: "18%", left: "8%" },
    { top: "42%", left: "92%" },
    { top: "68%", left: "6%" },
    { top: "28%", left: "78%" },
    { top: "82%", left: "88%" },
  ];
  spots.forEach((pos, i) => {
    const id = `${prefix}-heart-${i}`;
    if (store.hasHeart(id)) return;
    const btn = el(`<button class="click-heart" type="button" aria-label="tiny heart discovery">♡</button>`);
    btn.style.top = pos.top;
    btn.style.left = pos.left;
    btn.dataset.heartId = id;
    btn.addEventListener("click", () => popHeart(btn, id));
    container.appendChild(btn);
  });
}

export function popHeart(btn, id) {
  const result = store.findHeart(id);
  btn.classList.add("is-popped");
  burstParticles(btn, 10);
  if (result.newlyFound) {
    showToast(randomItem(heartMessages));
    const counter = document.getElementById("heart-count");
    if (counter) counter.textContent = String(result.count).padStart(2, "0");
    if (result.unlocked) {
      setTimeout(() => {
        showToast("small discovery unlocked — quiet corner waiting ♡", 3200);
      }, 900);
    }
  }
  setTimeout(() => btn.remove(), 500);
}

export function setupHeartTrail() {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let last = 0;
  document.addEventListener(
    "mousemove",
    (e) => {
      const now = Date.now();
      if (now - last < 90) return;
      last = now;
      if (Math.random() > 0.28) return;
      const trail = document.getElementById("heart-trail");
      const h = el(`<span class="trail-heart">♡</span>`);
      h.style.left = `${e.clientX}px`;
      h.style.top = `${e.clientY}px`;
      trail.appendChild(h);
      setTimeout(() => h.remove(), 800);
    },
    { passive: true }
  );
}

export function settingsStrip() {
  return `
    <div class="settings-strip">
      <span>your reading stays on this device. private by default.</span>
      <button type="button" class="btn btn-ghost tiny" data-clear>clear local data</button>
    </div>
  `;
}

export function bindClear(root) {
  root.querySelector("[data-clear]")?.addEventListener("click", () => {
    if (confirm("Clear local discoveries, saves, and thoughts on this device?")) {
      store.clearAll();
      location.hash = "#/";
      location.reload();
    }
  });
}
