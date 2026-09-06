var _selectedFoodItem = null;
window._selectedFoodItem = null;
var _selectedCompoundMeal = null;
window._selectedCompoundMeal = null;

function openRegisterSheet() {
  const sheet   = document.getElementById('register-sheet');
  const overlay = document.getElementById('register-overlay');
  if (!sheet) return;
  // Siempre empieza en el men\u00fa principal
  switchRSView('menu');
  sheet.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window.ModalHistory) window.ModalHistory.open('register-sheet', closeRegisterSheet);
}
function closeRegisterSheet() {
  const sheet   = document.getElementById('register-sheet');
  const overlay = document.getElementById('register-overlay');
  if (sheet) {
    sheet.classList.remove('open');
    sheet.style.transform = ''; // Reset transform
  }
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  if (window.ModalHistory) window.ModalHistory.close('register-sheet');
}
function switchRSView(viewName) {
  document.querySelectorAll('.rs-view').forEach(v => {
    if (v.id === `rs-view-${viewName}`) {
      v.hidden = false;
      v.classList.add('active');
    } else {
      v.hidden = true;
      v.classList.remove('active');
    }
  });

  // Limpiar contenidos al entrar a cada vista
  if (viewName === 'search')    resetRSSearchView();
  if (viewName === 'favorites') renderRSFavoritesView();
  if (viewName === 'voice')     resetRSVoiceView();
}
function initRegisterSheet() {
  const fab     = document.getElementById('btn-register-fab');
  const overlay = document.getElementById('register-overlay');

  if (fab)     fab.addEventListener('click', openRegisterSheet);
  if (overlay) overlay.addEventListener('click', closeRegisterSheet);

  // Botones de volver
  ['search','favorites','voice'].forEach(view => {
    const btn = document.getElementById(`rs-back-${view}`);
    if (btn) btn.addEventListener('click', () => switchRSView('menu'));
  });

  // Botones del menu principal
  document.querySelectorAll('.rs-menu-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-view');
      if (v) switchRSView(v);
    });
  });

  // Selector de chips de comida (registro simple)
  document.getElementById('rs-meal-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.rs-meal-chip');
    if (!chip) return;
    document.querySelectorAll('#rs-meal-chips .rs-meal-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('rs-gram-meal-type').value = chip.dataset.val;
  });

  // Selector de chips de comida (plato compuesto)
  document.getElementById('rs-compound-meal-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.rs-meal-chip');
    if (!chip) return;
    document.querySelectorAll('#rs-compound-meal-chips .rs-meal-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('rs-compound-meal-type').value = chip.dataset.val;
  });

  // Acciones de plato compuesto
  document.getElementById('btn-rs-compound-cancel')?.addEventListener('click', () => {
    const confirmEl = document.getElementById('rs-compound-confirm');
    if (confirmEl) confirmEl.hidden = true;
    _selectedCompoundMeal = null;
    const voiceContainer = document.querySelector('.rs-voice-container');
    if (voiceContainer) voiceContainer.classList.remove('voice-minimized');
    const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
    if (collapsedBar) collapsedBar.hidden = true;
  });
  document.getElementById('btn-rs-compound-save')?.addEventListener('click', saveCompoundMealEntry);

  // Gestos tactiles para cerrar (Swipe down)
  const sheet = document.getElementById('register-sheet');
  if (sheet) {
    let startY = 0;
    let isDragging = false;

    sheet.addEventListener('touchstart', (e) => {
      const target = e.target;
      // No arrastrar si se toca dentro de la zona scrolleable
      if (target.closest('.rs-scroll-content') && target.closest('.rs-scroll-content').scrollTop > 0) return;
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 0) {
        sheet.style.transform = `translateX(-50%) translateY(${diffY}px)`;
        sheet.style.transition = 'none';
      }
    }, { passive: true });

    sheet.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      sheet.style.transition = '';
      const currentY = e.changedTouches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 80) {
        closeRegisterSheet();
      } else {
        sheet.style.transform = '';
      }
    });
  }

  // Buscador de alimentos
  const searchInput = document.getElementById('rs-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleFoodSearch, 280));
  }

  // ── Gramaje: botones +/− y guardado ──
  const gramMinus = document.getElementById('rs-gram-minus');
  const gramPlus  = document.getElementById('rs-gram-plus');
  const gramInput = document.getElementById('rs-gram-input');
  const gramSave  = document.getElementById('rs-gram-save');

  if (gramMinus) gramMinus.addEventListener('click', () => {
    const v = parseInt(gramInput.value) || 100;
    gramInput.value = Math.max(1, v - 10);
    updateGramMacros();
  });
  if (gramPlus) gramPlus.addEventListener('click', () => {
    const v = parseInt(gramInput.value) || 100;
    gramInput.value = Math.min(2000, v + 10);
    updateGramMacros();
  });
  if (gramInput) gramInput.addEventListener('input', updateGramMacros);
  if (gramSave)  gramSave.addEventListener('click', saveFreeFoodEntry);

  // ── Voz: inicializar ──
  initVoiceRegistration();

  // Visibilidad del FAB según pestaña activa
  updateRegisterFabVisibility();
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', updateRegisterFabVisibility);
  });
}
function updateRegisterFabVisibility() {
  const fab = document.getElementById('btn-register-fab');
  if (!fab) return;
  const diaryActive = document.getElementById('screen-diary')?.classList.contains('active');
  fab.style.display = diaryActive ? 'flex' : 'none';
}
function resetRSSearchView() {
  const searchView = document.getElementById('rs-view-search');
  const confirmEl = document.getElementById('rs-gram-confirm');
  const compoundEl = document.getElementById('rs-compound-confirm');
  if (searchView && confirmEl && confirmEl.parentNode !== searchView) {
    searchView.appendChild(confirmEl);
  }
  if (searchView && compoundEl && compoundEl.parentNode !== searchView) {
    searchView.appendChild(compoundEl);
  }
  const input   = document.getElementById('rs-search-input');
  const results = document.getElementById('rs-search-results');
  const confirm = document.getElementById('rs-gram-confirm');
  const gramInp = document.getElementById('rs-gram-input');
  if (input)   input.value = '';
  if (gramInp) gramInp.value = '';
  if (results) results.innerHTML = '<div class="rs-result-empty">Escribe para buscar un alimento 🔍</div>';
  if (confirm) {
    confirm.hidden = true;
    document.getElementById('rs-gram-item-name').textContent = '';
    document.getElementById('rs-gram-macros').innerHTML = '';
  }
  if (compoundEl) {
    compoundEl.hidden = true;
  }
  _selectedFoodItem = null;
  _selectedCompoundMeal = null;
}
async function handleFoodSearch() {
  const query   = document.getElementById('rs-search-input')?.value.trim();
  const results = document.getElementById('rs-search-results');
  const confirm = document.getElementById('rs-gram-confirm');
  const compoundConfirm = document.getElementById('rs-compound-confirm');
  if (!results) return;
  if (confirm) confirm.hidden = true;
  if (compoundConfirm) compoundConfirm.hidden = true;
  _selectedFoodItem = null;
  _selectedCompoundMeal = null;

  if (!query || query.length < 2) {
    results.innerHTML = '<div class="rs-result-empty">Escribe para buscar un alimento 🔍</div>';
    return;
  }

  // 1. Buscar localmente en food_items (ya ordenado por relevancia y sin tildes)
  const localMatches = DB.searchFoodItems(query);
  const localNames = new Set(localMatches.map(m => (typeof normalizeSearchText === 'function' ? normalizeSearchText(m.name) : m.name.toLowerCase())));

  const normQuery = typeof normalizeSearchText === 'function' ? normalizeSearchText(query) : query.toLowerCase();

  // 2. Buscar en ingredientes del sistema
  const ingMatches = (DB.ingredients || []).filter(i => {
    const normName = typeof normalizeSearchText === 'function' ? normalizeSearchText(i.name) : i.name.toLowerCase();
    if (localNames.has(normName)) return false;
    return normName.includes(normQuery) || (normQuery.length >= 3 && normQuery.includes(normName));
  }).slice(0, 5);

  results.innerHTML = '';

  if (localMatches.length > 0) {
    localMatches.forEach(item => {
      results.appendChild(buildFoodResultItem(item, 'food_item'));
    });
  }

  if (ingMatches.length > 0) {
    ingMatches.forEach(ing => {
      // Convertir ingrediente a pseudo-food-item para display
      const pseudo = {
        id: ing.id,
        name: ing.name,
        calories_per_100g: ing.calories_per_100g || 0,
        protein_per_100g:  ing.protein_per_100g  || 0,
        carbs_per_100g:    ing.carbs_per_100g    || 0,
        fat_per_100g:      ing.fat_per_100g      || 0,
        typical_serving_g: 100,
        _fromIngredient: true
      };
      results.appendChild(buildFoodResultItem(pseudo, 'ingredient'));
    });
  }

  // Botón de búsqueda / análisis con IA siempre presente (al final de los resultados o en vacío)
  const aiSection = document.createElement('div');
  aiSection.className = 'rs-result-empty';
  aiSection.style.padding = (localMatches.length > 0 || ingMatches.length > 0) ? '16px 0 8px' : '24px 0';
  
  if (localMatches.length === 0 && ingMatches.length === 0) {
    aiSection.innerHTML = `
      <span>No encontrado en tu BD 🤔</span>
      ${AI.isConfigured()
        ? `<button class="btn-search-ai" id="btn-search-ai-now">🤖 Buscar con IA: "${query}"</button>`
        : `<span style="font-size:0.75rem">Configura tu API Key en Perfil para usar IA</span>`
      }
    `;
  } else {
    aiSection.innerHTML = `
      <span style="font-size:0.78rem; color:var(--gray-400);">¿No es lo que buscas o es un plato compuesto?</span>
      ${AI.isConfigured()
        ? `<button class="btn-search-ai" id="btn-search-ai-now">✨ Analizar con IA: "${query}"</button>`
        : `<span style="font-size:0.75rem">Configura tu API Key en Perfil para usar IA</span>`
      }
    `;
  }
  results.appendChild(aiSection);

  document.getElementById('btn-search-ai-now')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = '⏳ Consultando Gemini…';
    try {
      console.log('[NutriFlow UI] 🔍 Ejecutando análisis unificado IA para query:', query);
      const parsed = await AI.analyzeMealText(query);
      if (parsed && parsed.items && parsed.items.length > 0) {
        if (parsed.is_compound && parsed.items.length > 1) {
          showCompoundMealConfirm(parsed, 'search');
        } else {
          const single = parsed.items[0];
          const factor100 = (single.quantity_g > 0) ? (100 / single.quantity_g) : 1;
          const itemForGram = {
            name: single.name,
            calories_per_100g: Math.round(single.calories * factor100),
            protein_per_100g: parseFloat((single.protein * factor100).toFixed(1)),
            carbs_per_100g: parseFloat((single.carbs * factor100).toFixed(1)),
            fat_per_100g: parseFloat((single.fat * factor100).toFixed(1)),
            typical_serving_g: single.quantity_g || 100,
            _isTemp: true,
            source: 'gemini'
          };
          selectFoodForGram(itemForGram);
          const gramInput = document.getElementById('rs-gram-input');
          if (gramInput && single.quantity_g) {
            gramInput.value = single.quantity_g;
            updateGramMacros();
          }
        }
        showToast('✨ Información obtenida de Gemini');
      } else {
        showToast('❌ Gemini no encontró información de ese alimento');
      }
    } catch (err) {
      console.error('[NutriFlow UI] Error en búsqueda IA:', err);
      if (err.message === 'OFFLINE' || !navigator.onLine) {
        showToast('📡 Sin conexión: La búsqueda con IA requiere internet');
      } else {
        showToast('❌ Error al consultar Gemini');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = `✨ Buscar con IA: "${query}"`;
    }
  });
}
function buildFoodResultItem(item, _type) {
  const el = document.createElement('div');
  el.className = 'rs-result-item';
  const kcalPer100 = Math.round(item.calories_per_100g || 0);
  el.innerHTML = `
    <div>
      <div class="rs-result-name">${item.name}</div>
      <div class="rs-result-meta">${kcalPer100} kcal / 100g</div>
    </div>
    <div class="rs-result-kcal">${kcalPer100} kcal</div>
  `;
  el.addEventListener('click', () => selectFoodForGram(item));
  return el;
}
function selectFoodForGram(item) {
  _selectedFoodItem = item;
  const confirm  = document.getElementById('rs-gram-confirm');
  const compoundConfirm = document.getElementById('rs-compound-confirm');
  const nameEl   = document.getElementById('rs-gram-item-name');
  const gramInp  = document.getElementById('rs-gram-input');
  if (!confirm) return;

  if (compoundConfirm) compoundConfirm.hidden = true;

  nameEl.textContent = item.name;
  gramInp.placeholder = `Ej: ${item.typical_serving_g || 100}`;
  gramInp.value = item.typical_serving_g || 100;
  confirm.hidden = false;
  updateGramMacros();

  // Scroll para ver el panel
  setTimeout(() => confirm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}
function updateGramMacros() {
  const gramInput = document.getElementById('rs-gram-input');
  const macrosEl  = document.getElementById('rs-gram-macros');
  if (!gramInput || !macrosEl || !_selectedFoodItem) return;

  const g = Math.max(1, parseInt(gramInput.value) || 100);
  const factor = g / 100;
  const kcal = Math.round(((_selectedFoodItem.calories_per_100g || 0) * factor));
  const prot = (((_selectedFoodItem.protein_per_100g  || 0) * factor)).toFixed(1);
  const carb = (((_selectedFoodItem.carbs_per_100g    || 0) * factor)).toFixed(1);
  const fat  = (((_selectedFoodItem.fat_per_100g      || 0) * factor)).toFixed(1);

  macrosEl.innerHTML = `
    <div class="rs-gram-macro-chip" style="background: #fef3c7; border: 1px solid #fde68a;">
      <span class="rs-gram-macro-chip-val" style="color: #b45309">${kcal}</span><span class="rs-gram-macro-chip-lbl" style="color: #d97706">kcal</span>
    </div>
    <div class="rs-gram-macro-chip" style="background: #e0f2fe; border: 1px solid #bae6fd;">
      <span class="rs-gram-macro-chip-val" style="color: #0369a1">${prot}g</span><span class="rs-gram-macro-chip-lbl" style="color: #0284c7">Prot</span>
    </div>
    <div class="rs-gram-macro-chip" style="background: #dcfce7; border: 1px solid #bbf7d0;">
      <span class="rs-gram-macro-chip-val" style="color: #15803d">${carb}g</span><span class="rs-gram-macro-chip-lbl" style="color: #16a34a">Carb</span>
    </div>
    <div class="rs-gram-macro-chip" style="background: #fae8ff; border: 1px solid #f5d0fe;">
      <span class="rs-gram-macro-chip-val" style="color: #a21caf">${fat}g</span><span class="rs-gram-macro-chip-lbl" style="color: #c026d3">Grasa</span>
    </div>
  `;
}
function saveFreeFoodEntry() {
  const gramInput = document.getElementById('rs-gram-input');
  if (!_selectedFoodItem || !gramInput) return;
  const qty = Math.max(1, parseInt(gramInput.value) || 100);

  // Si es un ingrediente o un item temporal de Gemini, lo añadimos/actualizamos en food_items
  let refId = _selectedFoodItem.id;
  if (_selectedFoodItem._fromIngredient || _selectedFoodItem._isTemp) {
    const saved = DB.upsertFoodItem({
      name: _selectedFoodItem.name,
      calories_per_100g: _selectedFoodItem.calories_per_100g || 0,
      protein_per_100g:  _selectedFoodItem.protein_per_100g  || 0,
      carbs_per_100g:    _selectedFoodItem.carbs_per_100g    || 0,
      fat_per_100g:      _selectedFoodItem.fat_per_100g      || 0,
      typical_serving_g: _selectedFoodItem.typical_serving_g || 100,
      category: _selectedFoodItem.category || 'Otro',
      source: _selectedFoodItem._isTemp ? 'gemini' : 'ingredient'
    });
    refId = saved.id;
  }

  const mealSelect = document.getElementById('rs-gram-meal-type');
  const mealCategory = mealSelect ? mealSelect.value : 'snack';

  DB.addFoodLog({
    type: 'food_item',
    reference_id: refId,
    quantity_g: qty,
    planned: false,
    mealCategory: mealCategory
  });

  showToast(`✅ ${_selectedFoodItem.name} (${qty}g) registrado`);
  closeRegisterSheet();
  renderDiaryScreen();
  renderDailyMacros();
}

// ────────────────────────────────────────────
// PLATOS COMPUESTOS (MULTI-ITEM)
// ────────────────────────────────────────────

let _compoundMealOrigin = 'search';

function showCompoundMealConfirm(data, originView = 'search') {
  _selectedCompoundMeal = JSON.parse(JSON.stringify(data));
  _compoundMealOrigin = originView;
  const compoundConfirm = document.getElementById('rs-compound-confirm');
  const gramConfirm = document.getElementById('rs-gram-confirm');
  const titleEl = document.getElementById('rs-compound-title');
  const listEl = document.getElementById('rs-compound-items-list');
  if (!compoundConfirm || !titleEl || !listEl) return;

  if (gramConfirm) gramConfirm.hidden = true;

  if (originView === 'search') {
    const searchView = document.getElementById('rs-view-search');
    if (searchView && compoundConfirm.parentNode !== searchView) {
      searchView.appendChild(compoundConfirm);
    }
  } else if (originView === 'voice') {
    const voiceContainer = document.querySelector('.rs-voice-container');
    if (voiceContainer) {
      if (compoundConfirm.parentNode !== voiceContainer) {
        voiceContainer.appendChild(compoundConfirm);
      }
      voiceContainer.classList.add('voice-minimized');
      const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
      const collapsedPreview = document.getElementById('rs-voice-collapsed-preview');
      const voiceInput = document.getElementById('rs-voice-input');
      if (collapsedPreview) {
        collapsedPreview.textContent = voiceInput?.value.trim() || data.meal_title || 'Dictado de voz';
      }
      if (collapsedBar) collapsedBar.hidden = false;
    }
  }

  titleEl.textContent = data.meal_title || 'Plato detectado';

  let mealTypeVal = 'snack';
  if (data.meal_type) {
    const mt = data.meal_type.toLowerCase();
    if (mt.includes('desayuno')) mealTypeVal = 'breakfast';
    else if (mt.includes('almuerzo')) mealTypeVal = 'lunch';
    else if (mt.includes('cena')) mealTypeVal = 'dinner';
    else if (mt.includes('merienda')) mealTypeVal = 'merienda';
  }
  const mealTypeInput = document.getElementById('rs-compound-meal-type');
  if (mealTypeInput) mealTypeInput.value = mealTypeVal;

  document.querySelectorAll('#rs-compound-meal-chips .rs-meal-chip').forEach(c => {
    if (c.dataset.val === mealTypeVal) c.classList.add('active');
    else c.classList.remove('active');
  });

  renderCompoundItemsList();

  compoundConfirm.hidden = false;
  setTimeout(() => compoundConfirm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

function renderCompoundItemsList() {
  const listEl = document.getElementById('rs-compound-items-list');
  if (!listEl || !_selectedCompoundMeal || !_selectedCompoundMeal.items) return;

  listEl.innerHTML = '';

  _selectedCompoundMeal.items.forEach((item, index) => {
    if (item._basePer100 == null) {
      const q = Math.max(1, item.quantity_g || 100);
      item._basePer100 = {
        cal: (item.calories / q) * 100,
        prot: (item.protein / q) * 100,
        carb: (item.carbs / q) * 100,
        fat: (item.fat / q) * 100
      };
      item.currentGrams = item.quantity_g || 100;
      item.currentCal = item.calories;
      item.currentProt = item.protein;
      item.currentCarb = item.carbs;
      item.currentFat = item.fat;
    }

    const row = document.createElement('div');
    row.className = 'rs-compound-item-row';
    row.innerHTML = `
      <div class="rs-compound-item-info">
        <div class="rs-compound-item-name">${item.name}</div>
        <div class="rs-compound-item-portion">${item.portion_desc || ''}</div>
      </div>
      <div class="rs-compound-item-controls">
        <button type="button" class="btn-compound-qty btn-minus" data-index="${index}" aria-label="Disminuir gramos">−</button>
        <input type="number" class="rs-compound-item-qty-input" data-index="${index}" value="${item.currentGrams}" min="1" max="2000" />
        <span class="rs-compound-item-unit">g</span>
        <button type="button" class="btn-compound-qty btn-plus" data-index="${index}" aria-label="Aumentar gramos">+</button>
      </div>
      <div class="rs-compound-item-kcal" id="rs-comp-kcal-${index}">
        <span class="rs-compound-kcal-num">${Math.round(item.currentCal)}</span>
        <span class="rs-compound-kcal-unit">kcal</span>
      </div>
    `;

    const input = row.querySelector('.rs-compound-item-qty-input');
    const minusBtn = row.querySelector('.btn-minus');
    const plusBtn = row.querySelector('.btn-plus');

    const updateItemGrams = (newGrams) => {
      const val = Math.max(1, Math.min(2000, newGrams));
      item.currentGrams = val;
      if (input) input.value = val;
      const factor = val / 100;
      item.currentCal = Math.round(item._basePer100.cal * factor);
      item.currentProt = parseFloat((item._basePer100.prot * factor).toFixed(1));
      item.currentCarb = parseFloat((item._basePer100.carb * factor).toFixed(1));
      item.currentFat = parseFloat((item._basePer100.fat * factor).toFixed(1));

      const kcalEl = document.getElementById(`rs-comp-kcal-${index}`);
      if (kcalEl) {
        const numSpan = kcalEl.querySelector('.rs-compound-kcal-num');
        if (numSpan) numSpan.textContent = Math.round(item.currentCal);
        else kcalEl.textContent = `${item.currentCal} kcal`;
      }

      updateCompoundTotalMacros();
    };

    input?.addEventListener('input', (e) => {
      const g = parseInt(e.target.value) || 1;
      updateItemGrams(g);
    });

    minusBtn?.addEventListener('click', () => {
      const g = Math.max(1, (item.currentGrams || 100) - 10);
      updateItemGrams(g);
    });

    plusBtn?.addEventListener('click', () => {
      const g = Math.min(2000, (item.currentGrams || 100) + 10);
      updateItemGrams(g);
    });

    listEl.appendChild(row);
  });

  updateCompoundTotalMacros();
}

function updateCompoundTotalMacros() {
  const macrosEl = document.getElementById('rs-compound-total-macros');
  if (!macrosEl || !_selectedCompoundMeal || !_selectedCompoundMeal.items) return;

  const totalCal = _selectedCompoundMeal.items.reduce((s, it) => s + (it.currentCal || it.calories || 0), 0);
  const totalProt = parseFloat(_selectedCompoundMeal.items.reduce((s, it) => s + (it.currentProt || it.protein || 0), 0).toFixed(1));
  const totalCarb = parseFloat(_selectedCompoundMeal.items.reduce((s, it) => s + (it.currentCarb || it.carbs || 0), 0).toFixed(1));
  const totalFat = parseFloat(_selectedCompoundMeal.items.reduce((s, it) => s + (it.currentFat || it.fat || 0), 0).toFixed(1));

  macrosEl.innerHTML = `
    <div class="rs-compound-macro-chip cal">
      <span class="rs-compound-macro-val">${totalCal}</span>
      <span class="rs-compound-macro-lbl">kcal</span>
    </div>
    <div class="rs-compound-macro-chip prot">
      <span class="rs-compound-macro-val">${totalProt}g</span>
      <span class="rs-compound-macro-lbl">Prot</span>
    </div>
    <div class="rs-compound-macro-chip carb">
      <span class="rs-compound-macro-val">${totalCarb}g</span>
      <span class="rs-compound-macro-lbl">Carb</span>
    </div>
    <div class="rs-compound-macro-chip fat">
      <span class="rs-compound-macro-val">${totalFat}g</span>
      <span class="rs-compound-macro-lbl">Grasa</span>
    </div>
  `;
}

function saveCompoundMealEntry() {
  if (!_selectedCompoundMeal || !_selectedCompoundMeal.items || _selectedCompoundMeal.items.length === 0) return;

  const mealSelect = document.getElementById('rs-compound-meal-type');
  const mealCategory = mealSelect ? mealSelect.value : 'snack';

  // 1. Calcular totales exactos del plato
  const totalQty = _selectedCompoundMeal.items.reduce((s, it) => s + (parseInt(it.currentGrams || it.quantity_g) || 100), 0);
  const totalCal = _selectedCompoundMeal.items.reduce((s, it) => s + (it.currentCal || it.calories || 0), 0);
  const totalProt = parseFloat(_selectedCompoundMeal.items.reduce((s, it) => s + (it.currentProt || it.protein || 0), 0).toFixed(1));
  const totalCarb = parseFloat(_selectedCompoundMeal.items.reduce((s, it) => s + (it.currentCarb || it.carbs || 0), 0).toFixed(1));
  const totalFat = parseFloat(_selectedCompoundMeal.items.reduce((s, it) => s + (it.currentFat || it.fat || 0), 0).toFixed(1));

  const plateName = _selectedCompoundMeal.meal_title || 'Plato combinado';
  const factor100 = totalQty > 0 ? (100 / totalQty) : 1;

  // 2. Guardar o actualizar el plato compuesto como 1 solo alimento consolidado
  const compoundFoodItem = DB.upsertFoodItem({
    name: plateName,
    calories_per_100g: Math.round(totalCal * factor100),
    protein_per_100g: parseFloat((totalProt * factor100).toFixed(1)),
    carbs_per_100g: parseFloat((totalCarb * factor100).toFixed(1)),
    fat_per_100g: parseFloat((totalFat * factor100).toFixed(1)),
    typical_serving_g: totalQty,
    category: 'Otro',
    source: 'gemini'
  });

  // 3. Registrar 1 única entrada limpia en el diario con los macros consolidados
  DB.addFoodLog({
    type: 'food_item',
    reference_id: compoundFoodItem.id,
    quantity_g: totalQty,
    planned: false,
    mealCategory: mealCategory
  });

  showToast(`✅ ${plateName} (${totalQty}g) registrado`);
  
  const compoundConfirm = document.getElementById('rs-compound-confirm');
  if (compoundConfirm) compoundConfirm.hidden = true;

  const voiceContainer = document.querySelector('.rs-voice-container');
  if (voiceContainer) voiceContainer.classList.remove('voice-minimized');
  const collapsedBar = document.getElementById('rs-voice-collapsed-bar');
  if (collapsedBar) collapsedBar.hidden = true;

  _selectedCompoundMeal = null;

  closeRegisterSheet();
  renderDiaryScreen();
  renderDailyMacros();
}

window.showCompoundMealConfirm = showCompoundMealConfirm;
window.selectFoodForGram = selectFoodForGram;

function renderRSFavoritesView() {
  const container = document.getElementById('rs-favorites-content');
  if (!container) return;
  container.innerHTML = '';

  const favorites  = DB.getFavorites();
  const frequents  = DB.getFrequentItems(8);

  // \u2500\u2500 Favoritos \u2500\u2500
  const favResolved = favorites.map(fav => resolveItemLabel(fav)).filter(Boolean);
  if (favResolved.length > 0) {
    const title = document.createElement('div');
    title.className = 'rs-fav-section-title';
    title.textContent = '\u2b50 Tus favoritos';
    container.appendChild(title);

    const chips = document.createElement('div');
    chips.className = 'rs-fav-chips';
    favResolved.forEach(({ label, emoji, fav }) => {
      const chip = document.createElement('button');
      chip.className = 'rs-fav-chip';
      chip.textContent = `${emoji} ${label}`;
      chip.addEventListener('click', () => quickRegisterFav(fav));
      chips.appendChild(chip);
    });
    container.appendChild(chips);
  }

  // \u2500\u2500 Frecuentes \u2500\u2500
  const freqResolved = frequents.map(f => resolveItemLabel(f)).filter(Boolean);
  if (freqResolved.length > 0) {
    const title2 = document.createElement('div');
    title2.className = 'rs-fav-section-title';
    title2.textContent = '\u{1f525} M\u00e1s usados (\u00faltimos 30 d\u00edas)';
    container.appendChild(title2);

    const chips2 = document.createElement('div');
    chips2.className = 'rs-fav-chips';
    freqResolved.forEach(({ label, emoji, fav }) => {
      const chip = document.createElement('button');
      chip.className = 'rs-fav-chip';
      chip.textContent = `${emoji} ${label}`;
      chip.addEventListener('click', () => quickRegisterFav(fav));
      chips2.appendChild(chip);
    });
    container.appendChild(chips2);
  }

  if (favResolved.length === 0 && freqResolved.length === 0) {
    container.innerHTML = '<div class="rs-result-empty">A\u00fan no tienes favoritos ni frecuentes.<br>Reg\u00edstra alimentos para que aparezcan aqu\u00ed \u{1f331}</div>';
  }
}
function resolveItemLabel({ type, reference_id }) {
  const emojis = { desayuno:'\u{1f305}', almuerzo:'\u{1f37d}\ufe0f', cena:'\u{1f319}', merienda:'\u{1f96a}', food_item:'\u{1f957}', liquid:'\u{1f4a7}' };
  if (type === 'meal') {
    const r = DB.getRecipeById(reference_id);
    if (!r) return null;
    return { label: r.name, emoji: emojis[r.meal_type] || '\u{1f373}', fav: { type, reference_id } };
  }
  if (type === 'food_item') {
    const fi = DB.getFoodItemById(reference_id);
    if (!fi) return null;
    return { label: fi.name, emoji: '\u{1f957}', fav: { type, reference_id } };
  }
  if (type === 'ingredient') {
    const ing = DB.getIngredientById(reference_id);
    if (!ing) return null;
    return { label: ing.name, emoji: '\u{1f955}', fav: { type, reference_id } };
  }
  return null;
}
function quickRegisterFav({ type, reference_id }) {
  if (type === 'meal') {
    DB.addFoodLog({ type: 'meal', reference_id, planned: false });
    const r = DB.getRecipeById(reference_id);
    showToast(`\u2705 ${r?.name || 'Receta'} registrada`);
  } else if (type === 'food_item') {
    const fi = DB.getFoodItemById(reference_id);
    const qty = fi?.typical_serving_g || 100;
    DB.addFoodLog({ type: 'food_item', reference_id, quantity_g: qty, planned: false });
    showToast(`\u2705 ${fi?.name || 'Alimento'} (${qty}g) registrado`);
  }
  closeRegisterSheet();
  renderDiaryScreen();
  renderDailyMacros();
}

