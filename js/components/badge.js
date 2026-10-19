/* =============================================================
   Herbora Sales App — Badges de catálogo v2
   Soporte para badges BIO y filtrado por modo de usuario.
   En modo consulta NO se muestran badges comerciales:
     - TOP CONSUMO, TOP VOLUMEN, BEST MARGEN
   Sí se muestran siempre:
     - HERBORA SELECTION, BIO
   ============================================================= */

import { Store } from '../data/store.js';

/* Badges comerciales — solo visibles en modo empleado */
const COMMERCIAL_BADGES = new Set([
  'TOP CONSUMO',
  'TOP VOLUMEN',
  'TOP FACTURACIÓN',
  'BEST MARGEN',
]);

const BADGE_CLASSES = {
  'TOP CONSUMO':       'badge-top-consumo',
  'TOP VOLUMEN':       'badge-top-volumen',
  'TOP FACTURACIÓN':   'badge-top-factura',
  'BEST MARGEN':       'badge-best-margen',
  'HERBORA SELECTION': 'badge-herbora-sel',
  'BIO':               'badge-bio',
};

/* Filtrar badges según el modo de usuario */
function filterBadges(badges) {
  const isCommercial = Store.isCommercial();
  if (isCommercial) return badges; // empleado ve todos
  return badges.filter(b => !COMMERCIAL_BADGES.has(b));
}

/* Crear un elemento badge */
export function createBadge(label, extraClass = '') {
  const span = document.createElement('span');
  span.className = `badge ${BADGE_CLASSES[label] || ''} ${extraClass}`.trim();
  span.textContent = label;
  return span;
}

/* Crear todos los badges de un producto (respetando modo) */
export function createBadges(product, maxVisible = 2) {
  const badges = filterBadges(product.badges || []).slice(0, maxVisible);
  const frag = document.createDocumentFragment();
  badges.forEach(b => frag.appendChild(createBadge(b)));
  return frag;
}

/* HTML string de badges (para innerHTML), respetando modo */
export function badgesHtml(product, maxVisible = 2, extraBadges = []) {
  const filtered = filterBadges(product.badges || []).slice(0, maxVisible);
  const all = [...filtered, ...extraBadges];
  return all
    .map(b => `<span class="badge ${BADGE_CLASSES[b] || ''}">${b}</span>`)
    .join('');
}

/* Badge de descatalogado */
export function discontinuedBadge() {
  const span = document.createElement('span');
  span.className = 'badge badge-discontinued';
  span.textContent = 'Descatalogado';
  return span;
}
