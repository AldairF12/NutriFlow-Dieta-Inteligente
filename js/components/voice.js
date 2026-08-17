// ============================================================
// GESTIÓN UNIVERSAL DE HISTORIAL Y BOTÓN ATRÁS EN ANDROID (PWA History)
// Observa cualquier modal/sheet que se abra y gestiona el botón Atrás
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
// MEJORA DE UI: SECCIONES COLAPSABLES ("UÑAS" / ACORDEONES)
// ============================================================
function initCollapsibleSections() {
  const enhance = () => {
    // 1. Próximas comidas
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
          btn.innerHTML = '<span class="toggle-icon">▾</span>';
          btn.setAttribute('aria-label', 'Colapsar sección');
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
          btn.innerHTML = '<span class="toggle-icon">▾</span>';
          btn.setAttribute('aria-label', 'Colapsar sección');
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
// FASE 2: GAMIFICACIÓN, RACHA, ILUSTRACIÓN DINÁMICA E HIDRATACIÓN
// ============================================================

const DAILY_TIPS = [
  'La hidratación constante mejora tu concentración, energía y digestión.',
  'Prioriza proteínas en cada comida para mantener saciedad y masa muscular.',
  'La constancia vence a la perfección: cada elección saludable cuenta.',
  'Añadir fibra y vegetales a tu plato estabiliza tu glucosa y apetito.',
  'Dormir entre 7 y 8 horas es tan vital para tu metabolismo como tu dieta.',
  'Beber un vaso de agua al despertar activa tu sistema digestivo.',
  'Las grasas saludables (aguacate, frutos secos) protegen tu salud cardiovascular.'
];

function getDailyStreak() {
  const logs = (window.DB && window.DB.state && window.DB.state.food_logs) ? window.DB.state.food_logs : [];
  if (!logs.length) return { count: 0, recordedToday: false };

  const dates = new Set(logs.map(l => l.date));
  const today = new Date();
  const format = d => d.toISOString().split('T')[0];

  const todayStr = format(today);
  const recordedToday = dates.has(todayStr);

  let streak = 0;
  let curr = new Date(today);

  if (!recordedToday) {
    curr.setDate(curr.getDate() - 1);
  }

  while (dates.has(format(curr))) {
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

  // 1. Ilustración vectorial y saludo según la hora del día
  if (artContainer) {
    if (hour >= 5 && hour < 12) {
      if (greetingEl) greetingEl.textContent = '¡Buenos días! 🌅';
      artContainer.innerHTML = `
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <circle cx="27" cy="27" r="24" fill="url(#mSunGrad)" fill-opacity="0.25"/>
          <circle cx="27" cy="22" r="9" fill="#fde047"/>
          <path d="M17 32 h18 a2 2 0 0 1 2 2 v4 a6 6 0 0 1 -6 6 h-10 a6 6 0 0 1 -6 -6 v-4 a2 2 0 0 1 2 -2 Z" fill="#ffffff"/>
          <path d="M35 34 h2 a3 3 0 0 1 3 3 v1 a3 3 0 0 1 -3 3 h-2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 28 c0 -3 2 -4 2 -7" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>
          <path d="M28 28 c0 -3 2 -4 2 -7" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"/>
          <defs>
            <radialGradient id="mSunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27 27) scale(24)">
              <stop stop-color="#fef08a"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>`;
    } else if (hour >= 12 && hour < 19) {
      if (greetingEl) greetingEl.textContent = '¡Buenas tardes! ☀️';
      artContainer.innerHTML = `
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <circle cx="27" cy="27" r="24" fill="url(#tSunGrad)" fill-opacity="0.25"/>
          <circle cx="27" cy="27" r="10" fill="#f59e0b"/>
          <path d="M27 9 v3 M27 42 v3 M9 27 h3 M42 27 h3 M14 14 l2.5 2.5 M37.5 37.5 l2.5 2.5 M14 40 l2.5 -2.5 M37.5 16.5 l2.5 -2.5" stroke="#fde047" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M30 22 c3 -4 7 -3 7 -3 c0 4 -3 7 -7 7 Z" fill="#4ade80"/>
          <defs>
            <radialGradient id="tSunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27 27) scale(24)">
              <stop stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>`;
    } else {
      if (greetingEl) greetingEl.textContent = '¡Buenas noches! 🌙';
      artContainer.innerHTML = `
        <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <circle cx="27" cy="27" r="24" fill="url(#nMoonGrad)" fill-opacity="0.3"/>
          <path d="M33 16 A13 13 0 1 1 20 37 A11 11 0 0 0 33 16 Z" fill="#fef08a"/>
          <path d="M38 18 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 Z" fill="#ffffff"/>
          <path d="M16 19 l0.7 1.5 l1.5 0.7 l-1.5 0.7 l-0.7 1.5 l-0.7 -1.5 l-1.5 -0.7 l1.5 -0.7 Z" fill="#ffffff" opacity="0.8"/>
          <path d="M36 36 l0.7 1.5 l1.5 0.7 l-1.5 0.7 l-0.7 1.5 l-0.7 -1.5 l-1.5 -0.7 l1.5 -0.7 Z" fill="#ffffff" opacity="0.8"/>
          <defs>
            <radialGradient id="nMoonGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27 27) scale(24)">
              <stop stop-color="#818cf8"/><stop offset="1" stop-color="#312e81" stop-opacity="0"/>
            </radialGradient>
          </defs>
        </svg>`;
    }
  }

  // 2. Racha Diaria (Streak)
  if (streakEl) {
    const { count, recordedToday } = getDailyStreak();
    if (count > 0) {
      streakEl.textContent = `🔥 ${count} ${count === 1 ? 'día' : 'días'} de racha`;
      if (recordedToday) streakEl.classList.add('streak-badge--active');
      else streakEl.classList.remove('streak-badge--active');
    } else {
      streakEl.textContent = '🌱 ¡Inicia tu racha hoy!';
      streakEl.classList.remove('streak-badge--active');
    }
  }

  // 3. Frase / Tip del día rotativo
  if (tipText) {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % DAILY_TIPS.length;
    tipText.textContent = DAILY_TIPS[tipIndex];
  }
}

// ──────────────────────────────────────────────
// HIDRATACIÓN LÍQUIDA INTERACTIVA (Vaso / Ola animada)
// ──────────────────────────────────────────────
function getTodayHydrationTotal() {
  if (!window.DB) return 0;
  const logs = window.DB.getTodayLogs().filter(l => l.type === 'liquid');
  return logs.reduce((sum, l) => sum + (l.quantity_g || 250), 0);
}

function enhanceHydrationView() {
  const hydSections = document.querySelectorAll('.content-section');
  hydSections.forEach(sec => {
    const title = sec.querySelector('.section-title');
    if (!title || !title.textContent.includes('Hidratación')) return;

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
            <div class="water-stats-title">Meta de Hidratación</div>
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
            <span class="btn-water-icon">🥛</span>
            <span class="btn-water-amount">+250 ml</span>
            <span class="btn-water-lbl">Vaso</span>
          </button>
          <button class="btn-water-quick" data-ml="500" aria-label="Agregar botella de 500ml">
            <span class="btn-water-icon">🍶</span>
            <span class="btn-water-amount">+500 ml</span>
            <span class="btn-water-lbl">Botella</span>
          </button>
          <button class="btn-water-quick" data-ml="150" aria-label="Agregar taza de 150ml">
            <span class="btn-water-icon">☕</span>
            <span class="btn-water-amount">+150 ml</span>
            <span class="btn-water-lbl">Taza</span>
          </button>
          <button class="btn-water-quick" data-ml="100" aria-label="Agregar 100ml">
            <span class="btn-water-icon">💧</span>
            <span class="btn-water-amount">+100 ml</span>
            <span class="btn-water-lbl">Trago</span>
          </button>
          <button class="btn-water-reset" id="btn-water-undo" title="Deshacer último registro de líquido">
            ↺
          </button>
        </div>
      `;

      // Insertar la tarjeta animada justo después del título/subtítulo
      const sub = sec.querySelector('.section-subtitle') || title;
      sub.insertAdjacentElement('afterend', animCard);

      // Listeners para botones rápidos de agua
      animCard.querySelectorAll('.btn-water-quick').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const amount = parseInt(btn.dataset.ml, 10) || 250;
          if (window.DB) {
            window.DB.addFoodLog({ type: 'liquid', reference_id: 'liq_003', quantity_g: amount });
            if (typeof showToast === 'function') showToast(`💧 +${amount} ml de agua registrados`);
            enhanceHydrationView();
            updateHeaderGamification();
            if (typeof renderDailyMacros === 'function') renderDailyMacros();
          }
        });
      });

      // Botón de deshacer último registro de líquido
      const undoBtn = animCard.querySelector('#btn-water-undo');
      if (undoBtn) {
        undoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.DB) {
            const todayLogs = window.DB.getTodayLogs().filter(l => l.type === 'liquid');
            if (todayLogs.length > 0) {
              const lastLog = todayLogs[todayLogs.length - 1];
              window.DB.removeFoodLog(lastLog.id);
              if (typeof showToast === 'function') showToast('↺ Último registro de agua eliminado');
              enhanceHydrationView();
              updateHeaderGamification();
              if (typeof renderDailyMacros === 'function') renderDailyMacros();
            } else {
              if (typeof showToast === 'function') showToast('No hay registros de agua hoy');
            }
          }
        });
      }
    } else {
      // Actualizar valores existentes
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
 * Helper compartido para inicializar dictado por voz en cualquier botón/input.
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
    processBtn.addEventListener('click', processVoiceInput);
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
    },
    onError: (err) => {
      if (status) status.textContent = `Error: ${err}`;
    },
    onEnd: () => {
      if (micBtn) micBtn.classList.remove('recording');
      if (hint && input && input.value) {
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

function resetRSVoiceView() {
  const hint = document.getElementById('rs-voice-hint');
  const input = document.getElementById('rs-voice-input');
  const area = document.getElementById('rs-voice-transcript-area');
  const status = document.getElementById('rs-voice-status');
  
  if (hint) hint.textContent = 'Toca el micrófono y dime qué consumiste\n(Ej. "Me comí dos huevos con pan" o "Un vaso de leche")';
  if (input) input.value = '';
  if (area) area.hidden = true;
  if (status) status.textContent = '';
  if (_voiceDictation) _voiceDictation.stop();
  
  // Restaurar UI de confirmación a su lugar original
  const voiceContainer = document.querySelector('.rs-voice-container');
  if (voiceContainer) voiceContainer.style.display = 'flex';
  
  const gramConfirm = document.getElementById('rs-gram-confirm');
  const searchView = document.getElementById('rs-view-search');
  if (gramConfirm && searchView) {
    gramConfirm.hidden = true;
    searchView.appendChild(gramConfirm);
  }
}
async function processVoiceInput() {
  const input = document.getElementById('rs-voice-input');
  const status = document.getElementById('rs-voice-status');
  const processBtn = document.getElementById('btn-rs-voice-process');
  
  const text = input?.value.trim();
  if (!text) return;

  if (processBtn) processBtn.disabled = true;
  if (status) status.textContent = 'Procesando con IA... ⏳';

  try {
    const parsed = await AI.parseVoiceInput(text);
    if (!parsed || !parsed.food_name) throw new Error('No se detectó alimento');
    
    if (status) status.textContent = `Analizando: ${parsed.food_name}...`;

    // Usar la IA centralizada para buscar en BD o consultar macros
    const { item } = await AI.fetchNutritionInfo(parsed.food_name);
    let bestMatch = item;
    
    if (status) status.textContent = '¡Listo!';
    
    // Pasar al confirmador de gramaje
    // Pasar al confirmador de gramaje
    if (typeof _selectedFoodItem !== 'undefined') {
      _selectedFoodItem = bestMatch; // Global state for updateGramMacros
    }
    
    // Ocultar la UI de voz, mostrar el confirmador
    const voiceContainer = document.querySelector('.rs-voice-container');
    const gramConfirm = document.getElementById('rs-gram-confirm'); // usar el mismo del search view
    
    // Movemos el confirmador a la vista actual
    const voiceView = document.getElementById('rs-view-voice');
    if (voiceContainer && gramConfirm) {
      voiceContainer.appendChild(gramConfirm);
      gramConfirm.hidden = false;
      // Ya NO ocultamos voiceContainer para que el usuario pueda ver/editar su transcripción
      // si voiceContainer) voiceContainer.style.display = 'none';
      
      const nameEl = document.getElementById('rs-gram-item-name');
      if (nameEl) nameEl.textContent = bestMatch.name;

      const inputG = document.getElementById('rs-gram-input');
      if (inputG) {
        inputG.placeholder = `Ej: ${bestMatch.typical_serving_g || 100}`;
        inputG.value = parsed.quantity_g || bestMatch.typical_serving_g || 100;
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
        // Actualizar visual de chips
        document.querySelectorAll('.rs-meal-chip').forEach(c => {
          if (c.dataset.val === val) c.classList.add('active');
          else c.classList.remove('active');
        });
      }

      if (typeof updateGramMacros === 'function') updateGramMacros();
    }
    
  } catch (err) {
    console.error('Error parseVoiceInput:', err);
    if (status) status.textContent = 'Error al entender. Intenta editar el texto.';
  } finally {
    if (processBtn) processBtn.disabled = false;
  }
}