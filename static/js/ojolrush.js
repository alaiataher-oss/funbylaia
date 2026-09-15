/** Ojol Rush: Sudirman — launch page + preload CTA */

import { ensureOjolPreload, wireGameLoadButton } from "./game-preload.js";

const GAME_HREF = "/static/ojol-rush/index.html";

function loadButtonHTML(readyLabel) {
  return `
    <a class="btn btn-ojol-cta btn-game-load is-loading" data-ojol-cta role="button" aria-busy="true" aria-disabled="true">
      <span class="btn-load-fill" data-load-fill style="width:0%"></span>
      <span class="btn-load-label" data-load-label>Loading 0%</span>
    </a>`;
}

export function renderOjolRush(root, deps) {
  const { navHTML, setMeta } = deps;
  setMeta({
    title: "Ojol Rush: Sudirman · fun by ayaya",
    description: "Endless ojol runner through Sudirman traffic.",
  });
  root.innerHTML = `
    ${navHTML("games")}
    <main class="page ojol-launch">
      <div class="ojol-launch-card">
        <div class="ojol-card-hero">
          <img src="/static/img/ojol-rush-card-hero.png" alt="" width="960" height="540" loading="lazy" />
        </div>
        <h1>Ojol Rush: Sudirman</h1>
        <p>3D endless runner through Sudirman traffic. Best on landscape mobile or desktop.</p>
        ${loadButtonHTML("Enter Ride")}
        <p class="ojol-load-hint" data-ojol-hint>Warming up the 3D ride — hang tight.</p>
        <a class="ojol-launch-back" href="#/games/solo">← Back to Solo Games</a>
      </div>
    </main>`;

  const btn = root.querySelector("[data-ojol-cta]");
  const hint = root.querySelector("[data-ojol-hint]");
  wireGameLoadButton(btn, {
    key: "ojol-rush",
    ensure: ensureOjolPreload,
    href: GAME_HREF,
    readyLabel: "Enter Ride ▶",
    loadingLabel: (p) => `Loading ${p}%`,
    errorLabel: "Retry load",
  });
  // keep hint in sync
  ensureOjolPreload(({ status, progress }) => {
    if (!hint) return;
    if (status === "ready") hint.textContent = "Ready — tap Enter Ride.";
    else if (status === "error") hint.textContent = "Couldn’t preload. Tap to retry.";
    else hint.textContent = `Downloading ride assets… ${progress}%`;
  });
}

export function startOjolRush() {
  /* navigation via hash route */
}

export { ensureOjolPreload, wireGameLoadButton, GAME_HREF, loadButtonHTML };
