/* =============================================================
   Herbora Sales App — Product Sheet v9 (definitivo)

   ÚNICA FUENTE DE VERDAD: products.json
   Campos usados (por prioridad en cada sección):
     · accordions.ingredientes_principales → "Ingredientes principales"
     · accordions.propiedades_e_indicaciones → "Propiedades e indicaciones"
     · formula_table → "Fórmula" (tabla)
     · active_ingredients → "Definición de ingredientes"
     · accordions.modo_de_uso → "Modo de uso"
     · accordions.advertencias → "Advertencias"
     · accordions.otros_ingredientes → "Otros ingredientes"

   FALLBACKS (si accordion vacío): main_ingredients, properties+indications, usage, warnings
   NO se cargan archivos externos en runtime.
   NO se insertan <br> — textos ya vienen limpios en el JSON.
   SECCIONES CERRADAS por defecto, animación suave con height.
   CTA "Añadir al listado" solo visible en modo empleado.
   ============================================================= */

import { Store }      from '../data/store.js';
import { Router }     from '../router/router.js';
import { Image }      from '../utils/image.js';
import { Share }      from '../utils/share.js';
import { Toast }      from './toast.js';
import { badgesHtml } from './badge.js';

/* ── Caché BIO (único fetch externo — liviano, <1KB) ────────── */
let _bio = null;
async function _loadBio() {
  if (_bio !== null) return;
  try {
    const r = await fetch('./data/product-bio.json');
    _bio = r.ok ? await r.json() : {};
  } catch { _bio = {}; }
}

/* ── Entry point ─────────────────────────────────────────────── */
export async function renderProductSheet(product, container) {
  if (!product || !container) return;
  await _loadBio();
  _render(product, container);
}

