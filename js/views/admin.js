/* =============================================================
   Herbora Sales App — Panel de gestión de productos (Área empleado)
   Solo accesible con Store.isCommercial() === true.
   Rutas:
     /admin           → Dashboard admin
     /admin/nuevo     → Crear producto
     /admin/editar/:ref → Editar producto
   ============================================================= */

import { ProductService } from '../data/productService.js';
import { Store }          from '../data/store.js';
import { Router }         from '../router/router.js';
import { Toast }          from '../components/toast.js';
import { Modal }          from '../components/modal.js';
import { showNavbar, showTopbar } from '../components/navbar.js';

/* ════════════════════════════════════════════════════════════
   DASHBOARD ADMIN
   ════════════════════════════════════════════════════════════ */
export function renderAdmin() {
  if (!Store.isCommercial()) { Router.push('/catalogo'); return; }

  const screen = document.getElementById('screen-admin');
  showNavbar(true);
  showTopbar(true);

  const stats    = ProductService.getStats();
  const products = ProductService.getAll();

  screen.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-top">
        <div>
          <h1 class="admin-title">Panel de gestión</h1>
          <p class="admin-subtitle">Área empleado · Catálogo Herbora</p>
        </div>
        <button class="admin-btn-primary" id="btn-new-product">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          Nuevo producto
        </button>
      </div>

      <!-- Stats -->
      <div class="admin-stats-row">
        <div class="admin-stat">
          <div class="admin-stat-n">${stats.active}</div>
          <div class="admin-stat-l">Activos</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat-n admin-stat-n--draft">${stats.draft}</div>
          <div class="admin-stat-l">Borradores</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat-n admin-stat-n--disc">${stats.discontinued}</div>
          <div class="admin-stat-l">Descatalogados</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat-n admin-stat-n--mod">${stats.modified}</div>
          <div class="admin-stat-l">Modificados</div>
        </div>
      </div>
    </div>

    <!-- Acciones rápidas de datos -->
    <div class="admin-data-bar">
      <button class="admin-btn-ghost" id="btn-export">
        ↓ Exportar JSON
      </button>
      <label class="admin-btn-ghost" style="cursor:pointer;">
        ↑ Importar JSON
        <input type="file" id="input-import" accept=".json" style="display:none">
      </label>
      <button class="admin-btn-ghost admin-btn-ghost--danger" id="btn-reset-overrides"
        title="Volver al catálogo original (descarta todos los cambios locales)">
        ↺ Resetear cambios
      </button>
    </div>

    <!-- Buscador -->
    <div class="admin-search-bar">
      <div class="admin-search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-hint);">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input class="admin-search" id="admin-search" type="search"
          placeholder="Buscar por nombre, REF, marca…">
      </div>
      <div class="admin-filter-row">
        <select class="admin-select" id="filter-status">
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="draft">Borradores</option>
          <option value="discontinued">Descatalogados</option>
        </select>
        <select class="admin-select" id="filter-brand">
          <option value="">Todas las marcas</option>
          ${[...new Set(products.map(p => p.brand).filter(Boolean))].sort()
            .map(b => `<option value="${_esc(b)}">${_esc(b)}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Tabla de productos -->
    <div class="admin-table-wrap">
      <table class="admin-table" id="admin-table">
        <thead>
          <tr>
            <th style="width:40%">Producto</th>
            <th style="width:12%">REF</th>
            <th style="width:15%">Marca</th>
            <th style="width:12%">Estado</th>
            <th style="width:21%">Acciones</th>
          </tr>
        </thead>
        <tbody id="admin-tbody"></tbody>
      </table>
      <div id="admin-empty" style="display:none;padding:40px;text-align:center;color:var(--color-text-hint);">
        Sin resultados
      </div>
    </div>
  `;

  // Renderizar tabla inicial
  _renderTable(products);

  // Buscador + filtros
  let filtered = products;
  function applyFilters() {
    const q      = screen.querySelector('#admin-search').value.toLowerCase().trim();
    const status = screen.querySelector('#filter-status').value;
    const brand  = screen.querySelector('#filter-brand').value;

    filtered = products.filter(p => {
      const text = [p.name, p.ref, p.brand, p.line].join(' ').toLowerCase();
      return (!q || text.includes(q))
          && (!status || (p.status || 'active') === status)
          && (!brand  || p.brand === brand);
    });
    _renderTable(filtered);
  }

  screen.querySelector('#admin-search')?.addEventListener('input', applyFilters);
  screen.querySelector('#filter-status')?.addEventListener('change', applyFilters);
  screen.querySelector('#filter-brand')?.addEventListener('change', applyFilters);

  // Nuevo producto
  screen.querySelector('#btn-new-product')?.addEventListener('click', () => {
    Router.push('/admin/nuevo');
  });

  // Exportar
  screen.querySelector('#btn-export')?.addEventListener('click', () => {
    ProductService.exportJSON();
    Toast.show('Catálogo exportado como JSON', 'success');
  });

  // Importar
  screen.querySelector('#input-import')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const count = await ProductService.importJSON(file);
      Toast.show(`${count} productos importados`, 'success');
      Router.push('/admin');
    } catch (err) {
      Toast.show('Error al importar: ' + err.message, 'error');
    }
  });

  // Resetear overrides
  screen.querySelector('#btn-reset-overrides')?.addEventListener('click', () => {
    Modal.confirm(
      '¿Descartar todos los cambios locales y volver al catálogo original?',
      () => {
        ProductService.resetOverrides();
        Toast.show('Cambios locales descartados', 'info');
        Router.push('/admin');
      }
    );
  });

  // Delegación de eventos en tabla
  screen.querySelector('#admin-tbody')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const ref    = btn.dataset.ref;
    const action = btn.dataset.action;
    _handleTableAction(action, ref);
  });
}

