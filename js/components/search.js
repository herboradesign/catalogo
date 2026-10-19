/* =============================================================
   Herbora — motor de búsqueda local v1.3
   Relevancia: REF/EAN > nombre > marca/línea > ingredientes > uso.
   Sin servicios externos; funciona offline y con altas del editor.
   ============================================================= */

const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'para', 'con', 'y', 'en', 'un', 'una', 'por']);

/* Sinónimos orientativos de necesidades, no categorías fijas del catálogo. */
const GROUPS = [
  ['vitamina', 'vitaminas', 'vit', 'multivitaminico', 'multivitaminas'],
  ['digestion', 'digestivo', 'digestiva', 'estomago', 'gases', 'hinchazon', 'pesadez', 'barriga'],
  ['articulacion', 'articulaciones', 'articular', 'movilidad', 'juntas'],
  ['cansancio', 'fatiga', 'energia', 'vitalidad'],
  ['defensas', 'inmunidad', 'inmunitario', 'inmune'],
  ['sueño', 'sueno', 'descanso', 'dormir'],
  ['calcio', 'hueso', 'huesos', 'oseo', 'osea'],
  ['cabello', 'pelo', 'capilar'],
  ['piel', 'cutaneo', 'cutanea', 'derma'],
  ['estres', 'nervios', 'relajacion', 'calma'],
];

const NORMAL_GROUPS = GROUPS.map(g => g.map(normalizeSearchText));

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
}

function tokens(text) {
  return normalizeSearchText(text).split(' ').filter(t => t && !STOP_WORDS.has(t));
}

function variants(term) {
  const group = NORMAL_GROUPS.find(g => g.includes(term));
  return group ? group.filter(t => t !== term) : [];
}

function editDistanceAtMostOne(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, differences = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++differences > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return differences + (a.length - i) + (b.length - j) <= 1;
}

function strength(query, field, fieldTokens, allowFuzzy = true) {
  if (!field) return 0;
  if (field === query) return 1.65;
  if (fieldTokens.includes(query)) return 1.25;
  if (field.startsWith(query)) return 1.1;
  if (fieldTokens.some(t => t.startsWith(query))) return 0.95;
  if (field.includes(query)) return 0.78;
  const alternates = variants(query);
  if (alternates.some(t => fieldTokens.includes(t))) return 0.55;
  if (alternates.some(t => fieldTokens.some(word => word.startsWith(t)))) return 0.43;
  if (allowFuzzy && query.length >= 5 && fieldTokens.some(t =>
    t.length >= 5 && editDistanceAtMostOne(query, t))) return 0.45;
  return 0;
}

function fieldsFor(p) {
  return [
    [p.ref, 155, false], [p.ean13, 160, false],
    [p.name, 82, true], [p.brand, 34, true], [p.line, 31, true],
    [p.main_ingredients, 24, true],
    [p.presentation, 15, true], [p.format, 13, true],
    [p.properties, 9, true], [p.indications, 8, true],
    [p.usage, 6, true],
    [p.accordions?.ingredientes_principales, 16, true],
    [p.accordions?.propiedades_e_indicaciones, 6, true],
  ].map(([value, weight, fuzzy]) => {
    const text = normalizeSearchText(value);
    return { text, words: text.split(' ').filter(Boolean), weight, fuzzy };
  });
}

export function rankProducts(products, query) {
  const phrase = normalizeSearchText(query);
  if (!phrase) return [...products];
  const qTokens = tokens(phrase);
  if (!qTokens.length) return [...products];

  const results = [];
  for (const product of products) {
    const fields = fieldsFor(product);
    let score = 0;
    let passes = true;
    for (const term of qTokens) {
      let best = 0;
      for (const field of fields) {
        const matched = strength(term, field.text, field.words, field.fuzzy);
        best = Math.max(best, field.weight * matched);
      }
      if (!best) { passes = false; break; }
      score += best;
    }
    if (!passes) continue;
    const name = normalizeSearchText(product.name);
    const ref = normalizeSearchText(product.ref);
    const ean = normalizeSearchText(product.ean13);
    if (name === phrase) score += 200;
    else if (name.startsWith(phrase)) score += 95;
    else if (name.includes(phrase)) score += 45;
    if (phrase === ref || phrase === ean) score += 300;
    else if (ref.startsWith(phrase) || ean.startsWith(phrase)) score += 100;
    results.push({ product, score });
  }

  return results.sort((a, b) => b.score - a.score ||
    a.product.name.localeCompare(b.product.name, 'es')).map(r => r.product);
}

export const Search = { normalize: normalizeSearchText, rank: rankProducts };
