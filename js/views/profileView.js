// ============================================================
// profileView.js ? Configuraci?n, Preferencias y Gesti?n
// ============================================================

function renderProfileScreen() {
  // ?? Ingredientes no deseados seleccionados (chips en la parte superior) ??
  const selectedContainer = document.getElementById('dislikes-selected');
  if (selectedContainer) {
    selectedContainer.innerHTML = '';
    const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
    const dislikes = prefs.dislikedIngredients || prefs.disliked_ingredients || [];

    if (dislikes.length === 0) {
      const noDislikes = document.createElement('p');
      noDislikes.className = 'no-dislikes-msg';
      noDislikes.textContent = 'Ninguno excluido. Todas las recetas se sugerir\u00E1n.';
      selectedContainer.appendChild(noDislikes);
    } else {
      const chipsWrap = document.createElement('div');
      chipsWrap.className = 'dislikes-chips';
      dislikes.forEach(ingId => {
        const ing = window.DB.getIngredientById(ingId);
        if (!ing) return;
        const chip = document.createElement('span');
        chip.className = 'dislike-chip';
        chip.innerHTML = `${ing.name} <span class="chip-remove" role="button" aria-label="Quitar ${ing.name}">\u00D7</span>`;
        chip.querySelector('.chip-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          window.DB.toggleDislikedIngredient(ingId);
          renderProfileScreen();
          if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
          if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
          showToast('Preferencias actualizadas \u{1F957}');
        });
        chipsWrap.appendChild(chip);
      });
      selectedContainer.appendChild(chipsWrap);
    }
  }

  // ?? Lista completa de ingredientes dentro del desplegable ??
  const container = document.getElementById('dislikes-list');
  if (container) {
    container.innerHTML = '';
    const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
    const dislikes = prefs.dislikedIngredients || prefs.disliked_ingredients || [];
    const ingredientsList = window.DB.ingredients || (window.DB.state && window.DB.state.ingredients) || [];

    ingredientsList.forEach(ing => {
      const isDisliked = dislikes.includes(ing.id);
      const label = document.createElement('label');
      label.className = `dislike-item ${isDisliked ? 'disliked' : ''}`;
      label.innerHTML = `
        <input type="checkbox" class="dislike-check" data-id="${ing.id}" ${isDisliked ? 'checked' : ''} aria-label="${ing.name}">
        <span class="dislike-name">${ing.name}</span>
        <span class="dislike-cat">${ing.category || ''}</span>
      `;
      label.querySelector('.dislike-check').addEventListener('change', () => {
        window.DB.toggleDislikedIngredient(ing.id);
        renderProfileScreen();
        if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
        if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
        showToast('Preferencias actualizadas \u{1F957}');
      });
      container.appendChild(label);
    });
  }

  // L?quidos
  renderLiquidsManager();

  // Horas de comida
  renderMealHoursEditor();

  // Metas nutricionales
  renderGoalsSettings();

  // Estado de API Key de IA
  renderAIKeySettings();
}

function renderMealHoursEditor() {
  const container = document.getElementById('meal-hours-list');
  if (!container) return;
  container.innerHTML = '';

  const hours = getMealHours();

  Object.entries(MEAL_LABELS).forEach(([type, meta]) => {
    const slotHours = hours[type] || { start: 8, end: 12 };
    const start = slotHours.start;
    const end = slotHours.end;

    const row = document.createElement('div');
    row.className = 'meal-hour-row';
    row.innerHTML = `
      <div class="meal-hour-info">
        <span class="meal-hour-emoji">${meta.emoji}</span>
        <span class="meal-hour-label">${meta.label}</span>
      </div>
      <div class="meal-hour-controls">
        <select class="meal-hour-select" data-meal="${type}" data-field="start" aria-label="Inicio ${meta.label}">
          ${hourOptions(start)}
        </select>
        <span class="meal-hour-sep">a</span>
        <select class="meal-hour-select" data-meal="${type}" data-field="end" aria-label="Fin ${meta.label}">
          ${hourOptions(end)}
        </select>
      </div>
    `;
    container.appendChild(row);
  });

  // Eventos de cambio
  container.querySelectorAll('.meal-hour-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const meal  = sel.dataset.meal;
      const field = sel.dataset.field;
      const val   = parseInt(sel.value, 10);

      if (!window.DB.userPreferences.mealHours) window.DB.userPreferences.mealHours = getMealHours();
      if (!window.DB.userPreferences.mealHours[meal]) window.DB.userPreferences.mealHours[meal] = { start: 8, end: 12 };
      window.DB.userPreferences.mealHours[meal][field] = val;
      window.DB.userPreferences.meal_hours = window.DB.userPreferences.mealHours;
      persistState();

      if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
      showToast(`\u23F0 Horario de ${MEAL_LABELS[meal].label} actualizado`);
    });
  });
}

