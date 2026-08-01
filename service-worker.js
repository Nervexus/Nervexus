/* Offline cache for AI Command Center. Network-first so a reload always gets
   the latest build when online; falls back to the cached shell only when
   offline. Also relays notification clicks. Bump CACHE on every shell change
   so activate() purges the old cache and clients pick up fresh assets. */
const CACHE = 'cc-v2';
const SHELL = [
  './', './AI Command Center.dc.html', './manifest.json', './favicon.svg',
  './support.js', './countries-data.js', './notif-engine.js', './voice-engine.js',
  './providers-data.js', './health-tracker.js', './learning-maths.js', './learning-english.js',
  './learning-science.js', './learning-grammar.js', './learning-history.js', './learning-speaking.js',
  './learning-physiology.js', './learning-money.js', './orb-engine.js'
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

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
    if (list.length) return list[0].focus();
    return self.clients.openWindow('./AI Command Center.dc.html');
  }));
});
