// ============================================================
// dashboardView.js ? Estad?sticas, Calendario Panor?mico y Timeline
// ============================================================

let _dashSelectedDate = null;
let _dashCalMode = 'week'; // 'week' por defecto para dar m?s espacio a los gr?ficos
let _dashCalYear = new Date().getFullYear();
let _dashCalMonth = new Date().getMonth();
let _dashCalWeekStart = null;
let _calSlideDirection = null; // 'left' | 'right' | null

function getDashTodayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDashSelectedDate() {
  if (!_dashSelectedDate) _dashSelectedDate = getDashTodayIso();
  return _dashSelectedDate;
}

function getMondayOfDate(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderDashboardScreen() {
  const selectedDate = getDashSelectedDate();
  const todayStr = getDashTodayIso();
  const isToday = (selectedDate === todayStr);

  const consumed = getDailyMacroSummary(selectedDate);
  const goals = (window.DB && window.DB.userPreferences && window.DB.userPreferences.goals)
    ? window.DB.userPreferences.goals
    : { calories: 2000, protein: 150, carbs: 220, fat: 65 };

  const dateEl = document.getElementById('dash-date');
  const parts = selectedDate.split('-').map(Number);
  const targetDateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

  const dateFormatted = targetDateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  if (dateEl) {
    dateEl.textContent = isToday ? `${dateFormatted} (Hoy)` : `${dateFormatted} (Hist\u00F3rico)`;
  }

  // Bot?n Volver a Hoy en cabecera
  const btnToday = document.getElementById('btn-dash-today');
  if (btnToday) {
    btnToday.classList.toggle('visible', !isToday);
    btnToday.style.display = isToday ? 'none' : 'inline-flex';
    btnToday.onclick = () => {
      _dashSelectedDate = todayStr;
      const t = new Date();
      _dashCalYear = t.getFullYear();
      _dashCalMonth = t.getMonth();
      _dashCalWeekStart = getMondayOfDate(t);
      renderDashboardScreen();
    };
  }

  // Cargar resumen inteligente persistido o mostrar estado inicial
  renderCachedAISummary(selectedDate);

  // Conectar bot?n de generar insight con IA
  const btnAi = document.getElementById('btn-dash-refresh-ai');
  if (btnAi) {
    btnAi.onclick = async () => {
      await handleGenerateDailyInsight(selectedDate);
    };
  }

  renderDashboardCalendar();
  renderCaloriesRing(consumed.calories, goals.calories || 2000);
  renderMacroBars(consumed, goals);
  renderPlanVsExtra(selectedDate);
  renderDashTimeline(selectedDate);
}

function renderCachedAISummary(dateStr) {
  const textEl = document.getElementById('dash-ai-text');
  const loadingEl = document.getElementById('dash-ai-loading');
  if (!textEl) return;
  if (loadingEl) loadingEl.hidden = true;

  try {
    const raw = localStorage.getItem('nutriflow_ai_summary_' + dateStr);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.text) {
        textEl.innerHTML = typeof parseMarkdown === 'function' ? parseMarkdown(parsed.text) : parsed.text;
        return;
      }
    }
  } catch(e) {}

  textEl.textContent = 'Presiona "\u2728 Generar Insight" para obtener un an\u00E1lisis inteligente de tu progreso.';
}

async function handleGenerateDailyInsight(dateStr) {
  const textEl = document.getElementById('dash-ai-text');
  const loadingEl = document.getElementById('dash-ai-loading');
  const btnAi = document.getElementById('btn-dash-refresh-ai');

  if (!window.AI || typeof window.AI.getDailySummary !== 'function') {
    if (typeof showToast === 'function') showToast('\u26A0\uFE0F M\u00F3dulo de IA no disponible');
    return;
  }

  if (!window.AI.isConfigured()) {
    if (typeof showToast === 'function') showToast('\u26A0\uFE0F Configura tu API Key en Perfil');
    const profileTab = document.querySelector('[data-screen="profile"]');
    if (profileTab) profileTab.click();
    return;
  }

  if (loadingEl) loadingEl.hidden = false;
  if (textEl) textEl.textContent = 'NutriBot est\u00E1 analizando tu progreso...';
  if (btnAi) btnAi.disabled = true;

  try {
    const insight = await window.AI.getDailySummary(dateStr);
    if (textEl) textEl.innerHTML = typeof parseMarkdown === 'function' ? parseMarkdown(insight) : insight;
    if (typeof showToast === 'function') showToast('\u2728 Resumen IA generado');
  } catch (err) {
    if (textEl) textEl.textContent = 'No se pudo generar el insight: ' + (err.message || 'Error desconocido');
  } finally {
    if (loadingEl) loadingEl.hidden = true;
    if (btnAi) btnAi.disabled = false;
  }
}

