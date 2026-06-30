/* =============================================================
   Herbora Sales App — Bootstrap principal v4
   ============================================================= */

import { DB }      from './data/db.js';
import { Store }   from './data/store.js';
import { Catalog } from './data/catalog.js';
import { Router }  from './router/router.js';

import { initNavbar, showNavbar, showTopbar } from './components/navbar.js';
import { Toast } from './components/toast.js';

import { renderEntry }        from './views/entry.js';
import { renderAuth }         from './views/auth.js';
import { renderDashboard }    from './views/dashboard.js';
import { renderCatalog }      from './views/catalog.js';
import { renderProduct }      from './views/product.js';
import { renderOrder }        from './views/order.js';
import { renderFavorites }    from './views/favorites.js';
import { renderHistory, renderHistoryDetail } from './views/history.js';
import { renderCompare }      from './views/compare.js';
import { renderPresentation } from './views/presentation.js';
import { renderMore }         from './views/more.js';
import { renderBrands }       from './views/brands.js';
import { renderAdmin, renderProductForm } from './views/admin.js';

/* ── Pantallas registradas ──────────────────────────────── */
const ALL_SCREENS = [
  'screen-entry', 'screen-auth', 'screen-dashboard',
  'screen-catalog', 'screen-brands', 'screen-product', 'screen-order',
  'screen-favorites', 'screen-history', 'screen-compare',
  'screen-presentation', 'screen-more', 'screen-admin',
];

/* ── Mostrar pantalla — con posición:absolute no hay scroll acumulado ── */
function showScreen(id) {
  ALL_SCREENS.forEach(sid => {
    const el = document.getElementById(sid);
    if (!el) return;
    const isActive = sid === id;
    el.classList.toggle('active', isActive);
    /* Resetear scroll ANTES de mostrar la nueva pantalla */
    if (isActive) el.scrollTop = 0;
  });
}

/* ── Pantallas que usan la topbar y navbar ──────────────── */
const SCREENS_WITH_CHROME = new Set([
  'screen-dashboard', 'screen-catalog', 'screen-brands',
  'screen-product', 'screen-order', 'screen-favorites',
  'screen-history', 'screen-compare', 'screen-presentation', 'screen-more',
  'screen-admin',
]);

function setChrome(screenId) {
  const hasChrome = SCREENS_WITH_CHROME.has(screenId);
  showNavbar(hasChrome);
  showTopbar(hasChrome);
}

/* ── PWA install prompt ─────────────────────────────────── */
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window._pwaInstallPrompt = e;
});

