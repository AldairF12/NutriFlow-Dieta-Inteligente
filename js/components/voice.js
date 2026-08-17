/**
 * Helper compartido para inicializar dictado por voz en cualquier botón/input.
 * Utiliza encadenamiento de sesiones por pausas (onspeechend) para permitir dictado continuo
 * fluido con feedback en tiempo real sin duplicación ni fallos en Android.
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
  let activeRecognition = null;
  let baseText = '';

  function startRecognitionSession() {
    if (!isRecording) return;

    try {
      if (activeRecognition) {
        try { activeRecognition.abort(); } catch(e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      activeRecognition = recognition;

      recognition.onstart = () => {
        if (onStart) onStart();
      };

      recognition.onresult = (event) => {
        if (!isRecording) return;
        const resultItem = event.results[0];
        if (!resultItem) return;

        const transcript = resultItem[0].transcript;

        if (resultItem.isFinal) {
          // Frase confirmada: se acumula en el texto base
          baseText = (baseText ? baseText + ' ' : '') + transcript.trim();
          if (inputEl) {
            inputEl.value = baseText;
            inputEl.dispatchEvent(new Event('input'));
          }
        } else {
          // Frase provisional: se muestra en vivo concatenada al texto base
          if (inputEl) {
            inputEl.value = (baseText ? baseText + ' ' : '') + transcript;
            inputEl.dispatchEvent(new Event('input'));
          }
        }

        if (onResult) {
          onResult(inputEl ? inputEl.value : (baseText || transcript));
        }
      };

      recognition.onspeechend = () => {
        // Pausa detectada: reanuda inmediatamente una nueva sesión limpia para la siguiente frase
        if (isRecording) {
          setTimeout(() => {
            if (isRecording) startRecognitionSession();
          }, 50);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          if (isRecording) {
            setTimeout(() => {
              if (isRecording) startRecognitionSession();
            }, 100);
            return;
          }
        }
        console.warn('SpeechRecognition notice:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (onError) onError(event.error);
          controller.stop();
        }
      };

      recognition.onend = () => {
        if (isRecording) {
          // Si el navegador cortó la sesión pero el usuario no ha tocado detener, reinicia
          setTimeout(() => {
            if (isRecording) startRecognitionSession();
          }, 50);
        } else {
          if (onEnd) onEnd();
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Error al iniciar sesión de reconocimiento:', e);
      if (isRecording) {
        setTimeout(() => {
          if (isRecording) startRecognitionSession();
        }, 300);
      }
    }
  }

  const controller = {
    supported: true,
    isRecording: () => isRecording,
    start: () => {
      if (isRecording) return;
      isRecording = true;
      baseText = inputEl && inputEl.value ? inputEl.value.trim() : '';
      startRecognitionSession();
    },
    stop: () => {
      isRecording = false;
      if (activeRecognition) {
        try { activeRecognition.stop(); } catch (e) {}
        activeRecognition = null;
      }
      if (inputEl && baseText) {
        inputEl.value = baseText.trim();
        inputEl.dispatchEvent(new Event('input'));
      }
      if (onEnd) onEnd();
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