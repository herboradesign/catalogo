/* Herbora v1.5 GitHub Pages.
   IMPORTANT: Client-side password controls only the interface on this device.
   Public GitHub Pages files/data remain accessible to anyone with the URL. */
const KEY = 'herbora_backoffice_pin_v15';
let unlocked = false;
const bytesToHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
const hexToBytes = hex => new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
async function derive(password, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'}, key, 256);
  return bytesToHex(new Uint8Array(bits));
}
export const Access = {
  isBackofficeUnlocked() { return unlocked; },
  hasBackofficeKey() { return !!localStorage.getItem(KEY); },
  async check() { return { authenticated:true, protected:false, backoffice:unlocked }; },
  async loginBackoffice(password, confirmPassword = '') {
    if (typeof password !== 'string' || password.trim().length < 6) throw new Error('La clave debe tener al menos 6 caracteres.');
    const stored = localStorage.getItem(KEY);
    if (stored) {
      let data;
      try { data=JSON.parse(stored); } catch { throw new Error('Clave local dañada. Usa «Reiniciar clave».'); }
      const hash = await derive(password, hexToBytes(data.salt));
      if (hash !== data.hash) throw new Error('Clave del backoffice incorrecta.');
    } else {
      if (password !== confirmPassword) throw new Error('Las claves no coinciden.');
      const salt=crypto.getRandomValues(new Uint8Array(16));
      localStorage.setItem(KEY, JSON.stringify({ salt:bytesToHex(salt), hash:await derive(password,salt) }));
    }
    unlocked=true;
    return true;
  },
  async logoutBackoffice() { unlocked=false; },
  async logoutGlobal() { unlocked=false; location.hash='#/entrada'; },
  resetBackofficeKey() { unlocked=false; localStorage.removeItem(KEY); },
};
