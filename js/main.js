// ============================================================
// main.js ? Coordinador y orquestador de la aplicaci?n
// ============================================================

let _isTabSwitching = false;

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

// ??????????????????????????????????????????????
// INICIALIZACI?N GLOBAL
// ??????????????????????????????????????????????
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

  _isTabSwitching = true;
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
  if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
  if (typeof renderPantryScreen === 'function') renderPantryScreen();
  if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
  if (typeof renderProfileScreen === 'function') renderProfileScreen();
  _isTabSwitching = false;
});
