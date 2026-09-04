// ============================================================
// recipesView.js — Catálogo de Recetas con Toggle Cards vs Lista y CRUD
// ============================================================

let _recipesViewMode = localStorage.getItem('nutriflow_recipes_view') || 'cards'; // 'cards' | 'compact'
let _recipesSearchQuery = '';
let _showHiddenRecipes = false;

function initRecipesToolbar() {
  const toggleBtn = document.getElementById('btn-recipes-view');
  const searchInput = document.getElementById('recipes-search');
  const createBtn = document.getElementById('btn-create-recipe');

  if (toggleBtn) {
    updateRecipesViewToggleBtn(toggleBtn);
    toggleBtn.onclick = () => {
      _recipesViewMode = (_recipesViewMode === 'cards') ? 'compact' : 'cards';
      localStorage.setItem('nutriflow_recipes_view', _recipesViewMode);
      updateRecipesViewToggleBtn(toggleBtn);
      renderRecipesScreen();
    };
  }

  if (createBtn) {
    createBtn.onclick = () => {
      if (typeof openRecipeEditor === 'function') {
        openRecipeEditor();
      }
    };
  }

  if (searchInput) {
    searchInput.oninput = () => {
      _recipesSearchQuery = searchInput.value.trim().toLowerCase();
      renderRecipesScreen();
    };
  }

  // Cerrar menús desplegables al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.recipe-options-dropdown')) {
      document.querySelectorAll('.recipe-options-menu.open').forEach(menu => {
        menu.classList.remove('open');
      });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRecipesToolbar);
} else {
  initRecipesToolbar();
}

function updateRecipesViewToggleBtn(btn) {
  if (!btn) return;
  const icon = btn.querySelector('.btn-view-icon');
  const isCards = (_recipesViewMode === 'cards');
  if (icon) icon.textContent = isCards ? '📄' : '🖼️';
  btn.title = isCards ? 'Cambiar a vista compacta de lista' : 'Cambiar a vista de tarjetas';
}

function recipeMatchesSearch(recipe) {
  if (!_recipesSearchQuery) return true;
  const normQ = typeof normalizeSearchText === 'function' ? normalizeSearchText(_recipesSearchQuery) : _recipesSearchQuery.toLowerCase();
  const nameNorm = typeof normalizeSearchText === 'function' ? normalizeSearchText(recipe.name || '') : (recipe.name || '').toLowerCase();
  if (nameNorm.includes(normQ)) return true;
  
  const ris = window.DB ? window.DB.getRecipeIngredients(recipe.id) : [];
  return ris.some(ri => {
    const ing = window.DB ? window.DB.getIngredientById(ri.ingredient_id) : null;
    const ingNorm = typeof normalizeSearchText === 'function' ? normalizeSearchText(ing?.name || '') : (ing?.name || '').toLowerCase();
    return ing && ingNorm.includes(normQ);
  });
}

