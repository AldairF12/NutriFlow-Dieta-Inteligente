// ============================================================
// GESTI\u00d3N UNIVERSAL DE HISTORIAL Y BOT\u00d3N ATR\u00c1S EN ANDROID (PWA History)
// Observa cualquier modal/sheet que se abra y gestiona el bot\u00f3n Atr\u00e1s
// ============================================================
window.ModalHistory = {
  _stack: [],
  _isPopping: false,

  open(modalId, closeFn) {
    if (!this._stack.some(m => m.id === modalId)) {
      this._stack.push({ id: modalId, closeFn });
      history.pushState({ modalId: modalId }, '');
    }
  },

  close(modalId) {
    const idx = this._stack.findIndex(m => m.id === modalId);
    if (idx !== -1) {
      this._stack.splice(idx, 1);
      if (history.state && history.state.modalId === modalId && !this._isPopping) {
        this._isPopping = true;
        history.back();
        setTimeout(() => { this._isPopping = false; }, 80);
      }
    }
  },

  hasOpenModals() {
    return this._stack.length > 0;
  }
};

(function initUniversalModalObserver() {
  const modalDefs = [
    { selector: '#ai-chat-modal', closeFn: () => typeof closeAIChat === 'function' ? closeAIChat() : document.getElementById('ai-chat-modal')?.classList.remove('open') },
    { selector: '#ai-clear-confirm', closeFn: () => document.getElementById('ai-clear-confirm')?.classList.remove('open') },
    { selector: '#register-sheet', closeFn: () => typeof closeRegisterSheet === 'function' ? closeRegisterSheet() : document.getElementById('register-sheet')?.classList.remove('open') },
    { selector: '#shopping-modal', closeFn: () => typeof closeShoppingModal === 'function' ? closeShoppingModal() : document.getElementById('shopping-modal')?.classList.remove('open') },
    { selector: '#recipe-modal', closeFn: () => typeof closeRecipeModal === 'function' ? closeRecipeModal() : document.getElementById('recipe-modal')?.classList.remove('open') },
    { selector: '#ingredient-popover', closeFn: () => typeof closeIngredientPopover === 'function' ? closeIngredientPopover() : document.getElementById('ingredient-popover')?.classList.remove('open') }
  ];

  let activeModals = [];
  let isPopping = false;

  function checkModals() {
    modalDefs.forEach(def => {
      const el = document.querySelector(def.selector);
      if (!el) return;
      const isOpen = el.classList.contains('open') || (el.classList.contains('active') && !el.hidden && el.style.display !== 'none');
      const idx = activeModals.indexOf(def.selector);

      if (isOpen && idx === -1) {
        activeModals.push(def.selector);
        history.pushState({ modalSelector: def.selector }, '');
      } else if (!isOpen && idx !== -1) {
        activeModals.splice(idx, 1);
        if (history.state && history.state.modalSelector === def.selector && !isPopping) {
          isPopping = true;
          history.back();
          setTimeout(() => { isPopping = false; }, 80);
        }
      }
    });
  }

  const observer = new MutationObserver(checkModals);

  const startObserving = () => {
    modalDefs.forEach(def => {
      const el = document.querySelector(def.selector);
      if (el) {
        observer.observe(el, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }

  window.addEventListener('popstate', () => {
    if (isPopping) return;
    if (activeModals.length > 0) {
      const topSelector = activeModals.pop();
      const def = modalDefs.find(m => m.selector === topSelector);
      if (def && typeof def.closeFn === 'function') {
        isPopping = true;
        def.closeFn();
        setTimeout(() => { isPopping = false; }, 80);
      }
    }
  });
})();

// ============================================================
// MEJORA DE UI: SECCIONES COLAPSABLES ("U\u00d1AS" / ACORDEONES)
// ============================================================
function initCollapsibleSections() {
  const enhance = () => {
    // 1. Pr\u00f3ximas comidas
    document.querySelectorAll('.upcoming-section').forEach(sec => {
      if (sec.dataset.collapsibleInit) return;
      sec.dataset.collapsibleInit = 'true';
      sec.classList.add('collapsible-section');
      
      const header = sec.querySelector('.upcoming-header') || sec.querySelector('.section-title');
      if (header) {
        header.classList.add('section-collapse-toggle');
        if (!header.querySelector('.section-toggle-btn')) {
          const btn = document.createElement('button');
          btn.className = 'section-toggle-btn';
          btn.innerHTML = '<span class="toggle-icon">\u25be</span>';
          btn.setAttribute('aria-label', 'Colapsar secci\u00f3n');
          header.appendChild(btn);
        }
        
        // Wrap children after header in collapsible-body
        let body = sec.querySelector('.collapsible-body');
        if (!body) {
          body = document.createElement('div');
          body.className = 'collapsible-body';
          const children = Array.from(sec.children).filter(c => c !== header);
          children.forEach(c => body.appendChild(c));
          sec.appendChild(body);
        }

        const isCollapsed = localStorage.getItem('nf_collapse_upcoming') === 'true';
        if (isCollapsed) sec.classList.add('collapsed');

        header.addEventListener('click', () => {
          sec.classList.toggle('collapsed');
          localStorage.setItem('nf_collapse_upcoming', sec.classList.contains('collapsed'));
        });
      }
    });

    // 2. Te falta comprar
    document.querySelectorAll('.needs-buy').forEach(sec => {
      if (sec.dataset.collapsibleInit) return;
      sec.dataset.collapsibleInit = 'true';
      sec.classList.add('collapsible-section');

      const title = sec.querySelector('.section-title');
      if (title) {
        title.classList.add('section-collapse-toggle');
        if (!title.querySelector('.section-toggle-btn')) {
          const count = sec.querySelectorAll('.card').length;
          const wrap = document.createElement('div');
          wrap.style.display = 'flex';
          wrap.style.alignItems = 'center';
          wrap.style.gap = '8px';
          
          if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'collapse-count-badge';
            badge.textContent = count;
            title.appendChild(badge);
          }

          const btn = document.createElement('button');
          btn.className = 'section-toggle-btn';
          btn.innerHTML = '<span class="toggle-icon">\u25be</span>';
          btn.setAttribute('aria-label', 'Colapsar secci\u00f3n');
          title.appendChild(btn);
        }

        let body = sec.querySelector('.collapsible-body');
        if (!body) {
          body = document.createElement('div');
          body.className = 'collapsible-body';
          const children = Array.from(sec.children).filter(c => c !== title);
          children.forEach(c => body.appendChild(c));
          sec.appendChild(body);
        }

        const isCollapsed = localStorage.getItem('nf_collapse_needsbuy') === 'true';
        if (isCollapsed) sec.classList.add('collapsed');

        title.addEventListener('click', () => {
          sec.classList.toggle('collapsed');
          localStorage.setItem('nf_collapse_needsbuy', sec.classList.contains('collapsed'));
        });
      }
    });
  };

  enhance();
  // Re-ejecutar cuando cambien las vistas del diario
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    const observer = new MutationObserver(() => enhance());
    observer.observe(mainContent, { childList: true, subtree: false });
  }
}

// ============================================================
// ============================================================
// FASE 2: GAMIFICACI\u00d3N, RACHA, ILUSTRACI\u00d3N DIN\u00c1MICA E HIDRATACI\u00d3N
// ============================================================

const DAILY_TIPS = [
  'La hidrataci\u00f3n constante mejora tu concentraci\u00f3n, energ\u00eda y digesti\u00f3n.',
  'Prioriza prote\u00ednas en cada comida para mantener saciedad y masa muscular.',
  'La constancia vence a la perfecci\u00f3n: cada elecci\u00f3n saludable cuenta.',
  'A\u00f1adir fibra y vegetales a tu plato estabiliza tu glucosa y apetito.',
  'Dormir entre 7 y 8 horas es tan vital para tu metabolismo como tu dieta.',
  'Beber un vaso de agua al despertar activa tu sistema digestivo.',
  'Las grasas saludables (aguacate, frutos secos) protegen tu salud cardiovascular.'
];

function getNutriDB() {
  if (typeof DB !== 'undefined') return DB;
  if (typeof window !== 'undefined' && window.DB) return window.DB;
  return null;
}

function getLocalIsoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDailyStreak() {
  const db = getNutriDB();
  const logs = (db && db.state && db.state.food_logs) ? db.state.food_logs : [];
  if (!logs.length) return { count: 0, recordedToday: false };

  const dates = new Set(logs.map(l => l.date));
  const today = new Date();
  const todayStr = getLocalIsoDate(today);
  const recordedToday = dates.has(todayStr);

  let streak = 0;
  let curr = new Date(today);

  if (!recordedToday) {
    curr.setDate(curr.getDate() - 1);
  }

  while (dates.has(getLocalIsoDate(curr))) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }

  return { count: streak, recordedToday };
}

function updateHeaderGamification() {
  const hour = new Date().getHours();
  const artContainer = document.getElementById('header-dynamic-art');
  const streakEl = document.getElementById('streak-badge');
  const tipText = document.getElementById('daily-tip-text');
  const greetingEl = document.getElementById('greeting-text');

  // 1. Ilustraci\u00f3n vectorial animada y grande (76px) seg\u00fan la hora del d\u00eda
  if (artContainer) {
    if (hour >= 5 && hour < 12) {
      if (greetingEl) greetingEl.textContent = '\u00a1Buenos d\u00edas! \u{1f305}';
      artContainer.innerHTML = `
        <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
          <circle cx="37" cy="37" r="32" fill="url(#mSunGrad)" fill-opacity="0.3" style="animation: sunPulse 3s ease-in-out infinite;"/>
          <circle cx="37" cy="30" r="13" fill="#fde047"/>
          <!-- Taza de caf\u00e9 con vapor animado -->
          <path d="M24 44 h26 a3 3 0 0 1 3 3 v5 a8 8 0 0 1 -8 8 h-14 a8 8 0 0 1 -8 -8 v-5 a3 3 0 0 1 3 -3 Z" fill="#ffffff"/>
          <path d="M49 46 h4 a4 4 0 0 1 4 4 v2 a4 4 0 0 1 -4 4 h-4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M31 38 c0 -4 3 -6 3 -10" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 3" style="animation: steamRise 2s ease-in-out infinite;"/>
          <path d="M39 38 c0 -4 3 -6 3 -10" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 3" style="animation: steamRise 2s ease-in-out infinite 0.7s;"/>
          <path d="M46 38 c0 -4 3 -6 3 -10" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 3" style="animation: steamRise 2s ease-in-out infinite 1.3s;"/>
          <defs>
            <radialGradient id="mSunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(37 37) scale(32)">
              <stop stop-color="#fef08a"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>`;
    } else if (hour >= 12 && hour < 19) {
      if (greetingEl) greetingEl.textContent = '\u00a1Buenas tardes! \u2600\ufe0f';
      artContainer.innerHTML = `
        <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
          <circle cx="37" cy="37" r="32" fill="url(#tSunGrad)" fill-opacity="0.3"/>
          <g style="transform-origin: 37px 37px; animation: sunSpinSlow 20s linear infinite;">
            <circle cx="37" cy="37" r="14" fill="#f59e0b"/>
            <path d="M37 12 v4 M37 58 v4 M12 37 h4 M58 37 h4 M19 19 l3 3 M52 52 l3 3 M19 55 l3 -3 M52 19 l3 -3" stroke="#fde047" stroke-width="3" stroke-linecap="round"/>
          </g>
          <!-- Hoja verde de energ\u00eda -->
          <path d="M42 30 c4 -5 9 -4 9 -4 c0 5 -4 9 -9 9 Z" fill="#4ade80" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"/>
          <defs>
            <radialGradient id="tSunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(37 37) scale(32)">
              <stop stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>`;
    } else {
      if (greetingEl) greetingEl.textContent = '\u00a1Buenas noches! \u{1f319}';
      artContainer.innerHTML = `
        <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
          <circle cx="37" cy="37" r="32" fill="url(#nMoonGrad)" fill-opacity="0.35"/>
          <g style="transform-origin: 37px 37px; animation: moonSway 4s ease-in-out infinite;">
            <path d="M44 22 A18 18 0 1 1 27 51 A15 15 0 0 0 44 22 Z" fill="#fef08a"/>
          </g>
          <!-- Estrellas brillantes con parpadeo -->
          <path d="M52 24 l1.5 3 l3 1.5 l-3 1.5 l-1.5 3 l-1.5 -3 l-3 -1.5 l3 -1.5 Z" fill="#ffffff" style="animation: starTwinkle 2.2s infinite;"/>
          <path d="M22 25 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z" fill="#ffffff" style="animation: starTwinkle 2.2s infinite 0.8s;"/>
          <path d="M49 50 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z" fill="#ffffff" style="animation: starTwinkle 2.2s infinite 1.4s;"/>
          <defs>
            <radialGradient id="nMoonGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(37 37) scale(32)">
              <stop stop-color="#818cf8"/><stop offset="1" stop-color="#312e81" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>`;
    }
  }

  // 2. Racha Diaria (Streak con fueguito siempre visible)
  if (streakEl) {
    const { count, recordedToday } = getDailyStreak();
    if (count > 0) {
      streakEl.textContent = `\u{1f525} ${count} ${count === 1 ? 'd\u00eda' : 'd\u00edas'} de racha`;
      streakEl.classList.add('streak-badge--active');
    } else {
      streakEl.textContent = '\u{1f525} \u00a1Inicia tu racha hoy!';
      streakEl.classList.remove('streak-badge--active');
    }
  }

  // 3. Frase / Tip del d\u00eda rotativo
  if (tipText) {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    tipText.textContent = DAILY_TIPS[tipIndex];
  }
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// HIDRATACI\u00d3N L\u00cdQUIDA INTERACTIVA (Vaso / Ola animada)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function getTodayHydrationTotal() {
  const db = getNutriDB();
  if (!db) return 0;
  const logs = db.getTodayLogs().filter(l => l.type === 'liquid');
  return logs.reduce((sum, l) => sum + (l.quantity_g || 250), 0);
}

function enhanceHydrationView() {
  const hydSections = document.querySelectorAll('.content-section');
  hydSections.forEach(sec => {
    const title = sec.querySelector('.section-title');
    if (!title || !title.textContent.includes('Hidrataci\u00f3n')) return;

    // Ocultar tarjetas redundantes de bebidas de abajo
    const redundantRow = sec.querySelector('.cards-row');
    if (redundantRow) {
      redundantRow.style.display = 'none';
    }

    let animCard = sec.querySelector('.hydration-card-animated');
    const totalMl = getTodayHydrationTotal();
    const targetMl = 2000; // Meta diaria recomendada de 2 Litros
    const pct = Math.min(100, Math.round((totalMl / targetMl) * 100));

    if (!animCard) {
      animCard = document.createElement('div');
      animCard.className = 'hydration-card-animated';
      
      animCard.innerHTML = `
        <div class="hydration-top-info">
          <div class="water-glass-wrap">
            <div class="water-wave-fill" style="height: ${Math.max(6, pct)}%;">
              <div class="water-wave-anim"></div>
            </div>
          </div>
          <div class="water-stats-panel">
            <div class="water-stats-header-row">
              <div class="water-stats-title">Meta de Hidrataci\u00f3n</div>
              <button class="btn-water-undo-pill" id="btn-water-undo" title="Deshacer \u00faltimo registro de agua" aria-label="Deshacer \u00faltimo registro de agua">
                <span class="undo-icon">\u21BA</span> Deshacer
              </button>
            </div>
            <div class="water-vol-display">
              <span class="water-current-ml">${totalMl.toLocaleString()}</span>
              <span class="water-target-ml">/ ${targetMl.toLocaleString()} ml (${pct}%)</span>
            </div>
            <div class="water-progress-bar-wrap">
              <div class="water-progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>

        <div class="quick-water-buttons">
          <button class="btn-water-quick" data-ml="250" aria-label="Agregar vaso de 250ml">
            <span class="btn-water-icon">\u{1F95B}</span>
            <span class="btn-water-amount">+250 ml</span>
            <span class="btn-water-lbl">Vaso</span>
          </button>
          <button class="btn-water-quick" data-ml="500" aria-label="Agregar botella de 500ml">
            <span class="btn-water-icon">\u{1F376}</span>
            <span class="btn-water-amount">+500 ml</span>
            <span class="btn-water-lbl">Botella</span>
          </button>
          <button class="btn-water-quick" data-ml="150" aria-label="Agregar taza de 150ml">
            <span class="btn-water-icon">\u2615</span>
            <span class="btn-water-amount">+150 ml</span>
            <span class="btn-water-lbl">Taza</span>
          </button>
          <button class="btn-water-quick" data-ml="100" aria-label="Agregar 100ml">
            <span class="btn-water-icon">\u{1F4A7}</span>
            <span class="btn-water-amount">+100 ml</span>
            <span class="btn-water-lbl">Trago</span>
          </button>
        </div>
      `;

      const sub = sec.querySelector('.section-subtitle') || title;
      sub.insertAdjacentElement('afterend', animCard);
    } else {
      const fill = animCard.querySelector('.water-wave-fill');
      const curMl = animCard.querySelector('.water-current-ml');
      const tarMl = animCard.querySelector('.water-target-ml');
      const barFill = animCard.querySelector('.water-progress-bar-fill');

      if (fill) fill.style.height = `${Math.max(6, pct)}%`;
      if (curMl) curMl.textContent = totalMl.toLocaleString();
      if (tarMl) tarMl.textContent = `/ ${targetMl.toLocaleString()} ml (${pct}%)`;
      if (barFill) barFill.style.width = `${pct}%`;
    }
  });
}

// Delegaci\u00f3n de eventos global para clicks de hidrataci\u00f3n
document.addEventListener('click', (e) => {
  const quickBtn = e.target.closest('.btn-water-quick');
  if (quickBtn) {
    e.preventDefault();
    e.stopPropagation();
    const amount = parseInt(quickBtn.dataset.ml, 10) || 250;
    const db = getNutriDB();
    if (db) {
      const liquidsList = db.liquids || (db.state && db.state.liquids) || [];
      const waterLiq = liquidsList.find(l => l.type === 'water') || liquidsList[0] || { id: 'liq_003' };
      db.addFoodLog({ type: 'liquid', reference_id: waterLiq.id, quantity_g: amount });
      if (typeof showToast === 'function') showToast(`\u{1f4a7} +${amount} ml de agua registrados`);
      enhanceHydrationView();
      updateHeaderGamification();
      if (typeof renderDailyMacros === 'function') renderDailyMacros();
    }
    return;
  }

  const undoBtn = e.target.closest('#btn-water-undo');
  if (undoBtn) {
    e.preventDefault();
    e.stopPropagation();
    const db = getNutriDB();
    if (db) {
      const todayLogs = db.getTodayLogs().filter(l => l.type === 'liquid');
      if (todayLogs.length > 0) {
        const lastLog = todayLogs[todayLogs.length - 1];
        db.removeFoodLog(lastLog.id);
        if (typeof showToast === 'function') showToast('\u21ba \u00daltimo registro de agua eliminado');
        enhanceHydrationView();
        updateHeaderGamification();
        if (typeof renderDailyMacros === 'function') renderDailyMacros();
      } else {
        if (typeof showToast === 'function') showToast('No hay registros de agua hoy');
      }
    }
  }
});

function initPhase2() {
  initCollapsibleSections();
  updateHeaderGamification();
  enhanceHydrationView();

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    const observer = new MutationObserver(() => {
      initCollapsibleSections();
      enhanceHydrationView();
      updateHeaderGamification();
    });
    observer.observe(mainContent, { childList: true, subtree: false });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase2);
} else {
  initPhase2();
}

