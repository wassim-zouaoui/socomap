// SocoMap — service worker : cache de l'interface pour démarrage rapide / hors-ligne
const CACHE = "socomap-v4";
const CORE = ["./", "./index.html", "./manifest.json", "./icon.svg", "./projets.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Itinéraires : toujours en ligne (données fraîches)
  if (url.hostname.includes("osrm") || url.hostname.includes("open-meteo")) return;
  // Liste des projets : réseau d'abord (toujours la dernière version publiée), cache si hors-ligne
  if (url.pathname.endsWith("projets.json")) {
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put("./projets.json", copy)); return res;
    }).catch(() => caches.match("./projets.json")));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (e.request.method === "GET" && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
