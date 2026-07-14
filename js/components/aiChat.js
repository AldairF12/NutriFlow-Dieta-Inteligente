let _chatMessages = []; // historial local de la sesión
let _currentContextMode = 'general';
let _chatSpeechRecognition = null;

function openAIChat() {
  const overlay = document.getElementById('ai-chat-overlay');
  const modal   = document.getElementById('ai-chat-modal');
  const keyReq  = document.getElementById('ai-key-required');
  const inputArea = document.getElementById('ai-chat-input-area');

  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.classList.add('modal-open');

  if (!AI.isConfigured()) {
    keyReq.hidden    = false;
    inputArea.hidden = true;
  } else {
    keyReq.hidden    = true;
    inputArea.hidden = false;
    
    // Si no hay historial en la variable, intentamos cargarlo localmente
    if (_chatMessages.length === 0) {
      loadChatHistory();
    }
    
    // Mensaje de bienvenida si el historial está vacío (incluso tras cargar)
    if (_chatMessages.length === 0) {
      appendChatMessage('bot', '¡Hola! 👋 Soy NutriBot.\n\nPuedo ayudarte con tus dudas nutricionales, sugerirte qué comer según tu progreso, o responder preguntas generales.');
    }
  }
}
function closeAIChat() {
  const overlay = document.getElementById('ai-chat-overlay');
  const modal   = document.getElementById('ai-chat-modal');
  overlay.classList.remove('open');
  modal.classList.remove('open');
  modal.style.transform = ''; // Reset transform
  document.body.classList.remove('modal-open');
}
function saveChatHistory() {
  if (_chatMessages.length > 50) {
    _chatMessages = _chatMessages.slice(_chatMessages.length - 50);
  }
  try {
    localStorage.setItem('nutriflow_chat', JSON.stringify(_chatMessages));
  } catch(e) {}
}

function loadChatHistory() {
  try {
    const saved = localStorage.getItem('nutriflow_chat');
    if (saved) {
      const msgs = JSON.parse(saved);
      const container = document.getElementById('ai-chat-messages');
      if (container) container.innerHTML = ''; 
      _chatMessages = [];
      msgs.forEach(m => appendChatMessage(m.role, m.text, true, m.id, m.pinned));
    }
  } catch(e) {}
}

function togglePinMessage(id) {
  const msg = _chatMessages.find(m => m.id === id);
  if (msg) {
    msg.pinned = !msg.pinned;
    saveChatHistory();
    const btn = document.querySelector(`.chat-pin-btn[data-id="${id}"]`);
    if (btn) {
      if (msg.pinned) btn.classList.add('pinned');
      else btn.classList.remove('pinned');
    }
  }
}

function appendChatMessage(role, text, isLoad = false, msgId = null, isPinned = false) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const id = msgId || 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5);
  const msg = document.createElement('div');
  msg.className = `chat-msg chat-msg--${role}`;
  
  const formattedText = typeof parseMarkdown === 'function' ? parseMarkdown(text) : text.replace(/\n/g, '<br>');
  
  let pinHtml = '';
  if (role === 'bot') {
    pinHtml = `<button class="chat-pin-btn ${isPinned ? 'pinned' : ''}" data-id="${id}" onclick="togglePinMessage('${id}')" title="Fijar mensaje">📌</button>`;
  }

  msg.innerHTML = `<div class="chat-bubble-container">
    <div class="chat-bubble">
      ${formattedText}
      ${pinHtml}
    </div>
  </div>`;
  
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  
  if (!isLoad) {
    _chatMessages.push({ id, role, text, pinned: isPinned });
    saveChatHistory();
  } else {
    _chatMessages.push({ id, role, text, pinned: isPinned });
  }
}
function showChatTyping() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;
  const typing = document.createElement('div');
  typing.className = 'chat-msg chat-msg--bot chat-typing';
  typing.id = 'chat-typing-indicator';
  typing.innerHTML = `<div class="chat-bubble"><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span></div>`;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}
