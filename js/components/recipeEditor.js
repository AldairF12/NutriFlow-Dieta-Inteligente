// ============================================================
// recipeEditor.js — Modal Editor de Recetas y Selector de Ingredientes
// ============================================================

let _editingRecipeId = null;
let _recipeDraft = {
  name: '',
  meal_type: 'desayuno',
  instructions: '',
  ingredients: [] // array of { ingredient_id, quantity }
};

let _pickerSearchQuery = '';
let _isCreatingCustomIngredient = false;

function openRecipeEditor(recipeId = null) {
  _editingRecipeId = recipeId;
  
  if (recipeId) {
    const existing = window.DB.getRecipeById(recipeId);
    if (!existing) {
      if (typeof showToast === 'function') showToast('⚠️ Receta no encontrada');
      return;
    }
    const ris = window.DB.getRecipeIngredients(recipeId);
    _recipeDraft = {
      name: existing.name || '',
      meal_type: (existing.meal_type || 'desayuno').toLowerCase(),
      instructions: existing.instructions || '',
      ingredients: ris.map(ri => ({ ingredient_id: ri.ingredient_id, quantity: ri.quantity || 100 }))
    };
  } else {
    _recipeDraft = {
      name: '',
      meal_type: 'desayuno',
      instructions: '',
      ingredients: []
    };
  }

  const modal = document.getElementById('recipe-editor-modal');
  const overlay = document.getElementById('modal-overlay');
  if (!modal || !overlay) return;

  const titleEl = document.getElementById('recipe-editor-title');
  if (titleEl) {
    titleEl.textContent = _editingRecipeId ? '✏️ Editar Receta' : '✨ Nueva Receta';
  }

  const nameInput = document.getElementById('recipe-editor-name');
  if (nameInput) nameInput.value = _recipeDraft.name;

  const instInput = document.getElementById('recipe-editor-instructions');
  if (instInput) instInput.value = _recipeDraft.instructions;

  // Reset any manual inline drag transforms
  modal.style.transform = '';
  modal.style.transition = '';
  overlay.style.opacity = '';
  overlay.style.transition = '';

  // Set active meal type pill
  updateMealTypePillsUI();

  // Render selected ingredients list
  renderRecipeEditorIngredients();

  // Update live macros summary
  updateRecipeEditorMacros();

  // Open modal
  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRecipeEditor() {
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }

  const modal = document.getElementById('recipe-editor-modal');
  const overlay = document.getElementById('modal-overlay');
  if (modal) {
    modal.classList.remove('open');
    modal.style.transform = '';
    modal.style.transition = '';
  }
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.opacity = '';
    overlay.style.transition = '';
  }
  document.body.style.overflow = '';
}

function updateMealTypePillsUI() {
  const pills = document.querySelectorAll('.recipe-meal-type-pill');
  pills.forEach(pill => {
    const type = pill.dataset.type;
    pill.classList.toggle('active', type === _recipeDraft.meal_type);
  });
}

