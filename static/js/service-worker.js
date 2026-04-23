const STATIC_CACHE = "cyberwatch-static-v5";
const PAGE_CACHE = "cyberwatch-pages-v5";

const APP_SHELL = [
    "/",
    "/static/css/styles.css",
    "/static/js/script.js",
    "/static/manifest.json",
    "/static/icons/icon-192x192.png",
    "/static/icons/icon-512x512.png",
    "/static/sounds/cinematic-hit.mp3",
    "/static/sounds/damage-ring.mp3"
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline | Cyberwatch</title>
  <style>
    :root {
      color-scheme: light;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      margin: 0;
      min-height: 100vh;
      background: #ffffff;
      color: #222;
      padding: 24px;
    }
    main {
      max-width: 36rem;
      margin: 0 auto;
    }
    h1 { margin: 0 0 12px; font-size: 2rem; }
    p { margin: 0 0 12px; line-height: 1.5; }
    a {
      display: inline-block;
      margin-top: 8px;
      background: #0d6efd;
      color: #fff;
      text-decoration: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main>
    <h1>You’re offline</h1>
    <p>If Cyberwatch has already been installed and opened before, the installed app can still show pages that were cached earlier.</p>
    <p>To load new pages or fresh data again, reconnect and restart the local Flask server.</p>
    <a href="/">Return Home</a>
  </main>
</body>
</html>`;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((cacheName) => ![STATIC_CACHE, PAGE_CACHE].includes(cacheName))
                    .map((cacheName) => caches.delete(cacheName))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (event.request.mode === "navigate") {
        event.respondWith(handleNavigationRequest(event.request));
        return;
    }

    if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith("/static/")) {
        event.respondWith(handleStaticRequest(event.request));
    }
});

async function handleNavigationRequest(request) {
    const cache = await caches.open(PAGE_CACHE);

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const shellResponse = await caches.match("/");
        if (request.url === self.location.origin + "/" && shellResponse) {
            return shellResponse;
        }

        return new Response(OFFLINE_HTML, {
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            }
        });
    }
}

async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}
