// Hybrid v2 — red primero (siempre la versión más nueva), caché si no hay conexión
const V = "hybrid-v2-5";
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(["./", "manifest.json", "icon-192.png", "apple-touch-icon.png"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.hostname.includes("strava.com")) return;
  e.respondWith(fetch(e.request).then(r => { if (r && r.ok && (u.origin === location.origin || u.hostname.includes("fonts."))) { const c = r.clone(); caches.open(V).then(ch => ch.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