function _renderTable(products) {
  const tbody = document.getElementById('admin-tbody');
  const empty = document.getElementById('admin-empty');
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = products.map(p => {
    const status    = p.status || 'active';
    const statusCls = { active: 'admin-badge--active', draft: 'admin-badge--draft', discontinued: 'admin-badge--disc' }[status] || '';
    const statusLbl = { active: 'Activo', draft: 'Borrador', discontinued: 'Descatalogado' }[status] || status;
    const modified  = p._modified ? '✏️' : '';

    return `
      <tr class="admin-tr${status === 'discontinued' ? ' admin-tr--disc' : ''}">
        <td class="admin-td">
          <div class="admin-product-name">${_esc(p.name)} ${modified}</div>
          <div class="admin-product-sub">${_esc(p.line || '')}</div>
        </td>
        <td class="admin-td admin-td-mono">${_esc(p.ref)}</td>
        <td class="admin-td">${_esc(p.brand || '—')}</td>
        <td class="admin-td">
          <span class="admin-badge ${statusCls}">${statusLbl}</span>
        </td>
        <td class="admin-td admin-actions-cell">
          <button class="admin-action-btn" data-action="view"       data-ref="${_esc(p.ref)}" title="Ver ficha">👁</button>
          <button class="admin-action-btn" data-action="edit"       data-ref="${_esc(p.ref)}" title="Editar">✏️</button>
          <button class="admin-action-btn" data-action="duplicate"  data-ref="${_esc(p.ref)}" title="Duplicar">⎘</button>
          ${status !== 'discontinued'
            ? `<button class="admin-action-btn admin-action-btn--warn" data-action="discontinue" data-ref="${_esc(p.ref)}" title="Descatalogar">⊘</button>`
            : `<button class="admin-action-btn admin-action-btn--ok"   data-action="reactivate"  data-ref="${_esc(p.ref)}" title="Reactivar">✓</button>`
          }
          <button class="admin-action-btn admin-action-btn--danger" data-action="delete" data-ref="${_esc(p.ref)}" title="Eliminar">🗑</button>
        </td>
      </tr>`;
  }).join('');
}

