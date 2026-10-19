/* =============================================================
   Herbora Sales App — Vista: Historial de pedidos
   Lista y detalle. Historial robusto: copia estática de productos.
   ============================================================= */

import { DB }     from '../data/db.js';
import { Store }  from '../data/store.js';
import { Catalog } from '../data/catalog.js';
import { Router } from '../router/router.js';
import { Share }  from '../utils/share.js';
import { Modal }  from '../components/modal.js';
import { Toast }  from '../components/toast.js';
import { showNavbar } from '../components/navbar.js';
import { EmptyStates } from '../components/empty-state.js';
import { formatDate, formatDateShort, previewProducts, calcOrderTotals, formatPvp } from '../utils/format.js';

/* ── Lista de pedidos ───────────────────────────────────── */
export async function renderHistory() {
  const screen = document.getElementById('screen-history');
  showNavbar(true);

  const orders = await DB.getOrders();

  screen.innerHTML = `
    <div class="screen-header">
      <h1>Historial de pedidos</h1>
      <div class="subtitle">${orders.length} pedido${orders.length !== 1 ? 's' : ''} guardado${orders.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="history-list" id="history-list"></div>
  `;

  const list = screen.querySelector('#history-list');

  if (orders.length === 0) {
    list.appendChild(EmptyStates.noHistory());
    return;
  }

  orders.forEach(order => {
    const card = _buildHistoryCard(order);
    list.appendChild(card);
  });
}

function _buildHistoryCard(order) {
  const isCommercial = order.mode === 'commercial';
  const statusLabel = order.status === 'sent' ? 'Enviado (confirmado)' : order.status === 'draft' ? 'Borrador' : 'Guardado';
  const totals       = calcOrderTotals(order.items || []);
  const card         = document.createElement('div');
  card.className     = 'history-card';
  card.dataset.id    = order.id;

  card.innerHTML = `
    <div class="history-card__top${isCommercial ? '' : ' consumer'}">
      <div class="history-card__meta">
        <div class="history-card__header">
          <span class="history-card__date">${order.name || formatDateShort(order.createdAt)}</span>
          <span class="badge-mode-${isCommercial ? 'commercial' : 'consumer'}">
            ${statusLabel}
          </span>
        </div>
        <div class="history-card__stats">${totals.refs} referencias · ${totals.units} unidades · ${formatDateShort(order.createdAt)}</div>
        <div class="history-card__products">${previewProducts(order.items)}</div>
      </div>
    </div>
    <div class="history-card__actions">
      <button class="btn btn-outline btn-sm" data-action="view">Ver detalle</button>
      <button class="btn btn-ghost btn-sm btn-whatsapp" data-action="whatsapp" style="background:#25D366;color:white;border:none;">WhatsApp</button>
      <button class="btn btn-secondary btn-sm" data-action="duplicate">Repetir pedido</button>
      <button class="btn btn-ghost btn-sm" data-action="delete" style="color:var(--color-danger);">Eliminar</button>
    </div>
  `;

  card.querySelector('[data-action="view"]').addEventListener('click', () =>
    Router.push(`/historial/${order.id}`));

  card.querySelector('[data-action="whatsapp"]').addEventListener('click', () =>
    Share.whatsapp(order.items, { mode: order.mode, name: order.name, notes: order.notes }));

  card.querySelector('[data-action="duplicate"]').addEventListener('click', () => _repeatOrder(order));

  card.querySelector('[data-action="delete"]').addEventListener('click', () => {
    Modal.confirm('¿Eliminar este pedido del historial?', async () => {
      await DB.deleteOrder(order.id);
      card.remove();
      Toast.show('Pedido eliminado');
    });
  });

  return card;
}

