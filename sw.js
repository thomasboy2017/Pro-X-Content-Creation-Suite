/* Studio Editor PRO X 1.0 - offline shell
   Served next to studio-editor.html. Optional: the editor works without it,
   but install and offline mode need it over HTTP or HTTPS. */

const VERSION = "pro-x-1.0.0-r2";
const CACHE = "studio-pro-x-shell-" + VERSION;
// The editor is a single self-contained HTML file, so the shell only needs
// the entry points, the manifest and the icons.
const SHELL = [
  "./",
  "./index.html",
  "./studio-editor.html",
  "./manifest.webmanifest",
  "./icon-32.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache what exists. The single-file build may not ship the external CSS/JS.
    await Promise.all(SHELL.map((url) =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => null)
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "PX_DIAG") {
    const keys = await caches.keys();
    const detail = [];
    for (const key of keys) {
      const cache = await caches.open(key);
      detail.push([key, (await cache.keys()).length]);
    }
    if (event.source) event.source.postMessage({ type: "PX_DIAG_RESULT", caches: detail, version: VERSION });
    else if (event.ports && event.ports[0]) event.ports[0].postMessage({ type: "PX_DIAG_RESULT", caches: detail, version: VERSION });
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  // Navigations: network first so a new build appears, cache as an offline fallback.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) ||
          (await cache.match("./studio-editor.html")) ||
          (await cache.match("./index.html")) ||
          new Response("Studio Editor PRO X is offline and the shell is not cached yet.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      }
    })());
    return;
  }

  // Same-origin assets: cache first, refresh in the background.
  // Code (CSS/JS/manifest) is network first so a new build is never mixed
  // with an older cached script after an update.
  const isCode = /\.(?:css|js|mjs|webmanifest)$/i.test(url.pathname);
  if (isCode) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok && fresh.type === "basic") cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match(req)) || new Response("", { status: 504 });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || new Response("", { status: 504 });
  })());
});
