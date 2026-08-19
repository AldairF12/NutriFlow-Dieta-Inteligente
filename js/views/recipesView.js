// ============================================================
// recipesView.js ? Cat?logo de Recetas con Toggle Cards vs Lista
// ============================================================

let _recipesViewMode = localStorage.getItem('nutriflow_recipes_view') || 'cards'; // 'cards' | 'compact'
let _recipesSearchQuery = '';

function initRecipesToolbar() {
  const toggleBtn = document.getElementById('btn-recipes-view');
  const searchInput = document.getElementById('recipes-search');

  if (toggleBtn) {
    updateRecipesViewToggleBtn(toggleBtn);
    toggleBtn.onclick = () => {
      _recipesViewMode = (_recipesViewMode === 'cards') ? 'compact' : 'cards';
      localStorage.setItem('nutriflow_recipes_view', _recipesViewMode);
      updateRecipesViewToggleBtn(toggleBtn);
      renderRecipesScreen();
    };
  }

  if (searchInput) {
    searchInput.oninput = () => {
      _recipesSearchQuery = searchInput.value.trim().toLowerCase();
      renderRecipesScreen();
    };
  }
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
  if (icon) icon.textContent = isCards ? '\u{1F4C4}' : '\u{1F5BC}\uFE0F';
  btn.title = isCards ? 'Cambiar a vista compacta de lista' : 'Cambiar a vista de tarjetas';
}

function recipeMatchesSearch(recipe) {
  if (!_recipesSearchQuery) return true;
  const nameMatch = (recipe.name || '').toLowerCase().includes(_recipesSearchQuery);
  if (nameMatch) return true;
  
  const ris = window.DB ? window.DB.getRecipeIngredients(recipe.id) : [];
  return ris.some(ri => {
    const ing = window.DB ? window.DB.getIngredientById(ri.ingredient_id) : null;
    return ing && (ing.name || '').toLowerCase().includes(_recipesSearchQuery);
  });
}

function renderRecipesScreen() {
  const container = document.getElementById('recipes-list');
  if (!container) return;
  container.innerHTML = '';

  const toggleBtn = document.getElementById('btn-recipes-view');
  if (toggleBtn) updateRecipesViewToggleBtn(toggleBtn);

  const mealTypes = ['desayuno', 'almuerzo', 'merienda', 'cena'];
  let totalShown = 0;

  mealTypes.forEach(type => {
    const allForType = (window.DB && window.DB.recipes) ? window.DB.recipes.filter(r => r.meal_type === type) : [];
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
      // ?? Vista Tarjetas ???????????????????????????????????????
      const row = document.createElement('div');
      row.className = 'cards-row';

      list.forEach(recipe => {
        const macros = calcRecipeMacros(recipe.id);
        const pantryCheck = checkPantryForRecipe(recipe.id);
        const card = buildRecipeCard({ ...recipe, macros, pantryCheck }, pantryCheck.canCook);

        // Bot?n borrar
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete-recipe';
        delBtn.title = 'Eliminar receta';
        delBtn.textContent = '\u2715';
        delBtn.setAttribute('aria-label', `Eliminar ${recipe.name}`);
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          deleteRecipe(recipe.id);
        });
        card.style.position = 'relative';
        card.appendChild(delBtn);

        row.appendChild(card);
      });
      section.appendChild(row);
    } else {
      // ?? Vista Lista Compacta (Solo kcal y disponibilidad con colores amarillo/verde) ??
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

        const emoji = typeof getMealTypeEmoji === 'function' ? getMealTypeEmoji(recipe.meal_type) : '\u{1F373}';
        item.innerHTML = `
          <div class="recipe-compact-emoji">${emoji}</div>
          <div class="recipe-compact-info">
            <div class="recipe-compact-name">${recipe.name}</div>
            <div class="recipe-compact-chips">
              <span class="compact-chip chip-cal">\u{1F525} ${macros.calories} kcal</span>
              <span class="compact-chip ${canCook ? 'chip-stock-ok' : 'chip-stock-miss'}">
                ${canCook ? '\u2713 Disponible' : `\u{1F6D2} Faltan ${pantryCheck.missingIngredients.length}`}
              </span>
            </div>
          </div>
          <div class="recipe-compact-actions">
            <button class="btn-compact-log ${isRegistered ? 'registered' : canCook ? 'btn-can-cook' : 'btn-needs-buy'}" aria-label="Acci\u00F3n de comida">
              ${isRegistered ? `\u2713 Registrada ${logCount > 1 ? `(${logCount})` : ''}` : canCook ? '+ Registrar' : '\u{1F6D2} Comprar'}
            </button>
            <button class="btn-compact-del" title="Eliminar receta" aria-label="Eliminar ${recipe.name}">\u2715</button>
          </div>
        `;

        item.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          if (typeof openRecipeDetail === 'function') {
            openRecipeDetail(recipe);
          }
        });

        const logBtn = item.querySelector('.btn-compact-log');
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

        const delBtn = item.querySelector('.btn-compact-del');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteRecipe(recipe.id);
        });

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
      <div class="empty-icon">\u{1F50D}</div>
      <p>${_recipesSearchQuery ? `No se encontraron recetas con "${_recipesSearchQuery}"` : 'No hay recetas en el cat\u00E1logo.'}</p>
    `;
    container.appendChild(empty);
  }

  cleanupAnimationClasses();
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
        newBtn.textContent = `\u2713 Registrada ${logCount > 1 ? `(${logCount})` : ''}`;
        newBtn.setAttribute('aria-label', `Registrada`);
        newBtn.addEventListener('click', e => {
          e.stopPropagation();
          removeMealLog(recipeId, window.DB.getRecipeById(recipeId).name);
        });
      } else if (canCook) {
        newBtn.textContent = '\u2713 Registrar comida';
        newBtn.setAttribute('aria-label', `Registrar`);
        newBtn.addEventListener('click', e => {
          e.stopPropagation();
          logMeal(recipeId);
        });
      } else {
        newBtn.textContent = '\u{1F6D2} Ir a Despensa';
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
        logBtn.textContent = `\u2713 Registrada ${logCount > 1 ? `(${logCount})` : ''}`;
      } else if (canCook) {
        logBtn.textContent = '+ Registrar';
      } else {
        logBtn.textContent = '\u{1F6D2} Comprar';
      }
      logBtn.classList.add('btn-pop-feedback');
      setTimeout(() => logBtn.classList.remove('btn-pop-feedback'), 400);
    }
  });
}
