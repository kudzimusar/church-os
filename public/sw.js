// ChurchGPT Service Worker — v2
// Intentionally minimal: caches only static assets.
// NEVER intercepts Supabase auth, API calls, or cross-origin requests.

const CACHE_NAME = 'churchgpt-v2';
const SUPABASE_HOST = 'supabase.co';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- NEVER intercept ---
  // 1. Supabase (auth, database, storage, realtime)
  if (url.hostname.includes(SUPABASE_HOST)) return;

  // 2. Any API routes (Next.js /api/*)
  if (url.pathname.startsWith('/api/')) return;

  // 3. Auth callback routes
  if (url.pathname.startsWith('/auth/')) return;

  // 4. Non-GET requests (POST, PUT, DELETE — auth signups / logins)
  if (request.method !== 'GET') return;

  // 5. Cross-origin requests (except Google Fonts)
  const isGoogleFonts = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  if (url.origin !== self.location.origin && !isGoogleFonts) return;

  // --- Cache-first for static assets ---
  const isStaticAsset = (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf)$/)
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          }
          return response;
        });
      })
    );
    return;
  }

  // --- Network-only for everything else (HTML pages, dynamic content) ---
  // This ensures the user always gets a fresh login/signup page.
  event.respondWith(fetch(request));
});
