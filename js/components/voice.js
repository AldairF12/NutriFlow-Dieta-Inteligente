let recognition = null;
let isRecording = false;
let recordingTimeout = null;
function initVoiceRegistration() {
  const micBtn = document.getElementById('btn-rs-voice-mic');
  const processBtn = document.getElementById('btn-rs-voice-process');

  if (micBtn) {
    micBtn.addEventListener('click', toggleVoiceRecording);
  }
  if (processBtn) {
    processBtn.addEventListener('click', processVoiceInput);
  }

  // Inicializar SpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add('recording');
      const hint = document.getElementById('rs-voice-hint');
      if (hint) hint.textContent = 'Escuchando... (Toca para detener)';
      
      // Límite de 30 segundos por seguridad
      if (recordingTimeout) clearTimeout(recordingTimeout);
      recordingTimeout = setTimeout(() => {
        if (isRecording) {
          recognition.stop();
          if (typeof showToast === 'function') showToast('El micrófono se apagó por límite de tiempo (30s)');
        }
      }, 30000);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const input = document.getElementById('rs-voice-input');
      const area = document.getElementById('rs-voice-transcript-area');
      
      if (input && area) {
        // En modo continuo, mostramos todo el texto final + el texto intermedio actual
        input.value = finalTranscript + interimTranscript;
        area.hidden = false;
      }
    };

    recognition.onerror = (event) => {
      if (recordingTimeout) clearTimeout(recordingTimeout);
      console.error('SpeechRecognition error:', event.error);
      const status = document.getElementById('rs-voice-status');
      if (status) status.textContent = `Error: ${event.error}`;
      stopVoiceRecording();
    };

    recognition.onend = () => {
      if (recordingTimeout) clearTimeout(recordingTimeout);
      stopVoiceRecording();
      const hint = document.getElementById('rs-voice-hint');
      if (hint && !document.getElementById('rs-voice-input').value) {
        hint.textContent = 'Pulsa el micrófono para dictar...';
      } else if (hint) {
        hint.textContent = 'Dictado finalizado. Puedes editar el texto antes de procesar.';
      }
    };
  } else {
    // No soportado
    if (micBtn) {
      micBtn.disabled = true;
      micBtn.style.opacity = '0.5';
    }
    const hint = document.getElementById('rs-voice-hint');
    if (hint) hint.textContent = 'Tu navegador no soporta registro por voz.';
  }
}
function toggleVoiceRecording() {
  if (!recognition) return;
  if (isRecording) {
    recognition.stop();
    return;
  }
  
  // Reset estado
  const input = document.getElementById('rs-voice-input');
  const status = document.getElementById('rs-voice-status');
  const area = document.getElementById('rs-voice-transcript-area');
  if (input) input.value = '';
  if (status) status.textContent = '';
  if (area) area.hidden = true;
  
  try {
    recognition.start();
  } catch(e) {
    console.warn("Error al iniciar dictado", e);
  }
}
function stopVoiceRecording() {
  isRecording = false;
  const micBtn = document.getElementById('btn-rs-voice-mic');
  if (micBtn) micBtn.classList.remove('recording');
  
  const hint = document.getElementById('rs-voice-hint');
  if (hint && hint.textContent === 'Escuchando...') {
    hint.textContent = 'Puedes editar el texto abajo y luego procesarlo.';
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
  if (isRecording && recognition) recognition.stop();
  
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