// ============================================================
// diaryView.js ? Pantalla de Diario y Renderizado de Comidas
// ============================================================

function renderDiaryScreen(options = {}) {
  const animateUpcoming = options.animateUpcoming === true;
  const wasUpcomingVisible = document.querySelector('#screen-diary .upcoming-section') !== null;
  const wasDoneVisible     = document.querySelector('#screen-diary .diary-done-state') !== null;

  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) greetingEl.textContent = getGreeting();

  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    const targetDate = window.ACTIVE_DATE ? new Date(window.ACTIVE_DATE + 'T12:00:00') : new Date();
    dateEl.textContent = targetDate.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  if (typeof renderDailyMacros === 'function') renderDailyMacros();

  const { slot, showMealFirst, currentRecipes, nextSlot, nextRecipes } = getDiaryState();
  const needsToBuyGlobal = getUpcomingNeedsToBuy();

  const slotBadge = document.getElementById('slot-badge');
  if (slotBadge) slotBadge.textContent = slot.emoji + ' ' + slot.label;

  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '';

  if (showMealFirst) {
    // ?? ES HORA DE COMER y a?n no ha comido ????????????
    let shownAny = false;
    const allCurrentRecipes = [...(currentRecipes ? currentRecipes.canCook : []), ...(currentRecipes ? currentRecipes.needsToBuy : [])];
    if (allCurrentRecipes.length > 0) {
      const sec = buildRecipeSection(`\u{1F373} ${slot.label}`, allCurrentRecipes, 'current-meal');
      mainContent.appendChild(sec);
      if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) sec.classList.add('section-entering');
      shownAny = true;
    }

    // 2. Hidrataci?n
    const hydSec = buildHydrationSection();
    mainContent.appendChild(hydSec);
    if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) hydSec.classList.add('section-entering');

    // 3. Recetas que te falta comprar
    if (needsToBuyGlobal.length > 0) {
      const buySec = buildRecipeSection('\u{1F6D2} Te falta comprar', needsToBuyGlobal, 'needs-buy');
      mainContent.appendChild(buySec);
      if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) buySec.classList.add('section-entering');
      shownAny = true;
    }

    if (!shownAny) {
      mainContent.appendChild(buildEmptyState('Sin recetas para este horario \u{1F33F}'));
    }

  } else {
    // ?? ENTRE COMIDAS o ya comi? ??????????????????????
    // 1. Hidrataci?n primero
    const hydSec = buildHydrationSection();
    mainContent.appendChild(hydSec);
    if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) hydSec.classList.add('section-entering');

    // 2. Pr?xima comida
    if (nextSlot && nextRecipes) {
      let shownAny = false;
      if (nextRecipes.canCook.length > 0) {
        const upSec = buildUpcomingRecipeSection(`\u{1F373} Pr\u00F3ximo: ${nextSlot.label}`, nextSlot, nextRecipes.canCook, true);
        mainContent.appendChild(upSec);
        if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) {
          upSec.classList.add('section-entering');
        } else if (animateUpcoming && !wasUpcomingVisible) {
          upSec.classList.add('section-appearing');
        }
        shownAny = true;
      }
      if (needsToBuyGlobal.length > 0) {
        const buySec = buildRecipeSection('\u{1F6D2} Te falta comprar', needsToBuyGlobal, 'needs-buy');
        mainContent.appendChild(buySec);
        if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) buySec.classList.add('section-entering');
        shownAny = true;
      }
      if (!shownAny) {
        mainContent.appendChild(buildEmptyState('Sin recetas para el pr\u00F3ximo turno \u{1F33F}'));
      }
    } else {
      // Todas las comidas completadas
      if (needsToBuyGlobal.length > 0) {
        const buySec = buildRecipeSection('\u{1F6D2} Te falta comprar', needsToBuyGlobal, 'needs-buy');
        mainContent.appendChild(buySec);
        if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) buySec.classList.add('section-entering');
      } else {
        const done = buildEmptyState('\u00A1Comidas del d\u00EDa completadas! \u{1F389}');
        done.classList.add('diary-done-state');
        if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) {
          done.classList.add('section-entering');
        } else if (animateUpcoming && !wasDoneVisible) {
          done.classList.add('section-appearing');
        }
        mainContent.appendChild(done);
      }
    }
  }

  // A?adir siempre las entradas libres del d?a al final
  renderFreeDiaryEntries(mainContent);

  // Activar la tarjeta de hidrataci?n interactiva con el progreso actual de agua
  if (typeof enhanceHydrationView === 'function') {
    enhanceHydrationView();
  }
  if (typeof updateHeaderGamification === 'function') {
    updateHeaderGamification();
  }

  if (typeof cleanupAnimationClasses === 'function') cleanupAnimationClasses();
}

let _diaryActiveLiquidId = 'liq_001';
window._diaryActiveLiquidId = _diaryActiveLiquidId;