/**
 * Helper compartido para inicializar dictado por voz en cualquier bot\u00f3n/input.
 */
function initVoiceDictation({ button, input, onStart, onEnd, onResult, onError }) {
  const btnEl = typeof button === 'string' ? document.getElementById(button) : button;
  const inputEl = typeof input === 'string' ? document.getElementById(input) : input;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.style.opacity = '0.5';
    }
    return { supported: false, start: () => {}, stop: () => {}, toggle: () => {}, isRecording: () => false };
  }

  let isRecording = false;
  let baseText = '';
  let recognition = null;

  const controller = {
    supported: true,
    isRecording: () => isRecording,
    start: () => {
      if (isRecording) return;
      isRecording = true;
      baseText = inputEl && inputEl.value ? inputEl.value.trim() : '';
      
      try {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          if (onStart) onStart();
        };

        recognition.onresult = (event) => {
          const resultItem = event.results[0];
          if (!resultItem) return;

          const transcript = resultItem[0].transcript;
          if (inputEl) {
            inputEl.value = (baseText ? baseText + ' ' : '') + (resultItem.isFinal ? transcript.trim() : transcript);
            inputEl.dispatchEvent(new Event('input'));
          }
          if (onResult) onResult(inputEl ? inputEl.value : transcript);
        };

        recognition.onerror = (event) => {
          isRecording = false;
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            if (onError) onError(event.error);
          }
        };

        recognition.onend = () => {
          isRecording = false;
          if (inputEl) {
            inputEl.value = inputEl.value.trim();
          }
          if (onEnd) onEnd();
        };

        recognition.start();
      } catch (e) {
        console.warn('Error al iniciar reconocimiento:', e);
        isRecording = false;
        if (onError) onError(e.message);
      }
    },
    stop: () => {
      if (!isRecording) return;
      isRecording = false;
      try {
        if (recognition) recognition.stop();
      } catch (e) {}
    },
    toggle: () => {
      if (isRecording) controller.stop();
      else controller.start();
    }
  };

  if (btnEl) {
    btnEl.addEventListener('click', controller.toggle);
  }

  return controller;
}

