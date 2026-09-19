const CACHE_NAME = "straftatfx-v4-20260919";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/styles.css",
  "./js/main.mjs",
  "./js/floating.mjs",
  "./js/formatter.mjs",
  "./js/gradient.mjs",
  "./js/guide.mjs",
  "./js/logoAudio.mjs",
  "./js/presetOrder.mjs",
  "./js/randomFxFeedback.mjs",
  "./js/render.mjs",
  "./js/saved.mjs",
  "./js/selectionEditor.mjs",
  "./js/selectionModel.mjs",
  "./js/state.mjs",
  "./gradients/anime.json",
  "./gradients/anime_characters.json",
  "./gradients/brands.json",
  "./gradients/movies-tv.json",
  "./gradients/superpowered.json",
  "./gradients/vibes.json",
  "./gradients/video-games.json",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/pngs/logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response.ok || response.type === "opaque") {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return cached || Response.error();
      });

      return cached || fetched;
    })
  );
});
