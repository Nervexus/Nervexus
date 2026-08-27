/* Offline cache + push delivery for Nervexus. Network-first so a reload always gets
   the latest build when online; falls back to the cached shell only when offline.
   Also the out-of-app half of the Notification & Reminder System: receives Web Push
   and shows it even with the app fully closed, and relays notification/action-button
   clicks back into the app (or relaunches it with a deep link if nothing's open).
   Bump CACHE on every shell change so activate() purges the old cache and clients
   pick up fresh assets. */
const CACHE = 'cc-v59';
const SHELL = [
  './', './AI Command Center.dc.html', './manifest.json', './favicon.png',
  './support.js', './countries-data.js', './notif-engine.js', './notification-engine.js', './voice-engine.js',
  './providers-data.js', './health-tracker.js', './learning-maths.js', './learning-english.js',
  './learning-science.js', './learning-grammar.js', './learning-history.js', './learning-speaking.js',
  './learning-physiology.js', './learning-money.js', './learning-gentleman.js', './gentleman-blackbook.js', './orb-engine.js', './voice-assistant-engine.js',
  './anatomy-3d.js', './constellation-engine.js', './void-orb-engine.js', './ai-gateway.js',
  // Vendored third-party runtime. React especially: it is the difference between the app
  // rendering and a blank page, so it must be in the precached shell, not fetched remotely.
  './vendor/react.production.min.js', './vendor/react-dom.production.min.js', './vendor/supabase.min.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// ---- Push receipt (out-of-app delivery) -------------------------------------
// Payload shape comes from the ai-provider-proxy/reminder-tick `sendPush` helper —
// {title, body, category, priority, tag, data, actions}. `tag` groups/replaces
// related notifications (the Reminder Engine's own anti-spam continued at the OS
// level — a fresh reminder for the same checklist replaces the stale one instead
// of stacking). `data.checklistId` is what makes "Open Checklist" deep-link correctly.
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: 'Nervexus', body: e.data ? e.data.text() : '' }; }
  const title = data.title || 'Nervexus';
  const priority = data.priority || 'normal';
  const options = {
    body: data.body || '',
    tag: data.tag || 'nervexus-push',
    data: data.data || { url: data.url || './' },
    icon: './favicon.png',
    badge: './favicon.png',
    requireInteraction: priority === 'critical',
    silent: priority === 'silent',
    actions: (data.actions || []).slice(0, 3).map((a) => ({ action: a.action, title: a.title })), // most platforms cap at ~3 buttons
  };
  e.waitUntil(
    self.registration.showNotification(title, options).then(() =>
      self.registration.getNotifications().then((list) => {
        try { if ('setAppBadge' in self.navigator) self.navigator.setAppBadge(list.length).catch(() => {}); } catch (err) { /* not all browsers expose Badging API in SW scope */ }
      })
    )
  );
});

// ---- Notification interaction -------------------------------------------------
// A body tap (no e.action) means "open"; an action-button tap carries its name
// directly. Either way this is a Notification Manager action — relay it to an
// already-open tab via postMessage, or launch one with the action encoded in the
// URL so index.html's _consumeNotifDeepLink() can pick it up on cold boot.
self.addEventListener('notificationclick', (e) => {
  const notif = e.notification;
  const action = e.action || 'open';
  const data = notif.data || {};
  notif.close();

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const relay = { type: 'notif-action', action, checklistId: data.checklistId, notifId: data.notifId, kind: data.kind };
      const existing = list.find((c) => 'focus' in c);
      if (existing) {
        existing.postMessage(relay);
        return existing.focus();
      }
      const qs = data.checklistId
        ? ('?openChecklist=' + encodeURIComponent(data.checklistId) + '&action=' + encodeURIComponent(action) + (data.notifId ? ('&notifId=' + encodeURIComponent(data.notifId)) : ''))
        : '';
      return self.clients.openWindow('./' + qs);
    }).then(() =>
      self.registration.getNotifications().then((list) => {
        try { if ('setAppBadge' in self.navigator) { if (list.length) self.navigator.setAppBadge(list.length).catch(() => {}); else self.navigator.clearAppBadge && self.navigator.clearAppBadge().catch(() => {}); } } catch (err) { /* best effort */ }
      })
    )
  );
});

self.addEventListener('notificationclose', () => {
  self.registration.getNotifications().then((list) => {
    try { if ('setAppBadge' in self.navigator) { if (list.length) self.navigator.setAppBadge(list.length).catch(() => {}); else self.navigator.clearAppBadge && self.navigator.clearAppBadge().catch(() => {}); } } catch (err) { /* best effort */ }
  });
});