/* ── Inicialización ─────────────────────────────────────── */
async function init() {
  try {
    await DB.init();
    await Store.init();

    const catalogOk = await Catalog.init();
    if (!catalogOk) Toast.show('No se pudo cargar el catálogo. Conecta a internet.', 'error');

    initNavbar();
    _setupHomeButton();
    _setupRouter();
    _registerSW();
    _setupOffline();

    Router.afterEach(() => window._hideSplash?.());
    Router.init();

  } catch (err) {
    console.error('[App] Error de inicialización:', err);
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  min-height:100dvh;gap:16px;padding:24px;text-align:center;font-family:sans-serif;">
        <div style="font-size:36px;">⚠️</div>
        <div style="font-size:18px;font-weight:600;">Error al iniciar la app</div>
        <p style="font-size:14px;color:#7A7A7A;">Recarga la página para intentarlo de nuevo.</p>
        <button onclick="location.reload()" style="padding:12px 24px;background:#0E6270;color:white;border:none;border-radius:24px;cursor:pointer;font-size:16px;">Recargar</button>
      </div>`;
  }
}

/* ── Botón Inicio (topbar) ──────────────────────────────── */
function _setupHomeButton() {
  const btn = document.getElementById('btn-home');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    /* Borrar modo — vuelve a la pantalla de bienvenida */
    await Store.setUserMode(null);
    Router.push('/entrada');
  });
}

/* ── Rutas ──────────────────────────────────────────────── */
function _setupRouter() {

  /* Guard: sin modo de usuario → entrada */
  Router.beforeEach((to, from) => {
    const protectedRoutes = [
      '/', '/catalogo', '/marcas', '/comparador', '/pedido',
      '/favoritos', '/historial', '/mas', '/admin',
    ];
    const isProtected = protectedRoutes.some(r =>
      to.path === r || to.path.startsWith(r + '/')
    );
    if (isProtected && Store.getUserMode() === null) {
      return '/entrada';
    }
  });

  Router.on('/entrada', () => {
    showScreen('screen-entry');
    setChrome('screen-entry');
    renderEntry();
  });

  Router.on('/auth', () => {
    showScreen('screen-auth');
    setChrome('screen-auth');
    renderAuth();
  });

  Router.on('/', () => {
    showScreen('screen-dashboard');
    setChrome('screen-dashboard');
    renderDashboard();
  });

  Router.on('/catalogo', route => {
    showScreen('screen-catalog');
    setChrome('screen-catalog');
    renderCatalog(route);
  });

  Router.on('/marcas', () => {
    showScreen('screen-brands');
    setChrome('screen-brands');
    renderBrands();
  });

  Router.on('/producto/:ref', route => {
    showScreen('screen-product');
    setChrome('screen-product');
    renderProduct(route);
  });

  Router.on('/pedido', () => {
    showScreen('screen-order');
    setChrome('screen-order');
    renderOrder();
  });

  Router.on('/favoritos', () => {
    showScreen('screen-favorites');
    setChrome('screen-favorites');
    renderFavorites();
  });

  Router.on('/historial', () => {
    showScreen('screen-history');
    setChrome('screen-history');
    renderHistory();
  });

  Router.on('/historial/:id', route => {
    showScreen('screen-history');
    setChrome('screen-history');
    renderHistoryDetail(route);
  });

  Router.on('/comparador', () => {
    showScreen('screen-compare');
    setChrome('screen-compare');
    renderCompare();
  });

  Router.on('/presentacion/:ref', route => {
    showScreen('screen-presentation');
    setChrome('screen-presentation');
    renderPresentation(route);
  });

  Router.on('/mas', () => {
    showScreen('screen-more');
    setChrome('screen-more');
    renderMore();
  });

  /* Panel de gestión — solo modo empleado */
  Router.on('/admin', () => {
    showScreen('screen-admin');
    setChrome('screen-admin');
    renderAdmin();
  });

  Router.on('/admin/nuevo', () => {
    showScreen('screen-admin');
    setChrome('screen-admin');
    renderProductForm({});
  });

  Router.on('/admin/editar/:ref', route => {
    showScreen('screen-admin');
    setChrome('screen-admin');
    renderProductForm(route);
  });
}

/* ── Service Worker ─────────────────────────────────────── */
function _registerSW() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./service-worker.js', {
    /* scope relativo al directorio donde está el SW — correcto para /catalogo/ */
    scope: './',
    updateViaCache: 'none',  /* evita que el navegador cachee el propio SW.js */
  })
  .then(reg => {
    /* Comprobar actualizaciones cada vez que el usuario retoma la app */
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });

    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          /* Hay una versión nueva esperando — avisar con opción de recargar */
          _showUpdateBanner();
        }
      });
    });

    /* Si ya hay un nuevo SW esperando al cargar la página, avisar */
    if (reg.waiting) _showUpdateBanner();
  })
  .catch(err => console.warn('[SW] Error al registrar:', err));
}

function _showUpdateBanner() {
  /* Evitar duplicados */
  if (document.getElementById('update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:calc(var(--nav-h,60px) + 12px)', 'left:12px', 'right:12px',
    'background:#0E6270', 'color:white', 'border-radius:12px', 'padding:12px 16px',
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'gap:12px', 'z-index:9998', 'box-shadow:0 4px 16px rgba(0,0,0,.25)',
    'font-family:inherit', 'font-size:14px',
  ].join(';');
  banner.innerHTML = `
    <span>🔄 Nueva versión disponible</span>
    <button onclick="window.location.reload()"
      style="background:white;color:#0E6270;border:none;border-radius:20px;
             padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;">
      Actualizar
    </button>
  `;
  document.body.appendChild(banner);
}

/* ── Online/Offline ─────────────────────────────────────── */
function _setupOffline() {
  const banner = document.getElementById('offline-banner');

  function updateBanner() {
    const offline = !navigator.onLine;
    banner?.classList.toggle('visible', offline);
  }

  /* No mostrar el banner en el arranque si hay conexión */
  updateBanner();

  window.addEventListener('online',  () => {
    updateBanner();
  });
  window.addEventListener('offline', () => {
    updateBanner();
    Toast.show('Sin conexión. Usando catálogo guardado.', 'error');
  });
}

document.addEventListener('DOMContentLoaded', init);
