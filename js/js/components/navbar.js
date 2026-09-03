/* =============================================================
   Herbora Sales App — Navbar inferior v4
   Orden: Comparador · Marcas · [CATÁLOGO FAB] · Favoritos · Más
   Listado/Pedido movido a "Más"
   ============================================================= */

import { Router } from '../router/router.js';
import { Store }  from '../data/store.js';

const TABS = [
  { id: 'comparador', label: 'Comparar', icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="8" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="8" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>`, route: '/comparador' },
  { id: 'marcas',     label: 'Marcas',   icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>`, route: '/marcas' },
  { id: 'catalogo',   label: 'Catálogo', icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="white"/><rect x="14" y="3" width="7" height="7" rx="1" fill="white"/><rect x="3" y="14" width="7" height="7" rx="1" fill="white"/><rect x="14" y="14" width="7" height="7" rx="1" fill="white"/></svg>`, route: '/catalogo', isFab: true },
  { id: 'favoritos',  label: 'Favoritos',icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`, route: '/favoritos' },
  { id: 'mas',        label: 'Más',      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>`, route: '/mas' },
];

export function initNavbar() {
  const nav = document.getElementById('app-navbar');
  if (!nav) return;
  _renderNavbar(nav);
  Store.on('order', () => _updateOrderBadge());
}

function _renderNavbar(nav) {
  nav.innerHTML = TABS.map(tab => {
    if (tab.isFab) {
      /* Botón central FAB — siempre destacado */
      return `
        <div class="nav-item nav-fab" data-route="${tab.route}" data-id="${tab.id}" role="button" tabindex="0" aria-label="${tab.label}">
          <div class="nav-fab-btn">
            ${tab.icon}
          </div>
          <span class="nav-label">${tab.label}</span>
        </div>`;
    }
    return `
      <div class="nav-item" data-route="${tab.route}" data-id="${tab.id}" role="button" tabindex="0" aria-label="${tab.label}">
        <span class="nav-icon">${tab.icon}</span>
        <span class="nav-label">${tab.label}</span>
      </div>`;
  }).join('');

  /* Eventos */
  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => Router.push(item.dataset.route));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Router.push(item.dataset.route); }
    });
  });

  /* Resaltar tab activo */
  Router.afterEach(route => _highlightActive(nav, route.path));

  _updateOrderBadge();
  const current = Router.current();
  if (current) _highlightActive(nav, current.path);
}

function _highlightActive(nav, path) {
  nav.querySelectorAll('.nav-item').forEach(item => {
    const route = item.dataset.route;
    const active = path === route || (route !== '/mas' && path.startsWith(route + '/'));
    item.classList.toggle('active', active);
  });
}

function _updateOrderBadge() {
  /* El badge de pedido ahora puede estar en "Más" — buscar si existe */
  const badge = document.getElementById('nav-order-badge');
  if (!badge) return;
  const count = Store.getOrderCount();
  badge.textContent = count > 99 ? '99+' : count;
  badge.style.display = count > 0 ? '' : 'none';
}

export function showNavbar(visible) {
  const nav = document.getElementById('app-navbar');
  if (nav) nav.classList.toggle('visible', visible);
}

export function showTopbar(visible) {
  const bar = document.getElementById('app-topbar');
  if (bar) bar.classList.toggle('visible', visible);
}
