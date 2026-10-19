/* =============================================================
   Herbora Sales App — Utilidades de formateo
   Fechas, texto, generación de resumen de pedido
   ============================================================= */

/* ── Precios públicos PVP: nunca incluir PVT o precio empleado en Pages. ── */
export function hasPvp(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
export function formatPvp(value) {
  return hasPvp(value) ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value) : 'Precio pendiente';
}
export function pvpCents(value) { return hasPvp(value) ? Math.round(value * 100) : null; }

/* ── Formatear fecha ────────────────────────────────────── */
export function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

export function formatDateShort(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

/* ── Truncar texto ──────────────────────────────────────── */
export function truncate(text, maxLen = 60) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text;
}

/* ── Normalizar texto para búsqueda ─────────────────────── */
export function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* ── Unidades (singular/plural) ─────────────────────────── */
export function units(qty) {
  return qty === 1 ? '1 unidad' : `${qty} unidades`;
}

/* ── Generar texto del resumen de pedido ────────────────── */
export function buildOrderText(order, mode = 'commercial') {
  if (mode === 'personal') return buildPersonalOrderText(order);
  const isCommercial = mode === 'commercial';
  const lines = [];

  /* Encabezado */
  lines.push('Resumen de pedido Herbora');
  lines.push(`Fecha: ${formatDate()}`);
  if (order.name) lines.push(`Nombre: ${order.name}`);
  lines.push('');

  /* Productos */
  for (const item of order.items) {
    lines.push(`REF ${item.ref} | ${item.name} | ${units(item.quantity)} | PVP ${formatPvp(item.pvp)}${hasPvp(item.pvp) ? ` | ${formatPvp(Math.round(item.pvp * 100) * item.quantity / 100)}` : ''}`);
  }

  /* Totales */
  const totalRefs  = order.items.length;
  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
  lines.push('');
  lines.push(`Total referencias: ${totalRefs}`);
  lines.push(`Total unidades: ${totalUnits}`);
  const pvpTotals = calcOrderTotals(order.items);
  lines.push(`${pvpTotals.complete ? 'Total PVP estimado' : 'Subtotal PVP conocido'}: ${pvpTotals.pricedLines ? formatPvp(pvpTotals.pvpCents / 100) : 'No disponible'}`);
  if (pvpTotals.missingLines) lines.push(`${pvpTotals.missingLines} referencia(s) sin PVP, subtotal incompleto.`);
  lines.push('PVP orientativo, no es la condición de compra del empleado.');

  /* Observaciones */
  if (order.notes && order.notes.trim()) {
    lines.push('');
    lines.push(`Observaciones: ${order.notes.trim()}`);
  }

  /* Aviso modo consulta (PVP visible, condiciones particulares no incluidas). */
  if (!isCommercial) {
    lines.push('');
    lines.push('Para compras y condiciones finales, consultar con tu distribuidor Herbora.');
  }

  lines.push('');
  lines.push('Generado con Herbora Sales App');

  return lines.join('\n');
}

/* ── Pedido personal interno Herbora ─────────────────────── */
export function buildPersonalOrderText(order) {
  const lines = [
    'Hola,', '', 'Os envío mi pedido personal Herbora.', '',
    `Solicitante: ${order.name || 'Sin indicar'}`,
    `Fecha: ${formatDateShort()}`, '', 'PRODUCTOS',
  ];
  for (const item of order.items || []) {
    const unitPrice = hasPvp(item.pvp) ? formatPvp(item.pvp) : 'PVP pendiente';
    const linePrice = hasPvp(item.pvp) ? formatPvp(Math.round(item.pvp * 100) * item.quantity / 100) : '—';
    lines.push(`${item.ref} | ${item.name} | ${item.quantity} ${item.quantity === 1 ? 'ud.' : 'uds.'} | ${unitPrice}/ud. | ${linePrice}`);
  }
  const totals = calcOrderTotals(order.items || []);
  lines.push('', `Total: ${totals.refs} referencias · ${totals.units} unidades`);
  lines.push(`${totals.missingLines ? 'Subtotal PVP conocido' : 'Total PVP estimado'}: ${totals.pricedLines ? formatPvp(totals.pvpCents / 100) : 'No disponible'}`);
  if (totals.missingLines) lines.push(`PVP pendiente en ${totals.missingLines} referencia(s); total incompleto.`);
  lines.push('PVP de referencia del catálogo. El precio final del pedido interno lo confirma Herbora.');
  if (order.notes?.trim()) lines.push('', `Observaciones: ${order.notes.trim()}`);
  lines.push('', 'Gracias.');
  return lines.join('\n');
}

/* ── Asunto de email ────────────────────────────────────── */
export function buildEmailSubject(mode = 'commercial', name = '') {
  if (mode === 'personal') {
    const safeName = String(name || 'Empleado').replace(/[\r\n]+/g, ' ').trim().slice(0, 70);
    return `PEDIDO PERSONAL HERBORA | ${safeName} | ${formatDateShort()}`;
  }
  return 'Resumen de pedido Herbora';
}

/* ── Highlight de texto de búsqueda ─────────────────────── */
export function highlight(text, query) {
  if (!query || !text) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

/* ── Extraer texto de productos para historial preview ───── */
export function previewProducts(items, max = 3) {
  if (!items || items.length === 0) return '—';
  const names = items.slice(0, max).map(i => i.name);
  if (items.length > max) names.push(`+${items.length - max} más`);
  return names.join(', ');
}

/* ── Calcular totales de pedido ─────────────────────────── */
export function calcOrderTotals(items) {
  const result = { refs: items.length, units: 0, pvpCents: 0, pricedLines: 0, missingLines: 0, missingUnits: 0 };
  for (const item of items) {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    result.units += quantity;
    const unitCents = pvpCents(item.pvp);
    if (unitCents === null) { result.missingLines++; result.missingUnits += quantity; }
    else { result.pricedLines++; result.pvpCents += unitCents * quantity; }
  }
  result.complete = result.missingLines === 0;
  return result;
}