function createRecipeOptionsMenu(recipe) {
  const wrap = document.createElement('div');
  wrap.className = 'recipe-options-dropdown';

  const trigger = document.createElement('button');
  trigger.className = 'btn-recipe-options-trigger';
  trigger.innerHTML = '⋮';
  trigger.setAttribute('aria-label', `Opciones para ${recipe.name}`);
  trigger.title = 'Opciones';

  const menu = document.createElement('div');
  menu.className = 'recipe-options-menu';

  if (recipe.isCustom) {
    // Receta propia: Editar y Eliminar
    const btnEdit = document.createElement('button');
    btnEdit.className = 'recipe-option-item';
    btnEdit.innerHTML = '<span>✏️</span><span>Editar receta</span>';
    btnEdit.onclick = (e) => {
      e.stopPropagation();
      menu.classList.remove('open');
      if (typeof openRecipeEditor === 'function') {
        openRecipeEditor(recipe.id);
      }
    };
    menu.appendChild(btnEdit);

    const btnDelete = document.createElement('button');
    btnDelete.className = 'recipe-option-item danger';
    btnDelete.innerHTML = '<span>🗑️</span><span>Eliminar receta</span>';
    btnDelete.onclick = (e) => {
      e.stopPropagation();
      menu.classList.remove('open');
      if (confirm(`¿Deseas eliminar definitivamente "${recipe.name}"? Esta acción no se puede deshacer.`)) {
        window.DB.deleteCustomRecipe(recipe.id);
        renderRecipesScreen();
        if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
        if (typeof showToast === 'function') showToast('🗑️ Receta eliminada');
      }
    };
    menu.appendChild(btnDelete);
  } else {
    // Receta predeterminada del sistema: Ocultar / Mostrar
    const isHidden = window.DB.isRecipeHidden ? window.DB.isRecipeHidden(recipe.id) : false;
    const btnHide = document.createElement('button');
    btnHide.className = `recipe-option-item ${isHidden ? '' : 'danger'}`;
    btnHide.innerHTML = isHidden 
      ? '<span>👁️</span><span>Restaurar receta</span>' 
      : '<span>👁️</span><span>Ocultar del catálogo</span>';
    
    btnHide.onclick = (e) => {
      e.stopPropagation();
      menu.classList.remove('open');
      const action = isHidden ? 'restaurar' : 'ocultar';
      if (confirm(`¿Deseas ${action} "${recipe.name}" de tu catálogo?`)) {
        const nowHidden = window.DB.toggleHideRecipe(recipe.id);
        renderRecipesScreen();
        if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
        if (typeof showToast === 'function') {
          showToast(nowHidden ? '👁️ Receta ocultada' : '✅ Receta restaurada');
        }
      }
    };
    menu.appendChild(btnHide);
  }

  trigger.onclick = (e) => {
    e.stopPropagation();
    // Cerrar otros menús abiertos
    document.querySelectorAll('.recipe-options-menu.open').forEach(m => {
      if (m !== menu) m.classList.remove('open');
    });
    menu.classList.toggle('open');
  };

  wrap.appendChild(trigger);
  wrap.appendChild(menu);
  return wrap;
}

