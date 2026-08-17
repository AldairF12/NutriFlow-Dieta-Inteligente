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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollapsibleSections);
} else {
  initCollapsibleSections();
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