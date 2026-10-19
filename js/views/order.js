/* =============================================================
   Herbora v1.3 — Pedido personal
   Cesta persistente → borrador → mailto → confirmación manual.
   El navegador NO puede comprobar si el mensaje fue enviado.
   ============================================================= */

import { Store } from '../data/store.js';
import { DB } from '../data/db.js';
import { Catalog } from '../data/catalog.js';
import { Router } from '../router/router.js';
import { Share, PERSONAL_ORDER_EMAIL } from '../utils/share.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { createOrderItem } from '../components/order-item.js';
import { formatDateShort, calcOrderTotals, formatPvp } from '../utils/format.js';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderOrder() {
  showNavbar(true);
  _buildOrder(document.getElementById('screen-order'));
}

async function _buildOrder(screen, focusSearch = false) {
  const items = Store.getOrder().map(i => ({ ...i, pvp: Catalog.getById(i.ref)?.pvp ?? null }));
  const totals = calcOrderTotals(items);
  const name = (await DB.getState('employeeName')) || '';
  const notes = (await DB.getState('personalOrderNotes')) || '';
  const pendingId = await DB.getState('pendingPersonalOrderId');
  const pending = pendingId ? await DB.getOrder(pendingId) : null;
  const invalid = items.filter(i => {
    const p = Catalog.getById(i.ref);
    return !p || (p.status && p.status !== 'active');
  });

  screen.innerHTML = `
    <div class="order-header order-header-v13">
      <div class="order-header__title">Mi pedido personal</div>
      <div class="order-header__date">${formatDateShort()} · ${totals.refs} referencias · ${totals.units} unidades</div>
      <span class="order-mode-label">Se prepara un correo para ${PERSONAL_ORDER_EMAIL}</span>
    </div>

    <div class="order-add-search">
      <label class="order-field-label" for="order-search">Añadir otro producto</label>
      <div class="search-wrap" id="order-search-wrap">
        <span class="search-icon">⌕</span>
        <input class="input" type="search" id="order-search" autocomplete="off"
          placeholder="Nombre, REF, ingrediente o EAN...">
        <button class="search-clear" id="order-search-clear" type="button" aria-label="Limpiar búsqueda">✕</button>
      </div>
      <div class="order-search-results" id="order-search-results" hidden></div>
    </div>

    <div class="order-body">
      ${items.length ? `
        <div class="order-items" id="order-items-list"></div>
        <div class="order-totals" id="order-totals">
          <div><div class="order-totals__label">Referencias</div><div class="order-totals__val" id="total-refs">${totals.refs}</div></div>
          <div><div class="order-totals__label">Unidades</div><div class="order-totals__val" id="total-units">${totals.units}</div></div>
          <div class="order-totals__pvp"><div class="order-totals__label">${totals.complete ? 'Total PVP estimado' : 'Subtotal PVP conocido'}</div><div class="order-totals__val">${totals.pricedLines ? formatPvp(totals.pvpCents / 100) : 'No disponible'}</div></div>
        </div>
        ${totals.missingLines ? `<div class="order-pvp-warning">${totals.missingLines} referencia(s) sin precio. El subtotal no incluye esas unidades.</div>` : ''}
        <div class="order-pvp-note">El PVP es orientativo. No es el precio que se cobrará al empleado.</div>
        ${invalid.length ? `<div class="order-warning" role="alert">Hay ${invalid.length} producto(s) descatalogado(s) o no disponible(s) en la cesta. Elimínalos antes de preparar el correo.</div>` : ''}
      ` : `<div class="order-empty"><div class="order-empty__icon">⌕</div><h2>Empieza tu pedido</h2><p>Busca por nombre, código o ingrediente y añade las unidades que necesitas.</p><button class="btn btn-secondary" type="button" id="order-go-search">Ir al buscador</button></div>`}

      <div class="order-personal-data">
        <h2>Datos del pedido</h2>
        <label class="order-field-label" for="order-name">Nombre del empleado <span aria-hidden="true">*</span></label>
        <input class="input" id="order-name" type="text" maxlength="90" autocomplete="name"
          placeholder="Nombre y apellidos" value="${esc(name)}">
        <label class="order-field-label" for="order-notes">Observaciones (opcional)</label>
        <textarea class="textarea" id="order-notes" rows="3" placeholder="Añade indicaciones si hace falta...">${esc(notes)}</textarea>
        <div class="order-destination">Destinatario <strong>${PERSONAL_ORDER_EMAIL}</strong></div>
      </div>
    </div>

    ${items.length ? `<div class="order-share-section order-share-v13">
      ${pending?.status === 'draft' ? `
        <div class="order-pending" id="order-pending">
          <strong>Correo preparado · envío pendiente de confirmar</strong>
          <p>Cuando hayas enviado el mensaje desde tu correo, confírmalo aquí para guardarlo como enviado.</p>
          <button class="btn btn-secondary btn-full" type="button" id="btn-confirm-sent">Sí, ya he enviado el correo</button>
        </div>` : ''}
      <button class="btn btn-primary btn-lg btn-full" type="button" id="btn-email-personal" ${invalid.length ? 'disabled' : ''}>
        Preparar correo a Herbora →
      </button>
      <p class="order-mail-hint">Se abrirá tu aplicación de correo con el pedido completo. El envío no es automático.</p>
      <div class="order-secondary-actions">
        <button class="btn btn-outline btn-sm" id="btn-copy" type="button">Copiar pedido</button>
        <button class="btn btn-outline btn-sm" id="btn-pdf" type="button">PDF</button>
        <button class="btn btn-ghost btn-sm" id="btn-clear" type="button">Vaciar</button>
      </div>
      <button class="order-history-link" id="order-history-link" type="button">Ver historial y repetir pedidos →</button>
    </div>` : `<div class="order-footer-empty"><button class="order-history-link" id="order-history-link" type="button">Ver historial y repetir pedidos →</button></div>`}
  `;

  screen.querySelector('#order-go-search')?.addEventListener('click', () => Router.push('/buscar'));
  screen.querySelector('#order-history-link')?.addEventListener('click', () => Router.push('/historial'));

  const nameInput = screen.querySelector('#order-name');
  const notesInput = screen.querySelector('#order-notes');
  nameInput.addEventListener('input', async () => {
    await DB.setState('employeeName', nameInput.value);
    await DB.setState('pendingPersonalOrderId', null);
    screen.querySelector('#order-pending')?.remove();
  });
  notesInput.addEventListener('input', async () => {
    await DB.setState('personalOrderNotes', notesInput.value);
    await DB.setState('pendingPersonalOrderId', null);
    screen.querySelector('#order-pending')?.remove();
  });

  const getOpts = () => ({ mode: 'personal', name: nameInput.value.trim(), notes: notesInput.value.trim() });

  if (items.length) {
    const list = screen.querySelector('#order-items-list');
    items.forEach(i => {
      const p = Catalog.getById(i.ref);
      list.appendChild(createOrderItem({ ...i, pvp: p?.pvp ?? null, status: p?.status || 'discontinued' }, () => _buildOrder(screen)));
    });
  }

  _initOrderSearch(screen);
  if (focusSearch) screen.querySelector('#order-search')?.focus();

  screen.querySelector('#btn-email-personal')?.addEventListener('click', async () => {
    const opts = getOpts();
    if (!opts.name) {
      Toast.show('Introduce tu nombre antes de preparar el correo.', 'error');
      nameInput.focus(); return;
    }
    if (!Store.isOnline()) {
      Toast.show('Sin conexión. El pedido sigue guardado; prepara el correo cuando tengas internet.', 'error');
      return;
    }
    if (!Store.getOrder().length || Store.getOrder().some(i => {
      const p = Catalog.getById(i.ref);
      return !p || (p.status && p.status !== 'active');
    })) {
      Toast.show('Revisa los productos descatalogados del pedido.', 'error');
      return;
    }
    await DB.setState('employeeName', opts.name);
    await DB.setState('personalOrderNotes', opts.notes);

    /* Guardar borrador ANTES de abrir el cliente de correo. */
    let id = await DB.getState('pendingPersonalOrderId');
    if (!id || !(await DB.getOrder(id))) {
      id = await DB.saveOrder({
        mode: 'personal', label: 'Pedido personal', status: 'draft',
        name: opts.name, notes: opts.notes,
        items: items.map(i => ({ ...i })),
        totalRefs: Store.getOrderRefs(), totalUnits: Store.getOrderCount(),
      });
      await DB.setState('pendingPersonalOrderId', id);
    }
    screen.querySelector('#btn-email-personal').disabled = true;
    await _buildOrder(screen);
    Share.email(Store.getOrder(), opts);
  });

  screen.querySelector('#btn-confirm-sent')?.addEventListener('click', () => {
    Modal.confirm('¿Confirmas que ya has enviado el correo desde tu aplicación de email?', async () => {
      const id = await DB.getState('pendingPersonalOrderId');
      if (!id) { Toast.show('No hay un correo pendiente de confirmar.', 'error'); return; }
      await DB.updateOrder(id, { status: 'sent', sentAt: new Date().toISOString() });
      await DB.setState('pendingPersonalOrderId', null);
      await Store.clearOrder();
      await DB.setState('personalOrderNotes', '');
      Toast.success('Pedido marcado como enviado y guardado en el historial.');
      Router.push('/historial');
    });
  });

  screen.querySelector('#btn-copy')?.addEventListener('click', () => Share.clipboard(Store.getOrder(), getOpts()));
  screen.querySelector('#btn-pdf')?.addEventListener('click', () => Share.pdf(Store.getOrder(), getOpts()));
  screen.querySelector('#btn-clear')?.addEventListener('click', () => Modal.confirm('¿Vaciar el pedido actual? Se eliminarán sus productos de la cesta.', async () => {
    await Store.clearOrder();
    await DB.setState('personalOrderNotes', '');
    await _buildOrder(screen);
  }));
}

