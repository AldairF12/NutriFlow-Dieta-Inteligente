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
  if (window.ModalHistory) window.ModalHistory.open('ai-chat', closeAIChat);

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
  if (window.ModalHistory) window.ModalHistory.close('ai-chat');
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

function copyChatMessage(id) {
  const msg = _chatMessages.find(m => m.id === id);
  if (msg && msg.text) {
    navigator.clipboard.writeText(msg.text).then(() => {
      showToast('📋 Copiado al portapapeles');
      const btn = document.querySelector(`.chat-copy-btn[data-id="${id}"]`);
      if (btn) {
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '📋'; }, 1500);
      }
    }).catch(() => {
      showToast('No se pudo copiar el texto');
    });
  }
}

function parseChatMarkdown(text) {
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const result = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Elemento de lista con viñetas (- item o * item)
    const ulMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    // Elemento de lista numerada (1. item)
    const olMatch = line.match(/^\s*\d+[\.\)]\s+(.*)$/);

    if (ulMatch) {
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        result.push('<ul class="chat-list">');
        inUl = true;
      }
      result.push(`<li>${formatChatInline(ulMatch[1])}</li>`);
      continue;
    }

    if (olMatch) {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        result.push('<ol class="chat-list">');
        inOl = true;
      }
      result.push(`<li>${formatChatInline(olMatch[1])}</li>`);
      continue;
    }

    // Si no es un elemento de lista, cerrar listas abiertas
    if (inUl) {
      result.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      result.push('</ol>');
      inOl = false;
    }

    // Línea en blanco -> Espacio vertical entre párrafos
    if (trimmed === '') {
      result.push('<div class="chat-spacer"></div>');
      continue;
    }

    // Encabezados (# ## ###)
    if (trimmed.startsWith('### ')) {
      result.push(`<div class="chat-heading">${formatChatInline(trimmed.substring(4))}</div>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      result.push(`<div class="chat-heading">${formatChatInline(trimmed.substring(3))}</div>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      result.push(`<div class="chat-heading">${formatChatInline(trimmed.substring(2))}</div>`);
      continue;
    }

    // Línea de texto normal
    result.push(`<div class="chat-line">${formatChatInline(line)}</div>`);
  }

  // Cerrar listas que hayan quedado al final
  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('');
}

function formatChatInline(str) {
  if (!str) return '';
  return str
    // Negrita (**texto**)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Cursiva (*texto* o _texto_)
    .replace(/\*([^\*]+?)\*/g, '<em>$1</em>')
    .replace(/_([^_]+?)_/g, '<em>$1</em>')
    // Código inline (`código`)
    .replace(/`([^`]+?)`/g, '<code class="chat-code">$1</code>')
    // Resaltado de macros y calorías
    .replace(/\b(\d+(?:\.\d+)?\s*(?:kcal|calorías|calorias|g\s*(?:de\s*)?(?:prote[ií]na|carbohidratos|carbos|grasas?|fibra)))\b/gi, '<span class="chat-macro-highlight">$1</span>');
}

function appendChatMessage(role, text, isLoad = false, msgId = null, isPinned = false) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const id = msgId || 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5);
  const msg = document.createElement('div');
  msg.className = `chat-msg chat-msg--${role}`;
  
  const formattedText = parseChatMarkdown(text);
  
  let actionsHtml = '';
  if (role === 'bot') {
    actionsHtml = `<div class="chat-msg-actions">
      <button class="chat-action-btn chat-copy-btn" data-id="${id}" onclick="copyChatMessage('${id}')" title="Copiar respuesta">📋</button>
      <button class="chat-action-btn chat-pin-btn ${isPinned ? 'pinned' : ''}" data-id="${id}" onclick="togglePinMessage('${id}')" title="Fijar mensaje">📌</button>
    </div>`;
  }

  msg.innerHTML = `<div class="chat-bubble-container">
    <div class="chat-bubble">
      ${formattedText}
      ${actionsHtml}
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
const QUICK_PROMPTS = {
  general: [
    { icon: '💡', text: 'Ideas de cena ligera y proteica' },
    { icon: '🥑', text: 'Grasas saludables para mi dieta' },
    { icon: '💧', text: '¿Cuánta agua debo tomar al día?' },
    { icon: '⚙️', text: '¿Cómo calcular mis metas calóricas?' }
  ],
  progress: [
    { icon: '📊', text: '¿Cómo voy con mis proteínas hoy?' },
    { icon: '🍦', text: '¿Me paso de calorías si como un postre?' },
    { icon: '⚖️', text: '¿Qué me falta para cumplir mi meta?' },
    { icon: '🍎', text: 'Sugerencia para mi próxima comida' }
  ]
};

