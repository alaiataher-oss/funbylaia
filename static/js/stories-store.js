/** Stories store — seed + editable overrides (localStorage + optional API) */

import { STORIES as SEED_STORIES } from "./stories-data.js";

const LS_KEY = "funbylaia_stories_overrides_v1";
const LS_DELETED = "funbylaia_stories_deleted_v1";

function slugify(title) {
  return String(title || "story")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `story-${Date.now().toString(36)}`;
}

export function normalizeBlock(block) {
  if (typeof block === "string") return { type: "p", text: block };
  if (!block || typeof block !== "object") return { type: "p", text: "" };
  const type = block.type || "p";
  if (type === "img") {
    return { type: "img", url: String(block.url || "").trim(), alt: String(block.alt || "").trim() };
  }
  if (type === "a" || type === "link") {
    return {
      type: "a",
      href: String(block.href || block.url || "").trim(),
      label: String(block.label || block.text || block.href || "Link").trim(),
    };
  }
  return { type: "p", text: String(block.text || "") };
}

export function normalizeContent(content) {
  if (!Array.isArray(content)) return [];
  return content.map(normalizeBlock);
}

export function estimateReadingTime(content) {
  const blocks = normalizeContent(content);
  const words = blocks.reduce((n, b) => {
    if (b.type === "p") return n + b.text.split(/\s+/).filter(Boolean).length;
    if (b.type === "a") return n + b.label.split(/\s+/).filter(Boolean).length;
    return n + 12; // image glance
  }, 0);
  return Math.max(1, Math.round(words / 220));
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function loadDeleted() {
  try {
    const raw = localStorage.getItem(LS_DELETED);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveOverrides(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

function saveDeleted(ids) {
  localStorage.setItem(LS_DELETED, JSON.stringify(ids));
}

function normalizeStory(s, { fromSeed = false } = {}) {
  if (!s) return null;
  const id = s.id || s.slug || slugify(s.title);
  const slug = s.slug || slugify(s.title);
  const content = normalizeContent(s.content || []);
  return {
    id,
    slug,
    title: s.title || "Untitled",
    subtitle: s.subtitle || "",
    excerpt: s.excerpt || (content.find((b) => b.type === "p")?.text || "").slice(0, 180),
    theme: s.theme || "Things I’m Still Learning",
    readingTime: s.readingTime || estimateReadingTime(content),
    publishedAt: s.publishedAt || new Date().toISOString().slice(0, 10),
    status: s.status || "published",
    featured: !!s.featured,
    content,
    _fromSeed: fromSeed,
    _updatedAt: s._updatedAt || null,
  };
}

/** Merged catalog: seed stories + local overrides − deleted */
export function allStories() {
  const deleted = new Set(loadDeleted());
  const overrides = loadOverrides();
  const byId = new Map();

  for (const s of SEED_STORIES) {
    const n = normalizeStory(s, { fromSeed: true });
    if (!n || deleted.has(n.id)) continue;
    byId.set(n.id, n);
  }
  for (const [id, s] of Object.entries(overrides)) {
    if (deleted.has(id)) continue;
    const n = normalizeStory({ ...s, id });
    if (n) byId.set(id, n);
  }
  return [...byId.values()];
}

export function publishedStoriesLive() {
  return allStories()
    .filter((s) => s.status === "published")
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

export function getStoryLive(slug) {
  return allStories().find((s) => s.slug === slug || s.id === slug) || null;
}

export function storyThemesLive() {
  return [...new Set(publishedStoriesLive().map((s) => s.theme))].sort();
}

export function adjacentStoriesLive(slug) {
  const list = publishedStoriesLive();
  const i = list.findIndex((s) => s.slug === slug || s.id === slug);
  if (i < 0) return { prev: null, next: null };
  return { prev: list[i + 1] || null, next: list[i - 1] || null };
}

export function upsertStory(partial) {
  const overrides = loadOverrides();
  const existing = getStoryLive(partial.id || partial.slug) || normalizeStory(partial);
  const merged = normalizeStory({
    ...existing,
    ...partial,
    content: partial.content != null ? partial.content : existing.content,
    _updatedAt: Date.now(),
  });
  if (!merged.id) merged.id = slugify(merged.title);
  if (!merged.slug) merged.slug = slugify(merged.title);
  // ensure unique slug among others
  const others = allStories().filter((s) => s.id !== merged.id);
  let base = merged.slug;
  let n = 2;
  while (others.some((s) => s.slug === merged.slug)) {
    merged.slug = `${base}-${n}`;
    n += 1;
  }
  merged.readingTime = estimateReadingTime(merged.content);
  overrides[merged.id] = merged;
  // if was deleted, undelete
  const deleted = loadDeleted().filter((id) => id !== merged.id);
  saveDeleted(deleted);
  saveOverrides(overrides);
  return merged;
}

export function deleteStory(id) {
  const overrides = loadOverrides();
  delete overrides[id];
  saveOverrides(overrides);
  const deleted = new Set(loadDeleted());
  deleted.add(id);
  saveDeleted([...deleted]);
}

export function blankStory() {
  const today = new Date().toISOString().slice(0, 10);
  return normalizeStory({
    id: `draft-${Date.now().toString(36)}`,
    slug: "",
    title: "",
    subtitle: "",
    excerpt: "",
    theme: "Things I’m Still Learning",
    publishedAt: today,
    status: "published",
    featured: false,
    content: [{ type: "p", text: "" }],
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Inline markdown links: [label](https://...) */
export function renderInlineText(text) {
  const esc = escapeHtml(text);
  return esc.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

export function renderContentBlocks(content) {
  return normalizeContent(content)
    .map((b) => {
      if (b.type === "img" && b.url) {
        return `<figure class="story-figure"><img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.alt || "")}" loading="lazy" /><figcaption>${escapeHtml(b.alt || "")}</figcaption></figure>`;
      }
      if (b.type === "a" && b.href) {
        return `<p class="story-link-block"><a href="${escapeHtml(b.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(b.label || b.href)}</a></p>`;
      }
      return `<p>${renderInlineText(b.text || "")}</p>`;
    })
    .join("");
}

/** Pull remote overrides if API available (best-effort). */
export async function hydrateFromApi() {
  try {
    const res = await fetch("/api/stories/overrides", { credentials: "same-origin" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || typeof data !== "object") return false;
    const remote = data.overrides || {};
    const remoteDeleted = data.deleted || [];
    const local = loadOverrides();
    // merge by _updatedAt
    for (const [id, story] of Object.entries(remote)) {
      const loc = local[id];
      if (!loc || (story._updatedAt || 0) >= (loc._updatedAt || 0)) local[id] = story;
    }
    saveOverrides(local);
    const deleted = new Set([...loadDeleted(), ...remoteDeleted]);
    saveDeleted([...deleted]);
    return true;
  } catch {
    return false;
  }
}

export async function pushToApi(password) {
  const body = {
    password,
    overrides: loadOverrides(),
    deleted: loadDeleted(),
  };
  const res = await fetch("/api/stories/overrides", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Could not save to server");
  return data;
}