function buildHydrationSection() {
  const section = document.createElement('section');
  section.className = 'content-section';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = '💧 Hidratación';
  section.appendChild(title);

  const sub = document.createElement('p');
  sub.className = 'section-subtitle';
  sub.textContent = 'Mantén tu hidratación diaria';
  section.appendChild(sub);

  const liquidsList = window.DB.liquids || (window.DB.state && window.DB.state.liquids) || [];
  if (!liquidsList.some(l => l.id === _diaryActiveLiquidId)) {
    _diaryActiveLiquidId = liquidsList[0]?.id || 'liq_001';
  }
  window._diaryActiveLiquidId = _diaryActiveLiquidId;
  const activeLiq = liquidsList.find(l => l.id === _diaryActiveLiquidId) || liquidsList[0] || { id: 'liq_001', name: 'Agua', icon: '💧', calories_per_100ml: 0 };

  const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
    ? window.DB.getTodayLogs().filter(l => l.type === 'liquid')
    : [];
  const totalMl = todayLogs.reduce((sum, l) => sum + (l.quantity_g || 250), 0);
  const goalMl = 2000;
  const pct = Math.min(100, Math.round((totalMl / goalMl) * 100));

  const card = document.createElement('div');
  card.className = 'hydration-card-animated';
  card.innerHTML = `
    <div class="hydration-top-info">
      <div class="water-glass-wrap">
        <div class="water-wave-fill" style="height: ${Math.max(6, pct)}%;">
          <div class="water-wave-anim"></div>
        </div>
      </div>
      <div class="water-stats-panel">
        <div class="water-stats-title">META DE HIDRATACIÓN</div>
        <button class="btn-water-undo-pill" id="btn-water-undo" type="button" title="Deshacer último registro de hidratación" aria-label="Deshacer último registro">
          <span class="undo-icon">↺</span> Deshacer
        </button>
        <div class="water-vol-display">
          <span class="water-current-ml">${totalMl.toLocaleString()}</span>
          <span class="water-target-ml">/ ${goalMl.toLocaleString()} ml (${pct}%)</span>
        </div>
        <div class="water-progress-bar-wrap">
          <div class="water-progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    </div>

    <div class="hydration-drink-selector-row" role="tablist" aria-label="Seleccionar bebida">
      ${liquidsList.map(liq => {
        const c100 = liq.calories_per_100ml || liq.calories_per_100g || 0;
        const isActive = liq.id === activeLiq.id;
        return `
          <button type="button" class="hydration-drink-chip ${isActive ? 'active' : ''}" data-id="${liq.id}" aria-label="Seleccionar ${liq.name}">
            <span>${liq.icon || '💧'}</span>
            <span>${liq.name}</span>
            ${c100 > 0 ? `<span class="drink-chip-cal">${c100} kcal</span>` : ''}
          </button>
        `;
      }).join('')}
    </div>

    <div class="quick-water-buttons">
      <button type="button" class="btn-water-quick" data-ml="250" aria-label="Agregar vaso de 250ml">
        <span class="btn-water-icon">🥛</span>
        <span class="btn-water-amount">+250 ml</span>
        <span class="btn-water-lbl">Vaso</span>
      </button>
      <button type="button" class="btn-water-quick" data-ml="500" aria-label="Agregar botella de 500ml">
        <span class="btn-water-icon">🍶</span>
        <span class="btn-water-amount">+500 ml</span>
        <span class="btn-water-lbl">Botella</span>
      </button>
      <button type="button" class="btn-water-quick" data-ml="150" aria-label="Agregar taza de 150ml">
        <span class="btn-water-icon">☕</span>
        <span class="btn-water-amount">+150 ml</span>
        <span class="btn-water-lbl">Taza</span>
      </button>
      <button type="button" class="btn-water-quick" data-ml="100" aria-label="Agregar 100ml">
        <span class="btn-water-icon">💧</span>
        <span class="btn-water-amount">+100 ml</span>
        <span class="btn-water-lbl">Trago</span>
      </button>
    </div>
  `;

  // Cambiar bebida activa
  card.querySelectorAll('.hydration-drink-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      _diaryActiveLiquidId = btn.dataset.id;
      window._diaryActiveLiquidId = _diaryActiveLiquidId;
      renderDiaryScreen();
    });
  });

  // Registrar con los 4 botones rápidos
  function logLiquid(amount) {
    const mealSlot = (typeof getCurrentMealSlot === 'function') ? getCurrentMealSlot() : 'snack';
    window.DB.addFoodLog({
      type: 'liquid',
      reference_id: activeLiq.id,
      quantity_g: amount,
      mealCategory: mealSlot
    });

    const c100 = activeLiq.calories_per_100ml || activeLiq.calories_per_100g || 0;
    const addedCal = Math.round(c100 * amount / 100);
    if (addedCal > 0) {
      if (typeof showToast === 'function') showToast(`${activeLiq.icon || '💧'} +${amount} ml de ${activeLiq.name} (+${addedCal} kcal)`);
    } else {
      if (typeof showToast === 'function') showToast(`${activeLiq.icon || '💧'} +${amount} ml de ${activeLiq.name} registrados`);
    }

    renderDiaryScreen();
    if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
    if (typeof updateHeaderGamification === 'function') updateHeaderGamification();
  }

  card.querySelectorAll('.btn-water-quick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ml = parseInt(btn.dataset.ml, 10) || 250;
      logLiquid(ml);
    });
  });

  // Botón deshacer
  const undoBtn = card.querySelector('#btn-water-undo');
  if (undoBtn) {
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
        ? window.DB.getTodayLogs().filter(l => l.type === 'liquid')
        : [];
      if (todayLogs.length > 0) {
        const lastLog = todayLogs[todayLogs.length - 1];
        window.DB.removeFoodLog(lastLog.id);
        if (typeof showToast === 'function') showToast('↺ Último registro de hidratación eliminado');
        renderDiaryScreen();
        if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
        if (typeof updateHeaderGamification === 'function') updateHeaderGamification();
      } else {
        if (typeof showToast === 'function') showToast('No hay registros de hidratación hoy');
      }
    });
  }

  section.appendChild(card);
  return section;
}

function buildUpcomingRecipeSection(title, nextSlot, recipes, canCook) {
  const section = document.createElement('section');
  section.className = 'content-section upcoming-section';

  const header = document.createElement('div');
  header.className = 'upcoming-header';
  header.innerHTML = `
    <h2 class="section-title">${title}</h2>
    <span class="upcoming-pill">Pr\u00F3ximamente</span>
  `;
  section.appendChild(header);

  const row = document.createElement('div');
  row.className = 'cards-row';
  recipes.forEach(recipe => {
    const card = buildRecipeCard(recipe, canCook);
    card.classList.add('card--upcoming');
    row.appendChild(card);
  });
  section.appendChild(row);
  return section;
}

