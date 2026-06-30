/* =============================================================
   Herbora Sales App — Vista: Marcas
   Textos y estructura de gamas extraídos de:
   definiciones_marcas_herbora.json (fuente oficial Herbora)
   El nombre de marca en el catálogo (products.json) es la clave
   de búsqueda — los alias mapean variaciones tipográficas.
   ============================================================= */

import { Catalog } from '../data/catalog.js';
import { Router }  from '../router/router.js';

/* ── Paleta de colores por marca ─────────────────────────── */
const BRAND_COLOR = {
  'actifens':           '#0E6270',
  'artisix':            '#1A3A5C',
  'bondigest':          '#2C5F2E',
  'controlnerv':        '#4A3728',
  'dama':               '#85224C',
  'diet-prime':         '#C17A1A',
  'fortederma':         '#0E6270',
  'fosfomen':           '#1A3A5C',
  'herboplant':         '#2C5F2E',
  'inspira':            '#1A6B5C',
  'mimesis-sensations': '#7A5C6E',
  'newme-depur':        '#2C5F2E',
  'senda-kids':         '#85224C',
  'toods-superfoods':   '#3D6B1A',
  'uro':                '#6B4F20',
  'venarol':            '#8B1A1A',
  'vitaligo':           '#1A3A5C',
  'vitamine':           '#0E6270',
  'complementos-varios':'#7A7A7A',
};

const BRAND_ICON = {
  'actifens':           '🛡',
  'artisix':            '🦴',
  'bondigest':          '🌿',
  'controlnerv':        '🧘',
  'dama':               '🌸',
  'diet-prime':         '⚡',
  'fortederma':         '☀️',
  'fosfomen':           '🧠',
  'herboplant':         '🌱',
  'inspira':            '💨',
  'mimesis-sensations': '✨',
  'newme-depur':        '🌊',
  'senda-kids':         '🌈',
  'toods-superfoods':   '🥬',
  'uro':                '💧',
  'venarol':            '❤️',
  'vitaligo':           '💪',
  'vitamine':           '🔬',
  'complementos-varios':'📦',
};


/* ── Logos oficiales de marca (assets/brands/) ───────────── */
const BRAND_LOGO = {
  'Actifens':           './assets/brands/Logo_actifensmax.png',
  'Artisix':            './assets/brands/Logo_artisixmax.png',
  'Bon Digest':         './assets/brands/Logo_bon_digestmax.png',
  'Control Nerv':       './assets/brands/Logo_Controlnervmax.png',
  'Dama':               './assets/brands/Logo_Damamax.png',
  'Diet Prime':         './assets/brands/Logo_Diet_Primemax.png',
  'Fortederma':         './assets/brands/Logo_Fortedermamax.png',
  'Fosfomen':           './assets/brands/Logo_Fosfomenmax.png',
  'Inspira':            './assets/brands/Logo_Inspiramax.png',
  'Mimesis Sensations': './assets/brands/Logo_MimesisS_Sensationsmax.png',
  'Newme Depur':        './assets/brands/Logo_Newme_Depurmax.png',
  'Senda Kids':         './assets/brands/Logo_Senda_Kidsmax.png',
  'TOODS':              './assets/brands/Logo_Toodsmax.png',
  'Üro':                './assets/brands/Logo_Uromax.png',
  'Venarol':            './assets/brands/Logo_Venarolmax.png',
  'Vitaligo':           './assets/brands/Logo_Vitalgomax.png',
  'Vitamine':           './assets/brands/Logo_Vitaminemax.png',
};

