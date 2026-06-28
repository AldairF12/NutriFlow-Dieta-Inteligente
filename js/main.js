// ============================================================
// app.js — Lógica principal de la aplicación v2
// ============================================================

let _isTabSwitching = false;

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initNavigation();
  _isTabSwitching = true;
  renderDiaryScreen();
  renderRecipesScreen();
  renderPantryScreen();
  renderProfileScreen();
  _isTabSwitching = false;
});

// ──────────────────────────────────────────────
// NAVEGACIÓN
// ──────────────────────────────────────────────
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens  = document.querySelectorAll('.screen');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.screen;
      navItems.forEach(n => n.classList.remove('active'));
      screens.forEach(s  => { s.classList.remove('active'); s.scrollTop = 0; });
      item.classList.add('active');
      const activeScreen = document.getElementById(`screen-${target}`);
      activeScreen.classList.add('active');
      activeScreen.scrollTop = 0;
      window.scrollTo(0, 0);

      _isTabSwitching = true;
      if (target === 'diary')     renderDiaryScreen();
      if (target === 'recipes')   renderRecipesScreen();
      if (target === 'pantry')    renderPantryScreen();
      if (target === 'dashboard') renderDashboardScreen();
      if (target === 'profile')   renderProfileScreen();
      _isTabSwitching = false;
    });
  });
}

// ──────────────────────────────────────────────
// AUXILIAR: LIMPIEZA DE CLASES DE ANIMACIÓN DE ENTRADA
// ──────────────────────────────────────────────
function cleanupAnimationClasses() {
  setTimeout(() => {
    document.querySelectorAll('.section-entering, .section-appearing, .item-entering').forEach(el => {
      el.classList.remove('section-entering', 'section-appearing', 'item-entering');
    });
  }, 850);
}

// ──────────────────────────────────────────────
// PANTALLA: DIARIO
// ──────────────────────────────────────────────


function renderDailyMacros() {
  const m = getDailyMacroSummary();
  animateNumber('macro-cal', m.calories, ' kcal');
  animateNumber('macro-prot', m.protein, 'g');
  animateNumber('macro-carb', m.carbs, 'g');
  animateNumber('macro-fat', m.fat, 'g');
}

// ──────────────────────────────────────────────
// SECCIÓN DE HIDRATACIÓN
// ──────────────────────────────────────────────
// compact=true cuando va debajo de recetas (no es el elemento principal)


// ──────────────────────────────────────────────
// SECCIÓN UPCOMING (próxima comida)
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// SECCIÓN DE RECETAS
// ──────────────────────────────────────────────


// ──────────────────────────────────────────────
// DONUT CHART SVG
// ──────────────────────────────────────────────

function buildEmptyState(msg) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `<div class="empty-icon">🌿</div><p>${msg}</p>`;
  return div;
}


// ──────────────────────────────────────────────
// REGISTRAR COMIDA / LÍQUIDO
// ──────────────────────────────────────────────


// ──────────────────────────────────────────────
// MODAL DE DETALLE DE RECETA
// ──────────────────────────────────────────────



document.getElementById('modal-close').addEventListener('click', closeRecipeModal);
document.getElementById('modal-overlay').addEventListener('click', closeRecipeModal);

// ──────────────────────────────────────────────
// POPOVER DE AJUSTE DE INGREDIENTE
// ──────────────────────────────────────────────
let _popoverIngId    = null;
let _popoverRecipe   = null;
let _popoverQty      = 0;




// ──────────────────────────────────────────────
// DESPENSA · FILTRO Y BÚSQUEDA
// ──────────────────────────────────────────────
let _pantryFilterActive = false;
let _pantrySearchQuery  = '';



// ──────────────────────────────────────────────
// LISTA DE COMPRAS (Sheet Modal + FAB)
// ──────────────────────────────────────────────







// ──────────────────────────────────────────────
// PANTALLA: RECETAS
// ──────────────────────────────────────────────


// ──────────────────────────────────────────────
// PANTALLA: DESPENSA
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// PANTALLA: PERFIL
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// EDITOR DE HORAS DE COMIDA
// ──────────────────────────────────────────────
const MEAL_LABELS = {
  desayuno: { emoji: '🌅', label: 'Desayuno'  },
  almuerzo: { emoji: '☀️', label: 'Almuerzo'  },
  merienda: { emoji: '🍎', label: 'Merienda'  },
  cena:     { emoji: '🌙', label: 'Cena'      },
};



// ──────────────────────────────────────────────
// GESTIÓN DE LÍQUIDOS
// ──────────────────────────────────────────────



// ──────────────────────────────────────────────
// ELIMINAR RECETA
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// IMPORTAR JSON
// ──────────────────────────────────────────────




// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────

// Inicializar import y formulario de líquidos después del DOM
document.addEventListener('DOMContentLoaded', () => {
  initImport();
  initLiquidForm();
  initModalGestures();
  initIngredientPopover();
  initPantryToolbar();
  initShoppingModal();
  updateShoppingFab();
  initSettingsCardAccordions();
  initGoalsForm();
  initAIKeyForm();
  initAIChat();
  initDashboardAIBtn();
  initRegisterSheet();
});


// ──────────────────────────────────────────────
// PANTALLA: DASHBOARD
// ──────────────────────────────────────────────




// ──────────────────────────────────────────────
// DASHBOARD: SECCIÓN PLAN vs EXTRAS
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// PERFIL: METAS NUTRICIONALES
// ──────────────────────────────────────────────


// ──────────────────────────────────────────────
// PERFIL: API KEY DE GEMINI
// ──────────────────────────────────────────────


// ──────────────────────────────────────────────
// CHAT IA (Modal)
// ──────────────────────────────────────────────
let _chatMessages = []; // historial local de la sesión






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
    const response = await AI.askAssistant(msg);
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


// Dashboard: botón de Insight IA


// ══════════════════════════════════════════════════════════════
// BOTTOM SHEET · REGISTRO LIBRE
// ══════════════════════════════════════════════════════════════

let _selectedFoodItem = null; // Item seleccionado para gramaje






// ────────────────────────────────────────────
// Vista: DESDE MI PLAN
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// Vista: BUSCAR ALIMENTO
// ────────────────────────────────────────────






// ────────────────────────────────────────────
// Vista: BUSCAR RECETA
// ────────────────────────────────────────────



// ────────────────────────────────────────────
// Vista: FAVORITOS Y FRECUENTES
// ────────────────────────────────────────────



// ────────────────────────────────────────────
// RENDERIZADO DE ALIMENTOS LIBRES EN EL DIARIO
// ────────────────────────────────────────────


// ────────────────────────────────────────────
// REGISTRO POR VOZ
// ────────────────────────────────────────────







// ── Utilidad debounce ──