function renderRecipesScreen() {
  const container = document.getElementById('recipes-list');
  if (!container) return;
  container.innerHTML = '';

  const toggleBtn = document.getElementById('btn-recipes-view');
  if (toggleBtn) updateRecipesViewToggleBtn(toggleBtn);

  // Comprobar si hay recetas ocultas
  const hiddenCount = (window.DB.state.userPreferences && window.DB.state.userPreferences.hiddenRecipes) 
    ? window.DB.state.userPreferences.hiddenRecipes.length 
    : 0;

  if (hiddenCount > 0) {
    const hiddenBar = document.createElement('div');
    hiddenBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 14px; border-radius:12px; margin-bottom:14px; border:1px solid #e2e8f0; font-size:0.82rem;';
    hiddenBar.innerHTML = `
      <span style="color:#64748b; font-weight:600;">👁️ ${hiddenCount} receta${hiddenCount > 1 ? 's' : ''} oculta${hiddenCount > 1 ? 's' : ''}</span>
      <button type="button" style="background:none; border:none; color:var(--primary-600, #059669); font-weight:700; cursor:pointer; font-size:0.82rem;" id="btn-toggle-hidden-recipes">
        ${_showHiddenRecipes ? 'Ocultar estas recetas' : 'Mostrar ocultas'}
      </button>
    `;
    container.appendChild(hiddenBar);

    const btnToggle = hiddenBar.querySelector('#btn-toggle-hidden-recipes');
    if (btnToggle) {
      btnToggle.onclick = () => {
        _showHiddenRecipes = !_showHiddenRecipes;
        renderRecipesScreen();
      };
    }
  }

  const mealTypes = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'];
  let totalShown = 0;

  const allRecipesPool = _showHiddenRecipes 
    ? (window.DB.allRecipes || []) 
    : (window.DB.recipes || []);

  mealTypes.forEach(type => {
    const allForType = allRecipesPool.filter(r => (r.meal_type || '').toLowerCase() === type);
    const list = allForType.filter(recipeMatchesSearch);
    if (!list.length) return;

    totalShown += list.length;
    const section = document.createElement('section');
    section.className = 'content-section';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = (typeof getMealTypeEmoji === 'function' ? getMealTypeEmoji(type) : '') + ' ' + type.charAt(0).toUpperCase() + type.slice(1);
    section.appendChild(title);

    if (_recipesViewMode === 'cards') {
      // Vista Tarjetas
      const row = document.createElement('div');
      row.className = 'cards-row';

      list.forEach(recipe => {
        const macros = calcRecipeMacros(recipe.id);
        const pantryCheck = checkPantryForRecipe(recipe.id);
        const card = buildRecipeCard({ ...recipe, macros, pantryCheck }, pantryCheck.canCook);

        card.style.position = 'relative';

        // Badge propia si aplica (en la línea de tipo de comida, sin empujar el título ni cambiar la altura de la tarjeta)
        if (recipe.isCustom) {
          const typeEl = card.querySelector('.recipe-meal-type');
          if (typeEl) {
            const badge = document.createElement('span');
            badge.className = 'badge-own-recipe';
            badge.innerHTML = '✨ Propia';
            typeEl.appendChild(badge);
          }
        }

        // Menú de Opciones
        const optionsMenu = createRecipeOptionsMenu(recipe);
        card.appendChild(optionsMenu);

        row.appendChild(card);
      });
      section.appendChild(row);
    } else {
      // Vista Lista Compacta
      const compactList = document.createElement('div');
      compactList.className = 'recipes-compact-list';

      list.forEach(recipe => {
        const macros = calcRecipeMacros(recipe.id);
        const pantryCheck = checkPantryForRecipe(recipe.id);
        const canCook = pantryCheck.canCook;
        const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
          ? window.DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipe.id)
          : [];
        const isRegistered = todayLogs.length > 0;
        const logCount = todayLogs.length;

        const statusClass = isRegistered ? 'registered' : canCook ? 'can-cook' : 'needs-buy';

        const item = document.createElement('div');
        item.className = `recipe-compact-item ${statusClass}`;
        item.dataset.recipeId = recipe.id;
        item.style.position = 'relative';

        const emoji = typeof getMealTypeEmoji === 'function' ? getMealTypeEmoji(recipe.meal_type) : '🍽️';
        item.innerHTML = `
          <div class="recipe-compact-emoji">${emoji}</div>
          <div class="recipe-compact-info">
            <div class="recipe-compact-name">
              ${recipe.name}
              ${recipe.isCustom ? '<span class="badge-own-recipe">✨ Propia</span>' : ''}
            </div>
            <div class="recipe-compact-chips">
              <span class="compact-chip chip-cal">🔥 ${macros.calories} kcal</span>
              <span class="compact-chip ${canCook ? 'chip-stock-ok' : 'chip-stock-miss'}">
                ${canCook ? '✓ Disponible' : `🛒 Faltan ${pantryCheck.missingIngredients.length}`}
              </span>
            </div>
          </div>
          <div class="recipe-compact-actions">
            <button class="btn-compact-log ${isRegistered ? 'registered' : canCook ? 'btn-can-cook' : 'btn-needs-buy'}" aria-label="Acción de comida">
              ${isRegistered ? `✓ Registrada ${logCount > 1 ? `(${logCount})` : ''}` : canCook ? '+ Registrar' : '🛒 Comprar'}
            </button>
          </div>
        `;

        // Menú de opciones
        const optionsMenu = createRecipeOptionsMenu(recipe);
        item.querySelector('.recipe-compact-actions').appendChild(optionsMenu);

        item.addEventListener('click', (e) => {
          if (e.target.closest('button') || e.target.closest('.recipe-options-dropdown')) return;
          if (typeof openRecipeDetail === 'function') {
            openRecipeDetail(recipe);
          }
        });

        const logBtn = item.querySelector('.btn-compact-log');
        if (logBtn) {
          logBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isRegistered) {
              removeMealLog(recipe.id, recipe.name);
            } else if (canCook) {
              logMeal(recipe.id);
            } else {
              const pantryTab = document.querySelector('[data-screen="pantry"]');
              if (pantryTab) pantryTab.click();
            }
          });
        }

        compactList.appendChild(item);
      });
      section.appendChild(compactList);
    }

    container.appendChild(section);
  });

  if (totalShown === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.padding = '48px 20px';
    empty.innerHTML = `
      <div class="empty-icon">🔍</div>
      <p>${_recipesSearchQuery ? `No se encontraron recetas con "${_recipesSearchQuery}"` : 'No hay recetas disponibles.'}</p>
      <button type="button" class="btn-create-recipe-pill" onclick="openRecipeEditor()" style="margin-top: 14px;">
        + Crear tu primera receta
      </button>
    `;
    container.appendChild(empty);
  }

  if (typeof cleanupAnimationClasses === 'function') {
    cleanupAnimationClasses();
  }
}

