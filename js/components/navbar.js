/* =============================================================
   Herbora v1.3 — navegación centrada en búsqueda y pedidos.
   Buscar · Catálogo · Mi pedido · Favoritos · Más
   ============================================================= */

import { Router } from '../router/router.js';
import { Store } from '../data/store.js';

const TABS = [
  { id: 'buscar', label: 'Buscar', route: '/buscar', icon: '<circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 5 5"/>' },
  { id: 'catalogo', label: 'Catálogo', route: '/catalogo', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { id: 'campanas', label: 'Campa\u00f1as', route: '/campanas', icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5M16 4v5"/><path d="m9 15 2 2 4-4"/>' },
  { id: 'pedido', label: 'Mi pedido', route: '/pedido', icon: '<path d="M3 7h18l-2 13H5L3 7Z"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/>' },
  { id: 'favoritos', label: 'Favoritos', route: '/favoritos', icon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>' },
  { id: 'mas', label: 'Más', route: '/mas', icon: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>' },
];

export function initNavbar() {
  const nav = document.getElementById('app-navbar');
  if (!nav) return;
  nav.innerHTML = TABS.map(tab => `
    <button class="nav-item${tab.id === 'pedido' ? ' nav-order' : ''}" type="button" data-route="${tab.route}" data-id="${tab.id}" aria-label="${tab.label}">
      <span class="nav-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tab.icon}</svg>
        ${tab.id === 'pedido' ? '<span class="nav-order-badge" id="nav-order-badge" hidden></span>' : ''}
      </span>
      <span class="nav-label">${tab.label}</span>
    </button>`).join('');
  nav.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => Router.push(item.dataset.route)));
  Store.on('order', updateOrderBadge);
  Router.afterEach(route => _highlightActive(nav, route.path));
  updateOrderBadge();
}

function updateOrderBadge() {
  const badge = document.getElementById('nav-order-badge');
  if (!badge) return;
  const count = Store.getOrderCount();
  badge.textContent = count > 99 ? '99+' : count;
  badge.hidden = count === 0;
}

function _highlightActive(nav, path) {
  nav.querySelectorAll('.nav-item').forEach(item => {
    const route = item.dataset.route;
    item.classList.toggle('active', path === route || path.startsWith(route + '/'));
    if (path === route) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

export function showNavbar(visible) {
  document.getElementById('app-navbar')?.classList.toggle('visible', visible);
}

export function showTopbar(visible) {
  document.getElementById('app-topbar')?.classList.toggle('visible', visible);
}