function _handleTableAction(action, ref) {
  switch (action) {
    case 'view':
      Router.push(`/producto/${ref}`);
      break;
    case 'edit':
      Router.push(`/admin/editar/${ref}`);
      break;
    case 'duplicate':
      try {
        const copy = ProductService.duplicate(ref);
        Toast.show(`Duplicado como "${copy.name}"`, 'success');
        Router.push(`/admin/editar/${copy.ref}`);
      } catch (e) { Toast.show(e.message, 'error'); }
      break;
    case 'discontinue':
      Modal.confirm(
        '¿Descatalogar este producto? Seguirá visible para empleados.',
        () => {
          try {
            ProductService.discontinue(ref);
            Toast.show('Producto descatalogado', 'info');
            Router.push('/admin');
          } catch (e) { Toast.show(e.message, 'error'); }
        }
      );
      break;
    case 'reactivate':
      try {
        ProductService.reactivate(ref);
        Toast.show('Producto reactivado', 'success');
        Router.push('/admin');
      } catch (e) { Toast.show(e.message, 'error'); }
      break;
    case 'delete':
      Modal.confirm(
        `¿Eliminar definitivamente este producto? Esta acción no se puede deshacer.`,
        () => {
          try {
            ProductService.delete(ref);
            Toast.show('Producto eliminado', 'info');
            Router.push('/admin');
          } catch (e) { Toast.show(e.message, 'error'); }
        },
        { danger: true }
      );
      break;
  }
}

/* ════════════════════════════════════════════════════════════
   FORMULARIO DE PRODUCTO (nuevo / editar)
   ════════════════════════════════════════════════════════════ */
