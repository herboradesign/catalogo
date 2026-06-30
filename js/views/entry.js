/* =============================================================
   Herbora Sales App — Vista: Pantalla de bienvenida v4
   Pantalla independiente, no forma parte del flujo de scroll.
   ============================================================= */

import { Store }    from '../data/store.js';
import { Router }   from '../router/router.js';

export function renderEntry() {
  const screen = document.getElementById('screen-entry');

  screen.innerHTML = `
    <div class="entry-hero">
      <img
        class="entry-logo-img"
        src="./assets/logo/herbora-logo-blanco.svg"
        alt="Herbora"
        onerror="this.style.display='none';document.getElementById('entry-logo-text').style.display='block'"
      >
      <span id="entry-logo-text" style="display:none;font-size:45px;font-weight:700;color:white;letter-spacing:-1px;">herbora</span>
      <p class="entry-tagline">Desde 1981</p>
    </div>
    <div class="entry-actions">
      <p class="entry-actions-title">¿Cómo quieres acceder?</p>
      <button class="btn btn-secondary btn-full btn-lg" id="btn-consumer">
        Consultar catálogo
      </button>
      <button class="btn btn-ghost btn-full" id="btn-commercial" style="margin-top:4px;">
        🔒 Área registrada
      </button>
      <p class="entry-version">Herbora Sales App · v1.0</p>
    </div>
  `;

  screen.querySelector('#btn-consumer').addEventListener('click', async () => {
    await Store.setUserMode('consumer');
    Router.push('/catalogo');
  });

  screen.querySelector('#btn-commercial').addEventListener('click', () => {
    Router.push('/auth');
  });
}
