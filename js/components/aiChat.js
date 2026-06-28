let _chatMessages = []; // historial local de la sesión
let _currentContextMode = 'general';

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
    // Mensaje de bienvenida si es el primer mensaje
    if (_chatMessages.length === 0) {
      appendChatMessage('bot', '¡Hola! 👋 Soy NutriBot.\n\nPuedo ayudarte con tus dudas nutricionales, sugerirte qué comer según tu progreso, o responder preguntas generales.\n\n*Nota: Por tu privacidad y para ahorrar espacio, mi memoria se reiniciará cuando recargues la aplicación. ¡No guardo tu historial a largo plazo!*');
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
function appendChatMessage(role, text) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = `chat-msg chat-msg--${role}`;
  // Parse Markdown si está disponible
  const formattedText = typeof parseMarkdown === 'function' ? parseMarkdown(text) : text.replace(/\n/g, '<br>');
  msg.innerHTML = `<div class="chat-bubble">${formattedText}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  _chatMessages.push({ role, text });
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
      });
    });
  }

  if (fab)     fab.addEventListener('click', openAIChat);
  if (overlay) overlay.addEventListener('click', closeAIChat);
  if (closeBtn) closeBtn.addEventListener('click', closeAIChat);

  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
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

  input.value = '';
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