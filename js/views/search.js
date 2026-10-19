/* =============================================================
   Herbora v1.3 — Buscar: acceso directo a productos y pedido.
   ============================================================= */

import { Catalog } from '../data/catalog.js';
import { Store } from '../data/store.js';
import { Router } from '../router/router.js';
import { Image } from '../utils/image.js';
import { Toast } from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { formatPvp } from '../utils/format.js';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let _query = '';
export function renderSearch(route = {}) {
  const screen = document.getElementById('screen-search');
  showNavbar(true);
  _query = route.query?.q || '';

  screen.innerHTML = `
    <section class="smart-hero">
      <div class="smart-kicker">CATÁLOGO HERBORA</div>
      <h1>¿Qué producto buscas?</h1>
      <p>Por nombre, referencia, EAN, ingrediente o necesidad.</p>
      <div class="smart-searchbar">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.2" stroke="currentColor" stroke-width="1.8"/><path d="m16.2 16.2 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <input type="search" id="smart-input" autocomplete="off" enterkeyhint="search"
          aria-label="Buscar productos" placeholder="Ej. Fitogast, H20109, magnesio..."
          value="${esc(_query)}">
        <button type="button" id="smart-clear" aria-label="Limpiar búsqueda" ${_query ? '' : 'hidden'}>✕</button>
      </div>
    </section>
    <div class="smart-body">
      <button type="button" class="v14-campaign-shortcut" id="quick-campaigns">
        <span class="v14-campaign-shortcut__icon">&#9638;</span>
        <span><strong>Campa&ntilde;as y ofertas</strong><small>Creatividades, PDF y material comercial</small></span>
        <span class="v14-campaign-shortcut__arrow">&rarr;</span>
      </button>
      <div class="smart-suggestions" id="smart-suggestions">
        <span class="smart-small-label">Búsquedas frecuentes</span>
        <div class="smart-chips" id="smart-quick-terms">
          ${['Digestión', 'Articulaciones', 'Magnesio', 'Defensas', 'D3 K2'].map(t => `<button type="button" data-term="${esc(t)}">${esc(t)}</button>`).join('')}
        </div>
      </div>
      <div class="smart-results-heading">
        <div>
          <h2 id="smart-list-title">Productos habituales</h2>
          <div class="smart-results-count" id="smart-count"></div>
        </div>
        <button class="smart-explore" id="smart-explore" type="button">Ver catálogo completo →</button>
      </div>
      <div id="smart-results" class="smart-results" aria-live="polite"></div>
    </div>`;

  const input = screen.querySelector('#smart-input');
  input.addEventListener('input', () => {
    _query = input.value;
    screen.querySelector('#smart-clear').hidden = !_query;
    draw();
  });
  screen.querySelector('#smart-clear').addEventListener('click', () => {
    _query = ''; input.value = ''; screen.querySelector('#smart-clear').hidden = true;
    draw(); input.focus();
  });
  screen.querySelectorAll('[data-term]').forEach(btn => btn.addEventListener('click', () => {
    _query = btn.dataset.term; input.value = _query;
    screen.querySelector('#smart-clear').hidden = false;
    draw(); input.focus();
  }));
  screen.querySelector('#smart-explore').addEventListener('click', () => Router.push('/catalogo'));
  screen.querySelector('#quick-campaigns').addEventListener('click', () => Router.push('/campanas'));
  draw();

  function draw() {
    const term = _query.trim();
    const empty = !term;
    screen.querySelector('#smart-suggestions').hidden = !empty;
    screen.querySelector('#smart-list-title').textContent = empty ? 'Productos habituales' : 'Resultados de búsqueda';
    const count = screen.querySelector('#smart-count');
    let found;
    if (empty) {
      const refs = [...new Set([...Store.getFavorites(), ...Store.getRecentlyViewed()])];
      found = refs.map(ref => Catalog.getById(ref)).filter(p => p && (!p.status || p.status === 'active')).slice(0, 12);
      if (!found.length) {
        count.textContent = 'Guarda favoritos o consulta fichas para tenerlos aquí';
      } else count.textContent = `${found.length} producto${found.length === 1 ? '' : 's'} frecuente${found.length === 1 ? '' : 's'}`;
    } else {
      const allMatches = Catalog.search(term);
      found = allMatches.slice(0, 80);
      count.textContent = `${allMatches.length} producto${allMatches.length === 1 ? '' : 's'} encontrado${allMatches.length === 1 ? '' : 's'}`;
    }

    const container = screen.querySelector('#smart-results');
    container.innerHTML = '';
    if (!found.length) {
      container.innerHTML = empty
        ? '<div class="smart-empty">Tus favoritos y últimos productos consultados aparecerán aquí. Puedes comenzar con una de las búsquedas frecuentes o explorar el catálogo.</div>'
        : '<div class="smart-empty">No hay coincidencias. Prueba con la referencia, una palabra más corta o el ingrediente principal.</div>';
      return;
    }

    const frag = document.createDocumentFragment();
    found.forEach(p => {
      const row = document.createElement('article');
      row.className = 'smart-result';
      row.innerHTML = `
        <button type="button" class="smart-result__detail" aria-label="Ver ficha de ${esc(p.name)}">
          <img alt="" loading="lazy" decoding="async">
          <span class="smart-result__info">
            <strong>${esc(p.name)}</strong>
            <small>${esc([p.brand, p.line].filter(Boolean).join(' · '))}</small>
            <small>${esc(p.ref)}${p.presentation ? ' · ' + esc(p.presentation) : ''}</small>
            <small class="smart-result__price">PVP ${formatPvp(p.pvp)}</small>
          </span>
        </button>
        <div class="smart-result__actions">
          <span class="smart-qty" ${Store.getItemQty(p.ref) ? '' : 'hidden'}>${Store.getItemQty(p.ref)} en pedido</span>
          <button type="button" class="smart-add" aria-label="Añadir ${esc(p.name)} al pedido">+</button>
        </div>`;
      Image.setSrc(row.querySelector('img'), p);
      row.querySelector('.smart-result__detail').addEventListener('click', () => Router.push(`/producto/${encodeURIComponent(p.ref)}`));
      row.querySelector('.smart-add').addEventListener('click', async e => {
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          await Store.addToOrder(p, 1);
          const qty = row.querySelector('.smart-qty');
          qty.textContent = `${Store.getItemQty(p.ref)} en pedido`;
          qty.hidden = false;
          Toast.success(`${p.name} añadido al pedido`);
        } finally { btn.disabled = false; }
      });
      frag.appendChild(row);
    });
    container.appendChild(frag);
  }
}