function renderRecipeEditorIngredients() {
  const container = document.getElementById('recipe-editor-ingredients-list');
  const emptyHint = document.getElementById('recipe-editor-ingredients-empty');
  if (!container) return;

  container.innerHTML = '';

  if (_recipeDraft.ingredients.length === 0) {
    if (emptyHint) emptyHint.style.display = 'block';
    return;
  }
  if (emptyHint) emptyHint.style.display = 'none';

  _recipeDraft.ingredients.forEach((item, index) => {
    const ing = window.DB.getIngredientById(item.ingredient_id);
    if (!ing) return;

    const row = document.createElement('div');
    row.className = 'editor-ingredient-row';

    const factor = (item.quantity || 100) / 100;
    const cal = Math.round((ing.calories_per_100g || 0) * factor);
    const prot = ((ing.protein_per_100g || 0) * factor).toFixed(1);

    row.innerHTML = `
      <div class="editor-ing-main">
        <span class="editor-ing-emoji">${getCategoryEmoji(ing.category)}</span>
        <div class="editor-ing-details">
          <span class="editor-ing-name">${ing.name}</span>
          <span class="editor-ing-meta">${cal} kcal • ${prot}g prot</span>
        </div>
      </div>
      <div class="editor-ing-qty-wrap">
        <button type="button" class="btn-qty-step" data-action="minus" data-idx="${index}">−</button>
        <div class="editor-ing-input-group">
          <input type="number" class="editor-ing-qty-input" data-idx="${index}" value="${item.quantity}" min="1" max="5000" step="5" />
          <span class="editor-ing-unit">g</span>
        </div>
        <button type="button" class="btn-qty-step" data-action="plus" data-idx="${index}">+</button>
      </div>
      <button type="button" class="btn-remove-ing" data-idx="${index}" title="Quitar ingrediente" aria-label="Quitar ingrediente">✕</button>
    `;

    // Listeners for quantity change
    const qtyInput = row.querySelector('.editor-ing-qty-input');
    if (qtyInput) {
      qtyInput.oninput = (e) => {
        const val = Math.max(1, parseInt(e.target.value, 10) || 0);
        _recipeDraft.ingredients[index].quantity = val;
        updateRecipeEditorMacros();
        const meta = row.querySelector('.editor-ing-meta');
        if (meta) {
          const f = val / 100;
          meta.textContent = `${Math.round((ing.calories_per_100g || 0) * f)} kcal • ${((ing.protein_per_100g || 0) * f).toFixed(1)}g prot`;
        }
      };
    }

    const btnMinus = row.querySelector('[data-action="minus"]');
    const btnPlus = row.querySelector('[data-action="plus"]');
    if (btnMinus) {
      btnMinus.onclick = () => {
        const cur = _recipeDraft.ingredients[index].quantity || 100;
        const next = Math.max(5, cur - 10);
        _recipeDraft.ingredients[index].quantity = next;
        if (qtyInput) qtyInput.value = next;
        updateRecipeEditorMacros();
        renderRecipeEditorIngredients();
      };
    }
    if (btnPlus) {
      btnPlus.onclick = () => {
        const cur = _recipeDraft.ingredients[index].quantity || 100;
        const next = cur + 10;
        _recipeDraft.ingredients[index].quantity = next;
        if (qtyInput) qtyInput.value = next;
        updateRecipeEditorMacros();
        renderRecipeEditorIngredients();
      };
    }

    const btnRemove = row.querySelector('.btn-remove-ing');
    if (btnRemove) {
      btnRemove.onclick = () => {
        _recipeDraft.ingredients.splice(index, 1);
        renderRecipeEditorIngredients();
        updateRecipeEditorMacros();
      };
    }

    container.appendChild(row);
  });
}

function updateRecipeEditorMacros() {
  let calories = 0, protein = 0, carbs = 0, fat = 0;

  _recipeDraft.ingredients.forEach(item => {
    const ing = window.DB.getIngredientById(item.ingredient_id);
    if (!ing) return;
    const factor = (item.quantity || 100) / 100;
    calories += (ing.calories_per_100g || 0) * factor;
    protein += (ing.protein_per_100g || 0) * factor;
    carbs += (ing.carbs_per_100g || 0) * factor;
    fat += (ing.fat_per_100g || 0) * factor;
  });

  const calEl = document.getElementById('editor-macro-cal');
  const protEl = document.getElementById('editor-macro-prot');
  const carbEl = document.getElementById('editor-macro-carb');
  const fatEl = document.getElementById('editor-macro-fat');

  if (calEl) calEl.textContent = `${Math.round(calories)} kcal`;
  if (protEl) protEl.textContent = `${protein.toFixed(1)}g`;
  if (carbEl) carbEl.textContent = `${carbs.toFixed(1)}g`;
  if (fatEl) fatEl.textContent = `${fat.toFixed(1)}g`;
}

