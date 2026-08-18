// ============================================================
// dashboardView.js ? Estad?sticas, Calendario Hist?rico y Timeline
// ============================================================

let _dashSelectedDate = null;
let _dashCalMode = 'week'; // 'week' por defecto para dar m?s espacio a los gr?ficos
let _dashCalYear = new Date().getFullYear();
let _dashCalMonth = new Date().getMonth();
let _dashCalWeekStart = null;

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

  const btnToday = document.getElementById('btn-dash-today');
  if (btnToday) {
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

  renderDashboardCalendar();
  renderCaloriesRing(consumed.calories, goals.calories || 2000);
  renderMacroBars(consumed, goals);
  renderPlanVsExtra(selectedDate);
  renderDashTimeline(selectedDate);
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
      renderDashboardCalendar();
    };
  }
  if (btnWeek) {
    btnWeek.onclick = () => {
      _dashCalMode = 'week';
      const parts = getDashSelectedDate().split('-').map(Number);
      _dashCalWeekStart = getMondayOfDate(new Date(parts[0], parts[1] - 1, parts[2]));
      renderDashboardCalendar();
    };
  }

  const btnPrev = document.getElementById('dash-cal-prev');
  const btnNext = document.getElementById('dash-cal-next');

  if (btnPrev) {
    btnPrev.onclick = () => {
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

function renderCaloriesRing(consumed, goal) {
  const container = document.getElementById('dash-calories-ring');
  if (!container) return;

  const SIZE = 140;
  const R = 54;
  const STROKE = 12;
  const CX = SIZE / 2, CY = SIZE / 2;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.min(1, consumed / (goal || 1));
  const dash = pct * CIRC;
  const gap = CIRC - dash;

  const shadowColor = pct < 0.5 ? 'rgba(52, 211, 153, 0.35)' : pct < 0.85 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  const gradStart = pct < 0.85 ? '#34d399' : '#f59e0b';
  const gradEnd = pct < 0.85 ? '#60a5fa' : '#ef4444';

  container.innerHTML = `
    <div class="dash-ring-wrap">
      <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" style="filter: drop-shadow(0 6px 12px ${shadowColor});">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${gradStart}" />
            <stop offset="100%" stop-color="${gradEnd}" />
          </linearGradient>
        </defs>
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#f3f4f6" stroke-width="${STROKE}" />
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
        <span class="dash-ring-val">${consumed.toLocaleString()}</span>
        <span class="dash-ring-unit">kcal</span>
        <span class="dash-ring-goal">/ ${goal.toLocaleString()}</span>
      </div>
    </div>
    <div class="dash-ring-labels">
      <div class="dash-ring-label-item">
        <span class="dash-ring-pct">${Math.round(pct * 100)}%</span>
        <span class="dash-ring-lbl">del objetivo</span>
      </div>
      <div class="dash-ring-label-item">
        <span class="dash-ring-pct">${Math.max(0, goal - consumed).toLocaleString()}</span>
        <span class="dash-ring-lbl">kcal restantes</span>
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
            <div class="dash-macro-bar-fill" style="width:${pct}%; background:${m.color}; box-shadow: 0 0 8px ${m.color}88;"></div>
          </div>
          <span class="dash-macro-bar-pct">${pct}%</span>
        </div>
      `;
    }).join('')}
  `;
}

function renderPlanVsExtra(dateStr) {
  let section = document.getElementById('dash-plan-vs-extra');
  if (!section) {
    const aiCard = document.getElementById('dash-ai-card');
    if (!aiCard) return;
    section = document.createElement('div');
    section.id = 'dash-plan-vs-extra';
    section.className = 'dash-plan-vs-extra-section';
    aiCard.parentNode.insertBefore(section, aiCard);
  }

  const { plan, extra } = getPlanVsExtraSummary(dateStr);
  const goals = (window.DB && window.DB.userPreferences && window.DB.userPreferences.goals)
    ? window.DB.userPreferences.goals
    : { calories: 2000 };
  const totalCalGoal = goals.calories || 2000;

  const planPct = Math.min(100, Math.round((plan.calories / totalCalGoal) * 100));
  const extraPct = Math.min(100, Math.round((extra.calories / totalCalGoal) * 100));

  const totalConsumed = plan.calories + extra.calories;
  const planCompliance = totalConsumed > 0
    ? Math.round((plan.calories / totalConsumed) * 100)
    : 0;

  section.innerHTML = `
    <h2 class="dash-section-title">\u{1F4CA} Plan vs Extras</h2>
    <div class="dash-pve-cards">
      <div class="dash-pve-card dash-pve-card--plan">
        <div class="dash-pve-icon">\u{1F4CB}</div>
        <div class="dash-pve-val">${plan.calories} <span class="dash-pve-unit">kcal</span></div>
        <div class="dash-pve-lbl">Del plan \u2022 ${plan.entries} comida${plan.entries !== 1 ? 's' : ''}</div>
        <div class="dash-pve-bar-track">
          <div class="dash-pve-bar-fill dash-pve-bar--plan" style="width:${planPct}%"></div>
        </div>
        <div class="dash-pve-pct">${planPct}% del objetivo</div>
      </div>
      <div class="dash-pve-card dash-pve-card--extra">
        <div class="dash-pve-icon">\u2795</div>
        <div class="dash-pve-val">${extra.calories} <span class="dash-pve-unit">kcal</span></div>
        <div class="dash-pve-lbl">Extras \u2022 ${extra.entries} registro${extra.entries !== 1 ? 's' : ''}</div>
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
      <span class="dash-pve-compliance-pct" style="color:${planCompliance >= 70 ? '#10b981' : planCompliance >= 40 ? '#f59e0b' : '#ef4444'}">${planCompliance}%</span>
    </div>` : ''}
  `;
}