/* ── Datos oficiales de marca (fuente: definiciones_marcas_herbora.json) ── */
const BRAND_DATA = [
  {
    nombre: 'Actifens®',
    slug: 'actifens',
    /* Clave de búsqueda en products.json */
    catalogKey: 'Actifens',
    definicion: 'Marca orientada al apoyo de las defensas y al mantenimiento del estado general de salud, concebida para preparar al organismo frente a posibles amenazas externas.',
    submarcas: ['Alerplus', 'Defensas', 'Gola'],
    fuente: 'https://www.herbora.es/gama/actifens/Defensas',
  },
  {
    nombre: 'Artisix®',
    slug: 'artisix',
    catalogKey: 'Artisix',
    definicion: 'Marca estructurada en líneas orientadas al cuidado osteoarticular, muscular y de confort corporal.',
    submarcas: ['Artioptim', 'Dolocalm', 'Oseoplus'],
    fuente: 'https://www.herbora.es/gama/artisix',
  },
  {
    nombre: 'Bon Digest',
    slug: 'bondigest',
    catalogKey: 'Bon Digest',
    definicion: 'Marca formulada a base de ingredientes específicos orientados al mantenimiento de un intestino saludable.',
    submarcas: ['Digestión', 'Protección', 'Tránsito', 'Multifuncional Bon Digest'],
    fuente: 'https://www.herbora.es/gama/bondigest/transito',
  },
  {
    nombre: 'Controlnerv®',
    slug: 'controlnerv',
    catalogKey: 'Control Nerv',
    definicion: 'Marca creada con ingredientes específicos para atender cuatro áreas relacionadas con el bienestar emocional y el descanso.',
    submarcas: ['Ánimo', 'Calma', 'Relax', 'Sueño'],
    fuente: 'https://www.herbora.es/gama/controlnerv/Relax',
  },
  {
    nombre: 'Dama®',
    slug: 'dama',
    catalogKey: 'Dama',
    definicion: 'Marca desarrollada para cubrir necesidades específicas de la mujer en distintos momentos de la vida, incluyendo embarazo y lactancia, higiene íntima, menopausia y menstruación.',
    submarcas: ['Embarazo y lactancia', 'Higiene íntima', 'Menopausia', 'Menstruación', 'Multifuncional Dama'],
    fuente: 'https://www.herbora.es/gama/dama/higiene-intima',
  },
  {
    nombre: 'Diet Prime®',
    slug: 'diet-prime',
    catalogKey: 'Diet Prime',
    definicion: 'Marca enfocada en acompañar procesos de cambio hacia una vida más saludable y en favorecer que la persona se sienta a gusto con su cuerpo.',
    submarcas: ['Abdomen', 'Block', 'Detox', 'Dren', 'Quema', 'Sacia'],
    fuente: 'https://www.herbora.es/gama/diet-prime/detox',
  },
  {
    nombre: 'Fortederma®',
    slug: 'fortederma',
    catalogKey: 'Fortederma',
    definicion: 'Marca diseñada para aportar nutrientes esenciales relacionados con piel, cabello y uñas en diferentes situaciones y etapas de la vida.',
    submarcas: ['Capilar', 'Hidratante', 'Nutritiva', 'Solar', 'Multifuncional Fortederma'],
    fuente: 'https://www.herbora.es/gama/fortederma/Capilar',
  },
  {
    nombre: 'Fosfomen®',
    slug: 'fosfomen',
    catalogKey: 'Fosfomen',
    definicion: 'Marca desarrollada con ingredientes naturales orientados a contribuir a la función psicológica normal y al funcionamiento del sistema nervioso, con foco en memoria y concentración.',
    submarcas: ['Neuroaten', 'Neuromem'],
    fuente: 'https://www.herbora.es/gama/fosfomen/Neuroaten',
  },
  {
    nombre: 'Inspira',
    slug: 'inspira',
    catalogKey: 'Inspira',
    definicion: 'Marca de complementos alimenticios formulada a base de ingredientes naturales específicos orientados al bienestar interior, vinculada al ámbito de la respiración y la vitalidad.',
    submarcas: [],
    fuente: 'https://www.herbora.es/gama/inspira',
  },
  {
    nombre: 'Mimesis Sensations®',
    slug: 'mimesis-sensations',
    catalogKey: 'Mimesis Sensations',
    definicion: 'Marca de cosmética natural, bio-ecológica y vegana orientada al cuidado respetuoso de la piel y del medio ambiente. Sus productos cuentan con certificación BIO y ACENE VEGAN.',
    submarcas: ['Línea capilar', 'Línea corporal', 'Línea facial', 'Línea solar'],
    fuente: 'https://www.herbora.es/gama/mimesis-sensations/linea-capilar',
  },
  {
    nombre: 'Newme Depur®',
    slug: 'newme-depur',
    catalogKey: 'Newme Depur',
    definicion: 'Marca pensada para el cuidado interior y el bienestar exterior, estructurada en líneas depurativas, diuréticas, hepáticas y multifuncionales elaboradas con ingredientes seleccionados.',
    submarcas: ['Depurativa', 'Diurética', 'Hepática', 'Multifuncional Newme Depur'],
    fuente: 'https://www.herbora.es/gama/newme-depur/hepatica',
  },
  {
    nombre: 'Senda kids®',
    slug: 'senda-kids',
    catalogKey: 'Senda Kids',
    definicion: 'Marca enfocada a ayudar a los más pequeños durante el proceso de crecimiento, contemplando aportes puntuales y concretos para diferentes situaciones infantiles.',
    submarcas: [],
    fuente: 'https://www.herbora.es/gama/senda-kids',
  },
  {
    nombre: 'Toods (Superfoods)®',
    slug: 'toods-superfoods',
    catalogKey: 'TOODS',
    definicion: 'Marca creada como respuesta al consumo de superalimentos, caracterizados por su concentración de nutrientes, vitaminas, minerales y antioxidantes, y por su relación con el bienestar general.',
    submarcas: [],
    fuente: 'https://www.herbora.es/gama/toods-superfoods',
  },
  {
    nombre: 'Uro',
    slug: 'uro',
    catalogKey: 'Üro',
    definicion: 'Marca orientada a las necesidades del sistema genitourinario, una zona sensible que puede requerir atención específica en determinadas situaciones.',
    submarcas: ['Üropro', 'Ürove'],
    fuente: 'https://www.herbora.es/gama/uro/uropro',
  },
  {
    nombre: 'Venarol®',
    slug: 'venarol',
    catalogKey: 'Venarol',
    definicion: 'Marca formada por suplementos específicos orientados a aportar nutrientes relacionados con una vida cardiosaludable y el cuidado del sistema cardiovascular y circulatorio.',
    submarcas: ['Venarol Circ', 'Venarol Col', 'Venarol Ten', 'Multifuncional Venarol'],
    fuente: 'https://www.herbora.es/gama/venarol/venarol-circ',
  },
  {
    nombre: 'Vital¡GO!®',
    slug: 'vitaligo',
    catalogKey: 'Vitaligo',
    definicion: 'Marca de Herbora incluida dentro de Nuestras marcas, con productos orientados a la vitalidad y el bienestar general.',
    submarcas: [],
    fuente: 'https://www.herbora.es/gama/vitaligo',
  },
  {
    nombre: 'Vitamine',
    slug: 'vitamine',
    catalogKey: 'Vitamine',
    definicion: 'Marca de suplementos de vitaminas y minerales presentada en distintos formatos. Esta gama se vincula al aporte de micronutrientes necesarios para el funcionamiento correcto del organismo y el mantenimiento del equilibrio vital.',
    submarcas: ['Minerales', 'Vitaminas'],
    fuente: 'https://www.herbora.es/gama/vitamine/Minerales',
  },
  {
    nombre: 'Herboplant',
    slug: 'herboplant',
    catalogKey: 'Herboplant',
    definicion: 'Marca basada en la fitoterapia y en la combinación de plantas medicinales para buscar sinergias entre sus principios activos. Se presenta en formatos como planta troceada, infusiones, viales y cápsulas.',
    submarcas: [],
    fuente: 'https://www.herbora.es/gama/herboplant',
  },
  {
    nombre: 'Complementos varios',
    slug: 'complementos-varios',
    catalogKey: 'Varios',
    definicion: 'Agrupación de referencias que no pertenecen a una marca de gama específica dentro de la arquitectura principal de Herbora.',
    submarcas: [],
    fuente: 'https://www.herbora.es/gama/complementos-varios',
  },
];