function renderQuickPrompts(contextMode) {
  const container = document.getElementById('ai-quick-prompts');
  if (!container) return;

  const prompts = QUICK_PROMPTS[contextMode] || QUICK_PROMPTS.general;
  container.innerHTML = prompts.map(p => `
    <button class="ai-quick-chip" onclick="sendQuickPrompt('${p.text.replace(/'/g, "\\'")}')">
      <span>${p.icon}</span> ${p.text}
    </button>
  `).join('');
}

function sendQuickPrompt(text) {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;
  input.value = text;
  input.blur(); // Cerrar teclado
  sendChatMessage();
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

  renderQuickPrompts(_currentContextMode);

  if (contextBtns.length > 0) {
    contextBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        contextBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _currentContextMode = btn.dataset.context;
        renderQuickPrompts(_currentContextMode);
        if (input) {
          if (_currentContextMode === 'progress') {
            input.placeholder = "Ej: ¿Puedo comer un helado hoy?";
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

  const closeClearConfirm = () => {
    if (clearConfirmModal) clearConfirmModal.classList.remove('open');
    if (window.ModalHistory) window.ModalHistory.close('ai-clear-confirm');
  };

  if (clearBtn && clearConfirmModal) {
    clearBtn.addEventListener('click', () => {
      clearConfirmModal.classList.add('open');
      if (window.ModalHistory) window.ModalHistory.open('ai-clear-confirm', closeClearConfirm);
    });
    clearCancel.addEventListener('click', closeClearConfirm);
    clearYes.addEventListener('click', () => {
      closeClearConfirm();
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
    const adjustInputHeight = () => {
      input.style.height = 'auto';
      const maxHeight = 120;
      const newHeight = Math.min(input.scrollHeight, maxHeight);
      input.style.height = Math.max(40, newHeight) + 'px';
      input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    input.addEventListener('input', adjustInputHeight);
    // Enter ahora añade un salto de línea normal en el textarea sin enviar
    input.addEventListener('keydown', () => {
      setTimeout(adjustInputHeight, 10);
    });
  }

  // Dictado por voz
  const micBtn = document.getElementById('ai-chat-mic');
  if (micBtn && input) {
    let originalPlaceholder = '';

    _chatSpeechRecognition = initVoiceDictation({
      button: micBtn,
      input: input,
      onStart: () => {
        micBtn.style.color = '#ef4444';
        micBtn.classList.add('recording-pulse');
        micBtn.innerHTML = '⏹️';
        originalPlaceholder = input.placeholder;
        input.placeholder = 'Escuchando...';
      },
      onEnd: () => {
        micBtn.style.color = 'var(--gray-500)';
        micBtn.classList.remove('recording-pulse');
        micBtn.innerHTML = '🎙️';
        if (originalPlaceholder) input.placeholder = originalPlaceholder;
      }
    });

    if (!_chatSpeechRecognition.supported) {
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
      // No arrastrar el modal si se interactúa con el input, botones o textarea
      if (target.closest('.ai-chat-input-area') || target.closest('button') || target.closest('textarea') || target.closest('input')) {
        isDragging = false;
        return;
      }
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

  // Ocultar teclado en móvil para dejar espacio libre de lectura
  input.blur();
  input.value = '';
  input.style.height = '40px';
  input.style.overflowY = 'hidden';
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
    input.disabled = false;
    document.getElementById('ai-chat-send').disabled = false;
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