function renderDashTimeline(dateStr) {
  const container = document.getElementById('dash-timeline-list');
  const titleEl = document.getElementById('dash-timeline-title');
  if (!container) return;

  const targetDate = dateStr || getDashSelectedDate();
  const isToday = (targetDate === getDashTodayIso());

  if (titleEl) {
    titleEl.innerHTML = isToday ? '\u{1F4CB} Comidas de hoy' : `\u{1F4CB} Comidas del d\u00EDa (${targetDate})`;
  }

  const logs = (window.DB && typeof window.DB.getLogsByDate === 'function')
    ? window.DB.getLogsByDate(targetDate)
    : [];

  const mealLogs     = logs.filter(l => l.type === 'meal');
  const liqLogs      = logs.filter(l => l.type === 'liquid');
  const foodItemLogs = logs.filter(l => l.type === 'food_item');

  if (mealLogs.length === 0 && liqLogs.length === 0 && foodItemLogs.length === 0) {
    container.innerHTML = `<div class="dash-timeline-empty">${isToday ? 'Nada registrado a\u00FAn hoy. \u00A1Comienza registrando tus comidas! \u{1F33F}' : 'No se registraron comidas en esta fecha. \u{1F33F}'}</div>`;
    return;
  }

  container.innerHTML = '';

  mealLogs.forEach(log => {
    const recipe = window.DB.getRecipeById(log.reference_id);
    if (!recipe) return;
    const macros = calcRecipeMacros(recipe.id);
    const isPlanned = log.planned === true;
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot ${isPlanned ? 'meal-dot' : 'extra-dot'}"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${recipe.name}${!isPlanned ? ' <span class="dash-tl-extra-badge">extra</span>' : ''}</div>
        <div class="dash-tl-meta">${getMealTypeEmoji(recipe.meal_type)} ${recipe.meal_type} \u2022 ${macros.calories} kcal \u2022 ${macros.protein}g prot</div>
      </div>
    `;
    container.appendChild(item);
  });

  foodItemLogs.forEach(log => {
    const fi = window.DB.getFoodItemById(log.reference_id);
    if (!fi) return;
    const qty  = log.quantity_g || 100;
    const kcal = Math.round((fi.calories_per_100g || 0) * qty / 100);
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot extra-dot"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${fi.name} <span class="dash-tl-extra-badge">libre</span></div>
        <div class="dash-tl-meta">\u{1F957} ${qty}g \u2022 ${kcal} kcal \u2022 ${Math.round((fi.protein_per_100g||0)*qty/100)}g prot</div>
      </div>
    `;
    container.appendChild(item);
  });

  liqLogs.forEach(log => {
    const liquidsList = window.DB.liquids || (window.DB.state && window.DB.state.liquids) || [];
    const liq = liquidsList.find(l => l.id === log.reference_id);
    const qty = log.quantity_g || 250;
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot liquid-dot"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${liq ? liq.name : 'Agua / L\u00EDquido'}</div>
        <div class="dash-tl-meta">${liq ? liq.icon : '\u{1F4A7}'} Hidrataci\u00F3n \u2022 +${qty} ml</div>
      </div>
    `;
    container.appendChild(item);
  });
}
