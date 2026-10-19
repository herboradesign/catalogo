/* =============================================================
   Herbora Sales App — Vista: Ficha de producto
   ============================================================= */

import { Catalog }           from '../data/catalog.js';
import { Store }             from '../data/store.js';
import { renderProductSheet } from '../components/product-sheet.js';
import { EmptyStates }       from '../components/empty-state.js';
import { Router }            from '../router/router.js';

export async function renderProduct(route) {
  const ref    = route?.params?.ref || '';
  const screen = document.getElementById('screen-product');

  if (ref) Store.addRecentlyViewed(ref);

  const product = Catalog.getById(ref);

  if (!product || product.status === 'draft') {
    screen.innerHTML = '';
    screen.appendChild(EmptyStates.noProducts(() => Router.push('/catalogo')));
    return;
  }

  /* renderProductSheet es async (carga datos de fichas técnicas) */
  await renderProductSheet(product, screen);
}