let _voiceDictation = null;

function initVoiceRegistration() {
  const micBtn = document.getElementById('btn-rs-voice-mic');
  const processBtn = document.getElementById('btn-rs-voice-process');
  const input = document.getElementById('rs-voice-input');
  const hint = document.getElementById('rs-voice-hint');
  const area = document.getElementById('rs-voice-transcript-area');
  const status = document.getElementById('rs-voice-status');

  if (processBtn) {
    processBtn.disabled = !input?.value?.trim();
    processBtn.addEventListener('click', processVoiceInput);
  }

  const expandBtn = document.getElementById('btn-rs-voice-expand');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const voiceContainer = document.querySelector('.rs-voice-container');
      const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
      const compoundConfirm = document.getElementById('rs-compound-confirm');
      const gramConfirm = document.getElementById('rs-gram-confirm');
      if (voiceContainer) voiceContainer.classList.remove('voice-minimized');
      if (collapsedBar) collapsedBar.hidden = true;
      if (compoundConfirm) compoundConfirm.hidden = true;
      if (gramConfirm) gramConfirm.hidden = true;
    });
  }

  if (input) {
    input.addEventListener('input', () => {
      const val = input.value.trim();
      if (processBtn) processBtn.disabled = !val;
      updateVoiceDBSuggestions(val);
    });
  }

  _voiceDictation = initVoiceDictation({
    button: micBtn,
    input: input,
    onStart: () => {
      if (micBtn) micBtn.classList.add('recording');
      if (hint) hint.textContent = 'Escuchando...';
      if (status) status.textContent = '';
    },
    onResult: () => {
      if (area) area.hidden = false;
      const val = input ? input.value.trim() : '';
      if (processBtn) processBtn.disabled = !val;
      updateVoiceDBSuggestions(val);
    },
    onError: (err) => {
      if (status) status.textContent = `Error: ${err}`;
    },
    onEnd: () => {
      if (micBtn) micBtn.classList.remove('recording');
      const val = input ? input.value.trim() : '';
      if (processBtn) processBtn.disabled = !val;
      updateVoiceDBSuggestions(val);
      if (hint && val) {
        hint.textContent = 'Puedes editar el texto abajo y luego procesarlo.';
      } else if (hint) {
        hint.textContent = 'Toca el micrófono para dictar...';
      }
    }
  });

  if (!_voiceDictation.supported && hint) {
    hint.textContent = 'Tu navegador no soporta registro por voz.';
  }
}