/* ── Índice para búsqueda por catalogKey ─────────────────── */
const BRAND_BY_CATALOG_KEY = {};
BRAND_DATA.forEach(b => { BRAND_BY_CATALOG_KEY[b.catalogKey] = b; });

/* ═══════════════════════════════════════════════════════════ */
export function renderBrands() {
  const screen = document.getElementById('screen-brands');
  const filters  = Catalog.getFilters();
  /* Las marcas se renderizan en el orden del catálogo,
     pero se enriquecen con la definición oficial */
  const catalogBrands = filters.brands || [];

  screen.innerHTML = `
    <div class="screen-header">
      <h1>Marcas Herbora</h1>
      <p class="subtitle">${catalogBrands.length} marcas · Catálogo global</p>
    </div>

    <div style="padding:16px 16px 8px;background:var(--color-primary-lt);border-bottom:1px solid var(--color-border);">
      <p style="font-size:13px;line-height:1.65;color:var(--color-text-sec);">
        El grupo Herbora agrupa marcas especializadas que trabajan de forma complementaria,
        cubriendo las principales áreas del bienestar. Cada marca tiene su propio
        posicionamiento y arquitectura de gama.
      </p>
    </div>

    <div id="brands-list" style="padding:12px 12px 40px;display:flex;flex-direction:column;gap:10px;"></div>
  `;

  const container = screen.querySelector('#brands-list');

  catalogBrands.forEach(catalogKey => {
    /* Buscar la definición oficial por catalogKey */
    const brand = BRAND_BY_CATALOG_KEY[catalogKey] || {
      nombre: catalogKey,
      slug: catalogKey.toLowerCase().replace(/\s+/g, '-'),
      catalogKey,
      definicion: '',
      submarcas: [],
      fuente: '',
    };

    const color = BRAND_COLOR[brand.slug] || '#0E6270';
    const icon  = BRAND_ICON[brand.slug]  || '🌿';

    /* Conteo de productos de esta marca desde el catálogo */
    const products = Catalog.filter({ brands: [catalogKey] });
    const count = products.length;

    const card = document.createElement('div');
    card.className = 'brand-card-official';

    card.innerHTML = `
      <!-- Cabecera de color corporativo -->
      <div class="brand-card-head" style="background:${color};">
        <div class="brand-card-icon-wrap" style="background:transparent;padding:0;width:auto;min-width:80px;max-width:140px;height:44px;display:flex;align-items:center;">
          ${BRAND_LOGO[brand.catalogKey]
            ? `<img
                src="${BRAND_LOGO[brand.catalogKey]}"
                alt="${brand.nombre}"
                style="height:36px;width:auto;max-width:130px;object-fit:contain;filter:brightness(0) invert(1);"
                onerror="this.style.display='none'"
              >`
            : `<span style="font-size:22px;">${icon}</span>`
          }
        </div>
        <div class="brand-card-head-text">
          <div class="brand-card-name">${brand.nombre}</div>
        </div>
        <div class="brand-card-count">${count} producto${count !== 1 ? 's' : ''}</div>
      </div>

      <!-- Definición oficial -->
      ${brand.definicion ? `
      <div class="brand-card-body">
        <p class="brand-card-def">${brand.definicion}</p>

        <!-- Líneas / submarcas -->
        ${brand.submarcas.length > 0 ? `
        <div class="brand-card-lines">
          <div class="brand-card-lines-label">Líneas</div>
          <div class="brand-card-lines-chips">
            ${brand.submarcas.map(sub => `
              <span class="brand-line-chip">${sub}</span>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- CTA -->
        <button class="btn-see-brand" data-key="${catalogKey}" style="border-color:${color};color:${color};">
          Ver productos →
        </button>
      </div>` : ''}
    `;

    card.querySelector('.btn-see-brand')?.addEventListener('click', () => {
      Router.push(`/catalogo?brand=${encodeURIComponent(catalogKey)}`);
    });

    container.appendChild(card);
  });
}
