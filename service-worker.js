/* =============================================================
   Herbora Sales App — Service Worker v2
   Para GitHub Pages: https://herboradesign.github.io/catalogo/

   CAMBIOS RESPECTO A V1:
   - Versión de caché incrementada para invalidar caché corrupta
   - SHELL_ASSETS corregido: solo archivos que EXISTEN en el repo
   - products.json → Network-first (siempre fresco, fallback caché)
   - catalog-version.json → Network-first (timeout 3s)
   - Lógica de SKIP_WAITING inmediata al recibir mensaje
   - Activate limpia TODAS las cachés anteriores sin excepción

   ESTRATEGIAS:
   · Shell (HTML/CSS/JS)    → Cache-first, red como fallback
   · products.json          → Network-first, caché como fallback
   · catalog-version.json   → Network-first con timeout
   · Imágenes externas      → Cache-first, placeholder como fallback
   ============================================================= */

const SW_VERSION   = '2.0.0';
const CACHE_SHELL  = `herbora-shell-v${SW_VERSION}`;
const CACHE_DATA   = `herbora-data-v${SW_VERSION}`;
const CACHE_IMAGES = `herbora-images-v${SW_VERSION}`;
const MAX_IMG      = 200;

/* ── Archivos del shell — EXACTAMENTE los que están en el repo ── */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  './assets/images/placeholder-product.svg',
  './assets/logo/herbora-logo-blanco.svg',
  './assets/logo/herbora-logo-color.svg',
  './assets/logo/herbora-logo.svg',
  /* JS — app + router */
  './js/app.js',
  './js/router/router.js',
  /* JS — data */
  './js/data/catalog.js',
  './js/data/store.js',
  './js/data/db.js',
  './js/data/productService.js',
  /* JS — views */
  './js/views/entry.js',
  './js/views/auth.js',
  './js/views/dashboard.js',
  './js/views/catalog.js',
  './js/views/product.js',
  './js/views/order.js',
  './js/views/favorites.js',
  './js/views/history.js',
  './js/views/compare.js',
  './js/views/presentation.js',
  './js/views/more.js',
  './js/views/brands.js',
  './js/views/admin.js',
  /* JS — components */
  './js/components/navbar.js',
  './js/components/product-card.js',
  './js/components/product-sheet.js',
  './js/components/order-item.js',
  './js/components/filters.js',
  './js/components/search.js',
  './js/components/badge.js',
  './js/components/empty-state.js',
  './js/components/toast.js',
  './js/components/modal.js',
  /* JS — utils */
  './js/utils/share.js',
  './js/utils/image.js',
  './js/utils/format.js',
  './js/utils/ean-scanner.js',
];

/* ── INSTALL ─────────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache => cache.addAll(SHELL_ASSETS))
      /* Activar inmediatamente sin esperar a que cierren las pestañas */
      .then(() => self.skipWaiting())
      .catch(err => {
        /* Si algún asset falla, el SW sigue instalándose — no bloqueamos */
        console.warn('[SW] install parcial:', err);
        return self.skipWaiting();
      })
  );
});

/* ── ACTIVATE ────────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          /* Eliminar TODAS las cachés que no sean de esta versión */
          .filter(k => k !== CACHE_SHELL && k !== CACHE_DATA && k !== CACHE_IMAGES)
          .map(k => {
            console.log('[SW] eliminando caché antigua:', k);
            return caches.delete(k);
          })
      ))
      /* Tomar control de todas las pestañas abiertas inmediatamente */
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ───────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const req  = event.request;
  const url  = new URL(req.url);
  const path = url.pathname;

  /* Ignorar requests que no sean GET */
  if (req.method !== 'GET') return;

  /* Ignorar chrome-extension y otros esquemas no-http */
  if (!url.protocol.startsWith('http')) return;

  /* ── catalog-version.json: Network-first con timeout 3s ── */
  if (path.endsWith('catalog-version.json')) {
    event.respondWith(_networkFirstTimeout(req, CACHE_DATA, 3000));
    return;
  }

  /* ── products.json: Network-first (queremos siempre el más fresco) ── */
  if (path.endsWith('products.json')) {
    event.respondWith(_networkFirst(req, CACHE_DATA));
    return;
  }

  /* ── fichas_tecnicas_apartados_herbora.json: Network-first ── */
  if (path.includes('fichas_tecnicas')) {
    event.respondWith(_networkFirst(req, CACHE_DATA));
    return;
  }

  /* ── product-bio.json: Cache-first (cambia raramente) ── */
  if (path.endsWith('product-bio.json')) {
    event.respondWith(_cacheFirst(req, CACHE_DATA));
    return;
  }

  /* ── Imágenes de producto externas (herbora.es, CDN) ── */
  if (_isExtProductImage(url)) {
    event.respondWith(_imageWithFallback(req));
    return;
  }

  /* ── Assets del shell: Cache-first ── */
  if (_isShellAsset(url)) {
    event.respondWith(_cacheFirst(req, CACHE_SHELL));
    return;
  }

  /* ── Todo lo demás: Network-first ── */
  event.respondWith(_networkFirst(req, CACHE_SHELL));
});

/* ── MENSAJES DESDE LA APP ───────────────────────────────────── */
self.addEventListener('message', event => {
  const { type } = event.data || {};

  /* Activar nuevo SW inmediatamente (usado por el botón "Actualizar app") */
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  /* Forzar recarga de products.json en la caché */
  if (type === 'CACHE_PRODUCTS') {
    const { url, version } = event.data;
    caches.open(CACHE_DATA).then(cache => {
      fetch(url, { cache: 'no-store' }).then(res => {
        if (res.ok) {
          cache.put(new Request('./data/products.json'), res.clone());
          cache.put(new Request('./data/catalog-version.json'),
            new Response(JSON.stringify({ version }), {
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      }).catch(() => {});
    });
    return;
  }
});

/* ── ESTRATEGIAS ─────────────────────────────────────────────── */

async function _cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function _networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    /* cache: 'no-store' asegura que el navegador no sirva una respuesta HTTP cacheada */
    const res = await fetch(request, { cache: 'no-store' });
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached || new Response('Offline', { status: 503 });
  }
}

async function _networkFirstTimeout(request, cacheName, ms) {
  const cache   = await caches.open(cacheName);
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  try {
    const res = await Promise.race([
      fetch(request, { cache: 'no-store' }),
      timeout,
    ]);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached || new Response(
      JSON.stringify({ version: 'offline' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function _imageWithFallback(request) {
  const cache  = await caches.open(CACHE_IMAGES);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request, { mode: 'no-cors' });
    if (res) {
      const keys = await cache.keys();
      if (keys.length >= MAX_IMG) await cache.delete(keys[0]);
      cache.put(request, res.clone());
      return res;
    }
  } catch {}
  /* Fallback al placeholder SVG */
  const shell = await caches.open(CACHE_SHELL);
  const ph    = await shell.match('./assets/images/placeholder-product.svg');
  return ph || new Response('', { status: 404 });
}

/* ── HELPERS ─────────────────────────────────────────────────── */
function _isExtProductImage(url) {
  if (url.origin === self.location.origin) return false;
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url.pathname);
}

function _isShellAsset(url) {
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname;
  /* Excluir los JSONs de datos que queremos fresco */
  if (path.includes('catalog-version') || path.includes('products.json')) return false;
  if (path.includes('fichas_tecnicas')) return false;
  return /\.(html|css|js|svg|png|ico|woff2?|webmanifest)$/.test(path);
}
