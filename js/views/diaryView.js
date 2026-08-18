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
    dateEl.textContent = new Date().toLocaleDateString('es-ES', {
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

function buildHydrationSection() {
  const section = document.createElement('section');
  section.className = 'content-section';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = '\u{1F4A7} Hidrataci\u00F3n';
  section.appendChild(title);

  const sub = document.createElement('p');
  sub.className = 'section-subtitle';
  sub.textContent = 'Mant\u00E9n tu hidrataci\u00F3n diaria';
  section.appendChild(sub);

  const row = document.createElement('div');
  row.className = 'cards-row';
  const liquidsList = window.DB.liquids || (window.DB.state && window.DB.state.liquids) || [];
  liquidsList.forEach(liq => row.appendChild(buildLiquidCard(liq)));
  section.appendChild(row);
  return section;
}

function buildLiquidCard(liquid) {
  const card = document.createElement('div');
  const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
    ? window.DB.getTodayLogs().filter(l => l.type === 'liquid' && l.reference_id === liquid.id)
    : [];
  const logCount = todayLogs.length;
  const isRegistered = logCount > 0;

  card.className = `card card-liquid ${isRegistered ? 'registered' : ''}`;
  if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) card.classList.add('item-entering');
  card.innerHTML = `
    <div class="liquid-icon">${liquid.icon || '\u{1F4A7}'}</div>
    <div class="liquid-name">${liquid.name}</div>
    <div class="liquid-type">${liquid.type || 'Agua'}</div>
    <button class="btn-log ${isRegistered ? 'registered' : ''}" data-id="${liquid.id}" aria-label="Registrar ${liquid.name}">
      ${isRegistered ? `\u2713 Registrado (${logCount})` : '+ Registrar'}
    </button>
  `;
  card.querySelector('.btn-log').addEventListener('click', e => {
    e.stopPropagation();
    window.DB.addFoodLog({ type: 'liquid', reference_id: liquid.id, quantity_g: 250 });
    if (typeof showToast === 'function') showToast('\u{1F4A7} +250 ml de hidrataci\u00F3n registrados');
    renderDiaryScreen();

    const newBtn = document.querySelector(`.card-liquid button[data-id="${liquid.id}"]`);
    if (newBtn) {
      newBtn.classList.add('btn-pop-feedback');
      setTimeout(() => newBtn.classList.remove('btn-pop-feedback'), 400);
    }
  });
  return card;
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

  if (nameEl) nameEl.textContent = recipe.name;
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
      li.className = `ingredient-item ${ok ? '' : 'ingredient-missing'}`;
      li.innerHTML = `
        <span class="ing-name">${ing ? ing.name : 'Desconocido'}</span>
        <span class="ing-qty">${ri.quantity}g</span>
        <span class="ing-stock ${ok ? 'ok' : 'low'}">${ok ? '\u2713' : `${avail}g`}</span>
      `;
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

function initIngredientPopover() {}

function renderFreeDiaryEntries(container) {
  const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
    ? window.DB.getTodayLogs().filter(l => l.type === 'food_item')
    : [];

  if (todayLogs.length === 0) return;

  const section = document.createElement('section');
  section.className = 'content-section';

  const title = document.createElement('h2');
  title.className = 'extras-section-title';
  title.textContent = '\u{1F957} Alimentos Libres / Extras';
  section.appendChild(title);

  todayLogs.forEach(log => {
    const fi = window.DB.getFoodItemById(log.reference_id);
    if (!fi) return;
    const qty = log.quantity_g || 100;
    const factor = qty / 100;
    const cal = Math.round((fi.calories_per_100g || 0) * factor);
    const prot = (fi.protein_per_100g || 0) * factor;
    const carb = (fi.carbs_per_100g || 0) * factor;
    const fat = (fi.fat_per_100g || 0) * factor;

    const card = document.createElement('div');
    card.className = 'card--free-food';
    card.innerHTML = `
      <div class="free-food-info">
        <div class="free-food-name">${fi.name} <span class="free-entry-badge">Extra</span></div>
        <div class="free-food-meta">${qty}g \u2022 ${cal} kcal \u2022 P:${prot.toFixed(1)}g C:${carb.toFixed(1)}g G:${fat.toFixed(1)}g</div>
      </div>
      <div class="free-food-actions">
        <button class="btn-free-delete" title="Eliminar registro" aria-label="Eliminar ${fi.name}">\u2715</button>
      </div>
    `;

    card.querySelector('.btn-free-delete').addEventListener('click', () => {
      window.DB.removeFoodLog(log.id);
      showToast('\u21BA Registro eliminado');
      renderDiaryScreen();
    });

    section.appendChild(card);
  });

  container.appendChild(section);
}