export function renderProductForm(route) {
  if (!Store.isCommercial()) { Router.push('/catalogo'); return; }

  const screen  = document.getElementById('screen-admin');
  showNavbar(true);
  showTopbar(true);

  const ref     = route?.params?.ref;
  const isEdit  = !!ref;
  const product = isEdit ? (ProductService.getByRef(ref) || {}) : {};
  const title   = isEdit ? `Editar: ${product.name || ref}` : 'Nuevo producto';

  screen.innerHTML = `
    <div class="admin-form-header">
      <button class="admin-back-btn" id="btn-form-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Volver al panel
      </button>
      <h1 class="admin-form-title">${_esc(title)}</h1>
    </div>

    <form class="admin-form" id="product-form" autocomplete="off">

      <!-- ── SECCIÓN: IDENTIFICACIÓN ── -->
      <div class="admin-form-section">
        <h2 class="admin-section-title">Identificación</h2>
        <div class="admin-field-grid">
          ${_field('Nombre del producto *', 'name',         product.name,         'text',   true)}
          ${_field('Referencia *',          'ref',          product.ref,          'text',   !isEdit)}
          ${_field('EAN',                   'ean13',        product.ean13,        'text')}
          ${_field('Marca',                 'brand',        product.brand,        'text')}
          ${_field('Línea / Gama',          'line',         product.line,         'text')}
          ${_field('Formato',               'format',       product.format,       'text')}
          ${_field('Presentación / Dosis',  'presentation', product.presentation, 'text')}
          <div class="admin-field">
            <label class="admin-label">Estado</label>
            <select class="admin-input" name="status">
              <option value="active"       ${(product.status||'active')==='active'       ?'selected':''}>Activo</option>
              <option value="draft"        ${(product.status||'active')==='draft'        ?'selected':''}>Borrador</option>
              <option value="discontinued" ${(product.status||'active')==='discontinued' ?'selected':''}>Descatalogado</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ── SECCIÓN: IMAGEN ── -->
      <div class="admin-form-section">
        <h2 class="admin-section-title">Imagen principal</h2>
        <div class="admin-field">
          <label class="admin-label">URL de imagen</label>
          <input class="admin-input" name="image" type="url"
            placeholder="https://herbora.es/storage/..."
            value="${_esc(product.image || '')}">
          ${product.image ? `<img src="${_esc(product.image)}" alt="" class="admin-img-preview" id="img-preview" onerror="this.style.display='none'">` : '<img class="admin-img-preview" id="img-preview" style="display:none">'}
        </div>
      </div>

      <!-- ── SECCIÓN: CONTENIDO TÉCNICO (accordions) ── -->
      <div class="admin-form-section">
        <h2 class="admin-section-title">Contenido técnico</h2>

        ${_textarea('Ingredientes principales',           'accordions.ingredientes_principales',  _accVal(product, 'ingredientes_principales'))}
        ${_textarea('Propiedades e indicaciones',          'accordions.propiedades_e_indicaciones', _accVal(product, 'propiedades_e_indicaciones'))}
        ${_textarea('Modo de uso',                         'accordions.modo_de_uso',               _accVal(product, 'modo_de_uso'))}
        ${_textarea('Advertencias y contraindicaciones',   'accordions.advertencias',              _accVal(product, 'advertencias'))}
        ${_textarea('Otros ingredientes',                  'accordions.otros_ingredientes',        _accVal(product, 'otros_ingredientes'))}
      </div>

      <!-- ── SECCIÓN: FÓRMULA ── -->
      <div class="admin-form-section">
        <h2 class="admin-section-title">Fórmula</h2>
        <div class="admin-field">
          <label class="admin-label">Título de la fórmula</label>
          <input class="admin-input" name="formula_title"
            placeholder="POR 1 CÁPSULA (DOSIS DIARIA)"
            value="${_esc(product.formula_table?.title || product.formula_table?.headers?.[0] || '')}">
        </div>
        <div class="admin-formula-editor" id="formula-editor">
          <!-- Filas dinámicas -->
        </div>
        <button type="button" class="admin-btn-ghost" id="btn-add-formula-row" style="margin-top:8px;">
          + Añadir ingrediente activo
        </button>
        <div class="admin-field" style="margin-top:12px;">
          <label class="admin-label">Notas (VRN, etc.)</label>
          <input class="admin-input" name="formula_notes"
            value="${_esc(product.formula_table?.notes || '')}">
        </div>
        <div class="admin-field" style="margin-top:12px;">
          <label class="admin-label">Otros ingredientes (excipientes)</label>
          <textarea class="admin-input admin-textarea" name="other_ingredients" rows="2"
            placeholder="Agente de carga...">${_esc(product.other_ingredients || '')}</textarea>
        </div>
      </div>

      <!-- ── ACCIONES ── -->
      <div class="admin-form-actions">
        <button type="button" class="admin-btn-secondary" id="btn-form-cancel">Cancelar</button>
        <button type="button" class="admin-btn-ghost"    id="btn-save-draft">Guardar como borrador</button>
        <button type="submit"  class="admin-btn-primary">Guardar y publicar</button>
      </div>

    </form>
  `;

  // Previsualización de imagen
  screen.querySelector('[name="image"]')?.addEventListener('input', e => {
    const img = screen.querySelector('#img-preview');
    if (img) { img.src = e.target.value; img.style.display = e.target.value ? '' : 'none'; }
  });

  // Editor de fórmula
  const formulaRows = (product.formula_table?.rows || []);
  const editorEl = screen.querySelector('#formula-editor');
  formulaRows.forEach(row => _addFormulaRow(editorEl, row.ingrediente || row.name || '', row.cantidad || row.amount || ''));
  if (!formulaRows.length) _addFormulaRow(editorEl, '', '');

  screen.querySelector('#btn-add-formula-row')?.addEventListener('click', () => {
    _addFormulaRow(editorEl, '', '');
  });

  // Botones formulario
  screen.querySelector('#btn-form-back')?.addEventListener('click',   () => Router.push('/admin'));
  screen.querySelector('#btn-form-cancel')?.addEventListener('click', () => Router.push('/admin'));

  screen.querySelector('#btn-save-draft')?.addEventListener('click', () => {
    _submitForm(screen, product, isEdit, 'draft');
  });
  screen.querySelector('#product-form')?.addEventListener('submit', e => {
    e.preventDefault();
    _submitForm(screen, product, isEdit, 'active');
  });
}