function buildRecipeSection(title, recipes, extraClass = '') {
  const section = document.createElement('section');
  section.className = `content-section ${extraClass}`.trim();

  const titleEl = document.createElement('h2');
  titleEl.className = 'section-title';
  titleEl.textContent = title;
  section.appendChild(titleEl);

  const row = document.createElement('div');
  row.className = 'cards-row';
  recipes.forEach(r => row.appendChild(buildRecipeCard(r, r.pantryCheck ? r.pantryCheck.canCook : false)));
  section.appendChild(row);
  return section;
}

function buildRecipeCard(recipe, canCook) {
  const card = document.createElement('div');
  const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
    ? window.DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipe.id)
    : [];
  const logCount = todayLogs.length;
  const isRegistered = logCount > 0;

  card.className = `card card-recipe ${canCook ? 'available' : 'missing'} ${isRegistered ? 'registered' : ''}`;
  if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) card.classList.add('item-entering');
  card.dataset.recipeId = recipe.id;

  const inner = document.createElement('div');
  inner.className = 'card-inner';

  const type = document.createElement('div');
  type.className = 'recipe-meal-type';
  type.textContent = (typeof getMealTypeEmoji === 'function' ? getMealTypeEmoji(recipe.meal_type) : '') + ' ' + (recipe.meal_type || '');
  inner.appendChild(type);

  const name = document.createElement('h3');
  name.className = 'recipe-name';
  name.textContent = recipe.name;
  inner.appendChild(name);

  const macros = recipe.macros || calcRecipeMacros(recipe.id);
  inner.appendChild(buildMacroChart(macros));

  const btn = document.createElement('button');
  btn.className = 'btn-log btn-log-recipe';
  if (isRegistered) {
    btn.className += ' registered';
    btn.textContent = `\u2713 Registrada ${logCount > 1 ? `(${logCount})` : ''}`;
    btn.setAttribute('aria-label', `Registrada ${recipe.name}`);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeMealLog(recipe.id, recipe.name);
    });
  } else if (canCook) {
    btn.textContent = '\u2713 Registrar comida';
    btn.setAttribute('aria-label', `Registrar ${recipe.name}`);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      logMeal(recipe.id);
    });
  } else {
    btn.textContent = '\u{1F6D2} Ir a Despensa';
    btn.setAttribute('aria-label', `Ir a Despensa para ${recipe.name}`);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const pantryTab = document.querySelector('[data-screen="pantry"]');
      if (pantryTab) pantryTab.click();
    });
  }
  inner.appendChild(btn);
  card.appendChild(inner);

  card.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    openRecipeDetail(recipe);
  });
  return card;
}

function logMeal(recipeId) {
  const ris = window.DB.getRecipeIngredients(recipeId);
  ris.forEach(ri => {
    const pantry = window.DB.getPantryItem(ri.ingredient_id);
    const currentQty = pantry ? pantry.quantity_available : 0;
    window.DB.updatePantryQuantity(ri.ingredient_id, Math.max(0, currentQty - ri.quantity));
  });

  window.DB.addFoodLog({ type: 'meal', reference_id: recipeId, planned: true });
  showToast('\u2705 Comida registrada');

  if (typeof updateShoppingFab === 'function') updateShoppingFab();
  if (typeof updateRecipeCardState === 'function') updateRecipeCardState(recipeId);
  if (typeof updateHeaderGamification === 'function') updateHeaderGamification();

  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen && activeScreen.id === 'screen-diary') {
    renderDiaryScreen({ animateUpcoming: true });
  }
}

function removeMealLog(recipeId, recipeName) {
  if (confirm(`\u00BFDeseas eliminar el registro de "${recipeName}" de hoy?`)) {
    const todayLogs = window.DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipeId);
    if (todayLogs.length > 0) {
      const ris = window.DB.getRecipeIngredients(recipeId);
      ris.forEach(ri => {
        const pantry = window.DB.getPantryItem(ri.ingredient_id);
        const currentQty = pantry ? pantry.quantity_available : 0;
        window.DB.updatePantryQuantity(ri.ingredient_id, currentQty + ri.quantity);
      });
      window.DB.removeFoodLog(todayLogs[todayLogs.length - 1].id);
      showToast('\u21BA Registro eliminado y despensa restaurada');
      if (typeof updateShoppingFab === 'function') updateShoppingFab();
      if (typeof updateRecipeCardState === 'function') updateRecipeCardState(recipeId);
      if (typeof updateHeaderGamification === 'function') updateHeaderGamification();
      renderDiaryScreen();
    }
  }
}