function renderDashboardCalendar() {
  const container = document.getElementById('dash-calendar');
  if (!container) return;

  if (!_dashCalWeekStart) {
    _dashCalWeekStart = getMondayOfDate(new Date());
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  let navTitle = '';
  if (_dashCalMode === 'month') {
    navTitle = `${monthNames[_dashCalMonth]} ${_dashCalYear}`;
  } else {
    const wEnd = new Date(_dashCalWeekStart);
    wEnd.setDate(wEnd.getDate() + 6);
    navTitle = `${_dashCalWeekStart.getDate()} ${monthNames[_dashCalWeekStart.getMonth()].slice(0, 3)} - ${wEnd.getDate()} ${monthNames[wEnd.getMonth()].slice(0, 3)} ${_dashCalWeekStart.getFullYear()}`;
  }

  container.innerHTML = `
    <div class="dash-cal-header">
      <div class="dash-cal-title-group">
        <span class="dash-cal-icon">\u{1F4C5}</span>
        <h2 class="dash-cal-title">Progreso Hist\u00F3rico</h2>
      </div>
      <div class="dash-cal-mode-pills">
        <button class="cal-mode-btn ${_dashCalMode === 'week' ? 'active' : ''}" id="btn-cal-mode-week">Semana</button>
        <button class="cal-mode-btn ${_dashCalMode === 'month' ? 'active' : ''}" id="btn-cal-mode-month">Mes</button>
      </div>
    </div>

    <div class="dash-cal-toolbar">
      <button class="dash-cal-nav-btn" id="dash-cal-prev" aria-label="Anterior">\u25C0</button>
      <span class="dash-cal-nav-lbl" id="dash-cal-lbl">${navTitle}</span>
      <button class="dash-cal-nav-btn" id="dash-cal-next" aria-label="Siguiente">\u25B6</button>
    </div>

    <div class="dash-cal-grid-wrap">
      <div class="dash-cal-weekdays">
        <span>Lun</span><span>Mar</span><span>Mi\u00E9</span><span>Jue</span><span>Vie</span><span>S\u00E1b</span><span>Dom</span>
      </div>
      <div id="dash-cal-grid" class="dash-cal-grid ${_dashCalMode === 'week' ? 'grid-week-mode' : ''}"></div>
    </div>

    <div class="dash-cal-legend">
      <div class="cal-legend-item"><span class="cal-dot dot-green"></span><span>Meta cumplida</span></div>
      <div class="cal-legend-item"><span class="cal-dot dot-yellow"></span><span>Incompleto / Cerca</span></div>
      <div class="cal-legend-item"><span class="cal-dot dot-none"></span><span>Sin registro</span></div>
    </div>
  `;

  const btnMonth = document.getElementById('btn-cal-mode-month');
  const btnWeek = document.getElementById('btn-cal-mode-week');
  if (btnMonth) {
    btnMonth.onclick = () => {
      _dashCalMode = 'month';
      _calSlideDirection = null;
      renderDashboardCalendar();
    };
  }
  if (btnWeek) {
    btnWeek.onclick = () => {
      _dashCalMode = 'week';
      _calSlideDirection = null;
      const parts = getDashSelectedDate().split('-').map(Number);
      _dashCalWeekStart = getMondayOfDate(new Date(parts[0], parts[1] - 1, parts[2]));
      renderDashboardCalendar();
    };
  }

  const btnPrev = document.getElementById('dash-cal-prev');
  const btnNext = document.getElementById('dash-cal-next');

  if (btnPrev) {
    btnPrev.onclick = () => {
      _calSlideDirection = 'left';
      if (_dashCalMode === 'month') {
        _dashCalMonth--;
        if (_dashCalMonth < 0) { _dashCalMonth = 11; _dashCalYear--; }
      } else {
        _dashCalWeekStart.setDate(_dashCalWeekStart.getDate() - 7);
      }
      renderDashboardCalendar();
    };
  }

  if (btnNext) {
    btnNext.onclick = () => {
      _calSlideDirection = 'right';
      if (_dashCalMode === 'month') {
        _dashCalMonth++;
        if (_dashCalMonth > 11) { _dashCalMonth = 0; _dashCalYear++; }
      } else {
        _dashCalWeekStart.setDate(_dashCalWeekStart.getDate() + 7);
      }
      renderDashboardCalendar();
    };
  }

  fillCalendarGrid();
}

function fillCalendarGrid() {
  const grid = document.getElementById('dash-cal-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (_calSlideDirection === 'right') {
    grid.classList.add('cal-slide-right');
  } else if (_calSlideDirection === 'left') {
    grid.classList.add('cal-slide-left');
  }
  _calSlideDirection = null;

  const goals = (window.DB && window.DB.userPreferences && window.DB.userPreferences.goals)
    ? window.DB.userPreferences.goals
    : { calories: 2000 };
  const goalCal = goals.calories || 2000;

  const todayStr = getDashTodayIso();
  const selectedDateStr = getDashSelectedDate();

  if (_dashCalMode === 'month') {
    const firstDayIndex = new Date(_dashCalYear, _dashCalMonth, 1).getDay();
    const daysInMonth = new Date(_dashCalYear, _dashCalMonth + 1, 0).getDate();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(_dashCalMonth + 1).padStart(2, '0');
      const dateKey = `${_dashCalYear}-${monthStr}-${dayStr}`;
      const dayEl = createCalendarDayElement(d, dateKey, goalCal, todayStr, selectedDateStr, false);
      grid.appendChild(dayEl);
    }
  } else {
    const curr = new Date(_dashCalWeekStart);
    for (let i = 0; i < 7; i++) {
      const dateKey = formatIsoDate(curr);
      const dayNum = curr.getDate();
      const dayEl = createCalendarDayElement(dayNum, dateKey, goalCal, todayStr, selectedDateStr, true);
      grid.appendChild(dayEl);
      curr.setDate(curr.getDate() + 1);
    }
  }
}

