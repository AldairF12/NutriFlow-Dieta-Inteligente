function renderDiaryScreen(options = {}) {
  const animateUpcoming = options.animateUpcoming === true;
  const wasUpcomingVisible = document.querySelector('#screen-diary .upcoming-section') !== null;
  const wasDoneVisible     = document.querySelector('#screen-diary .diary-done-state') !== null;

  document.getElementById('greeting-text').textContent = getGreeting();
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  renderDailyMacros();

  const { slot, showMealFirst, currentRecipes, nextSlot, nextRecipes } = getDiaryState();
  const needsToBuyGlobal = getUpcomingNeedsToBuy();
  document.getElementById('slot-badge').textContent = slot.emoji + ' ' + slot.label;

  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  if (showMealFirst) {
    // ─ ES HORA DE COMER y aún no ha comido ────────────
    // Orden: comida (todas del turno) -> bebida -> te falta comprar (global)
    let shownAny = false;
    const allCurrentRecipes = [...currentRecipes.canCook, ...currentRecipes.needsToBuy];
    if (allCurrentRecipes.length > 0) {
      const sec = buildRecipeSection(`🍳 ${slot.label}`, allCurrentRecipes, 'current-meal');
      mainContent.appendChild(sec);
      if (_isTabSwitching) sec.classList.add('section-entering');
      shownAny = true;
    }
    
    // 2. Hidratación disponible siempre en el medio
    const hydSec = buildHydrationSection();
    mainContent.appendChild(hydSec);
    if (_isTabSwitching) hydSec.classList.add('section-entering');

    // 3. Recetas que te falta comprar (global de compras del resto del día/catálogo)
    if (needsToBuyGlobal.length > 0) {
      const buySec = buildRecipeSection('🛒 Te falta comprar', needsToBuyGlobal, 'needs-buy');
      mainContent.appendChild(buySec);
      if (_isTabSwitching) buySec.classList.add('section-entering');
      shownAny = true;
    }
    
    if (!shownAny) {
      mainContent.appendChild(buildEmptyState('Sin recetas para este horario 🌿'));
    }

  } else {
    // ─ ENTRE COMIDAS o ya comió ────────────────
    // Orden: bebida -> comida (próxima canCook) -> te falta comprar (global del resto del día)
    
    // 1. Hidratación primero
    const hydSec = buildHydrationSection();
    mainContent.appendChild(hydSec);
    if (_isTabSwitching) hydSec.classList.add('section-entering');
    
    // 2. Próxima comida dividida como preview
    if (nextSlot && nextRecipes) {
      let shownAny = false;
      if (nextRecipes.canCook.length > 0) {
        const upSec = buildUpcomingRecipeSection(`🍳 Próximo: ${nextSlot.label}`, nextSlot, nextRecipes.canCook, true);
        mainContent.appendChild(upSec);
        if (_isTabSwitching) {
          upSec.classList.add('section-entering');
        } else if (animateUpcoming && !wasUpcomingVisible) {
          upSec.classList.add('section-appearing');
        }
        shownAny = true;
      }
      if (needsToBuyGlobal.length > 0) {
        const buySec = buildRecipeSection('🛒 Te falta comprar', needsToBuyGlobal, 'needs-buy');
        mainContent.appendChild(buySec);
        if (_isTabSwitching) buySec.classList.add('section-entering');
        shownAny = true;
      }
      if (!shownAny) {
        mainContent.appendChild(buildEmptyState('Sin recetas para el próximo turno 🌿'));
      }
    } else {
      // Todas las comidas del día completadas 🎉
      // Pero si aún le faltan compras, se las mostramos para mañana / planificación.
      if (needsToBuyGlobal.length > 0) {
        const buySec = buildRecipeSection('🛒 Te falta comprar', needsToBuyGlobal, 'needs-buy');
        mainContent.appendChild(buySec);
        if (_isTabSwitching) buySec.classList.add('section-entering');
      } else {
        const done = buildEmptyState('¡Comidas del día completadas! 🎉');
        done.classList.add('diary-done-state');
        if (_isTabSwitching) {
          done.classList.add('section-entering');
        } else if (animateUpcoming && !wasDoneVisible) {
          done.classList.add('section-appearing');
        }
        mainContent.appendChild(done);
      }
    }
  }
  // Añadir siempre las entradas libres del día al final
  renderFreeDiaryEntries(mainContent);
  cleanupAnimationClasses();
}
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

  const row = document.createElement('div');
  row.className = 'cards-row';
  DB.liquids.forEach(liq => row.appendChild(buildLiquidCard(liq)));
  section.appendChild(row);
  return section;
}
function buildLiquidCard(liquid) {
  const card = document.createElement('div');
  const todayLogs = DB.getTodayLogs().filter(l => l.type === 'liquid' && l.reference_id === liquid.id);
  const logCount = todayLogs.length;
  const isRegistered = logCount > 0;

  card.className = `card card-liquid ${isRegistered ? 'registered' : ''}`;
  if (_isTabSwitching) card.classList.add('item-entering');
  card.innerHTML = `
    <div class="liquid-icon">${liquid.icon}</div>
    <div class="liquid-name">${liquid.name}</div>
    <div class="liquid-type">${liquid.type}</div>
    <button class="btn-log ${isRegistered ? 'registered' : ''}" data-id="${liquid.id}" aria-label="Registrar ${liquid.name}">
      ${isRegistered ? `✓ Registrado (${logCount})` : '+ Registrar'}
    </button>
  `;
  card.querySelector('.btn-log').addEventListener('click', e => {
    e.stopPropagation();
    DB.addFoodLog({ type: 'liquid', reference_id: liquid.id });
    showToast('💧 Hidratación registrada');
    renderDiaryScreen();
    
    // Animar el botón recién renderizado para dar feedback
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
    <span class="upcoming-pill">Próximamente</span>
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
function buildRecipeSection(title, recipes, className) {
  const section = document.createElement('section');
  section.className = `content-section ${className}`;

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
  const todayLogs = DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipe.id);
  const logCount = todayLogs.length;
  const isRegistered = logCount > 0;

  card.className = `card card-recipe ${canCook ? 'available' : 'missing'} ${isRegistered ? 'registered' : ''}`;
  if (_isTabSwitching) card.classList.add('item-entering');
  card.dataset.recipeId = recipe.id;

  // Construir inner
  const inner = document.createElement('div');
  inner.className = 'card-inner';

  // Tipo de comida
  const type = document.createElement('div');
  type.className = 'recipe-meal-type';
  type.textContent = getMealTypeEmoji(recipe.meal_type) + ' ' + recipe.meal_type;
  inner.appendChild(type);

  // Nombre
  const name = document.createElement('h3');
  name.className = 'recipe-name';
  name.textContent = recipe.name;
  inner.appendChild(name);

  // Gráfico de macros (Donut)
  const macros = recipe.macros || calcRecipeMacros(recipe.id);
  inner.appendChild(buildMacroChart(macros));

  // Botón registrar/despensa
  const btn = document.createElement('button');
  btn.className = 'btn-log btn-log-recipe';
  if (isRegistered) {
    btn.className += ' registered';
    btn.textContent = `✓ Registrada ${logCount > 1 ? `(${logCount})` : ''}`;
    btn.setAttribute('aria-label', `Registrada ${recipe.name}`);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeMealLog(recipe.id, recipe.name);
    });
  } else if (canCook) {
    btn.textContent = '✓ Registrar comida';
    btn.setAttribute('aria-label', `Registrar ${recipe.name}`);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      logMeal(recipe.id);
    });
  } else {
    btn.textContent = '🛒 Ir a Despensa';
    btn.setAttribute('aria-label', `Ir a Despensa para ${recipe.name}`);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelector('[data-screen="pantry"]').click();
    });
  }
  inner.appendChild(btn);

  card.appendChild(inner);
  card.addEventListener('click', () => openRecipeDetail(recipe));
  return card;
}
function getMealTypeEmoji(type) {
  const m = { desayuno: '🌅', almuerzo: '☀️', merienda: '🍎', cena: '🌙' };
  return m[type] || '🍽️';
}
function logMeal(recipeId) {
  // Descontar ingredientes de la despensa
  const ris = DB.getRecipeIngredients(recipeId);
  ris.forEach(ri => {
    const pantry = DB.getPantryItem(ri.ingredient_id);
    const currentQty = pantry ? pantry.quantity_available : 0;
    DB.updatePantryQuantity(ri.ingredient_id, Math.max(0, currentQty - ri.quantity));
  });

  DB.addFoodLog({ type: 'meal', reference_id: recipeId });
  showToast('✅ Comida registrada');
  
  updateShoppingFab();
  updateRecipeCardState(recipeId);

  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen && activeScreen.id === 'screen-diary') {
    const currentMealSec = document.querySelector('#screen-diary .content-section.current-meal');
    if (currentMealSec) {
      const card = currentMealSec.querySelector(`.card-recipe[data-recipe-id="${recipeId}"]`);
      if (card) {
        const btn = card.querySelector('.btn-log-recipe');
        if (btn) {
          btn.classList.add('registered');
          btn.textContent = '✓ Registrada';
        }
        card.classList.add('registered');
        
        setTimeout(() => {
          currentMealSec.classList.add('logging-out');
          setTimeout(() => {
            renderDiaryScreen({ animateUpcoming: true });
            renderPantryScreen(); // mantener en sincronía la despensa
          }, 380);
        }, 280);
        return;
      }
    }
  }

  renderDiaryScreen();
  renderPantryScreen();
}
function removeMealLog(recipeId, recipeName) {
  if (confirm(`¿Deseas eliminar el registro de "${recipeName}" de hoy?`)) {
    const today = new Date().toISOString().split('T')[0];
    const logs = DB.state.food_logs;
    const index = logs.findLastIndex(l => l.date === today && l.type === 'meal' && l.reference_id === recipeId);
    if (index > -1) {
      // Devolver ingredientes a la despensa
      const ris = DB.getRecipeIngredients(recipeId);
      ris.forEach(ri => {
        const pantry = DB.getPantryItem(ri.ingredient_id);
        const currentQty = pantry ? pantry.quantity_available : 0;
        DB.updatePantryQuantity(ri.ingredient_id, currentQty + ri.quantity);
      });

      logs.splice(index, 1);
      persistState();
      showToast('🗑️ Registro de comida eliminado');
      
      updateShoppingFab();
      updateRecipeCardState(recipeId);
      renderDiaryScreen();
      renderPantryScreen();
    }
  }
}
function openRecipeDetail(recipe) {
  const modal   = document.getElementById('recipe-modal');
  const overlay = document.getElementById('modal-overlay');

  // Limpiar estilos en línea previos antes de abrir
  modal.style.transform = '';
  modal.style.transition = '';
  overlay.style.opacity = '';
  overlay.style.transition = '';

  const macros  = recipe.macros || calcRecipeMacros(recipe.id);
  const ris     = DB.getRecipeIngredients(recipe.id);

  document.getElementById('modal-recipe-name').textContent = recipe.name;
  document.getElementById('modal-recipe-type').textContent = getMealTypeEmoji(recipe.meal_type) + ' ' + recipe.meal_type;
  document.getElementById('modal-cal').textContent  = macros.calories + ' kcal';
  document.getElementById('modal-prot').textContent = macros.protein  + 'g';
  document.getElementById('modal-carb').textContent = macros.carbs    + 'g';
  document.getElementById('modal-fat').textContent  = macros.fat      + 'g';
  document.getElementById('modal-instructions').textContent = recipe.instructions;

  const ingList = document.getElementById('modal-ingredients');
  ingList.innerHTML = '';
  ris.forEach(ri => {
    const ing     = DB.getIngredientById(ri.ingredient_id);
    const pantry  = DB.getPantryItem(ri.ingredient_id);
    const avail   = pantry ? pantry.quantity_available : 0;
    const ok      = avail >= ri.quantity;
    const li = document.createElement('li');
    li.className = `ingredient-item ${ok ? '' : 'ingredient-missing'}`;
    li.innerHTML = `
      <span class="ing-name">${ing ? ing.name : 'Desconocido'}</span>
      <span class="ing-qty">${ri.quantity}g</span>
      <span class="ing-stock ${ok ? 'ok' : 'low'}">${ok ? '✓' : `${avail}g`}</span>
      ${!ok ? '<span class="ing-edit-arrow" aria-hidden="true">›</span>' : ''}
    `;
    if (!ok && ing) {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => openIngredientPopover(ing.id, ing.name, ri.quantity, recipe));
    }
    ingList.appendChild(li);
  });
  
  // Botón de acción contextual en el modal
  const actionBtn = document.getElementById('modal-action-btn');
  const todayLogs = DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipe.id);
  const logCount = todayLogs.length;
  const isRegistered = logCount > 0;
  const pantryCheck = checkPantryForRecipe(recipe.id);
  const canCook = pantryCheck.canCook;

  actionBtn.className = 'btn-log';
  const newBtn = actionBtn.cloneNode(true);
  actionBtn.parentNode.replaceChild(newBtn, actionBtn);

  if (isRegistered) {
    newBtn.classList.add('btn-log-recipe', 'registered');
    newBtn.textContent = `✓ Registrada ${logCount > 1 ? `(${logCount})` : ''} — Quitar registro`;
    newBtn.addEventListener('click', () => {
      removeMealLog(recipe.id, recipe.name);
      openRecipeDetail(recipe);
    });
  } else if (canCook) {
    newBtn.classList.add('btn-log-recipe');
    newBtn.textContent = '✓ Registrar comida';
    newBtn.addEventListener('click', () => {
      logMeal(recipe.id);
      closeRecipeModal();
    });
  } else {
    newBtn.classList.add('btn-log-missing');
    newBtn.textContent = '🛒 Ir a Despensa';
    newBtn.addEventListener('click', () => {
      closeRecipeModal();
      document.querySelector('[data-screen="pantry"]').click();
    });
  }

  modal.classList.add('open');
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
}
function closeRecipeModal() {
  const modal = document.getElementById('recipe-modal');
  const overlay = document.getElementById('modal-overlay');
  modal.classList.remove('open');
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');

  // Limpiar estilos después de la animación de cierre para no interferir con futuras aperturas
  setTimeout(() => {
    modal.style.transform = '';
    modal.style.transition = '';
    overlay.style.opacity = '';
    overlay.style.transition = '';
  }, 420);
}
function initModalGestures() {
  const modal = document.getElementById('recipe-modal');
  const handle = modal.querySelector('.modal-handle');
  const header = modal.querySelector('.modal-header');

  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  function onTouchStart(e) {
    // Evitar arrastrar si se toca el botón de cerrar directamente
    if (e.target.closest('.modal-close')) {
      isDragging = false;
      return;
    }
    const touch = e.touches[0];
    startY = touch.clientY;
    isDragging = true;
    modal.style.transition = 'none'; // Sin transición para seguir el dedo en tiempo real
    const overlay = document.getElementById('modal-overlay');
    overlay.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;

    // Solo arrastrar hacia abajo
    if (deltaY > 0) {
      currentY = deltaY;
      modal.style.transform = `translateX(-50%) translate3d(0, ${currentY}px, 0)`;
      
      const overlay = document.getElementById('modal-overlay');
      const progress = Math.min(1, currentY / 320);
      overlay.style.opacity = (1 - progress * 0.85).toString();
    } else {
      currentY = 0;
      modal.style.transform = 'translateX(-50%) translate3d(0, 0, 0)';
    }
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;

    // Restaurar transiciones suaves
    modal.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    const overlay = document.getElementById('modal-overlay');
    overlay.style.transition = 'opacity 0.4s ease';

    if (currentY > 120) {
      // Forzar animación inmediata al fondo vía estilos inline antes de remover la clase
      modal.style.transform = 'translateX(-50%) translate3d(0, 105%, 0)';
      overlay.style.opacity = '0';
      closeRecipeModal();
    } else {
      modal.style.transform = 'translateX(-50%) translate3d(0, 0, 0)';
      overlay.style.opacity = '';
    }
    currentY = 0;
  }

  [handle, header].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
  });
}
function openIngredientPopover(ingId, ingName, needed, recipe) {
  _popoverIngId  = ingId;
  _popoverRecipe = recipe;

  const pantry = DB.getPantryItem(ingId);
  _popoverQty = pantry ? pantry.quantity_available : 0;

  document.getElementById('popover-ing-name').textContent   = ingName;
  document.getElementById('popover-ing-needed').textContent = `Necesitas: ${needed}g · Tienes: ${_popoverQty}g`;
  document.getElementById('popover-qty-display').textContent = `${_popoverQty}g`;

  document.getElementById('ingredient-popover-overlay').classList.add('open');
  document.getElementById('ingredient-popover').classList.add('open');
}
function closeIngredientPopover() {
  document.getElementById('ingredient-popover-overlay').classList.remove('open');
  document.getElementById('ingredient-popover').classList.remove('open');
  _popoverIngId = null;
  _popoverRecipe = null;
}
function initIngredientPopover() {
  document.getElementById('popover-close').addEventListener('click', closeIngredientPopover);
  document.getElementById('ingredient-popover-overlay').addEventListener('click', closeIngredientPopover);

  document.getElementById('popover-minus').addEventListener('click', () => {
    _popoverQty = _popoverQty % 50 === 0 ? Math.max(0, _popoverQty - 50) : Math.floor(_popoverQty / 50) * 50;
    document.getElementById('popover-qty-display').textContent = `${_popoverQty}g`;
  });

  document.getElementById('popover-plus').addEventListener('click', () => {
    _popoverQty = _popoverQty % 50 === 0 ? _popoverQty + 50 : Math.ceil(_popoverQty / 50) * 50;
    document.getElementById('popover-qty-display').textContent = `${_popoverQty}g`;
  });

  document.getElementById('popover-save').addEventListener('click', () => {
    if (_popoverIngId === null) return;
    const ingId = _popoverIngId;
    const qty = _popoverQty;

    DB.updatePantryQuantity(ingId, qty);
    showToast('✅ Despensa actualizada');
    closeIngredientPopover();

    // Reabrir el modal de la receta con los datos actualizados
    if (_popoverRecipe) {
      setTimeout(() => openRecipeDetail(_popoverRecipe), 60);
      renderPantryScreen();
      renderDiaryScreen();
      renderRecipesScreen();
      updateShoppingFab();
    } else {
      // Abierto desde la lista de compras o despensa directamente
      const shoppingModal = document.getElementById('shopping-modal');
      const isShoppingOpen = shoppingModal && shoppingModal.classList.contains('open');

      if (isShoppingOpen) {
        const itemEl = document.querySelector(`#shopping-list-body .shopping-item[data-ing-id="${ingId}"]`);
        if (itemEl) {
          const list = getMissingIngredientsList();
          const isStillMissing = list.some(item => item.ing.id === ingId);
          if (!isStillMissing) {
            // Esperar a que el popover se desvanezca antes de deslizar el ingrediente
            setTimeout(() => {
              itemEl.classList.add('checked-out');
              setTimeout(() => {
                renderShoppingList(false);
              }, 350);
            }, 180);
          } else {
            setTimeout(() => {
              renderShoppingList(false);
            }, 180);
          }
        } else {
          renderShoppingList(false);
        }
      }

      renderPantryScreen();
      renderDiaryScreen();
      renderRecipesScreen();
      updateShoppingFab();
    }
  });
}
function renderFreeDiaryEntries(parentEl) {
  const todayLogs = DB.getTodayLogs();
  const freeEntries = todayLogs.filter(l => l.type === 'food_item' || (l.type === 'meal' && l.planned === false));
  if (freeEntries.length === 0) return;

  const section = document.createElement('section');
  section.className = 'content-section';

  const title = document.createElement('div');
  title.className = 'extras-section-title';
  title.textContent = '+ Añadido fuera del plan';
  section.appendChild(title);

  freeEntries.forEach(log => {
    const card = buildFreeFoodCard(log);
    if (card) section.appendChild(card);
  });

  parentEl.appendChild(section);
}
function buildFreeFoodCard(log) {
  let name = '—', kcal = 0, meta = '';

  if (log.type === 'food_item') {
    const fi = DB.getFoodItemById(log.reference_id);
    if (!fi) return null;
    const qty = log.quantity_g || 100;
    kcal = Math.round((fi.calories_per_100g || 0) * qty / 100);
    const prot = ((fi.protein_per_100g || 0) * qty / 100).toFixed(1);
    name = fi.name;
    meta = `${qty}g · ${kcal} kcal · ${prot}g prot.`;
  } else if (log.type === 'meal') {
    const r = DB.getRecipeById(log.reference_id);
    if (!r) return null;
    kcal = calcRecipeMacros(r.id).calories;
    name = r.name;
    meta = `${kcal} kcal (receta extra)`;
  }

  const card = document.createElement('div');
  card.className = 'card--free-food';
  card.innerHTML = `
    <div class="free-food-info">
      <div class="free-food-name">${name}</div>
      <div class="free-food-meta">${meta}</div>
    </div>
    <div class="free-food-actions">
      <button class="btn-free-delete" data-log-id="${log.id}" aria-label="Eliminar">🗑</button>
    </div>
  `;

  card.querySelector('.btn-free-delete').addEventListener('click', () => {
    DB.removeFoodLog(log.id);
    renderDiaryScreen();
    renderDailyMacros();
    showToast('🗑 Registro eliminado');
  });

  return card;
}