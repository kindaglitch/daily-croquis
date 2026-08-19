const CACHE = "daily-croquis-v5.1.0";
const CORE = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./core.js",
  "./poses.js",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/poses/contrapposto.webp",
  "./assets/poses/long-stride.webp",
  "./assets/poses/overhead-reach.webp",
  "./assets/poses/side-stretch.webp",
  "./assets/poses/deep-lunge.webp",
  "./assets/poses/one-leg-balance.webp",
  "./assets/poses/look-back.webp",
  "./assets/poses/sprint-start.webp",
  "./assets/poses/seated-knee.webp",
  "./assets/poses/crouch-turn.webp",
  "./assets/poses/kneeling-reach.webp",
  "./assets/poses/crawl.webp",
  "./assets/poses/low-side-lunge.webp",
  "./assets/poses/recline.webp",
  "./assets/poses/long-leap.webp",
  "./assets/poses/back-view.webp",
  "./assets/poses/profile-stand.webp",
  "./assets/poses/chest-open.webp",
  "./assets/poses/forward-fold.webp",
  "./assets/poses/punch-forward.webp",
  "./assets/poses/side-kick.webp",
  "./assets/poses/throw-windup.webp",
  "./assets/poses/soft-landing.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
        return response;
      });
      return cached || network.catch(() => caches.match("./index.html"));
    })
  );
});
