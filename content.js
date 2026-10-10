(() => {
  "use strict";

  const SHORTS_PATH = /^\/shorts(\/|$)/;
  const BLOCKED_PAGE = browser.runtime.getURL("blocked.html");

  // ---- 1. Blocage des pages /shorts/… (chargement initial + navigation SPA) ----
  function redirectIfShorts() {
    if (SHORTS_PATH.test(location.pathname)) {
      location.replace(BLOCKED_PAGE);
      return true;
    }
    return false;
  }
  if (redirectIfShorts()) return;

  // YouTube est une SPA : surveiller les navigations internes.
  document.addEventListener("yt-navigate-start", redirectIfShorts, true);
  document.addEventListener("yt-navigate-finish", redirectIfShorts, true);
  window.addEventListener("popstate", redirectIfShorts, true);

  // Intercepter les clics sur des liens Shorts (descriptions, commentaires, etc.).
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("a[href]");
      if (!a) return;
      let url;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (!/(^|\.)youtube\.com$/.test(url.hostname)) return;
      if (!SHORTS_PATH.test(url.pathname)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      location.assign(BLOCKED_PAGE);
    },
    true
  );

  // ---- 2. Masquage DOM complémentaire (ce que le CSS pur ne peut pas attraper) ----
  const ITEM_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-video-renderer",
    "ytd-notification-renderer",
    "yt-lockup-view-model",
    "ytm-rich-item-renderer",
    "ytm-video-with-context-renderer",
    "ytm-compact-video-renderer",
  ].join(",");

  const SECTION_SELECTOR = [
    "ytd-rich-section-renderer",
    "ytd-item-section-renderer",
    "ytd-shelf-renderer",
    "grid-shelf-view-model",
    "ytm-rich-section-renderer",
    "ytm-item-section-renderer",
  ].join(",");

  function isShortsItem(el) {
    if (el.querySelector('a[href^="/shorts/"]')) return true;
    if (el.querySelector("ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytd-reel-item-renderer")) return true;
    if (el.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]')) return true;
    return false;
  }

  function isShortsSection(el) {
    // Une section dont le titre est "Shorts" ou qui ne contient que des Shorts.
    const title = el.querySelector("#title, h2, .title");
    if (title && /^\s*shorts\s*$/i.test(title.textContent || "")) return true;
    const items = el.querySelectorAll(ITEM_SELECTOR);
    if (items.length === 0) return false;
    for (const it of items) if (!isShortsItem(it)) return false;
    return true;
  }

  function sweep(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(ITEM_SELECTOR).forEach((el) => {
      if (!el.hasAttribute("data-no-shorts-hidden") && isShortsItem(el)) {
        el.setAttribute("data-no-shorts-hidden", "");
      }
    });
    scope.querySelectorAll(SECTION_SELECTOR).forEach((el) => {
      if (!el.hasAttribute("data-no-shorts-hidden") && isShortsSection(el)) {
        el.setAttribute("data-no-shorts-hidden", "");
      }
    });
  }

  let scheduled = false;
  function scheduleSweep() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sweep(document);
    });
  }

  function start() {
    sweep(document);
    const observer = new MutationObserver(scheduleSweep);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("yt-navigate-finish", scheduleSweep, true);
    document.addEventListener("yt-page-data-updated", scheduleSweep, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