function createCalendarDayElement(dayNum, dateKey, goalCal, todayStr, selectedDateStr, isWeekMode) {
  const logs = (window.DB && typeof window.DB.getLogsByDate === 'function')
    ? window.DB.getLogsByDate(dateKey)
    : [];

  let dotClass = 'dot-none';
  let totalKcal = 0;

  if (logs && logs.length > 0) {
    const summary = getDailyMacroSummary(dateKey);
    totalKcal = summary.calories;
    if ((totalKcal >= goalCal * 0.8 && totalKcal <= goalCal * 1.15) || 
        (totalKcal >= goalCal - 200 && totalKcal <= goalCal + 200)) {
      dotClass = 'dot-green';
    } else {
      dotClass = 'dot-yellow';
    }
  }

  const btn = document.createElement('button');
  btn.className = 'cal-day';
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-label', `Fecha ${dateKey}, ${totalKcal} kcal registradas`);

  if (dateKey === selectedDateStr) btn.classList.add('selected');
  if (dateKey === todayStr) btn.classList.add('today');

  if (isWeekMode) {
    btn.innerHTML = `
      <span class="cal-day-num">${dayNum}</span>
      <div class="cal-dot ${dotClass}"></div>
      <span class="cal-week-kcal">${totalKcal > 0 ? `${totalKcal}` : '-'}</span>
    `;
  } else {
    btn.innerHTML = `
      <span class="cal-day-num">${dayNum}</span>
      <div class="cal-dot ${dotClass}"></div>
    `;
  }

  btn.onclick = () => {
    _dashSelectedDate = dateKey;
    renderDashboardScreen();
  };

  return btn;
}

