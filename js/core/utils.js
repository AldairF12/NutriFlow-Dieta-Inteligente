// ============================================================
// utils.js ? Constantes y Utilidades Compartidas
// ============================================================

const SPANISH_STOP_WORDS = new Set([
  // Preposiciones y conjunciones
  'a', 'al', 'con', 'de', 'del', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'segun', 'según', 'sin', 'sobre', 'tras',
  'y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'más', 'sino', 'que', 'porque', 'como',
  // Artículos y pronombres
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'le', 'les', 'me', 'te', 'se', 'nos', 'os', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'yo', 'tu', 'él', 'ella', 'ellos', 'ellas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  // Verbos frecuentes de registro / ingesta
  'comer', 'comi', 'comí', 'comimos', 'comieron', 'tome', 'tomé', 'tomar', 'tomamos', 'bebi', 'bebí', 'beber',
  'desayune', 'desayuné', 'desayunar', 'almorce', 'almorcé', 'almorzar', 'cene', 'cené', 'cenar',
  'consumi', 'consumí', 'consumir', 'pedi', 'pedí', 'servi', 'serví', 'poner', 'puse',
  // Cantidades / unidades
  'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'gramo', 'gramos', 'gr', 'g', 'kilo', 'kilos', 'kg', 'ml', 'litro', 'litros', 'taza', 'tazas',
  'cucharada', 'cucharadas', 'cda', 'cdas', 'cdta', 'cdtas', 'cucharadita', 'cucharaditas',
  'plato', 'platos', 'porcion', 'porción', 'porciones', 'rebanada', 'rebanadas', 'rebanadita', 'rebanaditas',
  'unidad', 'unidades', 'ud', 'uds', 'vaso', 'vasos', 'botella', 'botellas', 'lata', 'latas'
]);

function normalizeSearchText(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isFuzzyTokenMatch(qToken, iToken) {
  if (!qToken || !iToken) return { matched: false, score: 0, type: 'none' };
  if (qToken === iToken) return { matched: true, score: 500, type: 'exact' };
  if (iToken.startsWith(qToken)) return { matched: true, score: 400, type: 'prefix' };
  if (qToken.startsWith(iToken) && iToken.length >= 3) return { matched: true, score: 350, type: 'stem' };
  
  if (qToken.length >= 3 && iToken.length >= 3) {
    if (qToken.slice(0, 3) === iToken.slice(0, 3)) {
      if (Math.abs(qToken.length - iToken.length) <= 1) {
        let diff = 0, i = 0, j = 0;
        while (i < qToken.length && j < iToken.length) {
          if (qToken[i] !== iToken[j]) {
            diff++;
            if (qToken.length > iToken.length) i++;
            else if (iToken.length > qToken.length) j++;
            else { i++; j++; }
          } else {
            i++; j++;
          }
        }
        diff += (qToken.length - i) + (iToken.length - j);
        if (diff <= 1) {
          return { matched: true, score: 300, type: 'fuzzy' };
        }
      }
    }
  }
  return { matched: false, score: 0, type: 'none' };
}

if (typeof window !== 'undefined') {
  window.SPANISH_STOP_WORDS = SPANISH_STOP_WORDS;
  window.normalizeSearchText = normalizeSearchText;
  window.isFuzzyTokenMatch = isFuzzyTokenMatch;
}

const MEAL_LABELS = {
  desayuno: { emoji: '🌅', label: 'Desayuno' },
  almuerzo: { emoji: '☀️', label: 'Almuerzo' },
  merienda: { emoji: '🥪', label: 'Merienda' },
  cena:     { emoji: '🌙', label: 'Cena'     },
  snack:    { emoji: '🥨', label: 'Snack'    },
};

function getMealTypeEmoji(type) {
  if (!type) return '🍽️';
  const m = {
    desayuno: '🌅',
    almuerzo: '☀️',
    merienda: '🥪',
    cena:     '🌙',
    snack:    '🥨',
  };
  return m[type.toLowerCase()] || '🍽️';
}

function animateNumber(elementId, targetValue, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const currentText = el.textContent || '';
  const currentVal = parseFloat(currentText.replace(/[^\d.]/g, '')) || 0;
  const targetVal = parseFloat(targetValue) || 0;

  if (currentVal === targetVal) {
    el.textContent = targetVal + suffix;
    return;
  }

  const duration = 350;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = progress * (2 - progress); // easeOutQuad
    const val = Math.round(currentVal + (targetVal - currentVal) * eased);
    el.textContent = val + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = targetVal + suffix;
    }
  }
  requestAnimationFrame(update);
}

function renderDailyMacros() {
  if (typeof getDailyMacroSummary !== 'function') return;
  const m = getDailyMacroSummary();
  animateNumber('macro-cal', m.calories, ' kcal');
  animateNumber('macro-prot', m.protein, 'g');
  animateNumber('macro-carb', m.carbs, 'g');
  animateNumber('macro-fat', m.fat, 'g');
}