// ??????????????????????????????????????????????
// MODAL DE DETALLE DE RECETA (Sincronizado con index.html)
// ??????????????????????????????????????????????
function openRecipeDetail(recipe) {
  const modal   = document.getElementById('recipe-modal');
  const overlay = document.getElementById('modal-overlay');
  if (!modal || !overlay) return;

  modal.style.transform = '';
  modal.style.transition = '';
  overlay.style.opacity = '';
  overlay.style.transition = '';

  const macros  = recipe.macros || calcRecipeMacros(recipe.id);
  const ris     = window.DB.getRecipeIngredients(recipe.id);

  const nameEl = document.getElementById('modal-recipe-name');
  const typeEl = document.getElementById('modal-recipe-type');
  const calEl  = document.getElementById('modal-cal');
  const protEl = document.getElementById('modal-prot');
  const carbEl = document.getElementById('modal-carb');
  const fatEl  = document.getElementById('modal-fat');
  const instEl = document.getElementById('modal-instructions');

  if (nameEl) {
    nameEl.innerHTML = recipe.name + (recipe.isCustom ? ' <span class="badge-own-recipe" style="vertical-align: middle; font-size: 0.75rem;">✨ Propia</span>' : '');
  }
  if (typeEl) typeEl.textContent = (typeof getMealTypeEmoji === 'function' ? getMealTypeEmoji(recipe.meal_type) : '') + ' ' + (recipe.meal_type || '');
  if (calEl)  calEl.textContent  = macros.calories + ' kcal';
  if (protEl) protEl.textContent = macros.protein  + 'g';
  if (carbEl) carbEl.textContent = macros.carbs    + 'g';
  if (fatEl)  fatEl.textContent  = macros.fat      + 'g';
  if (instEl) instEl.textContent = recipe.instructions || 'Sin instrucciones adicionales.';

  const ingList = document.getElementById('modal-ingredients');
  if (ingList) {
    ingList.innerHTML = '';
    ris.forEach(ri => {
      const ing     = window.DB.getIngredientById(ri.ingredient_id);
      const pantry  = window.DB.getPantryItem(ri.ingredient_id);
      const avail   = pantry ? pantry.quantity_available : 0;
      const ok      = avail >= ri.quantity;
      const li = document.createElement('li');
      li.className = `ingredient-item ${ok ? 'ingredient-available' : 'ingredient-missing'}`;
      li.style.cursor = 'pointer';
      li.title = ok 
        ? `${ing ? ing.name : 'Ingrediente'}: Tienes ${avail}g (Necesitas ${ri.quantity}g) ? Toca para ajustar stock`
        : `${ing ? ing.name : 'Ingrediente'}: Faltan ${ri.quantity - avail}g ? Toca para comprar o sumar stock`;
      
      li.innerHTML = `
        <span class="ing-name">${ing ? ing.name : 'Desconocido'}</span>
        <span class="ing-qty">${ri.quantity}g</span>
        <span class="ing-stock ${ok ? 'ok' : 'low'}">${ok ? `${avail}g \u2713` : `${avail}g +`}</span>
      `;
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof openIngredientPopover === 'function') {
          openIngredientPopover(ing ? ing.id : ri.ingredient_id, ing ? ing.name : 'Ingrediente', ri.quantity, recipe);
        }
      });
      ingList.appendChild(li);
    });
  }

  // Bot?n de acci?n contextual
  const actionBtn = document.getElementById('modal-action-btn');
  if (actionBtn) {
    const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
      ? window.DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipe.id)
      : [];
    const isRegistered = todayLogs.length > 0;
    const pantryCheck = checkPantryForRecipe(recipe.id);
    const canCook = pantryCheck.canCook;

    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);

    if (isRegistered) {
      newBtn.className = 'btn-log btn-log-recipe registered';
      newBtn.textContent = '\u2713 Registrada \u2014 Quitar registro';
      newBtn.addEventListener('click', () => {
        removeMealLog(recipe.id, recipe.name);
        openRecipeDetail(recipe);
      });
    } else if (canCook) {
      newBtn.className = 'btn-log btn-log-recipe';
      newBtn.textContent = '\u2713 Registrar comida';
      newBtn.addEventListener('click', () => {
        logMeal(recipe.id);
        closeRecipeModal();
      });
    } else {
      newBtn.className = 'btn-log btn-log-missing';
      newBtn.textContent = '\u{1F6D2} Ir a Despensa';
      newBtn.addEventListener('click', () => {
        closeRecipeModal();
        const pantryTab = document.querySelector('[data-screen="pantry"]');
        if (pantryTab) pantryTab.click();
      });
    }
  }

  modal.classList.add('open');
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeRecipeModal() {
  const modal = document.getElementById('recipe-modal');
  const overlay = document.getElementById('modal-overlay');
  if (modal) modal.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.classList.remove('modal-open');

  setTimeout(() => {
    if (modal) {
      modal.style.transform = '';
      modal.style.transition = '';
    }
    if (overlay) {
      overlay.style.opacity = '';
      overlay.style.transition = '';
    }
  }, 350);
}

