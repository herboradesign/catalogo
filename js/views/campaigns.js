/* Herbora v1.4 - Campaign library (JPG/PNG/WEBP/PDF) */
import { showNavbar } from '../components/navbar.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function localDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function state(campaign, today) {
  if (campaign.status === 'archived' || campaign.status === 'inactive') return 'archived';
  if (campaign.start_date && campaign.start_date > today) return 'upcoming';
  if (campaign.end_date && campaign.end_date < today) return 'archived';
  return campaign.status === 'upcoming' ? 'upcoming' : 'active';
}
function source(file) {
  const path = String(file.path || '');
  // Only local public assets; disallow dangerous protocols or traversal.
  if (!/^\.\/assets\/campanas\/[a-zA-Z0-9_.-]+\.(?:pdf|jpg|jpeg|png|webp)$/i.test(path)) return '';
  return path;
}
function icon(type) {
  return type === 'pdf' ? '<span class="campaign-pdf">PDF</span>' : '<span class="campaign-image-icon">IMG</span>';
}
function campaignCard(c, status) {
  const files = (Array.isArray(c.files) ? c.files : [])
    .map(f => ({ ...f, safePath: source(f) })).filter(f => f.safePath);
  const cover = files.find(f => /\.(?:jpe?g|png|webp)$/i.test(f.safePath));
  const stateName = { active: 'Activa', upcoming: 'Pr\u00f3ximamente', archived: 'Finalizada' }[status];
  const dateLabel = c.period_label || [c.start_date, c.end_date].filter(Boolean).join(' - ');
  const media = cover ? `<a class="campaign-cover" href="${esc(cover.safePath)}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar ${esc(c.title)}"><img src="${esc(cover.safePath)}" alt="${esc(c.title)}" loading="lazy" decoding="async"><span>Ver creatividad &nearr;</span></a>`
    : `<div class="campaign-cover campaign-cover--pdf"><span class="campaign-cover-symbol">PDF</span><span>Documentos de campa&ntilde;a</span></div>`;
  const buttons = files.map(f => `
    <a class="campaign-file" href="${esc(f.safePath)}" target="_blank" rel="noopener noreferrer">
      ${icon(f.type || f.safePath.split('.').pop().toLowerCase())}
      <span>${esc(f.label || 'Consultar archivo')}</span><span aria-hidden="true">&nearr;</span>
    </a>`).join('');
  return `<article class="campaign-card">
    ${media}
    <div class="campaign-detail">
      <div class="campaign-eyebrow"><span>${esc(c.brand || 'HERBORA')}</span><span class="campaign-state campaign-state--${status}">${stateName}</span></div>
      <h3>${esc(c.title)}</h3>
      ${dateLabel ? `<p class="campaign-period">${esc(dateLabel)}</p>` : ''}
      ${c.description ? `<p class="campaign-description">${esc(c.description)}</p>` : ''}
      <div class="campaign-files">${buttons || '<p>No hay archivos disponibles.</p>'}</div>
    </div>
  </article>`;
}

export async function renderCampaigns() {
  const screen = document.getElementById('screen-campaigns');
  showNavbar(true);
  screen.innerHTML = `<div class="campaign-heading">
    <div class="campaign-eyebrow-heading">RECURSOS COMERCIALES</div>
    <h1>Campa&ntilde;as y ofertas</h1>
    <p>Consulta las creatividades, fichas PDF y promociones disponibles.</p>
  </div><div class="campaign-main"><div class="campaign-state-filter" role="tablist" aria-label="Estado de las campa&ntilde;as">
    <button type="button" data-filter="active" aria-selected="true" class="active">Activas <span id="campaign-count-active"></span></button>
    <button type="button" data-filter="upcoming" aria-selected="false">Pr&oacute;ximas</button>
    <button type="button" data-filter="archived" aria-selected="false">Archivo</button>
  </div><div id="campaign-results" aria-live="polite" class="campaign-grid"><div class="campaign-empty">Cargando campa&ntilde;as...</div></div>
  </div>`;
  let campaigns = [];
  try {
    const response = await fetch('./data/campaigns.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Missing campaign data');
    const raw = await response.json();
    campaigns = Array.isArray(raw.campaigns) ? raw.campaigns : [];
  } catch {
    if (screen.classList.contains('active')) {
      screen.querySelector('#campaign-results').innerHTML = '<div class="campaign-empty">No se pudo cargar el listado de campa&ntilde;as. Comprueba tu conexi&oacute;n.</div>';
    }
    return;
  }
  if (!screen.classList.contains('active')) return;
  const today = localDate();
  const numActive = campaigns.filter(c => state(c, today) === 'active').length;
  screen.querySelector('#campaign-count-active').textContent = numActive ? String(numActive) : '';
  let selected = 'active';
  const emptyMessages = {
    active: 'No hay campa&ntilde;as activas publicadas en este momento.',
    upcoming: 'No hay campa&ntilde;as pr&oacute;ximas publicadas.',
    archived: 'Todav&iacute;a no hay campa&ntilde;as archivadas.',
  };
  function draw() {
    const valid = campaigns.filter(c => state(c, today) === selected)
      .sort((a, b) => String(b.start_date || b.period_label || '').localeCompare(String(a.start_date || a.period_label || '')));
    screen.querySelector('#campaign-results').innerHTML = valid.length
      ? valid.map(c => campaignCard(c, selected)).join('')
      : `<div class="campaign-empty"><div class="campaign-empty-icon">&#9633;</div>${emptyMessages[selected]}<small>Las nuevas promociones aparecer&aacute;n aqu&iacute; cuando se publiquen.</small></div>`;
  }
  screen.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    selected = btn.dataset.filter;
    screen.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    draw();
  }));
  draw();
}
