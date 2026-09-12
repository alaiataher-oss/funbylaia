import { store } from "./store.js";
import { setupHeartTrail, showToast } from "./ui.js";
import {
  renderInvitation,
  renderMindset,
  renderHome,
  renderCorner,
  renderStories,
  renderExplore,
  renderStory,
  renderQuestions,
  renderAbout,
  renderSecret,
  renderQuiz,
  renderNotFound,
  runSurprise,
} from "./pages.js";

const app = document.getElementById("app");

setupHeartTrail();

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "") || "";
  const [pathPart, query = ""] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { parts, params };
}

function wireGlobal(root) {
  root.querySelectorAll("[data-surprise]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      runSurprise();
    });
  });
}

function showMain() {
  const { parts, params } = parseHash();
  const route = parts[0] || "";

  // Gate: short invite → mindset still → rest of site
  if (!store.hasEntered()) {
    if (route === "mindset") {
      renderMindset(app, () => {
        location.hash = "#/home";
      });
    } else {
      renderInvitation(app, () => {
        location.hash = "#/mindset";
      });
    }
    wireGlobal(app);
    window.scrollTo(0, 0);
    return;
  }

  switch (route) {
    case "entrance":
      renderHome(app);
      history.replaceState(null, "", "#/home");
      break;
    case "home":
    case "":
      renderHome(app);
      break;
    case "corner":
      renderCorner(app, parts[1]);
      break;
    case "stories":
      renderStories(app, params.mood || null);
      break;
    case "explore":
      renderExplore(app);
      break;
    case "story":
      renderStory(app, parts[1]);
      break;
    case "questions":
      renderQuestions(app);
      break;
    case "about":
      renderAbout(app);
      break;
    case "secret":
      renderSecret(app);
      break;
    case "quiz":
      renderQuiz(app);
      break;
    case "mindset":
      renderMindset(app, () => {
        location.hash = "#/home";
      });
      break;
    default:
      renderNotFound(app);
  }

  wireGlobal(app);
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", showMain);

if (store.hasEntered()) {
  const sessionKey = "alaiafun_session_bumped";
  if (!sessionStorage.getItem(sessionKey)) {
    store.bumpVisit();
    sessionStorage.setItem(sessionKey, "1");
  }
}

if (!location.hash || location.hash === "#") {
  location.hash = store.hasEntered() ? "#/home" : "#/";
}

showMain();

setTimeout(() => {
  if (!store.hasEntered()) return;
  if (store.heartCount() > 0) return;
  if (Math.random() > 0.4) return;
  showToast("something nearby is clickable.", 2400);
}, 8000);
