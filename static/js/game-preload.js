/**
 * Prefetch heavy game bundles and report % so CTAs can set expectations
 * instead of dumping players onto a blank loading screen.
 */

const cache = new Map(); // key -> { status, progress, promise, error }

function emit(entry) {
  entry.listeners.forEach((fn) => {
    try {
      fn({ status: entry.status, progress: entry.progress, error: entry.error });
    } catch {
      /* ignore listener errors */
    }
  });
}

async function fetchWithProgress(url, onChunk) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total) {
    await res.blob();
    onChunk(1, 1);
    return;
  }
  const reader = res.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    onChunk(received, total);
  }
}

async function resolveOjolUrls() {
  const base = "/static/ojol-rush/";
  const htmlUrl = `${base}index.html`;
  const html = await fetch(htmlUrl, { credentials: "same-origin" }).then((r) => {
    if (!r.ok) throw new Error("Could not read Ojol Rush index");
    return r.text();
  });
  const abs = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("/")) return path;
    return `${base}${path.replace(/^\.\//, "")}`;
  };
  const js = [...html.matchAll(/src=["']([^"']+\.js)["']/g)].map((m) => abs(m[1])).filter(Boolean);
  const css = [...html.matchAll(/href=["']([^"']+\.css)["']/g)].map((m) => abs(m[1])).filter(Boolean);
  return [...new Set([htmlUrl, ...css, ...js, "/static/img/ojol-rush-card-hero.png"])];
}

async function runPreload(key, resolveUrls) {
  const entry = cache.get(key);
  entry.status = "loading";
  entry.progress = 0;
  emit(entry);
  try {
    const urls = await resolveUrls();
    // equal weight if sizes unknown; stream updates within each file
    const n = Math.max(1, urls.length);
    let fileIndex = 0;
    for (const url of urls) {
      await fetchWithProgress(url, (received, total) => {
        const fileFrac = total > 0 ? received / total : 1;
        const overall = ((fileIndex + fileFrac) / n) * 100;
        entry.progress = Math.min(99, Math.round(overall));
        emit(entry);
      });
      fileIndex += 1;
      entry.progress = Math.min(99, Math.round((fileIndex / n) * 100));
      emit(entry);
    }
    entry.progress = 100;
    entry.status = "ready";
    entry.error = null;
    emit(entry);
  } catch (err) {
    entry.status = "error";
    entry.error = err?.message || "Load failed";
    entry.progress = 0;
    emit(entry);
    throw err;
  }
}

/**
 * @param {string} key
 * @param {() => Promise<string[]>} resolveUrls
 * @param {(state: {status: string, progress: number, error?: string|null}) => void} [onUpdate]
 */
export function ensureGamePreload(key, resolveUrls, onUpdate) {
  let entry = cache.get(key);
  if (!entry) {
    entry = {
      status: "idle",
      progress: 0,
      error: null,
      promise: null,
      listeners: new Set(),
    };
    cache.set(key, entry);
  }
  if (onUpdate) {
    entry.listeners.add(onUpdate);
    onUpdate({ status: entry.status, progress: entry.progress, error: entry.error });
  }
  if (entry.status === "ready") return entry.promise || Promise.resolve();
  if (entry.promise) return entry.promise;
  entry.promise = runPreload(key, resolveUrls).catch((err) => {
    entry.promise = null;
    throw err;
  });
  return entry.promise;
}

export function ensureOjolPreload(onUpdate) {
  return ensureGamePreload("ojol-rush", resolveOjolUrls, onUpdate);
}

export function getGamePreloadState(key) {
  const entry = cache.get(key);
  if (!entry) return { status: "idle", progress: 0, error: null };
  return { status: entry.status, progress: entry.progress, error: entry.error };
}

/**
 * Wire a CTA that shows Loading N% until assets are ready, then navigates.
 * @param {HTMLElement|null} btn
 * @param {{ key: string, ensure: Function, href: string, readyLabel: string, loadingLabel?: (p:number)=>string }} opts
 */
export function wireGameLoadButton(btn, opts) {
  if (!btn) return;
  const {
    key,
    ensure,
    href,
    readyLabel,
    loadingLabel = (p) => `Loading ${p}%`,
    errorLabel = "Retry load",
  } = opts;

  const fill = btn.querySelector("[data-load-fill]");
  const label = btn.querySelector("[data-load-label]");

  const paint = ({ status, progress, error }) => {
    btn.classList.add("btn-game-load");
    btn.classList.toggle("is-loading", status === "loading" || status === "idle");
    btn.classList.toggle("is-ready", status === "ready");
    btn.classList.toggle("is-error", status === "error");
    if (fill) fill.style.width = `${status === "ready" ? 100 : progress}%`;
    if (label) {
      if (status === "ready") label.textContent = readyLabel;
      else if (status === "error") label.textContent = errorLabel;
      else label.textContent = loadingLabel(progress);
    }
    if (btn.tagName === "A") {
      if (status === "ready") btn.setAttribute("href", href);
      else btn.removeAttribute("href");
    }
    btn.setAttribute("aria-busy", status === "loading" || status === "idle" ? "true" : "false");
    btn.setAttribute("aria-disabled", status === "ready" ? "false" : "true");
  };

  paint(getGamePreloadState(key));

  const start = () => {
    ensure((state) => paint(state)).catch(() => {
      /* painted via ensure listener */
    });
  };
  start();

  btn.addEventListener("click", (e) => {
    const state = getGamePreloadState(key);
    if (state.status === "ready") {
      if (btn.tagName !== "A") {
        e.preventDefault();
        location.assign(href);
      }
      return;
    }
    e.preventDefault();
    if (state.status === "error") start();
  });
}