function updateVoiceDBSuggestions(text) {
  const sugBox = document.getElementById('rs-voice-suggestions');
  if (!sugBox) return;

  if (!text || text.trim().length < 2) {
    sugBox.hidden = true;
    sugBox.innerHTML = '';
    return;
  }

  const normQuery = typeof normalizeSearchText === 'function'
    ? normalizeSearchText(text)
    : text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const stopWords = (typeof SPANISH_STOP_WORDS !== 'undefined') ? SPANISH_STOP_WORDS : new Set(['con', 'sin', 'de', 'del', 'los', 'las', 'un', 'una', 'y', 'o', 'el', 'la']);

  // Extraer tokens significativos de la búsqueda (omitiendo palabras de parada como "con", "de", etc.)
  const rawTokens = normQuery.split(/[\s,.;+/()~0-9-]+/).filter(w => w.length >= 2);
  const queryTokens = rawTokens.filter(w => !stopWords.has(w));
  const effectiveTokens = queryTokens.length > 0 ? queryTokens : rawTokens;

  const candidates = [];
  const seenNames = new Set();

  // 1. Recopilar candidatos de DB.foodItems
  (DB.foodItems || []).forEach(fi => {
    if (!fi || !fi.name || seenNames.has(fi.name)) return;
    seenNames.add(fi.name);
    candidates.push({
      item: { ...fi, _type: 'food_item' },
      nameNorm: typeof normalizeSearchText === 'function' ? normalizeSearchText(fi.name) : fi.name.toLowerCase()
    });
  });

  // 2. Recopilar candidatos de DB.ingredients
  (DB.ingredients || []).forEach(ing => {
    if (!ing || !ing.name || seenNames.has(ing.name)) return;
    seenNames.add(ing.name);
    candidates.push({
      item: {
        id: ing.id,
        name: ing.name,
        calories_per_100g: ing.calories_per_100g || 0,
        protein_per_100g:  ing.protein_per_100g  || 0,
        carbs_per_100g:    ing.carbs_per_100g    || 0,
        fat_per_100g:      ing.fat_per_100g      || 0,
        typical_serving_g: 100,
        _fromIngredient: true,
        _type: 'ingredient'
      },
      nameNorm: typeof normalizeSearchText === 'function' ? normalizeSearchText(ing.name) : ing.name.toLowerCase()
    });
  });

  // 3. Evaluar relevancia y puntaje de cada candidato
  const scored = [];

  for (const { item, nameNorm } of candidates) {
    let score = 0;

    // Coincidencia exacta completa (ej. "Pan francés" === "Pan francés")
    if (nameNorm === normQuery) {
      score = 20000;
    }
    // El nombre del alimento empieza con la consulta completa (ej. "pan fran" -> "pan frances")
    else if (nameNorm.startsWith(normQuery)) {
      score = 15000 + normQuery.length;
    }
    // Coincidencia basada en tokens significativos
    else if (effectiveTokens.length > 0) {
      const itemTokens = nameNorm.split(/[\s,.;+/()~0-9-]+/).filter(w => w.length >= 2);
      let matchedExactCount = 0;
      let tokenScoreSum = 0;

      for (const qToken of effectiveTokens) {
        let bestTokenMatch = { matched: false, score: 0 };
        for (const iToken of itemTokens) {
          const matchRes = (typeof isFuzzyTokenMatch === 'function')
            ? isFuzzyTokenMatch(qToken, iToken)
            : (iToken === qToken ? { matched: true, score: 500 } : (iToken.startsWith(qToken) ? { matched: true, score: 350 } : { matched: false, score: 0 }));

          if (matchRes.matched && matchRes.score > bestTokenMatch.score) {
            bestTokenMatch = matchRes;
          }
        }
        if (bestTokenMatch.matched) {
          matchedExactCount++;
          tokenScoreSum += bestTokenMatch.score;
        }
      }

      if (matchedExactCount > 0) {
        score += tokenScoreSum;
        const queryCoverage = matchedExactCount / effectiveTokens.length;
        score += Math.round(queryCoverage * 6000);

        if (matchedExactCount >= effectiveTokens.length) {
          score += 4000;
        }
        const itemCoverage = matchedExactCount / Math.max(1, itemTokens.length);
        score += Math.round(itemCoverage * 1500);
      } else {
        score = 0;
      }

      // Bonus si la frase del usuario comienza con el nombre del alimento
      if (normQuery.startsWith(nameNorm)) {
        score += 2000;
      } else if (normQuery.includes(nameNorm)) {
        score += 1000;
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const matches = scored.slice(0, 4).map(s => s.item);

  if (matches.length === 0) {
    sugBox.hidden = true;
    sugBox.innerHTML = '';
    return;
  }

  sugBox.innerHTML = `
    <div class="rs-voice-sug-title">Sugerencias rápidas de tu BD:</div>
    <div class="rs-voice-sug-chips" id="rs-voice-sug-chips-list"></div>
  `;

  const chipsList = sugBox.querySelector('#rs-voice-sug-chips-list');
  matches.forEach(item => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'rs-voice-sug-chip';
    chip.textContent = `🥗 ${item.name}`;
    chip.title = `Seleccionar directamente ${item.name} (${Math.round(item.calories_per_100g)} kcal/100g)`;
    chip.addEventListener('click', () => {
      const voiceContainer = document.querySelector('.rs-voice-container');
      const gramConfirm = document.getElementById('rs-gram-confirm');
      const compoundConfirm = document.getElementById('rs-compound-confirm');
      const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
      const collapsedPreview = document.getElementById('rs-voice-collapsed-preview');
      const voiceInput = document.getElementById('rs-voice-input');

      if (compoundConfirm) compoundConfirm.hidden = true;

      if (voiceContainer) {
        voiceContainer.classList.add('voice-minimized');
        if (collapsedPreview) {
          collapsedPreview.textContent = voiceInput?.value.trim() || item.name || 'Dictado de voz';
        }
        if (collapsedBar) collapsedBar.hidden = false;

        if (gramConfirm) {
          voiceContainer.appendChild(gramConfirm);
          if (typeof selectFoodForGram === 'function') {
            selectFoodForGram(item);
          }
        }
      }
    });
    chipsList.appendChild(chip);
  });

  sugBox.hidden = false;
}

function resetRSVoiceView() {
  const hint = document.getElementById('rs-voice-hint');
  const input = document.getElementById('rs-voice-input');
  const area = document.getElementById('rs-voice-transcript-area');
  const status = document.getElementById('rs-voice-status');
  const sugBox = document.getElementById('rs-voice-suggestions');
  const processBtn = document.getElementById('btn-rs-voice-process');
  
  if (hint) hint.textContent = 'Toca el micrófono y dime qué consumiste\n(Ej. "Me comí dos papas con arroz, atún y palta")';
  if (input) input.value = '';
  if (area) area.hidden = true;
  if (status) status.textContent = '';
  if (sugBox) {
    sugBox.hidden = true;
    sugBox.innerHTML = '';
  }
  if (processBtn) processBtn.disabled = true;
  if (_voiceDictation) _voiceDictation.stop();
  
  const voiceContainer = document.querySelector('.rs-voice-container');
  if (voiceContainer) {
    voiceContainer.style.display = 'flex';
    voiceContainer.classList.remove('voice-minimized');
  }
  
  const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
  if (collapsedBar) collapsedBar.hidden = true;
  
  const gramConfirm = document.getElementById('rs-gram-confirm');
  const compoundConfirm = document.getElementById('rs-compound-confirm');
  const searchView = document.getElementById('rs-view-search');
  if (gramConfirm && searchView) {
    gramConfirm.hidden = true;
    searchView.appendChild(gramConfirm);
  }
  if (compoundConfirm && searchView) {
    compoundConfirm.hidden = true;
    searchView.appendChild(compoundConfirm);
  }
}

async function processVoiceInput() {
  const input = document.getElementById('rs-voice-input');
  const status = document.getElementById('rs-voice-status');
  const processBtn = document.getElementById('btn-rs-voice-process');
  
  const text = input?.value.trim();
  if (!text) return;

  if (processBtn) processBtn.disabled = true;
  if (status) status.textContent = 'Analizando tu comida... ⏳';

  try {
    console.log('[NutriFlow Voice] 🎙️ Analizando comida con IA:', text);
    
    const parsed = await AI.analyzeMealText(text);
    if (!parsed || !parsed.items || parsed.items.length === 0) {
      throw new Error('No se detectaron alimentos en el análisis.');
    }

    if (status) status.textContent = '¡Listo!';

    if (parsed.is_compound && parsed.items.length > 1) {
      if (typeof showCompoundMealConfirm === 'function') {
        showCompoundMealConfirm(parsed, 'voice');
      }
    } else {
      const single = parsed.items[0];
      const factor100 = (single.quantity_g > 0) ? (100 / single.quantity_g) : 1;
      const bestMatch = {
        name: single.name,
        calories_per_100g: Math.round(single.calories * factor100),
        protein_per_100g: parseFloat((single.protein * factor100).toFixed(1)),
        carbs_per_100g: parseFloat((single.carbs * factor100).toFixed(1)),
        fat_per_100g: parseFloat((single.fat * factor100).toFixed(1)),
        typical_serving_g: single.quantity_g || 100,
        _isTemp: true,
        source: 'gemini'
      };

      _selectedFoodItem = bestMatch;
      window._selectedFoodItem = bestMatch;

      const voiceContainer = document.querySelector('.rs-voice-container');
      const gramConfirm = document.getElementById('rs-gram-confirm');
      const compoundConfirm = document.getElementById('rs-compound-confirm');
      if (compoundConfirm) compoundConfirm.hidden = true;

      if (voiceContainer && gramConfirm) {
        voiceContainer.appendChild(gramConfirm);
        voiceContainer.classList.add('voice-minimized');
        const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
        const collapsedPreview = document.getElementById('rs-voice-collapsed-preview');
        const voiceInput = document.getElementById('rs-voice-input');
        if (collapsedPreview) {
          collapsedPreview.textContent = voiceInput?.value.trim() || bestMatch.name || 'Dictado de voz';
        }
        if (collapsedBar) collapsedBar.hidden = false;

        gramConfirm.hidden = false;

        const nameEl = document.getElementById('rs-gram-item-name');
        if (nameEl) nameEl.textContent = bestMatch.name;

        const inputG = document.getElementById('rs-gram-input');
        if (inputG) {
          inputG.placeholder = `Ej: ${bestMatch.typical_serving_g || 100}`;
          inputG.value = single.quantity_g || bestMatch.typical_serving_g || 100;
        }

        const mealSelect = document.getElementById('rs-gram-meal-type');
        if (mealSelect) {
          let val = 'snack';
          if (parsed.meal_type) {
            const mt = parsed.meal_type.toLowerCase();
            if (mt.includes('desayuno')) val = 'breakfast';
            else if (mt.includes('almuerzo')) val = 'lunch';
            else if (mt.includes('cena')) val = 'dinner';
            else if (mt.includes('merienda')) val = 'merienda';
          }
          mealSelect.value = val;
          document.querySelectorAll('#rs-meal-chips .rs-meal-chip').forEach(c => {
            if (c.dataset.val === val) c.classList.add('active');
            else c.classList.remove('active');
          });
        }

        if (typeof updateGramMacros === 'function') updateGramMacros();
        setTimeout(() => gramConfirm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
      }
    }
  } catch (err) {
    console.error('[NutriFlow Voice] ❌ Error en processVoiceInput:', err);
    if (status) status.textContent = 'Error al entender. Intenta editar el texto o reformularlo.';
  } finally {
    if (processBtn) processBtn.disabled = !input?.value?.trim();
  }
}