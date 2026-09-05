// ============================================================
// main.js ? Coordinador y orquestador de la aplicaci?n
// ============================================================

let _isTabSwitching = false;
window.ACTIVE_DATE = null; // null means 'today'

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

window.setActiveDate = function(dateStr) {
  if (dateStr === getTodayString()) {
    window.ACTIVE_DATE = null;
    if (typeof window.resetDashboardSelectedDate === 'function') {
      window.resetDashboardSelectedDate();
    }
  } else {
    window.ACTIVE_DATE = dateStr;
  }
  renderGlobalDateBanner();
  
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
  if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
};

window.goToDiaryToEdit = function() {
  const diaryTab = document.querySelector('.nav-item[data-screen="diary"]');
  if (diaryTab) diaryTab.click();
};

function renderGlobalDateBanner() {
  let banner = document.getElementById('global-date-banner');
  if (!window.ACTIVE_DATE) {
    if (banner) banner.remove();
    return;
  }
  
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'global-date-banner';
    banner.className = 'global-date-banner';
    document.body.appendChild(banner);
  }
  
  const d = new Date(window.ACTIVE_DATE + 'T12:00:00');
  const formattedDate = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  
  banner.innerHTML = `
    <div class="gdb-info">
      <span class="gdb-icon">📅</span>
      <span class="gdb-text">Editando: <strong>${formattedDate}</strong></span>
    </div>
    <div class="gdb-actions">
      <button class="gdb-btn-close" onclick="window.setActiveDate('${getTodayString()}')">✕</button>
    </div>
  `;
}

// ??????????????????????????????????????????????
// NAVEGACI?N ENTRE PANTALLAS
// ??????????????????????????????????????????????
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
      if (activeScreen) {
        activeScreen.classList.add('active');
        activeScreen.scrollTop = 0;
      }
      window.scrollTo(0, 0);

      _isTabSwitching = true;
      if (target === 'diary' && typeof renderDiaryScreen === 'function')         renderDiaryScreen();
      if (target === 'recipes' && typeof renderRecipesScreen === 'function')     renderRecipesScreen();
      if (target === 'pantry' && typeof renderPantryScreen === 'function')       renderPantryScreen();
      if (target === 'dashboard' && typeof renderDashboardScreen === 'function') renderDashboardScreen();
      if (target === 'profile' && typeof renderProfileScreen === 'function')     renderProfileScreen();
      _isTabSwitching = false;
    });
  });
}

// ??????????????????????????????????????????????
// LIMPIEZA DE CLASES DE ANIMACI?N DE ENTRADA
// ??????????????????????????????????????????????
function cleanupAnimationClasses() {
  setTimeout(() => {
    document.querySelectorAll('.section-entering, .section-appearing, .item-entering').forEach(el => {
      el.classList.remove('section-entering', 'section-appearing', 'item-entering');
    });
  }, 850);
}

function buildEmptyState(msg) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `<div class="empty-icon">??</div><p>${msg}</p>`;
  return div;
}

window.navigateToScreen = function(target) {
  const tab = document.querySelector(`.nav-item[data-screen="${target}"]`);
  if (tab) tab.click();
};

// ──────────────────────────────────────────────
// INICIALIZACIÓN GLOBAL
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (typeof loadState === 'function') loadState();
  initNavigation();

  if (typeof initModalGestures === 'function') initModalGestures();
  if (typeof initIngredientPopover === 'function') initIngredientPopover();
  if (typeof initImport === 'function') initImport();
  if (typeof initLiquidForm === 'function') initLiquidForm();
  if (typeof initRecipesToolbar === 'function') initRecipesToolbar();
  if (typeof initPantryToolbar === 'function') initPantryToolbar();
  if (typeof initShoppingModal === 'function') initShoppingModal();
  if (typeof updateShoppingFab === 'function') updateShoppingFab();
  if (typeof initSettingsCardAccordions === 'function') initSettingsCardAccordions();
  if (typeof initGoalsForm === 'function') initGoalsForm();
  if (typeof initAIKeyForm === 'function') initAIKeyForm();
  if (typeof initAIChat === 'function') initAIChat();
  if (typeof initDashboardAIBtn === 'function') initDashboardAIBtn();
  if (typeof initRegisterSheet === 'function') initRegisterSheet();
  if (typeof initPhase2 === 'function') initPhase2();
  if (window.NotificationService && typeof window.NotificationService.init === 'function') {
    window.NotificationService.init();
  }

  _isTabSwitching = true;
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
  if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
  if (typeof renderPantryScreen === 'function') renderPantryScreen();
  if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
  if (typeof renderProfileScreen === 'function') renderProfileScreen();
  _isTabSwitching = false;
});
