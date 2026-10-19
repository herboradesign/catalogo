/* Backoffice UI access code, stored locally per browser (not server authentication). */
import { Access } from '../utils/access.js';
import { Store } from '../data/store.js';
import { Router } from '../router/router.js';

export function renderAuth() {
  const screen = document.getElementById('screen-auth');
  const setup = !Access.hasBackofficeKey();
  screen.innerHTML = `
    <div class="auth-header">
      <img src="./assets/logo/herbora-logo-blanco.svg" alt="Herbora" style="width:160px;height:auto;margin-bottom:8px;">
      <h1 style="color:white;font-size:21px;font-weight:700;margin-top:8px;">${setup ? 'Configurar backoffice' : 'Acceso al backoffice'}</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;">${setup ? 'Establece una clave en este navegador.' : 'Introduce tu clave local para abrir el editor.'}</p>
    </div>
    <div class="auth-body">
      <button class="btn btn-ghost btn-sm" id="btn-back-entry" style="align-self:flex-start;">&larr; Volver</button>
      <div class="auth-password-wrap">
        <input class="input" type="password" id="auth-password" placeholder="${setup ? 'Nueva clave (mínimo 6 caracteres)' : 'Clave local de backoffice'}"
          autocomplete="${setup ? 'new-password' : 'current-password'}" style="text-align:center;font-size:16px;">
        <button class="auth-toggle-pw" id="toggle-pw" type="button" aria-label="Mostrar clave">Ver</button>
      </div>
      ${setup ? `<input class="input" type="password" id="auth-confirm" placeholder="Repite la nueva clave" autocomplete="new-password" style="text-align:center;font-size:16px;">` : ''}
      <div id="auth-error" style="display:none" class="auth-error" role="alert"></div>
      <button class="btn btn-primary btn-full btn-lg" id="btn-enter">${setup ? 'Guardar clave y entrar' : 'Entrar al backoffice'}</button>
      <p class="auth-local-note">Esta clave solo restringe el editor en este dispositivo. GitHub Pages es público y no ofrece protección real del catálogo.</p>
      ${!setup ? `<button class="btn btn-ghost btn-sm" id="btn-reset-key" type="button">¿Olvidaste la clave? Reiniciar en este navegador</button>` : ''}
    </div>`;
  const input = screen.querySelector('#auth-password');
  const error = screen.querySelector('#auth-error');
  const enter = screen.querySelector('#btn-enter');
  screen.querySelector('#btn-back-entry').addEventListener('click', () => Router.push('/entrada'));
  screen.querySelector('#toggle-pw').addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    const confirm = screen.querySelector('#auth-confirm'); if (confirm) confirm.type = input.type;
  });
  async function login() {
    enter.disabled = true;
    enter.textContent = 'Verificando...';
    error.style.display = 'none';
    try {
      await Access.loginBackoffice(input.value, screen.querySelector('#auth-confirm')?.value || '');
      await Store.setUserMode('commercial');
      Router.push('/buscar');
    } catch (e) {
      error.textContent = e.message || 'No se pudo verificar la clave.';
      error.style.display = 'block';
      input.value = '';
      input.focus();
    } finally {
      enter.disabled = false;
      enter.textContent = setup ? 'Guardar clave y entrar' : 'Entrar al backoffice';
    }
  }
  enter.addEventListener('click', login);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  screen.querySelector('#auth-confirm')?.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  screen.querySelector('#btn-reset-key')?.addEventListener('click', () => {
    if (window.confirm('Reiniciar la clave local del backoffice de este navegador. No se borran productos ni pedidos. ¿Continuar?')) {
      Access.resetBackofficeKey(); renderAuth();
    }
  });
  setTimeout(() => input.focus(), 100);
}