function initModalGestures() {
  const modal = document.getElementById('recipe-modal');
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  if (!modal || !overlay) return;

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeRecipeModal();
    };
  }
  if (overlay) {
    overlay.onclick = () => closeRecipeModal();
  }

  const handle = modal.querySelector('.modal-handle');
  const header = modal.querySelector('.modal-header');

  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  function onDragStart(clientY, target) {
    if (target.closest('.modal-close') || target.closest('button')) {
      isDragging = false;
      return false;
    }
    startY = clientY;
    isDragging = true;
    modal.style.transition = 'none';
    overlay.style.transition = 'none';
    return true;
  }

  function onDragMove(clientY) {
    if (!isDragging) return;
    const deltaY = clientY - startY;

    if (deltaY > 0) {
      currentY = deltaY;
      modal.style.transform = `translateX(-50%) translate3d(0, ${currentY}px, 0)`;
      const progress = Math.min(1, currentY / 280);
      overlay.style.opacity = (1 - progress * 0.85).toString();
    } else {
      currentY = 0;
      modal.style.transform = 'translateX(-50%) translateY(0)';
    }
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    modal.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    overlay.style.transition = 'opacity 0.35s ease';

    if (currentY > 85) {
      modal.style.transform = 'translateX(-50%) translateY(105%)';
      overlay.style.opacity = '0';
      closeRecipeModal();
    } else {
      modal.style.transform = 'translateX(-50%) translateY(0)';
      overlay.style.opacity = '';
    }
    currentY = 0;
  }

  // Gestos Touch (Móvil)
  [handle, header].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      onDragStart(e.touches[0].clientY, e.target);
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      onDragMove(e.touches[0].clientY);
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    el.addEventListener('touchend', onDragEnd);
    el.addEventListener('touchcancel', onDragEnd);
  });

  // Gestos Mouse (Desktop / Cursor)
  [handle, header].forEach(el => {
    if (!el) return;
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (onDragStart(e.clientY, e.target)) {
        const onMouseMove = (ev) => onDragMove(ev.clientY);
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          onDragEnd();
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModalGestures);
} else {
  initModalGestures();
}

// ??????????????????????????????????????????????
// POPOVER FLOTANTE PARA AJUSTAR / COMPRAR STOCK DE INGREDIENTE
// ??????????????????????????????????????????????
let _popoverIngId    = null;
let _popoverRecipe   = null;
let _popoverQty      = 0;
let _popoverNeeded   = 0;

function openIngredientPopover(ingId, ingName, needed, recipe) {
  _popoverIngId  = ingId;
  _popoverRecipe = recipe;
  _popoverNeeded = needed || 0;

  const pantry = (window.DB && typeof window.DB.getPantryItem === 'function')
    ? window.DB.getPantryItem(ingId)
    : null;
  _popoverQty = pantry ? pantry.quantity_available : 0;

  const nameEl = document.getElementById('popover-ing-name');
  const neededEl = document.getElementById('popover-ing-needed');
  const displayEl = document.getElementById('popover-qty-display');

  if (nameEl) nameEl.textContent = ingName || 'Ingrediente';
  if (neededEl) {
    if (needed > 0) {
      neededEl.textContent = `Necesitas: ${needed}g ? Tienes: ${_popoverQty}g`;
    } else {
      neededEl.textContent = `Stock actual: ${_popoverQty}g`;
    }
  }
  if (displayEl) displayEl.textContent = `${_popoverQty}g`;

  const overlay = document.getElementById('ingredient-popover-overlay');
  const popover = document.getElementById('ingredient-popover');
  if (overlay) overlay.classList.add('open');
  if (popover) popover.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeIngredientPopover() {
  const overlay = document.getElementById('ingredient-popover-overlay');
  const popover = document.getElementById('ingredient-popover');
  if (overlay) overlay.classList.remove('open');
  if (popover) popover.classList.remove('open');
  
  // Si no hay otro modal abierto, quitamos modal-open del body
  const recipeModal = document.getElementById('recipe-modal');
  const shoppingModal = document.getElementById('shopping-modal');
  const hasOtherModal = (recipeModal && recipeModal.classList.contains('open')) ||
                        (shoppingModal && shoppingModal.classList.contains('open'));
  if (!hasOtherModal) {
    document.body.classList.remove('modal-open');
  }

  _popoverIngId = null;
  _popoverRecipe = null;
  _popoverNeeded = 0;
}

function initIngredientPopover() {
  const closeBtn = document.getElementById('popover-close');
  const overlay = document.getElementById('ingredient-popover-overlay');
  const minusBtn = document.getElementById('popover-minus');
  const plusBtn = document.getElementById('popover-plus');
  const saveBtn = document.getElementById('popover-save');

  if (closeBtn) closeBtn.onclick = () => closeIngredientPopover();
  if (overlay) overlay.onclick = () => closeIngredientPopover();

  if (minusBtn) {
    minusBtn.onclick = () => {
      _popoverQty = _popoverQty % 50 === 0 ? Math.max(0, _popoverQty - 50) : Math.floor(_popoverQty / 50) * 50;
      const displayEl = document.getElementById('popover-qty-display');
      if (displayEl) displayEl.textContent = `${_popoverQty}g`;
    };
  }

  if (plusBtn) {
    plusBtn.onclick = () => {
      _popoverQty = _popoverQty % 50 === 0 ? _popoverQty + 50 : Math.ceil(_popoverQty / 50) * 50;
      const displayEl = document.getElementById('popover-qty-display');
      if (displayEl) displayEl.textContent = `${_popoverQty}g`;
    };
  }

  if (saveBtn) {
    saveBtn.onclick = () => {
      if (_popoverIngId === null) return;
      const ingId = _popoverIngId;
      const qty = _popoverQty;
      const recipeToReopen = _popoverRecipe;

      if (window.DB && typeof window.DB.updatePantryQuantity === 'function') {
        window.DB.updatePantryQuantity(ingId, qty);
      }
      if (typeof showToast === 'function') showToast('? Despensa actualizada');
      closeIngredientPopover();

      if (recipeToReopen) {
        setTimeout(() => openRecipeDetail(recipeToReopen), 100);
      }
      if (typeof renderPantryScreen === 'function') renderPantryScreen();
      if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
      if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
      if (typeof updateShoppingFab === 'function') updateShoppingFab();

      const shoppingModal = document.getElementById('shopping-modal');
      if (shoppingModal && shoppingModal.classList.contains('open')) {
        if (typeof renderShoppingList === 'function') renderShoppingList(false);
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIngredientPopover);
} else {
  initIngredientPopover();
}

function renderFreeDiaryEntries(container) {
  const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
    ? window.DB.getTodayLogs().filter(l => l.type === 'food_item' || (l.type === 'meal' && !l.planned))
    : [];

  if (todayLogs.length === 0) return;

  const section = document.createElement('section');
  section.className = 'content-section';

  const title = document.createElement('h2');
  title.className = 'extras-section-title';
  title.textContent = '🥗 Alimentos Libres / Extras';
  section.appendChild(title);

  const catMap = {
    breakfast: { name: 'Desayuno', emoji: '🌅', cls: 'cat-breakfast' },
    lunch:     { name: 'Almuerzo',  emoji: '🍽️', cls: 'cat-lunch' },
    merienda:  { name: 'Merienda',  emoji: '🥪', cls: 'cat-merienda' },
    dinner:    { name: 'Cena',      emoji: '🌙', cls: 'cat-dinner' },
    snack:     { name: 'Snack',     emoji: '🥨', cls: 'cat-snack' }
  };

  todayLogs.forEach(log => {
    let name = 'Alimento';
    let cal = 0, prot = 0, carb = 0, fat = 0;
    const qty = log.quantity_g || 100;

    if (log.type === 'food_item') {
      const fi = window.DB.getFoodItemById(log.reference_id) || (window.DB.getIngredientById ? window.DB.getIngredientById(log.reference_id) : null);
      if (!fi) return;
      name = fi.name;
      const factor = qty / 100;
      cal = Math.round((fi.calories_per_100g || 0) * factor);
      prot = (fi.protein_per_100g || 0) * factor;
      carb = (fi.carbs_per_100g || 0) * factor;
      fat = (fi.fat_per_100g || 0) * factor;
    } else if (log.type === 'meal') {
      const recipe = window.DB.getRecipeById(log.reference_id);
      if (!recipe) return;
      name = recipe.name;
      const macros = recipe.macros || (typeof calcRecipeMacros === 'function' ? calcRecipeMacros(recipe.id) : { calories: 0, protein: 0, carbs: 0, fat: 0 });
      cal = macros.calories || 0;
      prot = macros.protein || 0;
      carb = macros.carbs || 0;
      fat = macros.fat || 0;
    }

    const catKey = log.mealCategory || 'snack';
    const catInfo = catMap[catKey] || catMap.snack;

    const card = document.createElement('div');
    card.className = `card--free-food ${catInfo.cls}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Detalles de ${name}`);
    card.innerHTML = `
      <div class="free-food-info">
        <div class="free-food-name-row">
          <span class="free-food-name">${name}</span>
          <span class="free-entry-badge">${catInfo.emoji} ${catInfo.name}</span>
        </div>
        <div class="free-food-meta">${qty}${log.type === 'meal' && !log.quantity_g ? ' porción' : 'g'} • ${cal} kcal • P:${prot.toFixed(1)}g C:${carb.toFixed(1)}g G:${fat.toFixed(1)}g</div>
      </div>
      <div class="free-food-arrow">›</div>
    `;

    card.addEventListener('click', () => {
      openFoodLogModal(log.id);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFoodLogModal(log.id);
      }
    });

    section.appendChild(card);
  });

  container.appendChild(section);
}

// ============================================================
// MODAL DE DETALLE Y EDICIÓN DE COMIDA (FOOD LOG MODAL)
// ======================================================================================================================
let _foodLogActiveLogId = null;
let _foodLogSelectedCategory = 'snack';
let _foodLogInitialCategory = 'snack';
let _foodLogInitialQty = 100;
let _foodLogBase100g = { cal: 0, prot: 0, carb: 0, fat: 0 };
let _foodLogIsPortionBased = false;

function openFoodLogModal(logId) {
  const log = window.DB && typeof window.DB.getFoodLogById === 'function'
    ? window.DB.getFoodLogById(logId)
    : null;
  if (!log) return;

  _foodLogActiveLogId = log.id;
  _foodLogSelectedCategory = log.mealCategory || 'snack';
  _foodLogInitialCategory = _foodLogSelectedCategory;

  const modal = document.getElementById('food-log-modal');
  const overlay = document.getElementById('food-log-overlay');
  if (!modal || !overlay) return;

  const titleEl = document.getElementById('food-log-title');
  const subtitleEl = document.getElementById('food-log-subtitle');
  const catBadgeEl = document.getElementById('food-log-category-badge');
  const typeBadgeEl = document.getElementById('food-log-type-badge');
  const calValEl = document.getElementById('food-log-cal-val');
  const protValEl = document.getElementById('food-log-prot-val');
  const carbValEl = document.getElementById('food-log-carb-val');
  const fatValEl = document.getElementById('food-log-fat-val');
  const ringProt = document.getElementById('food-log-ring-prot');
  const ringCarb = document.getElementById('food-log-ring-carb');
  const ringFat = document.getElementById('food-log-ring-fat');
  const gramInput = document.getElementById('food-log-gram-input');
  const favBtn = document.getElementById('btn-food-log-fav');
  const chipsContainer = document.getElementById('food-log-chips');
  const saveBtn = document.getElementById('btn-food-log-save');
  const delBtn = document.getElementById('btn-food-log-delete');

  const catNames = {
    breakfast: '🌅 Desayuno',
    lunch: '🍽️ Almuerzo',
    merienda: '🥪 Merienda',
    dinner: '🌙 Cena',
    snack: '🥨 Snack'
  };

  // Subtítulo con horario formateado
  const timeStr = log.timestamp
    ? new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '';
  subtitleEl.textContent = timeStr ? `Registrado hoy a las ${timeStr}` : 'Registrado hoy';
  catBadgeEl.textContent = catNames[_foodLogSelectedCategory] || '🥨 Snack';
  typeBadgeEl.textContent = log.planned ? 'Del plan' : 'Extra';

  // Dirty check: Guardar solo se activa si hay cambios
  function checkDirty() {
    const curQty = parseInt(gramInput.value) || 0;
    const isDirty = (_foodLogSelectedCategory !== _foodLogInitialCategory) || (curQty !== _foodLogInitialQty);
    if (saveBtn) {
      saveBtn.disabled = !isDirty;
    }
  }

  // Chips interactivos de tipo de comida (centrados)
  if (chipsContainer) {
    const chipBtns = chipsContainer.querySelectorAll('.food-log-chip');
    chipBtns.forEach(btn => {
      const val = btn.dataset.val;
      if (val === _foodLogSelectedCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      btn.onclick = () => {
        chipBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _foodLogSelectedCategory = val;
        catBadgeEl.textContent = catNames[val] || val;
        checkDirty();
      };
    });
  }

  // Resolver datos de alimento o receta
  let itemName = 'Alimento';
  let qty = log.quantity_g || 100;
  _foodLogIsPortionBased = false;

  if (log.type === 'meal') {
    const r = window.DB.getRecipeById(log.reference_id);
    itemName = r ? r.name : 'Receta';
    const macros = r ? (r.macros || (typeof calcRecipeMacros === 'function' ? calcRecipeMacros(r.id) : { calories: 0, protein: 0, carbs: 0, fat: 0 })) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    if (log.quantity_g && log.quantity_g > 10) {
      qty = log.quantity_g;
      const factor = qty / 100;
      _foodLogBase100g = {
        cal: (macros.calories || 0) / (factor || 1),
        prot: (macros.protein || 0) / (factor || 1),
        carb: (macros.carbs || 0) / (factor || 1),
        fat: (macros.fat || 0) / (factor || 1)
      };
    } else {
      _foodLogIsPortionBased = true;
      qty = log.quantity_g || 1;
      _foodLogBase100g = {
        cal: macros.calories || 0,
        prot: macros.protein || 0,
        carb: macros.carbs || 0,
        fat: macros.fat || 0
      };
    }
  } else if (log.type === 'food_item') {
    const fi = window.DB.getFoodItemById(log.reference_id) || (window.DB.getIngredientById ? window.DB.getIngredientById(log.reference_id) : null);
    itemName = fi ? fi.name : 'Alimento';
    _foodLogBase100g = {
      cal: fi?.calories_per_100g || 0,
      prot: fi?.protein_per_100g || 0,
      carb: fi?.carbs_per_100g || 0,
      fat: fi?.fat_per_100g || 0
    };
    qty = log.quantity_g || 100;
  } else if (log.type === 'liquid') {
    const liq = (window.DB && typeof window.DB.getLiquidById === 'function')
      ? window.DB.getLiquidById(log.reference_id)
      : ((window.DB.liquids || []).find(l => l.id === log.reference_id));
    itemName = liq ? `${liq.icon || '💧'} ${liq.name}` : 'Bebida';
    _foodLogBase100g = {
      cal: liq?.calories_per_100ml || liq?.calories_per_100g || 0,
      prot: liq?.protein_per_100ml || liq?.protein_per_100g || 0,
      carb: liq?.carbs_per_100ml || liq?.carbs_per_100g || 0,
      fat: liq?.fat_per_100ml || liq?.fat_per_100g || 0
    };
    qty = log.quantity_g || 250;
  }

  _foodLogInitialQty = qty;
  titleEl.textContent = itemName;

  // Actualizador en vivo de macros y gráfico circular (idéntico a recetas)
  const CIRC = 2 * Math.PI * 24; // R = 24 => ~150.796

  function renderLiveMacros(currentVal) {
    let cal = 0, prot = 0, carb = 0, fat = 0;
    if (_foodLogIsPortionBased) {
      cal = Math.round(_foodLogBase100g.cal * currentVal);
      prot = Math.round(_foodLogBase100g.prot * currentVal * 10) / 10;
      carb = Math.round(_foodLogBase100g.carb * currentVal * 10) / 10;
      fat = Math.round(_foodLogBase100g.fat * currentVal * 10) / 10;
    } else {
      const factor = currentVal / 100;
      cal = Math.round(_foodLogBase100g.cal * factor);
      prot = Math.round(_foodLogBase100g.prot * factor * 10) / 10;
      carb = Math.round(_foodLogBase100g.carb * factor * 10) / 10;
      fat = Math.round(_foodLogBase100g.fat * factor * 10) / 10;
    }

    calValEl.textContent = cal;
    protValEl.textContent = `${prot}g`;
    carbValEl.textContent = `${carb}g`;
    fatValEl.textContent = `${fat}g`;

    const protKcal = prot * 4;
    const carbKcal = carb * 4;
    const fatKcal = fat * 9;
    const totalKcal = protKcal + carbKcal + fatKcal || 1;

    const protPct = protKcal / totalKcal;
    const carbPct = carbKcal / totalKcal;
    const fatPct = fatKcal / totalKcal;

    const segProt = protPct * CIRC;
    const segCarb = carbPct * CIRC;
    const segFat = fatPct * CIRC;

    if (ringProt && ringCarb && ringFat) {
      ringProt.style.opacity = segProt >= 1 ? '1' : '0';
      ringProt.setAttribute('stroke-dasharray', `${segProt} ${Math.max(0, CIRC - segProt)}`);
      ringProt.setAttribute('stroke-dashoffset', '0');
      ringProt.setAttribute('transform', 'rotate(-90 34 34)');

      ringCarb.style.opacity = segCarb >= 1 ? '1' : '0';
      ringCarb.setAttribute('stroke-dasharray', `${segCarb} ${Math.max(0, CIRC - segCarb)}`);
      ringCarb.setAttribute('stroke-dashoffset', `${-(segProt)}`);
      ringCarb.setAttribute('transform', 'rotate(-90 34 34)');

      ringFat.style.opacity = segFat >= 1 ? '1' : '0';
      ringFat.setAttribute('stroke-dasharray', `${segFat} ${Math.max(0, CIRC - segFat)}`);
      ringFat.setAttribute('stroke-dashoffset', `${-(segProt + segCarb)}`);
      ringFat.setAttribute('transform', 'rotate(-90 34 34)');
    }
  }

  // Configurar unidad e input
  const unitEl = document.querySelector('.food-log-unit');
  if (unitEl) {
    unitEl.textContent = _foodLogIsPortionBased ? 'porción(es)' : (log.type === 'liquid' ? 'mililitros' : 'gramos');
  }

  gramInput.value = qty;
  renderLiveMacros(qty);
  checkDirty();

  // Botones de paso (+ / -) con incremento de 10 en 10 para mayor precisión
  const step = _foodLogIsPortionBased ? 1 : (log.type === 'liquid' ? 50 : 10);
  const minVal = _foodLogIsPortionBased ? 1 : 5;
  const maxVal = _foodLogIsPortionBased ? 20 : 3000;

  const btnMinus = document.getElementById('btn-food-log-minus');
  const btnPlus = document.getElementById('btn-food-log-plus');

  if (btnMinus) {
    btnMinus.onclick = () => {
      let v = (parseInt(gramInput.value) || step) - step;
      if (v < minVal) v = minVal;
      gramInput.value = v;
      renderLiveMacros(v);
      checkDirty();
    };
  }

  if (btnPlus) {
    btnPlus.onclick = () => {
      let v = (parseInt(gramInput.value) || 0) + step;
      if (v > maxVal) v = maxVal;
      gramInput.value = v;
      renderLiveMacros(v);
      checkDirty();
    };
  }

  gramInput.oninput = () => {
    let v = parseInt(gramInput.value) || 0;
    renderLiveMacros(v);
    checkDirty();
  };

  // Botón de Favoritos en la cabecera
  function syncFavUI() {
    const isFav = window.DB && typeof window.DB.isFavorite === 'function' && window.DB.isFavorite(log.reference_id);
    if (favBtn) {
      if (isFav) {
        favBtn.classList.add('is-fav');
        favBtn.querySelector('.fav-icon').textContent = '★';
        favBtn.setAttribute('title', 'En favoritos');
      } else {
        favBtn.classList.remove('is-fav');
        favBtn.querySelector('.fav-icon').textContent = '⭐';
        favBtn.setAttribute('title', 'Añadir a favoritos');
      }
    }
  }
  syncFavUI();

  if (favBtn) {
    favBtn.onclick = (e) => {
      e.stopPropagation();
      if (window.DB && typeof window.DB.toggleFavorite === 'function') {
        window.DB.toggleFavorite(log.reference_id);
        const isFavNow = window.DB.isFavorite(log.reference_id);
        syncFavUI();
        if (typeof showToast === 'function') {
          showToast(isFavNow ? '⭐ Añadido a favoritos' : 'Eliminado de favoritos');
        }
      }
    };
  }

  // Guardar Cambios (Solo activo si hubo cambios)
  if (saveBtn) {
    saveBtn.onclick = () => {
      const finalQty = parseInt(gramInput.value) || qty;
      window.DB.updateFoodLog(log.id, {
        quantity_g: finalQty,
        mealCategory: _foodLogSelectedCategory
      });
      closeFoodLogModal();
      if (typeof showToast === 'function') showToast('✅ Comida actualizada');
      if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
      if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
      if (typeof updateShoppingFab === 'function') updateShoppingFab();
      if (typeof updateHeaderGamification === 'function') updateHeaderGamification();
    };
  }

  // Eliminar comida
  if (delBtn) {
    delBtn.onclick = () => {
      if (confirm(`¿Eliminar "${itemName}" del registro de hoy?`)) {
        if (log.type === 'meal' && log.planned) {
          // Revertir ingredientes a despensa si era planificada
          const ris = window.DB.getRecipeIngredients(log.reference_id) || [];
          ris.forEach(ri => {
            const pantry = window.DB.getPantryItem(ri.ingredient_id);
            const cur = pantry ? pantry.quantity_available : 0;
            window.DB.updatePantryQuantity(ri.ingredient_id, cur + ri.quantity);
          });
        }
        window.DB.removeFoodLog(log.id);
        closeFoodLogModal();
        if (typeof showToast === 'function') showToast('🗑️ Comida eliminada');
        if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
        if (typeof renderDashboardScreen === 'function') renderDashboardScreen();
        if (typeof updateShoppingFab === 'function') updateShoppingFab();
        if (typeof updateHeaderGamification === 'function') updateHeaderGamification();
      }
    };
  }

  // Evitar arrastrar o scrollear la interfaz de fondo en móviles
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  // Mostrar modal con animación fluida
  modal.hidden = false;
  overlay.hidden = false;
  requestAnimationFrame(() => {
    modal.classList.add('open');
    overlay.classList.add('open');
  });
}

function closeFoodLogModal() {
  const modal = document.getElementById('food-log-modal');
  const overlay = document.getElementById('food-log-overlay');
  if (!modal || !overlay) return;

  // Restaurar scroll de fondo si no hay otros modales abiertos
  const otherOpen = document.querySelector('.modal-overlay.open:not(#food-log-overlay)');
  if (!otherOpen) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  modal.classList.remove('open');
  overlay.classList.remove('open');
  modal.style.transform = '';
  overlay.style.opacity = '';

  setTimeout(() => {
    modal.hidden = true;
    overlay.hidden = true;
  }, 320);
}

// Exponer globalmente
window.openFoodLogModal = openFoodLogModal;
window.closeFoodLogModal = closeFoodLogModal;

// Inicializar eventos de Food Log Modal (gestos y botones de cierre)
function initFoodLogModalEvents() {
  const modal = document.getElementById('food-log-modal');
  const overlay = document.getElementById('food-log-overlay');
  const closeBtn = document.getElementById('food-log-close');

  if (overlay) {
    overlay.addEventListener('click', closeFoodLogModal);
    overlay.addEventListener('touchmove', (e) => {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeFoodLogModal);

  if (modal) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const header = modal.querySelector('.food-log-header');
    const handle = modal.querySelector('.modal-handle');

    function onDragStart(clientY, target) {
      if (target && (target.closest('.modal-close') || target.closest('button') || target.closest('input'))) {
        isDragging = false;
        return false;
      }
      startY = clientY;
      currentY = startY;
      isDragging = true;
      modal.style.transition = 'none';
      if (overlay) overlay.style.transition = 'none';
      return true;
    }

    function onDragMove(clientY, e) {
      if (!isDragging) return;
      currentY = clientY;
      const deltaY = currentY - startY;
      if (deltaY > 0) {
        if (e && e.cancelable) e.preventDefault();
        modal.style.transform = `translateX(-50%) translate3d(0, ${deltaY}px, 0)`;
        if (overlay) {
          const progress = Math.min(1, deltaY / 280);
          overlay.style.opacity = (1 - progress * 0.85).toString();
        }
      } else {
        modal.style.transform = 'translateX(-50%) translateY(0)';
      }
    }

    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      modal.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      if (overlay) overlay.style.transition = 'opacity 0.35s ease';
      const deltaY = currentY - startY;
      if (deltaY > 85) {
        closeFoodLogModal();
      } else {
        modal.style.transform = 'translateX(-50%) translateY(0)';
        if (overlay) overlay.style.opacity = '';
      }
    }

    [handle, header].forEach(el => {
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        onDragStart(e.touches[0].clientY, e.target);
      }, { passive: true });

      el.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        onDragMove(e.touches[0].clientY, e);
      }, { passive: false });

      el.addEventListener('touchend', onDragEnd);
      el.addEventListener('touchcancel', onDragEnd);

      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (onDragStart(e.clientY, e.target)) {
          const onMouseMove = (ev) => onDragMove(ev.clientY, ev);
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            onDragEnd();
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFoodLogModalEvents);
} else {
  initFoodLogModalEvents();
}