// ??????????????????????????????????????????????
// ANILLO DE CALOR?AS CON RELIEVE Y NUBES CUTE
// ??????????????????????????????????????????????
function renderCaloriesRing(consumed, goal) {
  const container = document.getElementById('dash-calories-ring');
  if (!container) return;

  const SIZE = 142;
  const R = 54;
  const STROKE = 11;
  const CX = SIZE / 2, CY = SIZE / 2;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.min(1, consumed / (goal || 1));
  const dash = pct * CIRC;
  const gap = CIRC - dash;
  const remaining = Math.max(0, goal - consumed);

  const shadowColor = pct < 0.5 ? 'rgba(52, 211, 153, 0.35)' : pct < 0.85 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  const gradStart = pct < 0.85 ? '#10b981' : '#f59e0b';
  const gradEnd = pct < 0.85 ? '#3b82f6' : '#ef4444';

  const glowFilter = pct > 0 
    ? `filter: drop-shadow(0 6px 14px ${shadowColor});` 
    : `filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.12));`;

  container.innerHTML = `
    <div class="dash-ring-hero-stage">
      <!-- Nube Cute Izquierda: Porcentaje -->
      <div class="dash-cloud-cute cloud-left">
        <span class="cloud-val">${Math.round(pct * 100)}%</span>
        <span class="cloud-lbl">del objetivo</span>
      </div>

      <!-- Anillo Central Resplandeciente con Pista Suave -->
      <div class="dash-ring-wrap">
        <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" class="dash-ring-svg" style="${glowFilter}">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${gradStart}" />
              <stop offset="100%" stop-color="${gradEnd}" />
            </linearGradient>
          </defs>

          <!-- Halo sutil resplandeciente -->
          <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(16, 185, 129, 0.05)" stroke-width="${STROKE + 6}" />

          <!-- Pista base suave y limpia -->
          <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#f1f5f9" stroke-width="${STROKE}" stroke-linecap="round" />

          <!-- Arco de progreso con gradiente (inicia en la izquierda y avanza en sentido horario) -->
          ${consumed > 0 ? `
            <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
              stroke="url(#ringGrad)"
              stroke-width="${STROKE}"
              stroke-linecap="round"
              stroke-dasharray="${dash} ${gap}"
              stroke-dashoffset="${CIRC * 0.25}"
              transform="rotate(-90 ${CX} ${CY})"
              style="transition: stroke-dasharray 0.7s cubic-bezier(0.34,1.56,0.64,1);" />
          ` : ''}
        </svg>
        <div class="dash-ring-center">
          <span class="dash-ring-val">${consumed.toLocaleString()}</span>
          <span class="dash-ring-unit">kcal</span>
          <span class="dash-ring-goal">/ ${goal.toLocaleString()}</span>
        </div>
      </div>

      <!-- Nube Cute Derecha: Restantes -->
      <div class="dash-cloud-cute cloud-right">
        <span class="cloud-val">${remaining.toLocaleString()}</span>
        <span class="cloud-lbl">kcal restantes</span>
      </div>
    </div>
  `;
}