function buildMacroChart(macros) {
  const SIZE   = 68;
  const R      = 24;
  const STROKE = 7;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const CIRC   = 2 * Math.PI * R;

  const protKcal = ((macros && macros.protein) || 0) * 4;
  const carbKcal = ((macros && macros.carbs) || 0)   * 4;
  const fatKcal  = ((macros && macros.fat) || 0)     * 9;
  const total    = protKcal + carbKcal + fatKcal || 1;

  const protPct  = protKcal / total;
  const carbPct  = carbKcal / total;
  const fatPct   = fatKcal  / total;

  function segment(pct, offset) {
    const dash = pct * CIRC;
    const gap  = CIRC - dash;
    return { dash, gap, offset };
  }

  const seg1 = segment(protPct, 0);
  const seg2 = segment(carbPct, -(protPct * CIRC));
  const seg3 = segment(fatPct,  -((protPct + carbPct) * CIRC));

  const rotate = -90;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('width', SIZE);
  svg.setAttribute('height', SIZE);
  svg.style.overflow = 'visible';

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', CX); track.setAttribute('cy', CY);
  track.setAttribute('r', R); track.setAttribute('fill', 'none');
  track.setAttribute('stroke', '#f0f0f5'); track.setAttribute('stroke-width', STROKE);
  svg.appendChild(track);

  const colors = ['#93c5fd', '#fcd9a0', '#f9a8d4'];
  const shadows = [
    'drop-shadow(0 1px 3px rgba(147,197,253,0.70))',
    'drop-shadow(0 1px 3px rgba(252,217,160,0.70))',
    'drop-shadow(0 1px 3px rgba(249,168,212,0.70))'
  ];
  const segs = [seg1, seg2, seg3];

  segs.forEach((s, i) => {
    if (s.dash < 0.5) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CX); circle.setAttribute('cy', CY);
    circle.setAttribute('r', R); circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', colors[i]);
    circle.setAttribute('stroke-width', STROKE);
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('stroke-dasharray', `${s.dash} ${s.gap}`);
    circle.setAttribute('stroke-dashoffset', s.offset);
    circle.setAttribute('transform', `rotate(${rotate} ${CX} ${CY})`);
    circle.style.filter = shadows[i];
    circle.style.transition = 'stroke-dasharray 0.4s ease';
    svg.appendChild(circle);
  });

  const wrap = document.createElement('div');
  wrap.className = 'donut-wrap';
  wrap.style.width = SIZE + 'px';
  wrap.style.height = SIZE + 'px';
  wrap.appendChild(svg);

  const center = document.createElement('div');
  center.className = 'donut-center-text';
  center.innerHTML = `
    <span class="donut-kcal">${(macros && macros.calories) || 0}</span>
    <span class="donut-lbl">kcal</span>
  `;
  wrap.appendChild(center);

  const legend = document.createElement('div');
  legend.className = 'macro-legend';
  const items = [
    { cls: 'prot', label: 'Prote\u00EDna', val: ((macros && macros.protein) || 0) + 'g' },
    { cls: 'carb', label: 'Carbos',   val: ((macros && macros.carbs) || 0)   + 'g' },
    { cls: 'fat',  label: 'Grasa',    val: ((macros && macros.fat) || 0)     + 'g' },
  ];
  items.forEach(it => {
    legend.innerHTML += `
      <div class="legend-item">
        <span class="legend-dot ${it.cls}"></span>
        <span class="legend-label">${it.label}</span>
        <span class="legend-val">${it.val}</span>
      </div>`;
  });

  const area = document.createElement('div');
  area.className = 'macro-chart-area';
  area.appendChild(wrap);
  area.appendChild(legend);
  return area;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function parseMarkdown(text) {
  if (!text) return '';
  let html = text;
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^\s*(\d+)\.\s+(.*)/gm, '<br><span style="margin-left:8px;font-weight:600">$1.</span> $2');
  html = html.replace(/^\s*[-*]\s+(.*)/gm, '<br><span style="margin-left:8px">\u2022</span> $1');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/^(<br>)+/, '');
  return html;
}

function getCategoryEmoji(cat) {
  if (!cat) return '\u{1F37D}\uFE0F';
  cat = cat.toLowerCase();
  if (cat.includes('fruta')) return '\u{1F34E}';
  if (cat.includes('verdura') || cat.includes('vegetal')) return '\u{1F966}';
  if (cat.includes('carne') || cat.includes('pollo')) return '\u{1F969}';
  if (cat.includes('pescado') || cat.includes('marisco') || cat.includes('atun') || cat.includes('at\u00FAn')) return '\u{1F41F}';
  if (cat.includes('l\u00E1cteo') || cat.includes('lacteo') || cat.includes('leche') || cat.includes('queso') || cat.includes('yogur')) return '\u{1F9C0}';
  if (cat.includes('cereal') || cat.includes('grano') || cat.includes('arroz') || cat.includes('avena')) return '\u{1F33E}';
  if (cat.includes('legumbre') || cat.includes('frijol')) return '\u{1FAD8}';
  if (cat.includes('nuez') || cat.includes('semilla') || cat.includes('almendra')) return '\u{1F95C}';
  if (cat.includes('aceite') || cat.includes('grasa') || cat.includes('aguacate') || cat.includes('oliva')) return '\u{1F951}';
  if (cat.includes('especia') || cat.includes('condimento')) return '\u{1F9C2}';
  return '\u{1F37D}\uFE0F';
}
