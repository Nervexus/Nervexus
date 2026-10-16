// Minimal external store so React overlays can read scroll-derived state
// without re-running the whole scroll handler through React's render loop.

const listeners = new Set();

// `state` is a live mutable reference kept for callers that want to peek at
// the current values synchronously (e.g. click handlers reading cartCount).
// React subscribes through getSnapshot(), which must return a *new* object
// reference whenever something changes — useSyncExternalStore bails out on
// Object.is equality, so mutating one object in place would never re-render.
export const state = {
  footerT: 0,       // 0..1 how far the footer has risen into view
  heroPast: false,   // scrolled far enough past the hero to show the buy bar
  chatOpen: false,
  faqOpen: -1,
  navSolid: false,
};

let snapshot = { ...state };

export function setState(patch) {
  Object.assign(state, patch);
  snapshot = { ...state };
  listeners.forEach((fn) => fn(snapshot));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSnapshot() {
  return snapshot;
}