function renderMacroBars(consumed, goals) {
  const container = document.getElementById('dash-macros-bars');
  if (!container) return;

  const macros = [
    { label: 'Prote\u00EDna',      key: 'protein', consumed: consumed.protein, goal: goals.protein || 150, unit: 'g', color: '#93c5fd', icon: '\u{1F4AA}' },
    { label: 'Carbohidratos', key: 'carbs',   consumed: consumed.carbs,   goal: goals.carbs || 220,   unit: 'g', color: '#fcd9a0', icon: '\u{1F33E}' },
    { label: 'Grasas',        key: 'fat',     consumed: consumed.fat,     goal: goals.fat || 65,      unit: 'g', color: '#f9a8d4', icon: '\u{1F951}' },
  ];

  container.innerHTML = `
    <h2 class="dash-macros-title">\u{1F4CA} Macronutrientes</h2>
    ${macros.map(m => {
      const pct = Math.min(100, Math.round((m.consumed / (m.goal || 1)) * 100));
      return `
        <div class="dash-macro-bar-row">
          <div class="dash-macro-bar-info">
            <span class="dash-macro-bar-icon">${m.icon}</span>
            <span class="dash-macro-bar-label">${m.label}</span>
            <span class="dash-macro-bar-val">${m.consumed}${m.unit} <span class="dash-macro-bar-goal">/ ${m.goal}${m.unit}</span></span>
          </div>
          <div class="dash-macro-bar-track">
            <div class="dash-macro-bar-fill" style="width: ${pct}%; background: ${m.color};"></div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderPlanVsExtra(dateStr) {
  const container = document.getElementById('dash-plan-vs-extra');
  const summary = getPlanVsExtraSummary(dateStr);
  const totalCal = summary.plan.calories + summary.extra.calories;
  const planPct = totalCal > 0 ? Math.round((summary.plan.calories / totalCal) * 100) : 100;

  if (container) {
    container.innerHTML = `
      <div class="plan-extra-header">
        <span class="plan-extra-title">\u{1F4CB} Plan vs Extras</span>
        <span class="plan-extra-badge ${planPct >= 80 ? 'adherence-high' : 'adherence-low'}">
          ${totalCal > 0 ? `${planPct}% adherencia` : 'Sin registros'}
        </span>
      </div>
      <div class="plan-extra-bar">
        <div class="plan-extra-fill-plan" style="width: ${planPct}%;" title="Plan: ${summary.plan.calories} kcal"></div>
        <div class="plan-extra-fill-extra" style="width: ${100 - planPct}%;" title="Extras: ${summary.extra.calories} kcal"></div>
      </div>
      <div class="plan-extra-stats">
        <div class="plan-extra-item">
          <span class="plan-dot dot-plan"></span>
          <span>Plan: <strong>${summary.plan.calories} kcal</strong> (${summary.plan.entries} comidas)</span>
        </div>
        <div class="plan-extra-item">
          <span class="plan-dot dot-extra"></span>
          <span>Extras: <strong>${summary.extra.calories} kcal</strong> (${summary.extra.entries} comidas)</span>
        </div>
      </div>
    `;
  }
}

function renderDashTimeline(dateStr) {
  const container = document.getElementById('dash-timeline-list');
  const title = document.getElementById('dash-timeline-title');
  if (!container) return;

  const logs = (window.DB && typeof window.DB.getLogsByDate === 'function')
    ? window.DB.getLogsByDate(dateStr)
    : [];

  if (title) {
    title.textContent = `\u{1F4CB} Comidas del d\u00EDa (${logs.length})`;
  }

  container.innerHTML = '';

  if (logs.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <div class="empty-icon">\u{1F37D}\uFE0F</div>
        <p>No hay comidas registradas para esta fecha.</p>
      </div>
    `;
    return;
  }

  logs.forEach(log => {
    let name = 'Alimento';
    let typeEmoji = '\u{1F373}';
    let calories = 0;
    const isPlanned = (log.type === 'meal' && log.planned !== false) || log.planned === true;

    if (log.type === 'meal') {
      const recipe = window.DB.getRecipeById(log.reference_id);
      if (recipe) {
        name = recipe.name;
        typeEmoji = typeof getMealTypeEmoji === 'function' ? getMealTypeEmoji(recipe.meal_type) : '\u{1F373}';
        calories = calcRecipeMacros(recipe.id).calories;
      }
    } else if (log.type === 'food_item') {
      const fi = window.DB.getFoodItemById(log.reference_id);
      if (fi) {
        name = fi.name;
        typeEmoji = '\u{1F957}';
        const factor = (log.quantity_g || 100) / 100;
        calories = Math.round((fi.calories_per_100g || 0) * factor);
      }
    } else if (log.type === 'liquid') {
      const liquidsList = window.DB.liquids || (window.DB.state && window.DB.state.liquids) || [];
      const liq = liquidsList.find(l => l.id === log.reference_id);
      name = liq ? liq.name : 'Agua / Bebida';
      typeEmoji = liq && liq.icon ? liq.icon : '\u{1F4A7}';
      calories = 0;
    }

    const timeStr = log.timestamp
      ? new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : '--:--';

    const item = document.createElement('div');
    item.className = `dash-timeline-item ${isPlanned ? 'item-planned' : 'item-extra'}`;
    item.innerHTML = `
      <div class="dash-timeline-icon">${typeEmoji}</div>
      <div class="dash-timeline-info">
        <div class="dash-timeline-name">${name}</div>
        <div class="dash-timeline-time">${timeStr} \u2022 <span class="badge-${isPlanned ? 'plan' : 'extra'}">${isPlanned ? 'Del plan' : 'Extra'}</span></div>
      </div>
      <div class="dash-timeline-cal">${calories > 0 ? `${calories} kcal` : `${log.quantity_g || 250} ml`}</div>
    `;
    container.appendChild(item);
  });
}