function removeChatTyping() {
  document.getElementById('chat-typing-indicator')?.remove();
}
function initAIChat() {
  const fab     = document.getElementById('btn-ai-fab');
  const overlay = document.getElementById('ai-chat-overlay');
  const modal   = document.getElementById('ai-chat-modal');
  const closeBtn = document.getElementById('ai-chat-close');
  const sendBtn = document.getElementById('ai-chat-send');
  const input   = document.getElementById('ai-chat-input');
  const goProfile = document.getElementById('btn-go-profile-from-chat');
  const contextBtns = document.querySelectorAll('.ai-context-btn');

  if (contextBtns.length > 0) {
    contextBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        contextBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentContextMode = btn.dataset.context;
        if (input) {
          if (_currentContextMode === 'progress') {
            input.placeholder = "Ej: ¿Me paso de calorías con un helado?";
          } else {
            input.placeholder = "Pregunta algo sobre nutrición...";
          }
        }
      });
    });
  }

  if (fab)     fab.addEventListener('click', openAIChat);
  if (overlay) overlay.addEventListener('click', closeAIChat);
  if (closeBtn) closeBtn.addEventListener('click', closeAIChat);

  const clearBtn = document.getElementById('ai-chat-clear');
  const clearConfirmModal = document.getElementById('ai-clear-confirm');
  const clearCancel = document.getElementById('ai-clear-cancel');
  const clearYes = document.getElementById('ai-clear-yes');

  if (clearBtn && clearConfirmModal) {
    clearBtn.addEventListener('click', () => {
      clearConfirmModal.classList.add('open');
    });
    clearCancel.addEventListener('click', () => {
      clearConfirmModal.classList.remove('open');
    });
    clearYes.addEventListener('click', () => {
      clearConfirmModal.classList.remove('open');
      // Mantener solo los fijados
      _chatMessages = _chatMessages.filter(m => m.pinned);
      saveChatHistory();
      
      // Limpiar UI y volver a renderizar los fijados
      const container = document.getElementById('ai-chat-messages');
      if (container) {
        container.innerHTML = '';
        _chatMessages.forEach(m => appendChatMessage(m.role, m.text, true, m.id, m.pinned));
      }
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = '40px';
      this.style.height = (this.scrollHeight) + 'px';
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // Dictado por voz
  const micBtn = document.getElementById('ai-chat-mic');
  if (micBtn && input) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      _chatSpeechRecognition = new SpeechRecognition();
      _chatSpeechRecognition.lang = 'es-ES';
      _chatSpeechRecognition.continuous = true;
      _chatSpeechRecognition.interimResults = true;
      
      let isRecording = false;
      let originalPlaceholder = '';

      _chatSpeechRecognition.onstart = () => {
        isRecording = true;
        micBtn.style.color = '#ef4444'; // rojo
        micBtn.classList.add('recording-pulse');
        micBtn.innerHTML = '⏹️'; // Cuadrado de stop
        originalPlaceholder = input.placeholder;
        input.placeholder = 'Escuchando...';
      };

      _chatSpeechRecognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript || interimTranscript) {
          input.value = (input.dataset.originalText || '') + finalTranscript + interimTranscript;
          input.dispatchEvent(new Event('input')); // auto-resize
        }
        if (finalTranscript) {
          input.dataset.originalText = (input.dataset.originalText || '') + finalTranscript;
        }
      };

      _chatSpeechRecognition.onend = () => {
        isRecording = false;
        micBtn.style.color = 'var(--gray-500)';
        micBtn.classList.remove('recording-pulse');
        micBtn.innerHTML = '🎙️';
        input.placeholder = originalPlaceholder;
        delete input.dataset.originalText;
      };

      micBtn.addEventListener('click', () => {
        if (isRecording) {
          _chatSpeechRecognition.stop();
        } else {
          input.dataset.originalText = input.value ? input.value + ' ' : '';
          try { _chatSpeechRecognition.start(); } catch (e) {}
        }
      });
    } else {
      micBtn.style.display = 'none';
    }
  }

  if (goProfile) {
    goProfile.addEventListener('click', () => {
      closeAIChat();
      document.querySelector('[data-screen="profile"]').click();
      // Abrir automáticamente la card de IA
      setTimeout(() => {
        const aiCard = document.getElementById('scard-ai');
        if (aiCard && !aiCard.open) {
          aiCard.querySelector('.settings-card-header')?.click();
        }
      }, 350);
    });
  }

  // Gestos táctiles (Swipe down) para cerrar el chat
  if (modal) {
    let startY = 0;
    let isDragging = false;

    modal.addEventListener('touchstart', (e) => {
      const target = e.target;
      if (target.closest('.ai-chat-messages') && target.closest('.ai-chat-messages').scrollTop > 0) return;
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 0) {
        modal.style.transform = `translateX(-50%) translateY(${diffY}px)`;
        modal.style.transition = 'none';
      }
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      modal.style.transition = '';
      const currentY = e.changedTouches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 80) {
        closeAIChat();
      } else {
        modal.style.transform = '';
      }
    });
  }
}

async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  const msg   = input.value.trim();
  if (!msg) return;

  // Detener micrófono si estaba grabando
  if (_chatSpeechRecognition) {
    try { _chatSpeechRecognition.stop(); } catch(e) {}
  }

  input.value = '';
  input.style.height = '40px'; // reset height
  input.disabled = true;
  document.getElementById('ai-chat-send').disabled = true;

  appendChatMessage('user', msg);
  showChatTyping();

  try {
    const response = await AI.askAssistant(msg, _currentContextMode, _chatMessages);
    removeChatTyping();
    appendChatMessage('bot', response);
  } catch (err) {
    removeChatTyping();
    if (err.message === 'NO_KEY') {
      appendChatMessage('bot', '⚠️ No encontré tu API Key. Ve a Perfil → Asistente IA para configurarla.');
    } else {
      appendChatMessage('bot', `❌ Error: ${err.message}`);
    }
  } finally {
    input.disabled  = false;
    document.getElementById('ai-chat-send').disabled = false;
    input.focus();
  }
}

function initDashboardAIBtn() {
  const btn = document.getElementById('btn-dash-refresh-ai');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!AI.isConfigured()) {
      showToast('⚠️ Configura tu API Key en Perfil → Asistente IA');
      return;
    }
    const textEl    = document.getElementById('dash-ai-text');
    const loadingEl = document.getElementById('dash-ai-loading');
    btn.disabled = true;
    btn.textContent = '⏳ Generando…';
    if (loadingEl) loadingEl.hidden = false;
    if (textEl)    textEl.style.opacity = '0.4';
    try {
      const summary = await AI.getDailySummary();
      if (textEl) { textEl.textContent = summary; textEl.style.opacity = '1'; }
    } catch (err) {
      showToast('❌ Error al conectar con Gemini');
      if (textEl) textEl.style.opacity = '1';
    } finally {
      if (loadingEl) loadingEl.hidden = true;
      btn.disabled = false;
      btn.textContent = '✨ Insight IA';
    }
  });
}