function updateRecipeCardState(recipeId) {
  const cards = document.querySelectorAll(`.card-recipe[data-recipe-id="${recipeId}"]`);
  cards.forEach(card => {
    const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
      ? window.DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipeId)
      : [];
    const logCount = todayLogs.length;
    const isRegistered = logCount > 0;
    const pantryCheck = checkPantryForRecipe(recipeId);
    const canCook = pantryCheck.canCook;

    card.classList.toggle('registered', isRegistered);

    const btn = card.querySelector('.btn-log-recipe');
    if (btn) {
      btn.classList.toggle('registered', isRegistered);
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      if (isRegistered) {
        newBtn.textContent = `✓ Registrada ${logCount > 1 ? `(${logCount})` : ''}`;
        newBtn.setAttribute('aria-label', `Registrada`);
        newBtn.addEventListener('click', e => {
          e.stopPropagation();
          removeMealLog(recipeId, window.DB.getRecipeById(recipeId).name);
        });
      } else if (canCook) {
        newBtn.textContent = '✓ Registrar comida';
        newBtn.setAttribute('aria-label', `Registrar`);
        newBtn.addEventListener('click', e => {
          e.stopPropagation();
          logMeal(recipeId);
        });
      } else {
        newBtn.textContent = '🛒 Ir a Despensa';
        newBtn.setAttribute('aria-label', `Ir a Despensa`);
        newBtn.addEventListener('click', e => {
          e.stopPropagation();
          document.querySelector('[data-screen="pantry"]').click();
        });
      }
      newBtn.classList.add('btn-pop-feedback');
      setTimeout(() => newBtn.classList.remove('btn-pop-feedback'), 400);
    }
  });

  const compactItems = document.querySelectorAll(`.recipe-compact-item[data-recipe-id="${recipeId}"]`);
  compactItems.forEach(item => {
    const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
      ? window.DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipeId)
      : [];
    const logCount = todayLogs.length;
    const isRegistered = logCount > 0;
    const pantryCheck = checkPantryForRecipe(recipeId);
    const canCook = pantryCheck.canCook;

    item.classList.remove('registered', 'can-cook', 'needs-buy');
    item.classList.add(isRegistered ? 'registered' : canCook ? 'can-cook' : 'needs-buy');

    const logBtn = item.querySelector('.btn-compact-log');
    if (logBtn) {
      logBtn.className = `btn-compact-log ${isRegistered ? 'registered' : canCook ? 'btn-can-cook' : 'btn-needs-buy'}`;
      if (isRegistered) {
        logBtn.textContent = `✓ Registrada ${logCount > 1 ? `(${logCount})` : ''}`;
      } else if (canCook) {
        logBtn.textContent = '+ Registrar';
      } else {
        logBtn.textContent = '🛒 Comprar';
      }
      logBtn.classList.add('btn-pop-feedback');
      setTimeout(() => logBtn.classList.remove('btn-pop-feedback'), 400);
    }
  });
}