/* ═════════════════════════════════════════════════════════════ */
function _render(product, container) {
  const ref            = product.ref;
  const isFav          = Store.isFavorite(ref);
  const isInOrder      = Store.isInOrder(ref);
  const qty            = Store.getItemQty(ref);
  const isDiscontinued = product.status === 'discontinued';
  const isCommercial   = Store.isCommercial();
  const isBio          = !!(_bio?.[ref]?.isBio);

  /* ── Datos de acordeón (fuente: product.accordions → fallback a campos planos) */
  const acc = product.accordions || {};

  const ingPrinc   = acc.ingredientes_principales   || product.main_ingredients  || '';
  const propInd    = acc.propiedades_e_indicaciones ||
    [product.properties, product.indications].filter(Boolean).join(' ') || '';
  const modoUso    = acc.modo_de_uso                || product.usage             || '';
  const advertencias = acc.advertencias             || product.warnings          || '';
  const otrosIng   = acc.otros_ingredientes         || product.other_ingredients || '';

  /* Fórmula estructurada: product.formula_table (ya consolidado desde fichas) */
  const ft         = product.formula_table || null;
  const hasFormula = ft && Array.isArray(ft.rows) && ft.rows.length > 0;

  /* Definición de ingredientes activos */
  const activeIng  = Array.isArray(product.active_ingredients) && product.active_ingredients.length > 0
    ? product.active_ingredients : null;

  /* Meta */
  const name  = product.name         || '';
  const brand = product.brand        || '';
  const line  = product.line         || '';
  const ean   = product.ean13        || '';
  const pres  = product.presentation || '';

  container.innerHTML = `

    <!-- ══ IMAGEN ══ -->
    <div class="ps-image-wrap">
      <img id="ps-img" class="ps-image" alt="${esc(name)}">

      <div class="ps-img-controls">
        <button class="ps-btn-ghost" id="btn-back" aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div style="display:flex;gap:8px">
          <button class="ps-btn-ghost" id="btn-fav"
            aria-label="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            <svg width="20" height="20" viewBox="0 0 24 24"
              fill="${isFav ? 'white' : 'none'}">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                stroke="white" stroke-width="1.8"/>
            </svg>
          </button>
          <button class="ps-btn-ghost" id="btn-share" aria-label="Compartir">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="ps-img-badges">
        ${badgesHtml(product, 3)}
        ${isBio          ? '<span class="badge badge-bio">BIO</span>'                   : ''}
        ${isDiscontinued ? '<span class="badge badge-discontinued">Descatalogado</span>' : ''}
      </div>
    </div>

    <!-- ══ CABECERA ══ -->
    <div class="ps-header">
      ${brand || line ? `
        <div class="ps-brand">
          ${esc(brand)}${brand && line
            ? '<span class="ps-sep"> · </span>' : ''}${esc(line)}
        </div>` : ''}

      <h1 class="ps-name">${esc(name)}</h1>

      <div class="ps-meta-row">
        ${ref  ? `<span class="ps-meta-chip"><span class="ps-meta-label">Ref</span> ${esc(ref)}</span>`  : ''}
        ${ean  ? `<span class="ps-meta-chip"><span class="ps-meta-label">EAN</span> ${esc(ean)}</span>`  : ''}
        ${pres ? `<span class="ps-meta-chip">${esc(pres)}</span>`                                        : ''}
        ${product.format       ? `<span class="ps-meta-chip">${esc(product.format)}</span>`             : ''}
        ${product.dosage?.length ? `<span class="ps-meta-chip">💊 ${esc(product.dosage[0])}</span>`    : ''}
        ${(product.iconos || []).map(i => `<span class="ps-meta-chip ps-icon-chip">${esc(i)}</span>`).join('')}
      </div>

      <div class="ps-actions no-print">
        <button class="btn btn-outline btn-sm" id="btn-compare">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="8" height="18" rx="2"
              stroke="currentColor" stroke-width="2"/>
            <rect x="14" y="3" width="8" height="18" rx="2"
              stroke="currentColor" stroke-width="2"/>
          </svg>
          Comparar
        </button>
        <button class="btn btn-outline btn-sm" id="btn-presentation">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="14" rx="2"
              stroke="currentColor" stroke-width="2"/>
            <path d="M8 21h8M12 17v4" stroke="currentColor"
              stroke-width="2" stroke-linecap="round"/>
          </svg>
          Presentación
        </button>
      </div>
    </div>

    <!-- ══ SECCIONES ══ -->
    <div class="ps-sections">

      ${ingPrinc
        ? _acc('Ingredientes principales', `<p class="ps-text">${esc(ingPrinc)}</p>`)
        : ''}

      ${propInd
        ? _acc('Propiedades e indicaciones', `<p class="ps-text">${esc(propInd)}</p>`)
        : ''}

      ${activeIng
        ? _acc('Ingredientes — descripción técnica', _buildIngHtml(activeIng))
        : ''}

      ${hasFormula
        ? _acc('Fórmula', _buildFormulaHtml(ft), true)
        : ''}

      ${modoUso
        ? _acc('Modo de uso', `<p class="ps-text">${esc(modoUso)}</p>`)
        : ''}

      ${advertencias
        ? _acc('Advertencias', `
            <div class="ps-warn-box">
              <span class="ps-warn-icon">⚠️</span>
              <p class="ps-text">${esc(advertencias)}</p>
            </div>`)
        : ''}

      ${otrosIng
        ? _acc('Otros ingredientes', `<p class="ps-text ps-text-sm">${esc(otrosIng)}</p>`)
        : ''}

      ${!ingPrinc && !propInd && !modoUso && !advertencias && !hasFormula
        ? `<div class="ps-empty-info">
             <p>Información técnica no disponible para este producto.</p>
           </div>`
        : ''}

    </div>

    <!-- ══ CTA — solo modo empleado ══ -->
    ${isCommercial && !isDiscontinued ? `
    <div class="product-add-section no-print">
      <div class="qty-control">
        <button class="qty-btn minus" id="btn-dec" aria-label="Restar">−</button>
        <input class="qty-input" id="qty-input" type="number"
          min="1" max="999" value="${isInOrder ? qty : 1}" aria-label="Cantidad">
        <button class="qty-btn plus"  id="btn-inc" aria-label="Sumar">+</button>
      </div>
      <button class="btn btn-primary ps-add-btn" id="btn-add-order">
        ${isInOrder ? `✓ En listado (${qty})` : '+ Añadir al listado'}
      </button>
    </div>` : isDiscontinued ? `
    <div class="product-add-section no-print">
      <p class="ps-discontinued-msg">
        Producto descatalogado — no disponible para nuevos pedidos.
      </p>
    </div>` : ''}
  `;

  /* ── Imagen ──────────────────────────────────────────────────── */
  Image.setSrc(container.querySelector('#ps-img'), product);

  /* ── Eventos ─────────────────────────────────────────────────── */
  container.querySelector('#btn-back')?.addEventListener('click', () => Router.back());

  container.querySelector('#btn-fav')?.addEventListener('click', async e => {
    const isNow = await Store.toggleFavorite(ref);
    const path  = e.currentTarget.querySelector('path');
    if (path) path.setAttribute('fill', isNow ? 'white' : 'none');
    Toast.show(isNow ? 'Añadido a favoritos' : 'Eliminado de favoritos');
  });

  container.querySelector('#btn-share')?.addEventListener('click', () =>
    Share.shareProduct(product));

  container.querySelector('#btn-compare')?.addEventListener('click', async () => {
    await Store.addToCompare(ref);
    Toast.show('Añadido al comparador');
  });

  container.querySelector('#btn-presentation')?.addEventListener('click', () =>
    Router.push(`/presentacion/${ref}`));

  /* ── Acordeones: height 0 ↔ scrollHeight ────────────────────── */
  container.querySelectorAll('.ps-accordion-header').forEach(h => {
    h.addEventListener('click', () => {
      const item    = h.closest('.ps-accordion');
      const body    = item.querySelector('.ps-accordion-body');
      const chevron = h.querySelector('.ps-chevron');
      const isOpen  = item.classList.contains('open');

      if (isOpen) {
        body.style.height  = body.scrollHeight + 'px';
        requestAnimationFrame(() => {
          body.style.height  = '0';
          body.style.opacity = '0';
        });
        item.classList.remove('open');
        h.setAttribute('aria-expanded', 'false');
        chevron?.classList.remove('rotated');
      } else {
        item.classList.add('open');
        h.setAttribute('aria-expanded', 'true');
        chevron?.classList.add('rotated');
        body.style.height  = '0';
        body.style.opacity = '0';
        requestAnimationFrame(() => {
          body.style.height  = body.scrollHeight + 'px';
          body.style.opacity = '1';
          body.addEventListener('transitionend', () => {
            if (item.classList.contains('open')) body.style.height = 'auto';
          }, { once: true });
        });
      }
    });
  });

  /* ── Cantidad ────────────────────────────────────────────────── */
  const qtyInput = container.querySelector('#qty-input');
  if (qtyInput) {
    container.querySelector('#btn-dec')?.addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1);
    });
    container.querySelector('#btn-inc')?.addEventListener('click', () => {
      qtyInput.value = Math.min(999, parseInt(qtyInput.value, 10) + 1);
    });
    container.querySelector('#btn-add-order')?.addEventListener('click', async () => {
      if (!Store.isCommercial()) return;
      const q = Math.max(1, parseInt(qtyInput.value, 10));
      if (Store.isInOrder(ref)) {
        await Store.updateQuantity(ref, Store.getItemQty(ref) + q);
      } else {
        await Store.addToOrder(product, q);
      }
      const btn = container.querySelector('#btn-add-order');
      if (btn) btn.textContent = `✓ En listado (${Store.getItemQty(ref)})`;
      Toast.show(`${name} añadido al listado`, 'success');
    });
  }
}