/* ── Añadir fila al editor de fórmula ─────────────────────────── */
function _addFormulaRow(container, ingredient = '', amount = '') {
  const row = document.createElement('div');
  row.className = 'admin-formula-row';
  row.innerHTML = `
    <input class="admin-input formula-ingredient" type="text"
      placeholder="Ingrediente activo" value="${_esc(ingredient)}"
      style="flex:2">
    <input class="admin-input formula-amount" type="text"
      placeholder="Cantidad (ej: 100 mg)" value="${_esc(amount)}"
      style="flex:1">
    <button type="button" class="admin-action-btn admin-action-btn--danger formula-del"
      title="Eliminar fila" style="flex-shrink:0">×</button>
  `;
  row.querySelector('.formula-del')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

/* ── Recoger y guardar formulario ─────────────────────────────── */
function _submitForm(screen, original, isEdit, forcedStatus) {
  const form = screen.querySelector('#product-form');
  if (!form) return;
  const fd = new FormData(form);

  const ref = fd.get('ref')?.trim();
  if (!ref) { Toast.show('La referencia es obligatoria', 'error'); return; }

  const name = fd.get('name')?.trim();
  if (!name) { Toast.show('El nombre es obligatorio', 'error'); return; }

  // Recoger filas de fórmula
  const rows = [];
  form.querySelectorAll('.admin-formula-row').forEach(row => {
    const ing = row.querySelector('.formula-ingredient')?.value.trim();
    const amt = row.querySelector('.formula-amount')?.value.trim();
    if (ing) rows.push({ ingrediente: ing, cantidad: amt || '' });
  });

  const product = {
    ...(isEdit ? original : {}),
    ref,
    id:           ref,
    name,
    ean13:        fd.get('ean13')?.trim()        || original?.ean13        || '',
    brand:        fd.get('brand')?.trim()        || original?.brand        || '',
    line:         fd.get('line')?.trim()         || original?.line         || '',
    format:       fd.get('format')?.trim()       || original?.format       || '',
    presentation: fd.get('presentation')?.trim() || original?.presentation || '',
    image:        fd.get('image')?.trim()        || original?.image        || '',
    status:       forcedStatus || fd.get('status') || 'active',
    other_ingredients: fd.get('other_ingredients')?.trim() || '',

    accordions: {
      ingredientes_principales:    fd.get('accordions.ingredientes_principales')?.trim()  || '',
      propiedades_e_indicaciones:  fd.get('accordions.propiedades_e_indicaciones')?.trim() || '',
      modo_de_uso:                 fd.get('accordions.modo_de_uso')?.trim()               || '',
      advertencias:                fd.get('accordions.advertencias')?.trim()              || '',
      otros_ingredientes:          fd.get('accordions.otros_ingredientes')?.trim()        || '',
    },

    formula_table: rows.length ? {
      title:  fd.get('formula_title')?.trim() || '',
      rows,
      notes:  fd.get('formula_notes')?.trim() || '',
    } : null,
  };

  try {
    ProductService.save(product);
    Toast.show(
      forcedStatus === 'draft' ? 'Borrador guardado' : 'Producto publicado',
      'success'
    );
    Router.push('/admin');
  } catch (e) {
    Toast.show('Error al guardar: ' + e.message, 'error');
  }
}

/* ── Helpers ───────────────────────────────────────────────────── */
function _accVal(product, key) {
  return product?.accordions?.[key] || '';
}

function _field(label, name, value = '', type = 'text', required = false) {
  return `
    <div class="admin-field">
      <label class="admin-label">${_esc(label)}</label>
      <input class="admin-input" name="${name}" type="${type}"
        value="${_esc(value || '')}"
        ${required ? 'required' : ''}
        ${name === 'ref' && value ? 'readonly' : ''}>
    </div>`;
}

function _textarea(label, name, value = '') {
  return `
    <div class="admin-field">
      <label class="admin-label">${_esc(label)}</label>
      <textarea class="admin-input admin-textarea" name="${name}" rows="3">${_esc(value)}</textarea>
    </div>`;
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