function getCategoryEmoji(cat) {
  if (!cat) return '🥗';
  const lower = cat.toLowerCase();
  if (lower.includes('prot') || lower.includes('carne') || lower.includes('pollo') || lower.includes('pescado') || lower.includes('huevo') || lower.includes('atún')) return '🍗';
  if (lower.includes('verd') || lower.includes('espinaca') || lower.includes('tomate') || lower.includes('lechuga') || lower.includes('cebolla') || lower.includes('pepino')) return '🥦';
  if (lower.includes('frut') || lower.includes('manzana') || lower.includes('fresa') || lower.includes('plátano')) return '🍎';
  if (lower.includes('cer') || lower.includes('pan') || lower.includes('avena') || lower.includes('arroz') || lower.includes('papa')) return '🌾';
  if (lower.includes('lác') || lower.includes('leche') || lower.includes('yogur') || lower.includes('queso')) return '🥛';
  if (lower.includes('gras') || lower.includes('aceite') || lower.includes('aguacate') || lower.includes('maní') || lower.includes('almendra')) return '🥑';
  if (lower.includes('legum') || lower.includes('garbanzo') || lower.includes('lenteja') || lower.includes('hummus')) return '🫘';
  if (lower.includes('espec') || lower.includes('canela')) return '🌿';
  return '🥗';
}

// ============================================================
// SUB-MODAL SELECTOR DE INGREDIENTES
// ============================================================

function openIngredientPicker() {
  _pickerSearchQuery = '';
  _isCreatingCustomIngredient = false;

  const modal = document.getElementById('ingredient-picker-modal');
  const overlay = document.getElementById('ingredient-picker-overlay');
  if (!modal || !overlay) return;

  const searchInput = document.getElementById('picker-search-input');
  if (searchInput) searchInput.value = '';

  const formWrap = document.getElementById('custom-ing-form-wrap');
  if (formWrap) formWrap.style.display = 'none';

  // Reset any manual inline drag transforms
  modal.style.transform = '';
  modal.style.transition = '';
  overlay.style.opacity = '';
  overlay.style.transition = '';

  renderIngredientPickerList();

  overlay.classList.add('open');
  modal.classList.add('open');
}

function closeIngredientPicker() {
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }

  const modal = document.getElementById('ingredient-picker-modal');
  const overlay = document.getElementById('ingredient-picker-overlay');
  if (modal) {
    modal.classList.remove('open');
    modal.style.transform = '';
    modal.style.transition = '';
  }
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.opacity = '';
    overlay.style.transition = '';
  }
}