let _searchTimer = null;
function _initOrderSearch(screen) {
  const input = screen.querySelector('#order-search');
  const resultBox = screen.querySelector('#order-search-results');
  const wrap = screen.querySelector('#order-search-wrap');

  input.addEventListener('input', () => {
    const query = input.value.trim();
    wrap.classList.toggle('has-value', !!query);
    clearTimeout(_searchTimer);
    if (!query) { resultBox.hidden = true; return; }
    _searchTimer = setTimeout(() => {
      const found = Catalog.search(query).slice(0, 8);
      resultBox.innerHTML = found.length ? found.map(p => `
        <div class="order-search-match">
          <span><strong>${esc(p.name)}</strong><small>${esc(p.ref)} · ${esc(p.brand)} · PVP ${formatPvp(p.pvp)}</small></span>
          <button class="btn btn-secondary btn-sm" data-ref="${esc(p.ref)}" type="button">+ Añadir</button>
        </div>`).join('') : '<p class="order-search-none">Sin resultados. Prueba con otra palabra.</p>';
      resultBox.hidden = false;
      resultBox.querySelectorAll('[data-ref]').forEach(btn => btn.addEventListener('click', async () => {
        const product = Catalog.getById(btn.dataset.ref);
        if (!product || (product.status && product.status !== 'active')) return;
        await Store.addToOrder(product, 1);
        Toast.success(`${product.name} añadido`);
        await _buildOrder(screen, true);
      }));
    }, 120);
  });
  screen.querySelector('#order-search-clear').addEventListener('click', () => {
    input.value = ''; wrap.classList.remove('has-value'); resultBox.hidden = true; input.focus();
  });
}
