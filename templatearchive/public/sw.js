// Safety model: this worker never stores private data.
// - It precaches only the offline page and icons (public, static).
// - Navigations go to the network; if offline, the offline page is shown.
// - Authenticated pages, server actions and API responses are never put in a cache.
const CACHE = "shell-v1";
const SHELL = ["/offline", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }
  const url = new URL(req.url);
  if (SHELL.includes(url.pathname)) e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
