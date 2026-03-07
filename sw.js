/* ============================================================
   sw.js  –  Tibbi Xidmətlər PWA Service Worker
   Strategy:
     • Shell assets  → Cache-First  (fast repeat loads)
     • xidmetler.json → Network-First with cache fallback (always fresh data)
     • Everything else → Network-First with cache fallback
   ============================================================ */

const CACHE_VERSION   = 'v1';
const SHELL_CACHE     = `its-shell-${CACHE_VERSION}`;
const DATA_CACHE      = `its-data-${CACHE_VERSION}`;
const ALL_CACHES      = [SHELL_CACHE, DATA_CACHE];

// Assets that form the app shell – cached on install
const SHELL_ASSETS = [
  './index.html',
  './manifest.json',
  // External CDN resources
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())  // activate immediately
  );
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => !ALL_CACHES.includes(k))
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())  // take control of existing tabs
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // ── Data file: Network-First ───────────────────────────────────────────
  if (url.pathname.endsWith('xidmetler.json')) {
    event.respondWith(networkFirstData(request));
    return;
  }

  // ── Shell / static assets: Cache-First ────────────────────────────────
  event.respondWith(cacheFirstShell(request));
});

// ── Cache-First strategy (shell assets) ───────────────────────────────────
async function cacheFirstShell(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a minimal offline page if HTML was requested
    if (request.headers.get('Accept')?.includes('text/html')) {
      return offlinePage();
    }
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// ── Network-First strategy (data) ─────────────────────────────────────────
async function networkFirstData(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', services: [], categories: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── Minimal offline HTML fallback ─────────────────────────────────────────
function offlinePage() {
  const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline | İTS Portalı</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{display:flex;align-items:center;justify-content:center;min-height:100vh;
         background:#09090b;color:#e4e4e7;font-family:system-ui,sans-serif;text-align:center;padding:2rem}
    .card{background:#18181b;border:1px solid #27272a;border-radius:2rem;padding:3rem 2rem;max-width:360px}
    .dot{width:48px;height:48px;border-radius:50%;background:#4f46e5;margin:0 auto 1.5rem;
         display:flex;align-items:center;justify-content:center;font-size:1.5rem}
    h1{font-size:1.25rem;font-weight:800;margin-bottom:.75rem}
    p{color:#71717a;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}
    button{background:#4f46e5;color:#fff;border:none;padding:.75rem 2rem;border-radius:1rem;
           font-weight:700;cursor:pointer;font-size:.875rem}
    button:hover{background:#4338ca}
  </style>
</head>
<body>
  <div class="card">
    <div class="dot">⚕</div>
    <h1>İnternet əlaqəsi yoxdur</h1>
    <p>Səhifəni görmək üçün internet əlaqəsi tələb olunur. Əlaqənizi yoxlayıb yenidən cəhd edin.</p>
    <button onclick="location.reload()">Yenidən cəhd et</button>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}