function hourOptions(selected) {
  let html = '';
  for (let h = 0; h < 24; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    html += `<option value="${h}" ${h === selected ? 'selected' : ''}>${label}</option>`;
  }
  return html;
}

function renderLiquidsManager() {
  const list = document.getElementById('liquids-manage-list');
  if (!list) return;
  list.innerHTML = '';

  const liquidsList = window.DB.liquids || (window.DB.state && window.DB.state.liquids) || [];
  if (!liquidsList.length) {
    list.innerHTML = '<p style="font-size:0.78rem;color:var(--gray-400);text-align:center;padding:12px 0">Sin l\u00EDquidos registrados.</p>';
    return;
  }

  liquidsList.forEach(liq => {
    const item = document.createElement('div');
    item.className = 'liquid-manage-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <span class="liquid-manage-icon">${liq.icon || '\u{1F4A7}'}</span>
      <div class="liquid-manage-info">
        <div class="liquid-manage-name">${liq.name}</div>
        <div class="liquid-manage-type">${liq.type || 'Agua'}</div>
      </div>
      <button class="btn-delete-liquid" data-id="${liq.id}"
              aria-label="Eliminar ${liq.name}" title="Eliminar">\u00D7</button>
    `;
    item.querySelector('.btn-delete-liquid').addEventListener('click', () => {
      deleteLiquid(liq.id);
    });
    list.appendChild(item);
  });
}

function deleteLiquid(liquidId) {
  const liquidsList = window.DB.liquids || (window.DB.state && window.DB.state.liquids) || [];
  const liq  = liquidsList.find(l => l.id === liquidId);
  const name = liq ? liq.name : 'este l\u00EDquido';
  if (!confirm(`\u00BFDeseas eliminar "${name}"?`)) return;

  const state = window.DB.state;
  if (state.liquids) {
    state.liquids = state.liquids.filter(l => l.id !== liquidId);
  }
  if (state.food_logs) {
    state.food_logs = state.food_logs.filter(l => !(l.type === 'liquid' && l.reference_id === liquidId));
  }
  if (state.foodLogs) {
    state.foodLogs = state.foodLogs.filter(l => !(l.type === 'liquid' && l.reference_id === liquidId));
  }
  persistState();
  renderLiquidsManager();
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
  showToast('\u{1F5D1}\uFE0F L\u00EDquido eliminado');
}

function initLiquidForm() {
  const form = document.getElementById('liquid-add-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const icon = document.getElementById('liq-icon').value.trim() || '\u{1F4A7}';
    const name = document.getElementById('liq-name').value.trim();
    const type = document.getElementById('liq-type').value || 'Agua';

    if (!name) {
      showToast('\u26A0\uFE0F Escribe un nombre para el l\u00EDquido');
      document.getElementById('liq-name').focus();
      return;
    }

    const newLiquid = {
      id: `liq_${Date.now()}`,
      name,
      type,
      icon,
      goal_ml: 2000,
      current_ml: 0
    };

    if (!window.DB.state.liquids) window.DB.state.liquids = [];
    window.DB.state.liquids.push(newLiquid);
    persistState();

    document.getElementById('liq-icon').value = '';
    document.getElementById('liq-name').value = '';
    document.getElementById('liq-type').value = 'water';

    renderLiquidsManager();
    if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
    showToast(`\u2705 "${name}" a\u00F1adido`);
  });
}

function deleteRecipe(recipeId) {
  const recipesList = window.DB.recipes || (window.DB.state && window.DB.state.recipes) || [];
  const recipe = recipesList.find(r => r.id === recipeId);
  const name   = recipe ? recipe.name : 'esta receta';
  if (!confirm(`\u00BFDeseas eliminar "${name}"? Esta acci\u00F3n no se puede deshacer.`)) return;

  const state = window.DB.state;
  state.recipes = (state.recipes || []).filter(r => r.id !== recipeId);
  state.recipe_ingredients = (state.recipe_ingredients || []).filter(ri => ri.recipe_id !== recipeId);
  if (state.foodLogs) state.foodLogs = state.foodLogs.filter(l => l.reference_id !== recipeId);
  if (state.food_logs) state.food_logs = state.food_logs.filter(l => l.reference_id !== recipeId);
  persistState();

  if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
  showToast('\u{1F5D1}\uFE0F Receta eliminada');
}

function initImport() {
  const fileInput  = document.getElementById('json-file-input');
  const dropZone   = document.getElementById('import-drop-zone');
  const statusEl   = document.getElementById('import-status');
  const browseBtn  = document.getElementById('btn-browse-file');

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) processImportFile(file, statusEl);
      fileInput.value = '';
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) processImportFile(file, statusEl);
    });
  }
}

function processImportFile(file, statusEl) {
  if (!file.name.endsWith('.json')) {
    showImportStatus(statusEl, 'error', '\u26A0\uFE0F El archivo debe ser .json');
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      applyImportData(data, statusEl);
    } catch {
      showImportStatus(statusEl, 'error', '\u26A0\uFE0F JSON inv\u00E1lido. Revisa el formato.');
    }
  };
  reader.readAsText(file);
}

function applyImportData(data, statusEl) {
  const state = window.DB.state;
  let imported = [];

  if (Array.isArray(data.ingredients) && data.ingredients.length) {
    state.ingredients = data.ingredients;
    imported.push('ingredientes');

    const existingIds = new Set((state.pantry || []).map(p => p.ingredient_id));
    if (!state.pantry) state.pantry = [];
    data.ingredients.forEach(ing => {
      if (!existingIds.has(ing.id)) {
        state.pantry.push({ ingredient_id: ing.id, quantity_available: 0 });
      }
    });
    const validIds = new Set(data.ingredients.map(i => i.id));
    state.pantry = state.pantry.filter(p => validIds.has(p.ingredient_id));
  }

  if (Array.isArray(data.recipes) && data.recipes.length) {
    state.recipes = data.recipes;
    imported.push('recetas');
  }

  if (Array.isArray(data.recipe_ingredients) && data.recipe_ingredients.length) {
    state.recipe_ingredients = data.recipe_ingredients;
  }

  if (Array.isArray(data.liquids) && data.liquids.length) {
    state.liquids = data.liquids;
    imported.push('l\u00EDquidos');
  }

  if (!imported.length) {
    showImportStatus(statusEl, 'error', '\u26A0\uFE0F No se encontraron datos reconocibles.');
    return;
  }

  persistState();
  showImportStatus(statusEl, 'success', `\u2705 Importado: ${imported.join(', ')}`);

  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
  if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
  if (typeof renderPantryScreen === 'function') renderPantryScreen();
  renderProfileScreen();
}

function showImportStatus(el, type, msg) {
  if (!el) return;
  el.textContent = msg;
  el.className = `import-status ${type}`;
  setTimeout(() => { el.className = 'import-status'; }, 4000);
}

function initSettingsCardAccordions() {
  document.querySelectorAll('.settings-card').forEach(details => {
    const summary = details.querySelector('.settings-card-header');
    const body    = details.querySelector('.settings-card-body');
    const chevron = summary && summary.querySelector('.settings-card-chevron');
    if (!summary || !body) return;

    let isAnimating = false;

    summary.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (isAnimating) return;
      isAnimating = true;

      const isOpen = details.open;

      function once(fn) {
        let called = false;
        return function() { if (!called) { called = true; fn(); } };
      }

      if (isOpen) {
        if (chevron) chevron.classList.remove('open');
        body.style.overflow = 'hidden';
        body.style.height   = body.scrollHeight + 'px';
        body.style.opacity  = '1';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            body.style.transition = 'height 0.34s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.22s ease';
            body.style.height  = '0';
            body.style.opacity = '0';
          });
        });

        const onClose = once(() => {
          body.removeEventListener('transitionend', onHeightEnd);
          details.removeAttribute('open');
          body.style.cssText = '';
          isAnimating = false;
        });

        function onHeightEnd(ev) {
          if (ev.propertyName === 'height') onClose();
        }
        body.addEventListener('transitionend', onHeightEnd);
        setTimeout(onClose, 450);

      } else {
        details.setAttribute('open', '');
        const targetH = body.scrollHeight;

        body.style.overflow = 'hidden';
        body.style.height   = '0';
        body.style.opacity  = '0';

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            body.style.transition = 'height 0.34s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.26s ease 0.06s';
            body.style.height  = targetH + 'px';
            body.style.opacity = '1';
            if (chevron) chevron.classList.add('open');
          });
        });

        const onOpen = once(() => {
          body.removeEventListener('transitionend', onHeightEnd);
          body.style.cssText = '';
          isAnimating = false;
        });

        function onHeightEnd(ev) {
          if (ev.propertyName === 'height') onOpen();
        }
        body.addEventListener('transitionend', onHeightEnd);
        setTimeout(onOpen, 450);
      }
    });
  });
}

function renderGoalsSettings() {
  const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
  const goals = prefs.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };
  const fields = { calories: 'goal-calories', protein: 'goal-protein', carbs: 'goal-carbs', fat: 'goal-fat' };
  Object.entries(fields).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.value = goals[key] || '';
  });
}

function initGoalsForm() {
  const btn = document.getElementById('btn-save-goals');
  const calInput = document.getElementById('goal-calories');
  const proInput = document.getElementById('goal-protein');
  const carInput = document.getElementById('goal-carbs');
  const fatInput = document.getElementById('goal-fat');

  if (calInput && carInput && proInput && fatInput) {
    calInput.addEventListener('input', () => {
      const cals = parseInt(calInput.value, 10);
      if (cals > 0) {
        carInput.value = Math.round((cals * 0.50) / 4);
        proInput.value = Math.round((cals * 0.30) / 4);
        fatInput.value = Math.round((cals * 0.20) / 9);
      }
    });
  }

  if (!btn) return;
  btn.addEventListener('click', () => {
    const calories = parseInt(calInput.value, 10);
    let protein  = parseInt(proInput.value, 10);
    let carbs    = parseInt(carInput.value, 10);
    let fat      = parseInt(fatInput.value, 10);

    if (isNaN(calories) || calories <= 0) {
      showToast('\u26A0\uFE0F Ingresa calor\u00EDas v\u00E1lidas');
      return;
    }

    if (isNaN(protein) || isNaN(carbs) || isNaN(fat) || protein <= 0 || carbs <= 0 || fat <= 0) {
      protein = Math.round((calories * 0.30) / 4);
      carbs   = Math.round((calories * 0.40) / 4);
      fat     = Math.round((calories * 0.30) / 9);
      
      if (proInput) proInput.value = protein;
      if (carInput) carInput.value = carbs;
      if (fatInput) fatInput.value = fat;
      showToast('\u2728 Macros autocalculados');
    }
    window.DB.updateGoals({ calories, protein, carbs, fat });
    if (typeof renderDailyMacros === 'function') renderDailyMacros();
    showToast('\u{1F3AF} Metas guardadas');
  });
}

function renderAIKeySettings() {
  const prefs  = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
  const key    = prefs.geminiApiKey || prefs.gemini_api_key || '';
  const input  = document.getElementById('ai-key-input');
  const status = document.getElementById('ai-key-status');
  if (input)  input.value = key ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + key.slice(-4) : '';
  if (status) {
    status.textContent = key ? '\u2705 Clave configurada' : '\u26A0\uFE0F Sin configurar';
    status.className   = `ai-key-status ${key ? 'key-ok' : 'key-missing'}`;
  }
}

function initAIKeyForm() {
  const btn   = document.getElementById('btn-save-ai-key');
  const input = document.getElementById('ai-key-input');
  if (!btn || !input) return;

  input.addEventListener('focus', () => {
    if (input.value.startsWith('\u2022\u2022\u2022\u2022')) input.value = '';
  });

  btn.addEventListener('click', () => {
    const key = input.value.trim();
    if (!key || key.length < 10) {
      showToast('\u26A0\uFE0F Ingresa una API Key v\u00E1lida');
      return;
    }
    window.DB.updateGeminiKey(key);
    renderAIKeySettings();
    showToast('\u{1F511} API Key guardada');
  });
}
