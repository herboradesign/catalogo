/* =============================================================
   Herbora Sales App — ProductService
   Capa de abstracción de datos de producto.

   FASE 1 (actual): localStorage + IndexedDB
   FASE 2 (futura): sustituir los métodos _save/_load/_delete
   por llamadas a Firebase / Supabase / API REST.
   Solo cambia esta capa — las vistas no tocan nada.
   ============================================================= */

import { Catalog } from './catalog.js';

const LS_KEY = 'herbora_product_overrides'; // { [ref]: product | null }

/* ── Leer overrides de localStorage ────────────────────────────── */
function _loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch { return {}; }
}

/* ── Guardar overrides en localStorage ─────────────────────────── */
function _saveOverrides(overrides) {
  localStorage.setItem(LS_KEY, JSON.stringify(overrides));
}

/* ─── API PÚBLICA ─────────────────────────────────────────────── */
export const ProductService = {

  /* Devuelve todos los productos (catálogo base + overrides localStorage) */
  getAll() {
    return Catalog.getAllProducts()
      .map(p => ({ ...p }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  },

  /* Un solo producto */
  getByRef(ref) {
    return this.getAll().find(p => p.ref === ref) || null;
  },

  /* Crear o editar producto */
  save(product) {
    if (!product.ref) throw new Error('El producto necesita una REF');
    const overrides = _loadOverrides();
    // Marcar timestamp de modificación
    overrides[product.ref] = { ...product, _modified: Date.now() };
    _saveOverrides(overrides);
    _notify();
    return product;
  },

  /* Descatalogar (status = discontinued) */
  discontinue(ref) {
    const product = this.getByRef(ref);
    if (!product) throw new Error(`Producto ${ref} no encontrado`);
    return this.save({ ...product, status: 'discontinued' });
  },

  /* Reactivar un producto descatalogado */
  reactivate(ref) {
    const product = this.getByRef(ref);
    if (!product) throw new Error(`Producto ${ref} no encontrado`);
    return this.save({ ...product, status: 'active' });
  },

  /* Borrar definitivamente */
  delete(ref) {
    const overrides = _loadOverrides();
    overrides[ref] = null;
    _saveOverrides(overrides);
    _notify();
  },

  /* Duplicar producto */
  duplicate(ref) {
    const source = this.getByRef(ref);
    if (!source) throw new Error(`Producto ${ref} no encontrado`);
    const newRef = 'NEW_' + Date.now();
    const copy = {
      ...source,
      ref:    newRef,
      id:     newRef,
      name:   source.name + ' (copia)',
      status: 'draft',
      _modified: Date.now(),
    };
    const overrides = _loadOverrides();
    overrides[newRef] = copy;
    _saveOverrides(overrides);
    _notify();
    return copy;
  },

  /* Estadísticas para el dashboard admin */
  getStats() {
    const all = this.getAll();
    return {
      total:        all.length,
      active:       all.filter(p => p.status === 'active' || !p.status).length,
      draft:        all.filter(p => p.status === 'draft').length,
      discontinued: all.filter(p => p.status === 'discontinued').length,
      modified:     Object.keys(_loadOverrides()).filter(k => _loadOverrides()[k] !== null).length,
    };
  },

  /* ── EXPORTAR / IMPORTAR ──────────────────────────────────────── */

  /* Exporta products.json + catalog-version.json listos para sustituir en /data */
  exportJSON() {
    const products = this.getAll().map(({ _modified, ...p }) => p);
    const now = new Date();
    const version = `${now.toISOString().slice(0,10)}-editor-${now.getTime()}`;
    const data = {
      metadata: {
        version,
        updatedAt: now.toISOString(),
        totalProducts: products.length,
        catalogTitle: 'Catálogo comercial Herbora',
        changelog: 'Actualización generada desde el editor de productos del área empleado.'
      },
      products,
    };

    _downloadJSON('products.json', data);
    /* Segundo archivo: fuerza a las PWA instaladas a detectar la actualización. */
    setTimeout(() => _downloadJSON('catalog-version.json', { version }), 250);
  },

  /* Importa un JSON y lo aplica como override completo */
  async importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data     = JSON.parse(e.target.result);
          const products = Array.isArray(data) ? data : (data.products || []);
          if (!products.length) throw new Error('JSON sin productos');

          const overrides = _loadOverrides();
          products.forEach(p => {
            if (p.ref) overrides[p.ref] = { ...p, _modified: Date.now() };
          });
          _saveOverrides(overrides);
          _notify();
          resolve(products.length);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },

  /* Resetear todos los overrides (volver al catálogo original) */
  resetOverrides() {
    localStorage.removeItem(LS_KEY);
    _notify();
  },

  /* Cuántos productos tiene modificados el empleado */
  getOverridesCount() {
    return Object.keys(_loadOverrides()).length;
  },
};

function _downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Notificar a las vistas que el catálogo cambió ─────────────── */
function _notify() {
  window.dispatchEvent(new CustomEvent('catalog:updated'));
}