/* ── Generadores de HTML ─────────────────────────────────────── */

function _acc(title, contentHtml, isFormula = false) {
  return `
    <div class="ps-accordion">
      <button class="ps-accordion-header" aria-expanded="false" type="button">
        <span class="ps-acc-title">${title}</span>
        ${isFormula
          ? '<span class="ps-formula-badge">Composición</span>'
          : ''}
        <svg class="ps-chevron" width="16" height="16" viewBox="0 0 24 24"
          fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="ps-accordion-body" style="height:0;opacity:0">
        ${contentHtml}
      </div>
    </div>`;
}

function _buildIngHtml(items) {
  return items.map(item => `
    <div class="ps-ingredient">
      <div class="ps-ingredient-name">${esc(item.ingrediente || item.nombre || '')}</div>
      ${item.descripcion
        ? `<div class="ps-ingredient-desc">${esc(item.descripcion)}</div>`
        : ''}
    </div>`).join('');
}

function _buildFormulaHtml(ft) {
  if (!ft?.rows?.length) return '';
  const header = ft.headers?.[0] || ft.serving || ft.title || '';

  const rows = ft.rows.map(r => {
    const ing = r.ingrediente || r.ingrediente_activo || r.name || r[0] || '';
    const qty = r.cantidad    || r.amount             || r[1] || '';
    return `
      <tr>
        <td class="ps-ftable-ing">${esc(ing)}</td>
        <td class="ps-ftable-qty">${esc(qty)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="ps-ftable-wrap">
      ${header ? `<div class="ps-ftable-header">${esc(header)}</div>` : ''}
      <div class="ps-ftable-scroll">
        <table class="ps-ftable" role="table">
          <thead>
            <tr>
              <th class="ps-ftable-th" scope="col">Ingrediente</th>
              <th class="ps-ftable-th ps-ftable-th-qty" scope="col">Cantidad</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${ft.notes
        ? `<div class="ps-ftable-notes">${esc(ft.notes)}</div>`
        : ''}
    </div>`;
}

/* ── Escape HTML sin modificar saltos de línea ─────────────── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
