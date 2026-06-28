function buildMacroChart(macros) {
  const SIZE   = 68;
  const R      = 24;
  const STROKE = 7;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const CIRC   = 2 * Math.PI * R;

  const protKcal = macros.protein * 4;
  const carbKcal = macros.carbs   * 4;
  const fatKcal  = macros.fat     * 9;
  const total    = protKcal + carbKcal + fatKcal || 1;

  const protPct  = protKcal / total;
  const carbPct  = carbKcal / total;
  const fatPct   = fatKcal  / total;

  // Calcular los dasharray y offset de cada segmento
  function segment(pct, offset) {
    const dash = pct * CIRC;
    const gap  = CIRC - dash;
    return { dash, gap, offset };
  }

  const seg1 = segment(protPct, 0);
  const seg2 = segment(carbPct, -(protPct * CIRC));
  const seg3 = segment(fatPct,  -((protPct + carbPct) * CIRC));

  // Rotación para comenzar en la parte superior
  const rotate = -90;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('width', SIZE);
  svg.setAttribute('height', SIZE);
  svg.style.overflow = 'visible';

  // Pista de fondo
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', CX); track.setAttribute('cy', CY);
  track.setAttribute('r', R); track.setAttribute('fill', 'none');
  track.setAttribute('stroke', '#f0f0f5'); track.setAttribute('stroke-width', STROKE);
  svg.appendChild(track);

  // Donut con colores pastel
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

  // Wrapper con texto central
  const wrap = document.createElement('div');
  wrap.className = 'donut-wrap';
  wrap.style.width = SIZE + 'px';
  wrap.style.height = SIZE + 'px';
  wrap.appendChild(svg);

  const center = document.createElement('div');
  center.className = 'donut-center-text';
  center.innerHTML = `
    <span class="donut-kcal">${macros.calories}</span>
    <span class="donut-lbl">kcal</span>
  `;
  wrap.appendChild(center);

  // Leyenda
  const legend = document.createElement('div');
  legend.className = 'macro-legend';
  const items = [
    { cls: 'prot', label: 'Proteína', val: macros.protein + 'g' },
    { cls: 'carb', label: 'Carbos',   val: macros.carbs   + 'g' },
    { cls: 'fat',  label: 'Grasa',    val: macros.fat     + 'g' },
  ];
  items.forEach(it => {
    legend.innerHTML += `
      <div class="legend-item">
        <span class="legend-dot ${it.cls}"></span>
        <span class="legend-label">${it.label}</span>
        <span class="legend-val">${it.val}</span>
      </div>`;
  });

  // Área completa
  const area = document.createElement('div');
  area.className = 'macro-chart-area';
  area.appendChild(wrap);
  area.appendChild(legend);
  return area;
}
function renderDashboardScreen() {
  const consumed = getDailyMacroSummary();
  const goals    = DB.userPreferences.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };

  // Fecha
  const dateEl = document.getElementById('dash-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Anillo de calorías ─────────────────────────────────────
  renderCaloriesRing(consumed.calories, goals.calories);

  // ── Barras de macros ───────────────────────────────────────
  renderMacroBars(consumed, goals);

  // ── Plan vs Extras ─────────────────────────────────────────
  renderPlanVsExtra();

  // ── Timeline ───────────────────────────────────────────────
  renderDashTimeline();
}
function renderCaloriesRing(consumed, goal) {
  const container = document.getElementById('dash-calories-ring');
  if (!container) return;

  const SIZE = 130;
  const R    = 52;
  const STROKE = 12;
  const CX = SIZE / 2, CY = SIZE / 2;
  const CIRC = 2 * Math.PI * R;
  const pct  = Math.min(1, consumed / goal);
  const dash = pct * CIRC;
  const gap  = CIRC - dash;

  // Ya no usamos un color dinámico simple, sino un degradado
  const shadowColor = pct < 0.5 ? 'rgba(52, 211, 153, 0.4)' : pct < 0.85 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';
  
  // Dependiendo del porcentaje, podemos cambiar el gradiente o mantenerlo fijo, 
  // aquí lo mantenemos fijo pastel como sugirió el usuario.
  const gradStart = pct < 0.85 ? '#34d399' : '#f59e0b';
  const gradEnd   = pct < 0.85 ? '#60a5fa' : '#ef4444';

  container.innerHTML = `
    <div class="dash-ring-wrap">
      <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" style="filter: drop-shadow(0 6px 12px ${shadowColor});">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${gradStart}" />
            <stop offset="100%" stop-color="${gradEnd}" />
          </linearGradient>
        </defs>
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="var(--gray-100)" stroke-width="${STROKE}" />
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
          stroke="url(#ringGrad)"
          stroke-width="${STROKE}"
          stroke-linecap="round"
          stroke-dasharray="${dash} ${gap}"
          stroke-dashoffset="${CIRC * 0.25}"
          transform="rotate(-90 ${CX} ${CY})"
          style="transition: stroke-dasharray 0.7s cubic-bezier(0.34,1.56,0.64,1);" />
      </svg>
      <div class="dash-ring-center">
        <span class="dash-ring-val">${consumed}</span>
        <span class="dash-ring-unit">kcal</span>
        <span class="dash-ring-goal">/ ${goal}</span>
      </div>
    </div>
    <div class="dash-ring-labels">
      <div class="dash-ring-label-item">
        <span class="dash-ring-pct">${Math.round(pct * 100)}%</span>
        <span class="dash-ring-lbl">completado</span>
      </div>
      <div class="dash-ring-label-item">
        <span class="dash-ring-pct">${Math.max(0, goal - consumed)}</span>
        <span class="dash-ring-lbl">kcal restantes</span>
      </div>
    </div>
  `;
}
function renderMacroBars(consumed, goals) {
  const container = document.getElementById('dash-macros-bars');
  if (!container) return;

  const macros = [
    { label: 'Proteína',      key: 'protein', consumed: consumed.protein, goal: goals.protein, unit: 'g',   color: '#93c5fd', icon: '💪' },
    { label: 'Carbohidratos', key: 'carbs',   consumed: consumed.carbs,   goal: goals.carbs,   unit: 'g',   color: '#fcd9a0', icon: '🌾' },
    { label: 'Grasas',        key: 'fat',     consumed: consumed.fat,     goal: goals.fat,     unit: 'g',   color: '#f9a8d4', icon: '🥑' },
  ];

  container.innerHTML = macros.map(m => {
    const pct = Math.min(100, Math.round((m.consumed / (m.goal || 1)) * 100));
    return `
      <div class="dash-macro-bar-row">
        <div class="dash-macro-bar-info">
          <span class="dash-macro-bar-icon">${m.icon}</span>
          <span class="dash-macro-bar-label">${m.label}</span>
          <span class="dash-macro-bar-val">${m.consumed}${m.unit} <span class="dash-macro-bar-goal">/ ${m.goal}${m.unit}</span></span>
        </div>
        <div class="dash-macro-bar-track">
          <div class="dash-macro-bar-fill" style="width:${pct}%; background:${m.color}; box-shadow: 0 0 8px ${m.color}88;"></div>
        </div>
        <span class="dash-macro-bar-pct">${pct}%</span>
      </div>
    `;
  }).join('');
}
function renderDashTimeline() {
  const container = document.getElementById('dash-timeline-list');
  if (!container) return;

  const todayLogs = DB.getTodayLogs();
  const mealLogs     = todayLogs.filter(l => l.type === 'meal');
  const liqLogs      = todayLogs.filter(l => l.type === 'liquid');
  const foodItemLogs = todayLogs.filter(l => l.type === 'food_item');

  if (mealLogs.length === 0 && liqLogs.length === 0 && foodItemLogs.length === 0) {
    container.innerHTML = `<div class="dash-timeline-empty">Nada registrado aún hoy. Empieza a registrar tus comidas! 🌿</div>`;
    return;
  }

  container.innerHTML = '';

  // Recetas del plan y libres
  mealLogs.forEach(log => {
    const recipe = DB.getRecipeById(log.reference_id);
    if (!recipe) return;
    const macros = calcRecipeMacros(recipe.id);
    const isPlanned = log.planned === true;
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot ${isPlanned ? 'meal-dot' : 'extra-dot'}"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${recipe.name}${!isPlanned ? ' <span class="dash-tl-extra-badge">extra</span>' : ''}</div>
        <div class="dash-tl-meta">${getMealTypeEmoji(recipe.meal_type)} ${recipe.meal_type} · ${macros.calories} kcal · ${macros.protein}g prot</div>
      </div>
    `;
    container.appendChild(item);
  });

  // Alimentos libres (food_item)
  foodItemLogs.forEach(log => {
    const fi = DB.getFoodItemById(log.reference_id);
    if (!fi) return;
    const qty  = log.quantity_g || 100;
    const kcal = Math.round((fi.calories_per_100g || 0) * qty / 100);
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot extra-dot"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${fi.name} <span class="dash-tl-extra-badge">extra</span></div>
        <div class="dash-tl-meta">🥗 Alimento libre · ${qty}g · ${kcal} kcal</div>
      </div>
    `;
    container.appendChild(item);
  });

  // Líquidos
  liqLogs.forEach(log => {
    const liq = DB.liquids.find(l => l.id === log.reference_id);
    if (!liq) return;
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot liquid-dot"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${liq.name}</div>
        <div class="dash-tl-meta">${liq.icon} Hidratación</div>
      </div>
    `;
    container.appendChild(item);
  });
}
function renderPlanVsExtra() {
  // Insertar la sección entre dash-macros-bars y dash-ai-card si no existe
  let section = document.getElementById('dash-plan-vs-extra');
  if (!section) {
    const aiCard = document.getElementById('dash-ai-card');
    if (!aiCard) return;
    section = document.createElement('div');
    section.id = 'dash-plan-vs-extra';
    section.className = 'dash-plan-vs-extra-section';
    aiCard.parentNode.insertBefore(section, aiCard);
  }

  const { plan, extra } = getPlanVsExtraSummary();
  const goals = DB.userPreferences.goals || { calories: 2000 };
  const totalCalGoal = goals.calories || 2000;

  const planPct  = Math.min(100, Math.round((plan.calories  / totalCalGoal) * 100));
  const extraPct = Math.min(100, Math.round((extra.calories / totalCalGoal) * 100));

  // Porcentaje del plan cumplido respecto a las kcal totales consumidas
  const totalConsumed = plan.calories + extra.calories;
  const planCompliance = totalConsumed > 0
    ? Math.round((plan.calories / totalConsumed) * 100)
    : 0;

  section.innerHTML = `
    <h2 class="dash-section-title">📊 Plan vs Extras de hoy</h2>
    <div class="dash-pve-cards">
      <div class="dash-pve-card dash-pve-card--plan">
        <div class="dash-pve-icon">📋</div>
        <div class="dash-pve-val">${plan.calories} <span class="dash-pve-unit">kcal</span></div>
        <div class="dash-pve-lbl">Del plan · ${plan.entries} comida${plan.entries !== 1 ? 's' : ''}</div>
        <div class="dash-pve-bar-track">
          <div class="dash-pve-bar-fill dash-pve-bar--plan" style="width:${planPct}%"></div>
        </div>
        <div class="dash-pve-pct">${planPct}% del objetivo</div>
      </div>
      <div class="dash-pve-card dash-pve-card--extra">
        <div class="dash-pve-icon">➕</div>
        <div class="dash-pve-val">${extra.calories} <span class="dash-pve-unit">kcal</span></div>
        <div class="dash-pve-lbl">Extras · ${extra.entries} registro${extra.entries !== 1 ? 's' : ''}</div>
        <div class="dash-pve-bar-track">
          <div class="dash-pve-bar-fill dash-pve-bar--extra" style="width:${extraPct}%"></div>
        </div>
        <div class="dash-pve-pct">${extraPct}% del objetivo</div>
      </div>
    </div>
    ${totalConsumed > 0 ? `
    <div class="dash-pve-compliance">
      <span class="dash-pve-compliance-lbl">Adherencia al plan</span>
      <div class="dash-pve-compliance-bar-track">
        <div class="dash-pve-compliance-bar" style="width:${planCompliance}%"></div>
      </div>
      <span class="dash-pve-compliance-pct" style="color:${planCompliance >= 70 ? '#3ab98d' : planCompliance >= 40 ? '#f59e0b' : '#ef4444'}">${planCompliance}%</span>
    </div>` : ''}
  `;
}