/* ── Detalle de un pedido histórico ─────────────────────── */
export async function renderHistoryDetail(route) {
  const id     = route?.params?.id || '';
  const screen = document.getElementById('screen-history');
  showNavbar(true);

  const order = await DB.getOrder(id);

  if (!order) {
    screen.innerHTML = `
      <div class="screen-header screen-header-nav">
        <button class="btn-back" id="btn-back">←</button>
        <h1>Pedido no encontrado</h1>
      </div>
    `;
    screen.querySelector('#btn-back')?.addEventListener('click', () => Router.push('/historial'));
    return;
  }

  const isCommercial = order.mode === 'commercial';
  const statusLabel = order.status === 'sent' ? 'Enviado (confirmado)' : order.status === 'draft' ? 'Borrador' : 'Guardado';
  const totals       = calcOrderTotals(order.items || []);

  screen.innerHTML = `
    <div class="screen-header" style="background:var(--color-primary);">
      <div class="screen-header-nav">
        <button class="btn-back" id="btn-back">←</button>
        <div>
          <h1>${order.name || 'Detalle de pedido'}</h1>
          <div class="subtitle">${formatDate(order.createdAt)}</div>
        </div>
      </div>
    </div>

    <div class="order-body">
      <!-- Badge de modo -->
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="badge-mode-${isCommercial ? 'commercial' : 'consumer'}">
          ${statusLabel}
        </span>
        <span style="font-size:12px;color:var(--color-text-hint);">${totals.refs} ref. · ${totals.units} uds.</span>
      </div>

      <!-- Ítems: copia estática, siempre legibles aunque el producto se descatalogue -->
      <div class="order-items" id="detail-items"></div>

      <!-- Totales -->
      <div class="order-totals">
        <div>
          <div class="order-totals__label">Referencias</div>
          <div class="order-totals__val">${totals.refs}</div>
        </div>
        <div>
          <div class="order-totals__label">Total unidades</div>
          <div class="order-totals__val">${totals.units}</div>
        </div>
        <div class="order-totals__pvp"><div class="order-totals__label">${totals.complete ? 'PVP estimado archivado' : 'PVP conocido archivado'}</div><div class="order-totals__val">${totals.pricedLines ? formatPvp(totals.pvpCents / 100) : 'No disponible'}</div></div>
      </div>

      ${order.notes ? `
      <div class="card">
        <div style="font-size:12px;color:var(--color-text-hint);margin-bottom:4px;">Observaciones</div>
        <div style="font-size:14px;color:var(--color-text);">${order.notes}</div>
      </div>` : ''}

      <div class="order-pvp-note">PVP orientativo cuando está registrado; no refleja condiciones de empleado. ${totals.missingLines ? `${totals.missingLines} referencias de este pedido no tienen PVP archivado.` : ''}</div>
    </div>

    <!-- Compartir -->
    <div class="order-share-section">
      <div class="share-label">Compartir este pedido</div>
      <div class="share-grid">
        <button class="btn btn-whatsapp btn-sm" id="btn-wa">WhatsApp</button>
        <button class="btn btn-outline btn-sm" id="btn-email">Email</button>
        <button class="btn btn-ghost btn-sm" id="btn-copy">Copiar texto</button>
        <button class="btn btn-ghost btn-sm" id="btn-pdf">PDF</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-secondary btn-full" id="btn-duplicate">Repetir pedido</button>
        <button class="btn btn-ghost btn-sm" id="btn-delete" style="color:var(--color-danger);flex-shrink:0;">🗑</button>
      </div>
    </div>
  `;

  screen.querySelector('#btn-back')?.addEventListener('click', () => Router.push('/historial'));

  /* Renderizar ítems (de la copia estática guardada, no del catálogo actual) */
  const itemsEl = screen.querySelector('#detail-items');
  (order.items || []).forEach(item => {
    const row = document.createElement('div');
    row.className = 'order-item';
    row.innerHTML = `
      <div class="order-item__info" style="flex:1;">
        <div class="order-item__ref">${item.ref}</div>
        <div class="order-item__name">${item.name}</div>
        <div class="order-item__sub">${item.presentation || ''}</div>
        <div class="order-item__pvp">PVP ${formatPvp(item.pvp)}${typeof item.pvp === 'number' ? ` · Línea: ${formatPvp(Math.round(item.pvp * 100) * item.quantity / 100)}` : ''}</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:var(--color-primary);white-space:nowrap;">
        ×${item.quantity}
      </div>
    `;
    itemsEl.appendChild(row);
  });

  const opts = { mode: order.mode, name: order.name, notes: order.notes };

  screen.querySelector('#btn-wa')?.addEventListener('click',    () => Share.whatsapp(order.items, opts));
  screen.querySelector('#btn-email')?.addEventListener('click', () => Share.email(order.items, opts));
  screen.querySelector('#btn-copy')?.addEventListener('click',  () => Share.clipboard(order.items, opts));
  screen.querySelector('#btn-pdf')?.addEventListener('click',   () => Share.pdf(order.items, opts));

  screen.querySelector('#btn-duplicate')?.addEventListener('click', () => _repeatOrder(order));

  screen.querySelector('#btn-delete')?.addEventListener('click', () => {
    Modal.confirm('¿Eliminar este pedido del historial?', async () => {
      await DB.deleteOrder(order.id);
      Toast.show('Pedido eliminado');
      Router.push('/historial');
    });
  });
}

/* Repetir pedido: recuperar referencias activas en la CESTA actual.
   Nunca incorporar productos descatalogados al nuevo pedido. */
function _repeatOrder(order) {
  const requested = order.items || [];
  const lines = requested.map(item => {
    const product = Catalog.getById(item.ref);
    if (!product || (product.status && product.status !== 'active')) return null;
    return { ...product, quantity: Number(item.quantity) || 1 };
  }).filter(Boolean);
  if (!lines.length) {
    Toast.show('Este pedido no contiene productos disponibles actualmente.', 'error');
    return;
  }
  const skipped = requested.length - lines.length;
  const proceed = async () => {
    await Store.replaceOrder(lines);
    if (skipped) Toast.show(`${skipped} referencia(s) descatalogada(s) omitida(s).`, 'info');
    else Toast.success('Pedido cargado en tu cesta.');
    Router.push('/pedido');
  };
  if (Store.getOrderCount()) {
    Modal.confirm('Se sustituirá tu pedido actual por este pedido histórico. ¿Continuar?', proceed);
  } else proceed();
}
