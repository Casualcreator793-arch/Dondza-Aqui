/* Dondza Aqui — service worker (cache-first, 100% offline).
   Para publicar uma atualização: aumente o número em VERSAO_CACHE. */
const VERSAO_CACHE = "dondza-v9";
const FICHEIROS = [
  "./", "index.html", "manifest.webmanifest",
  "css/style.css",
  "js/app.js", "js/storage.js", "js/unlock.js", "js/lessons.js", "js/exams.js", "js/settings.js",
  "data/lessons.json", "data/exams/index.json", "data/exams/portugues-ii-2026.json", "data/exams/portugues-ujc-2021.json", "data/exams/portugues-i-uem-2026.json",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png"
];
// Para novos exames: acrescente aqui o ficheiro (ex.: "data/exams/portugues-ii-2027.json").

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO_CACHE).then(c => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
      if (res && res.ok && new URL(e.request.url).origin === location.origin) {
        const copia = res.clone();
        caches.open(VERSAO_CACHE).then(c => c.put(e.request, copia));
      }
      return res;
    }).catch(() => e.request.mode === "navigate" ? caches.match("index.html") : undefined))
  );
});
