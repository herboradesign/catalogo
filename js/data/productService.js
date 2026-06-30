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
    const base      = Catalog.getAllProducts();
    const overrides = _loadOverrides();
    const map       = new Map(base.map(p => [p.ref, { ...p }]));

    for (const [ref, data] of Object.entries(overrides)) {
      if (data === null) {
        map.delete(ref); // borrado definitivo
      } else if (map.has(ref)) {
        map.set(ref, { ...map.get(ref), ...data }); // edit
      } else {
        map.set(ref, data); // producto nuevo
      }
    }

    return [...map.values()].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
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

  /* Exporta el catálogo completo (base + overrides) como JSON descargable */
  exportJSON() {
    const products = this.getAll();
    const json = JSON.stringify(
      { metadata: { version: new Date().toISOString(), totalProducts: products.length }, products },
      null, 2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `herbora-catalogo-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

/* ── Notificar a las vistas que el catálogo cambió ─────────────── */
function _notify() {
  window.dispatchEvent(new CustomEvent('catalog:updated'));
}
