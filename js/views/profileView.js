function renderProfileScreen() {
  // Ingredientes no deseados seleccionados (chips en la parte superior)
  const selectedContainer = document.getElementById('dislikes-selected');
  selectedContainer.innerHTML = '';
  
  const dislikes = DB.userPreferences.disliked_ingredients || [];
  
  if (dislikes.length === 0) {
    const noDislikes = document.createElement('p');
    noDislikes.className = 'no-dislikes-msg';
    noDislikes.textContent = 'Ninguno excluido. Todas las recetas se sugerirán.';
    selectedContainer.appendChild(noDislikes);
  } else {
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'dislikes-chips';
    dislikes.forEach(ingId => {
      const ing = DB.getIngredientById(ingId);
      if (!ing) return;
      const chip = document.createElement('span');
      chip.className = 'dislike-chip';
      chip.innerHTML = `${ing.name} <span class="chip-remove" role="button" aria-label="Quitar ${ing.name}">×</span>`;
      chip.querySelector('.chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        DB.toggleDislikedIngredient(ingId);
        renderProfileScreen();
        renderDiaryScreen(); // actualiza recetas sugeridas
        showToast('Preferencias actualizadas 🥗');
      });
      chipsWrap.appendChild(chip);
    });
    selectedContainer.appendChild(chipsWrap);
  }

  // Lista completa de ingredientes dentro del desplegable
  const container = document.getElementById('dislikes-list');
  container.innerHTML = '';

  DB.ingredients.forEach(ing => {
    const isDisliked = dislikes.includes(ing.id);
    const label = document.createElement('label');
    label.className = `dislike-item ${isDisliked ? 'disliked' : ''}`;
    label.innerHTML = `
      <input type="checkbox" class="dislike-check" data-id="${ing.id}" ${isDisliked ? 'checked' : ''} aria-label="${ing.name}">
      <span class="dislike-name">${ing.name}</span>
      <span class="dislike-cat">${ing.category}</span>
    `;
    label.querySelector('.dislike-check').addEventListener('change', () => {
      DB.toggleDislikedIngredient(ing.id);
      renderProfileScreen();
      renderDiaryScreen(); // actualiza recetas sugeridas
      showToast('Preferencias actualizadas 🥗');
    });
    container.appendChild(label);
  });

  // Líquidos
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
    const { start, end } = hours[type];

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

      if (!DB.userPreferences.meal_hours) DB.userPreferences.meal_hours = getMealHours();
      DB.userPreferences.meal_hours[meal][field] = val;
      persistState();

      renderDiaryScreen(); // actualiza el diario con los nuevos rangos
      showToast(`⏰ Horario de ${MEAL_LABELS[meal].label} actualizado`);
    });
  });
}
function hourOptions(selected) {
  let html = '';
  for (let h = 0; h < 24; h++) {
    const label = `${String(h).padStart(2,'0')}:00`;
    html += `<option value="${h}" ${h === selected ? 'selected' : ''}>${label}</option>`;
  }
  return html;
}
function renderLiquidsManager() {
  const list = document.getElementById('liquids-manage-list');
  if (!list) return;
  list.innerHTML = '';

  if (!DB.liquids.length) {
    list.innerHTML = '<p style="font-size:0.78rem;color:var(--gray-400);text-align:center;padding:12px 0">Sin líquidos registrados.</p>';
    return;
  }

  DB.liquids.forEach(liq => {
    const item = document.createElement('div');
    item.className = 'liquid-manage-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <span class="liquid-manage-icon">${liq.icon}</span>
      <div class="liquid-manage-info">
        <div class="liquid-manage-name">${liq.name}</div>
        <div class="liquid-manage-type">${liq.type}</div>
      </div>
      <button class="btn-delete-liquid" data-id="${liq.id}"
              aria-label="Eliminar ${liq.name}" title="Eliminar">×</button>
    `;
    item.querySelector('.btn-delete-liquid').addEventListener('click', () => {
      deleteLiquid(liq.id);
    });
    list.appendChild(item);
  });
}
function deleteLiquid(liquidId) {
  const liq  = DB.state.liquids.find(l => l.id === liquidId);
  const name = liq ? liq.name : 'este líquido';
  if (!confirm(`¿Eliminar "${name}"?`)) return;
  const state = DB.state;
  state.liquids = state.liquids.filter(l => l.id !== liquidId);
  // Limpiar logs de hidratación que apuntaban a este líquido
  state.food_logs = state.food_logs.filter(
    l => !(l.type === 'liquid' && l.reference_id === liquidId)
  );
  persistState();
  renderLiquidsManager();
  renderDiaryScreen(); // refresca cards de hidratación
  showToast('🗑️ Líquido eliminado');
}
function initLiquidForm() {
  const form    = document.getElementById('liquid-add-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const icon = document.getElementById('liq-icon').value.trim() || '💧';
    const name = document.getElementById('liq-name').value.trim();
    const type = document.getElementById('liq-type').value;

    if (!name) {
      showToast('⚠️ Escribe un nombre para el líquido');
      document.getElementById('liq-name').focus();
      return;
    }

    const newLiquid = {
      id:   `liq_${Date.now()}`,
      name,
      type,
      icon
    };

    DB.state.liquids.push(newLiquid);
    persistState();

    // Limpiar form
    document.getElementById('liq-icon').value = '';
    document.getElementById('liq-name').value = '';
    document.getElementById('liq-type').value = 'water';

    renderLiquidsManager();
    renderDiaryScreen();
    showToast(`✅ "${name}" añadido`);
  });
}
function deleteRecipe(recipeId) {
  const recipe = DB.recipes.find(r => r.id === recipeId);
  const name   = recipe ? recipe.name : 'esta receta';
  if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
  const state = DB.state;
  state.recipes = state.recipes.filter(r => r.id !== recipeId);
  state.recipe_ingredients = state.recipe_ingredients.filter(ri => ri.recipe_id !== recipeId);
  // Eliminar logs que referencien esta receta
  state.food_logs = state.food_logs.filter(l => l.reference_id !== recipeId);
  persistState();
  renderRecipesScreen();
  renderDiaryScreen();
  showToast('🗑️ Receta eliminada');
}
function initImport() {
  const fileInput  = document.getElementById('json-file-input');
  const dropZone   = document.getElementById('import-drop-zone');
  const statusEl   = document.getElementById('import-status');
  const browseBtn  = document.getElementById('btn-browse-file');

  browseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) processImportFile(file, statusEl);
    fileInput.value = '';
  });

  // Drag & drop
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
function processImportFile(file, statusEl) {
  if (!file.name.endsWith('.json')) {
    showImportStatus(statusEl, 'error', '⚠️ El archivo debe ser .json');
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      applyImportData(data, statusEl);
    } catch {
      showImportStatus(statusEl, 'error', '⚠️ JSON inválido. Revisa el formato.');
    }
  };
  reader.readAsText(file);
}
function applyImportData(data, statusEl) {
  const state = DB.state;
  let imported = [];

  if (Array.isArray(data.ingredients) && data.ingredients.length) {
    state.ingredients = data.ingredients;
    imported.push('ingredientes');

    // Actualizar despensa: agregar nuevos, conservar existentes
    const existingIds = new Set(state.pantry.map(p => p.ingredient_id));
    data.ingredients.forEach(ing => {
      if (!existingIds.has(ing.id)) {
        state.pantry.push({ ingredient_id: ing.id, quantity_available: 0 });
      }
    });
    // Quitar entradas de despensa que ya no tienen ingrediente
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
    imported.push('líquidos');
  }

  if (!imported.length) {
    showImportStatus(statusEl, 'error', '⚠️ No se encontraron datos reconocibles.');
    return;
  }

  persistState();
  showImportStatus(statusEl, 'success',
    `✅ Importado: ${imported.join(', ')}`);

  // Re-render todo
  renderDiaryScreen();
  renderRecipesScreen();
  renderPantryScreen();
  renderProfileScreen();
}
function showImportStatus(el, type, msg) {
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

      // Helper: llama a fn una sola vez (evita doble disparo transitionend + setTimeout)
      function once(fn) {
        let called = false;
        return function() { if (!called) { called = true; fn(); } };
      }

      if (isOpen) {
        // ── CERRAR ──────────────────────────────────────────────────
        if (chevron) chevron.classList.remove('open');

        // 1. Fija altura actual y overflow para que el browser tenga punto de partida
        body.style.overflow = 'hidden';
        body.style.height   = body.scrollHeight + 'px';
        body.style.opacity  = '1';

        // 2. Doble rAF: primer frame aplica la altura fija al layout,
        //    segundo inicia la transición (garantiza que el browser ve el cambio)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            body.style.transition = 'height 0.34s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.22s ease';
            body.style.height  = '0';
            body.style.opacity = '0';
          });
        });

        // 3. Al terminar la transición de HEIGHT (no opacity): limpiamos y quitamos [open]
        const onClose = once(() => {
          body.removeEventListener('transitionend', onHeightEnd);
          details.removeAttribute('open');
          body.style.cssText = '';
          isAnimating = false;
        });

        // Listener nombrado — se puede remover manualmente (no { once:true })
        function onHeightEnd(ev) {
          if (ev.propertyName === 'height') onClose();
        }
        body.addEventListener('transitionend', onHeightEnd);
        setTimeout(onClose, 450); // fallback por si transitionend no dispara

      } else {
        // ── ABRIR ────────────────────────────────────────────────────
        // 1. Pone [open] para que el body sea visible (nativo <details>)
        details.setAttribute('open', '');

        // 2. Mide la altura natural del contenido con [open] ya activo
        const targetH = body.scrollHeight;

        // 3. Congela en 0 antes de que el browser pinte
        body.style.overflow = 'hidden';
        body.style.height   = '0';
        body.style.opacity  = '0';

        // 4. Doble rAF: garantiza que el browser aplica el estado inicial
        //    antes de iniciar la transición
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            body.style.transition = 'height 0.34s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.26s ease 0.06s';
            body.style.height  = targetH + 'px';
            body.style.opacity = '1';
            if (chevron) chevron.classList.add('open');
          });
        });

        // 5. Al terminar HEIGHT: quita inline styles para que el contenido
        //    pueda redimensionarse libremente después
        const onOpen = once(() => {
          body.removeEventListener('transitionend', onHeightEnd);
          body.style.cssText = '';
          isAnimating = false;
        });

        function onHeightEnd(ev) {
          if (ev.propertyName === 'height') onOpen();
        }
        body.addEventListener('transitionend', onHeightEnd);
        setTimeout(onOpen, 450); // fallback
      }
    });
  });
}
function renderGoalsSettings() {
  const goals = DB.userPreferences.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };
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

  if (calInput) {
    calInput.addEventListener('input', () => {
      const cals = parseInt(calInput.value, 10);
      if (cals > 0) {
        carInput.value = Math.round((cals * 0.50) / 4); // 50% carbos (4 kcal/g)
        proInput.value = Math.round((cals * 0.30) / 4); // 30% protein (4 kcal/g)
        fatInput.value = Math.round((cals * 0.20) / 9); // 20% grasas (9 kcal/g)
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
      showToast('⚠️ Ingresa calorías válidas');
      return;
    }

    // Autocompletar si alguno está vacío o es inválido
    if (isNaN(protein) || isNaN(carbs) || isNaN(fat) || protein <= 0 || carbs <= 0 || fat <= 0) {
      protein = Math.round((calories * 0.30) / 4); // 30%
      carbs   = Math.round((calories * 0.40) / 4); // 40%
      fat     = Math.round((calories * 0.30) / 9); // 30%
      
      proInput.value = protein;
      carInput.value = carbs;
      fatInput.value = fat;
      showToast('✨ Macros autocalculados');
    }
    DB.updateGoals({ calories, protein, carbs, fat });
    showToast('🎯 Metas guardadas');
  });
}
function renderAIKeySettings() {
  const key    = DB.userPreferences.gemini_api_key || '';
  const input  = document.getElementById('ai-key-input');
  const status = document.getElementById('ai-key-status');
  if (input)  input.value = key ? '••••••••' + key.slice(-4) : '';
  if (status) {
    status.textContent = key ? '✅ Clave configurada' : '⚠️ Sin configurar';
    status.className   = `ai-key-status ${key ? 'key-ok' : 'key-missing'}`;
  }
}
function initAIKeyForm() {
  const btn   = document.getElementById('btn-save-ai-key');
  const input = document.getElementById('ai-key-input');
  if (!btn || !input) return;

  // Al hacer focus limpiar el valor enmascarado para que el usuario pueda escribir
  input.addEventListener('focus', () => {
    if (input.value.startsWith('••••')) input.value = '';
  });

  btn.addEventListener('click', () => {
    const key = input.value.trim();
    if (!key || key.length < 10) {
      showToast('⚠️ Ingresa una API Key válida');
      return;
    }
    DB.updateGeminiKey(key);
    renderAIKeySettings();
    showToast('🔑 API Key guardada');
  });
}