function renderIngredientPickerList() {
  const container = document.getElementById('picker-ingredients-list');
  if (!container) return;
  container.innerHTML = '';

  const allIngredients = window.DB.ingredients || [];
  const query = typeof normalizeSearchText === 'function' ? normalizeSearchText(_pickerSearchQuery) : _pickerSearchQuery.toLowerCase().trim();

  const filtered = allIngredients.filter(ing => {
    const nameNorm = typeof normalizeSearchText === 'function' ? normalizeSearchText(ing.name || '') : (ing.name || '').toLowerCase();
    const catNorm = typeof normalizeSearchText === 'function' ? normalizeSearchText(ing.category || '') : (ing.category || '').toLowerCase();
    return nameNorm.includes(query) || catNorm.includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="editor-ingredients-empty-hint" style="padding: 24px 16px;">
        <span style="font-size: 1.5rem; display: block; margin-bottom: 6px;">🔍</span>
        <p style="margin: 0 0 10px; color: var(--text-main); font-weight: 600;">No encontramos "${_pickerSearchQuery}"</p>
        <button type="button" class="btn-picker-new-custom" id="btn-show-custom-ing-form" style="padding: 8px 16px;">
          ✨ Crear ingrediente "${_pickerSearchQuery || 'nuevo'}"
        </button>
      </div>
    `;
    const btnCreate = document.getElementById('btn-show-custom-ing-form');
    if (btnCreate) {
      btnCreate.onclick = () => {
        showCustomIngredientForm(_pickerSearchQuery);
      };
    }
    return;
  }

  filtered.forEach(ing => {
    const isAlreadyAdded = _recipeDraft.ingredients.some(i => i.ingredient_id === ing.id);
    const card = document.createElement('div');
    card.className = `picker-ing-card ${isAlreadyAdded ? 'already-added' : ''}`;

    card.innerHTML = `
      <div class="picker-ing-icon">${getCategoryEmoji(ing.category)}</div>
      <div class="picker-ing-info">
        <div class="picker-ing-title">
          <span class="picker-ing-name">${ing.name}</span>
          ${ing.isCustom ? '<span class="badge-custom-ing">Propio</span>' : ''}
        </div>
        <div class="picker-ing-macros">
          <span>🔥 ${ing.calories_per_100g || 0} kcal</span>
          <span>• P: ${ing.protein_per_100g || 0}g</span>
          <span>• C: ${ing.carbs_per_100g || 0}g</span>
          <span>• G: ${ing.fat_per_100g || 0}g</span>
          <span class="picker-ing-per100">(por 100g)</span>
        </div>
      </div>
      <div class="picker-ing-actions-wrap">
        ${ing.isCustom ? `
          <button type="button" class="btn-edit-custom-ing" title="Editar ingrediente" aria-label="Editar ${ing.name}">✏️</button>
          <button type="button" class="btn-delete-custom-ing" title="Eliminar ingrediente" aria-label="Eliminar ${ing.name}">🗑️</button>
        ` : ''}
        <button type="button" class="btn-picker-add ${isAlreadyAdded ? 'added' : ''}" ${isAlreadyAdded ? 'disabled' : ''}>
          ${isAlreadyAdded ? '✓ Añadido' : '+ Añadir'}
        </button>
      </div>
    `;

    // Botones de editar / eliminar ingrediente propio
    if (ing.isCustom) {
      const btnEdit = card.querySelector('.btn-edit-custom-ing');
      const btnDelete = card.querySelector('.btn-delete-custom-ing');
      if (btnEdit) {
        btnEdit.onclick = (e) => {
          e.stopPropagation();
          showCustomIngredientForm('', ing);
        };
      }
      if (btnDelete) {
        btnDelete.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`¿Deseas eliminar definitivamente el ingrediente "${ing.name}"?`)) {
            window.DB.deleteCustomIngredient(ing.id);
            _recipeDraft.ingredients = _recipeDraft.ingredients.filter(i => i.ingredient_id !== ing.id);
            renderRecipeEditorIngredients();
            updateRecipeEditorMacros();
            renderIngredientPickerList();
            if (typeof showToast === 'function') showToast('🗑️ Ingrediente eliminado');
          }
        };
      }
    }

    const addBtn = card.querySelector('.btn-picker-add');
    const handleAdd = () => {
      if (_recipeDraft.ingredients.some(i => i.ingredient_id === ing.id)) return;
      _recipeDraft.ingredients.push({
        ingredient_id: ing.id,
        quantity: 100 // default 100g
      });
      renderRecipeEditorIngredients();
      updateRecipeEditorMacros();
      
      // Update this card UI smoothly without closing modal
      card.classList.add('already-added');
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.textContent = '✓ Añadido';
        addBtn.classList.add('added');
      }
      if (typeof showToast === 'function') showToast(`✅ ${ing.name} añadido (100g)`);
    };

    card.onclick = (e) => {
      if (e.target.closest('.btn-edit-custom-ing') || e.target.closest('.btn-delete-custom-ing')) return;
      handleAdd();
    };

    container.appendChild(card);
  });
}

function showCustomIngredientForm(prefillName = '', editIng = null) {
  const formWrap = document.getElementById('custom-ing-form-wrap');
  const titleEl = document.getElementById('custom-ing-form-title');
  const idInput = document.getElementById('custom-ing-id');
  const nameInput = document.getElementById('custom-ing-name');
  const calInput = document.getElementById('custom-ing-cal');
  const protInput = document.getElementById('custom-ing-prot');
  const carbInput = document.getElementById('custom-ing-carb');
  const fatInput = document.getElementById('custom-ing-fat');
  const btnAi = document.getElementById('btn-custom-ing-ai');
  const searchInput = document.getElementById('picker-search-input');

  if (!formWrap) return;
  formWrap.style.display = 'block';

  if (editIng) {
    // Modo Edición
    if (titleEl) titleEl.textContent = '✏️ Editar Ingrediente';
    if (idInput) idInput.value = editIng.id;
    if (nameInput) nameInput.value = editIng.name || '';
    if (calInput) calInput.value = editIng.calories_per_100g != null ? editIng.calories_per_100g : '';
    if (protInput) protInput.value = editIng.protein_per_100g != null ? editIng.protein_per_100g : '';
    if (carbInput) carbInput.value = editIng.carbs_per_100g != null ? editIng.carbs_per_100g : '';
    if (fatInput) fatInput.value = editIng.fat_per_100g != null ? editIng.fat_per_100g : '';
    setCustomIngCategory(editIng.category || 'Otro');
    if (btnAi) btnAi.disabled = false;
  } else {
    // Modo Creación: Vaciar siempre datos anteriores
    if (titleEl) titleEl.textContent = '✨ Crear Nuevo Ingrediente';
    if (idInput) idInput.value = '';
    const textToFill = prefillName || (searchInput ? searchInput.value.trim() : '');
    if (nameInput) nameInput.value = textToFill;
    if (calInput) calInput.value = '';
    if (protInput) protInput.value = '';
    if (carbInput) carbInput.value = '';
    if (fatInput) fatInput.value = '';
    setCustomIngCategory('Proteína');
    if (btnAi) btnAi.disabled = !textToFill;
  }

  if (nameInput) nameInput.focus();
}

async function handleAIAutofillIngredient() {
  const nameInput = document.getElementById('custom-ing-name');
  const name = nameInput ? nameInput.value.trim() : '';

  console.log('[NutriFlow UI] ✨ Botón "Rellenar con IA" presionado para:', name);

  if (!name) {
    if (typeof showToast === 'function') showToast('⚠️ Escribe el nombre del alimento primero');
    if (nameInput) nameInput.focus();
    return;
  }

  const calInput = document.getElementById('custom-ing-cal');
  const protInput = document.getElementById('custom-ing-prot');
  const carbInput = document.getElementById('custom-ing-carb');
  const fatInput = document.getElementById('custom-ing-fat');

  if (!window.AI || typeof window.AI.fetchNutritionInfo !== 'function') {
    console.error('[NutriFlow UI] ❌ Objeto window.AI no encontrado');
    if (typeof showToast === 'function') showToast('⚠️ Módulo de IA no disponible');
    return;
  }

  if (!window.AI.isConfigured()) {
    console.warn('[NutriFlow UI] ⚠️ API Key no configurada en Perfil');
    if (typeof showToast === 'function') showToast('⚠️ Configura tu clave de Gemini en Perfil para usar la IA');
    return;
  }

  const btnAi = document.getElementById('btn-custom-ing-ai');
  const originalHtml = btnAi ? btnAi.innerHTML : '';
  const macroInputs = [calInput, protInput, carbInput, fatInput].filter(Boolean);

  if (btnAi) {
    btnAi.disabled = true;
    btnAi.innerHTML = '<span class="ai-spinner"></span> <span>Consultando IA...</span>';
  }
  macroInputs.forEach(input => {
    input.placeholder = '...';
    input.parentElement?.classList.add('loading-pulse');
  });

  try {
    console.log('[NutriFlow UI] 🚀 Llamando a AI.fetchNutritionInfo...');
    const res = await window.AI.fetchNutritionInfo(name, true);
    const item = res?.item;

    console.log('[NutriFlow UI] 📦 Resultado recibido en UI:', item);

    if (item) {
      if (item.name && nameInput) nameInput.value = item.name;
      if (calInput && item.calories_per_100g != null) calInput.value = Math.round(item.calories_per_100g);
      if (protInput && item.protein_per_100g != null) protInput.value = item.protein_per_100g;
      if (carbInput && item.carbs_per_100g != null) carbInput.value = item.carbs_per_100g;
      if (fatInput && item.fat_per_100g != null) fatInput.value = item.fat_per_100g;

      // Match category pill
      if (item.category) {
        setCustomIngCategory(item.category);
      }

      if (typeof showToast === 'function') showToast('✨ Valores calculados con NutriBot IA');
    }
  } catch (err) {
    console.error('[NutriFlow UI] ❌ Error en consulta IA:', err);
    if (typeof showToast === 'function') showToast('⚠️ Error: ' + (err.message || 'No se pudo conectar'));
  } finally {
    if (btnAi) {
      btnAi.disabled = false;
      btnAi.innerHTML = originalHtml;
    }
    macroInputs.forEach(input => {
      input.placeholder = '0';
      input.parentElement?.classList.remove('loading-pulse');
    });
  }
}

function setCustomIngCategory(catName) {
  if (!catName) return;
  const normalized = catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let targetCat = 'Otro';
  if (normalized.includes('prot') || normalized.includes('carne') || normalized.includes('pollo') || normalized.includes('pescado') || normalized.includes('huevo') || normalized.includes('atun')) targetCat = 'Proteína';
  else if (normalized.includes('cer') || normalized.includes('carb') || normalized.includes('pan') || normalized.includes('avena') || normalized.includes('arroz') || normalized.includes('papa')) targetCat = 'Cereal';
  else if (normalized.includes('verd') || normalized.includes('vegetal') || normalized.includes('espinaca') || normalized.includes('tomate')) targetCat = 'Verdura';
  else if (normalized.includes('frut') || normalized.includes('manzana') || normalized.includes('platano') || normalized.includes('fresa')) targetCat = 'Fruta';
  else if (normalized.includes('lac') || normalized.includes('leche') || normalized.includes('queso') || normalized.includes('yogur')) targetCat = 'Lácteo';
  else if (normalized.includes('gras') || normalized.includes('aceite') || normalized.includes('fruto seco') || normalized.includes('mante') || normalized.includes('aguacate')) targetCat = 'Grasa';
  else if (normalized.includes('legum') || normalized.includes('lente') || normalized.includes('frijol') || normalized.includes('garbanzo') || normalized.includes('hummus')) targetCat = 'Legumbre';
  else if (normalized.includes('espec') || normalized.includes('condimento') || normalized.includes('canela')) targetCat = 'Especia';

  const hiddenInput = document.getElementById('custom-ing-category');
  if (hiddenInput) hiddenInput.value = targetCat;

  const pills = document.querySelectorAll('.custom-ing-cat-pill');
  pills.forEach(pill => {
    const match = (pill.dataset.cat || '').toLowerCase() === targetCat.toLowerCase();
    pill.classList.toggle('active', match);
  });
}

function handleSaveCustomIngredient(e) {
  if (e) e.preventDefault();

  const idInput = document.getElementById('custom-ing-id');
  const nameInput = document.getElementById('custom-ing-name');
  const catInput = document.getElementById('custom-ing-category');
  const calInput = document.getElementById('custom-ing-cal');
  const protInput = document.getElementById('custom-ing-prot');
  const carbInput = document.getElementById('custom-ing-carb');
  const fatInput = document.getElementById('custom-ing-fat');

  const existingId = idInput ? idInput.value.trim() : '';
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    if (typeof showToast === 'function') showToast('⚠️ Ingresa el nombre del ingrediente');
    return;
  }

  const category = catInput ? catInput.value : 'Otro';
  const calories = calInput ? parseFloat(calInput.value) || 0 : 0;
  const protein = protInput ? parseFloat(protInput.value) || 0 : 0;
  const carbs = carbInput ? parseFloat(carbInput.value) || 0 : 0;
  const fat = fatInput ? parseFloat(fatInput.value) || 0 : 0;

  const savedIng = window.DB.saveCustomIngredient({
    id: existingId || undefined,
    name,
    category,
    calories_per_100g: calories,
    protein_per_100g: protein,
    carbs_per_100g: carbs,
    fat_per_100g: fat
  });

  const isEdit = Boolean(existingId);

  if (!isEdit) {
    // Si era nuevo, añadirlo a la receta actual
    _recipeDraft.ingredients.push({
      ingredient_id: savedIng.id,
      quantity: 100
    });
  }

  renderRecipeEditorIngredients();
  updateRecipeEditorMacros();
  renderIngredientPickerList();

  const formWrap = document.getElementById('custom-ing-form-wrap');
  if (formWrap) formWrap.style.display = 'none';

  if (typeof showToast === 'function') {
    showToast(isEdit ? `✏️ Ingrediente "${savedIng.name}" actualizado` : `✨ Ingrediente "${savedIng.name}" creado y añadido`);
  }
}

// ============================================================
// GUARDADO DE RECETA
// ============================================================

function handleSaveRecipe() {
  const nameInput = document.getElementById('recipe-editor-name');
  const instInput = document.getElementById('recipe-editor-instructions');

  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    if (typeof showToast === 'function') showToast('⚠️ Ingresa un nombre para la receta');
    if (nameInput) nameInput.focus();
    return;
  }

  if (_recipeDraft.ingredients.length === 0) {
    if (typeof showToast === 'function') showToast('⚠️ Añade al menos un ingrediente');
    return;
  }

  const instructions = instInput ? instInput.value.trim() : '';

  const recipeData = {
    id: _editingRecipeId,
    name: name,
    meal_type: _recipeDraft.meal_type || 'desayuno',
    instructions: instructions
  };

  const saved = window.DB.saveRecipe(recipeData, _recipeDraft.ingredients);

  closeRecipeEditor();

  // Re-render UI across screens
  if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();

  if (typeof showToast === 'function') {
    showToast(_editingRecipeId ? `✏️ Receta "${saved.name}" actualizada` : `✨ Receta "${saved.name}" creada con éxito`);
  }
}

// ============================================================
// GESTO DE DESLIZAR HACIA ABAJO PARA CERRAR (SWIPE TO CLOSE)
// ============================================================

function setupModalSwipeDown(modal, overlay, closeFn) {
  if (!modal || !overlay) return;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  function onDragStart(clientY, target) {
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) {
      return false;
    }
    // Only allow drag if scrolled to top
    const scrollableBody = modal.querySelector('.recipe-editor-body, .picker-body');
    if (scrollableBody && scrollableBody.scrollTop > 5 && !target.closest('.modal-handle') && !target.closest('.recipe-editor-header') && !target.closest('.picker-header')) {
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
      closeFn();
    } else {
      modal.style.transform = 'translateX(-50%) translateY(0)';
      overlay.style.opacity = '1';
    }
    currentY = 0;
  }

  // Touch Events
  modal.addEventListener('touchstart', (e) => {
    onDragStart(e.touches[0].clientY, e.target);
  }, { passive: true });

  modal.addEventListener('touchmove', (e) => {
    if (isDragging) {
      onDragMove(e.touches[0].clientY);
    }
  }, { passive: true });

  modal.addEventListener('touchend', onDragEnd);
  modal.addEventListener('touchcancel', onDragEnd);

  // Mouse Events on handle/header
  const handle = modal.querySelector('.modal-handle');
  const header = modal.querySelector('.recipe-editor-header, .picker-header');

  [handle, header].filter(Boolean).forEach(el => {
    el.addEventListener('mousedown', (e) => {
      if (onDragStart(e.clientY, e.target)) {
        const onMouseMove = (ev) => onDragMove(ev.clientY);
        const onMouseUp = () => {
          onDragEnd();
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
    });
  });
}

// ============================================================
// INICIALIZACIÓN DE EVENTOS
// ============================================================

function initRecipeEditorEvents() {
  const editorModal = document.getElementById('recipe-editor-modal');
  const globalOverlay = document.getElementById('modal-overlay');
  const pickerModal = document.getElementById('ingredient-picker-modal');
  const pickerOverlay = document.getElementById('ingredient-picker-overlay');

  // Close buttons
  const btnClose = document.getElementById('recipe-editor-close');
  const btnCancel = document.getElementById('recipe-editor-cancel');

  if (btnClose) btnClose.onclick = closeRecipeEditor;
  if (btnCancel) btnCancel.onclick = closeRecipeEditor;

  // Overlay click to close editor (only if picker is not open)
  if (globalOverlay) {
    globalOverlay.addEventListener('click', (e) => {
      if (editorModal && editorModal.classList.contains('open')) {
        closeRecipeEditor();
      }
    });
  }

  // Swipe down gesture on Editor Modal
  setupModalSwipeDown(editorModal, globalOverlay, closeRecipeEditor);

  // Meal type pills
  const pills = document.querySelectorAll('.recipe-meal-type-pill');
  pills.forEach(pill => {
    pill.onclick = () => {
      _recipeDraft.meal_type = pill.dataset.type;
      updateMealTypePillsUI();
    };
  });

  // Add ingredient button
  const btnAddIng = document.getElementById('btn-editor-add-ingredient');
  if (btnAddIng) btnAddIng.onclick = openIngredientPicker;

  // Save recipe button
  const btnSave = document.getElementById('recipe-editor-save');
  if (btnSave) btnSave.onclick = handleSaveRecipe;

  // Picker search input
  const pickerSearch = document.getElementById('picker-search-input');
  if (pickerSearch) {
    pickerSearch.oninput = (e) => {
      _pickerSearchQuery = e.target.value;
      renderIngredientPickerList();
    };
  }

  // Picker close buttons & overlay
  const btnPickerClose = document.getElementById('ingredient-picker-close');
  if (btnPickerClose) btnPickerClose.onclick = closeIngredientPicker;
  if (pickerOverlay) pickerOverlay.onclick = closeIngredientPicker;

  // Swipe down gesture on Ingredient Picker Modal
  setupModalSwipeDown(pickerModal, pickerOverlay, closeIngredientPicker);

  // Trigger custom ingredient form button inside picker header
  const btnNewCustomIng = document.getElementById('btn-picker-new-custom');
  if (btnNewCustomIng) {
    btnNewCustomIng.onclick = () => {
      showCustomIngredientForm(_pickerSearchQuery);
    };
  }

  // Category pills in custom ingredient form
  const catPills = document.querySelectorAll('.custom-ing-cat-pill');
  catPills.forEach(pill => {
    pill.onclick = () => {
      const cat = pill.dataset.cat || 'Otro';
      setCustomIngCategory(cat);
    };
  });

  // AI autofill button & Name input listener
  const btnAi = document.getElementById('btn-custom-ing-ai');
  const customNameInput = document.getElementById('custom-ing-name');
  if (btnAi) {
    btnAi.onclick = handleAIAutofillIngredient;
  }
  if (customNameInput && btnAi) {
    customNameInput.addEventListener('input', () => {
      btnAi.disabled = !customNameInput.value.trim();
    });
  }

  // Save custom ingredient form
  const customIngForm = document.getElementById('custom-ing-form');
  if (customIngForm) {
    customIngForm.onsubmit = handleSaveCustomIngredient;
  }

  const btnCancelCustomIng = document.getElementById('btn-cancel-custom-ing');
  if (btnCancelCustomIng) {
    btnCancelCustomIng.onclick = () => {
      const formWrap = document.getElementById('custom-ing-form-wrap');
      if (formWrap) formWrap.style.display = 'none';
    };
  }

  const btnCloseFormX = document.getElementById('btn-close-custom-ing-form');
  if (btnCloseFormX) {
    btnCloseFormX.onclick = () => {
      const formWrap = document.getElementById('custom-ing-form-wrap');
      if (formWrap) formWrap.style.display = 'none';
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRecipeEditorEvents);
} else {
  initRecipeEditorEvents();
}

window.openRecipeEditor = openRecipeEditor;
window.closeRecipeEditor = closeRecipeEditor;
