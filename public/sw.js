/* Shouks service worker — minimal, built for the MVP.
   Strategies:
     • cache-first for /icons/*
     • network-first with offline fallback for navigation
     • push + notificationclick handlers
*/

const SW_VERSION = "shouks-v1";
const ICON_CACHE = `${SW_VERSION}-icons`;
const SHELL_CACHE = `${SW_VERSION}-shell`;
const OFFLINE_URL = "/offline";

const ICON_PRECACHE = [
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(ICON_CACHE);
      // Best-effort pre-cache — don't fail install if some assets are missing.
      await Promise.allSettled(
        ICON_PRECACHE.map((url) =>
          fetch(url, { cache: "no-cache" })
            .then((res) => (res && res.ok ? cache.put(url, res.clone()) : null))
            .catch(() => null),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(SW_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Cache-first for /icons/*
  if (sameOrigin && url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req, ICON_CACHE));
    return;
  }

  // Network-first for navigations, with offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(networkFirstNavigation(req));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirstNavigation(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response(
      "<!doctype html><title>Offline</title><h1>You're offline</h1>",
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
    );
  }
}

// Push notifications -----------------------------------------------------

self.addEventListener("push", (event) => {
  let payload = { title: "Shouks", body: "You have a new notification.", url: "/" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_) {
      try {
        payload.body = event.data.text();
      } catch (_) {
        /* ignore */
      }
    }
  }

  const { title, body, url } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      data: { url: url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          const target = new URL(targetUrl, self.location.origin);
          if (clientUrl.origin === target.origin && "focus" in client) {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(target.toString()).catch(() => {});
            }
            return;
          }
        } catch (_) {
          /* ignore */
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
