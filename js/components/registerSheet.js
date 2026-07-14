function openRegisterSheet() {
  const sheet   = document.getElementById('register-sheet');
  const overlay = document.getElementById('register-overlay');
  if (!sheet) return;
  // Siempre empieza en el menú principal
  switchRSView('menu');
  sheet.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
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

  // Selector de chips de comida
  document.getElementById('rs-meal-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('.rs-meal-chip');
    if (!chip) return;
    document.querySelectorAll('.rs-meal-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('rs-gram-meal-type').value = chip.dataset.val;
  });

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
  if (searchView && confirmEl && confirmEl.parentNode !== searchView) {
    searchView.appendChild(confirmEl);
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
  _selectedFoodItem = null;
}
async function handleFoodSearch() {
  const query   = document.getElementById('rs-search-input')?.value.trim();
  const results = document.getElementById('rs-search-results');
  const confirm = document.getElementById('rs-gram-confirm');
  if (!results) return;
  if (confirm) confirm.hidden = true;
  _selectedFoodItem = null;

  if (!query || query.length < 2) {
    results.innerHTML = '<div class="rs-result-empty">Escribe para buscar un alimento 🔍</div>';
    return;
  }

  // 1. Buscar localmente en food_items
  const localMatches = DB.searchFoodItems(query);

  // 2. Buscar en ingredientes del sistema
  const ingMatches = DB.ingredients.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

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

  if (localMatches.length === 0 && ingMatches.length === 0) {
    // No encontrado — botón IA
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'rs-result-empty';
    emptyDiv.innerHTML = `
      <span>No encontrado en tu BD 🤔</span>
      ${AI.isConfigured()
        ? `<button class="btn-search-ai" id="btn-search-ai-now">🤖 Buscar con IA: "${query}"</button>`
        : `<span style="font-size:0.75rem">Configura tu API Key en Perfil para usar IA</span>`
      }
    `;
    results.appendChild(emptyDiv);

    document.getElementById('btn-search-ai-now')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '⏳ Consultando Gemini…';
      try {
        const { item } = await AI.fetchNutritionInfo(query);
        if (item) {
          results.innerHTML = '';
          results.appendChild(buildFoodResultItem(item, 'food_item'));
          selectFoodForGram(item);
          showToast('✨ Información obtenida de Gemini');
        } else {
          showToast('❌ Gemini no encontró información de ese alimento');
        }
      } catch {
        showToast('❌ Error al consultar Gemini');
        btn.disabled = false;
        btn.textContent = `🤖 Buscar con IA: "${query}"`;
      }
    });
  }
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
  const nameEl   = document.getElementById('rs-gram-item-name');
  const gramInp  = document.getElementById('rs-gram-input');
  if (!confirm) return;

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

  // Si es un ingrediente o un item temporal de Gemini, lo añadimos a food_items
  let refId = _selectedFoodItem.id;
  if (_selectedFoodItem._fromIngredient || _selectedFoodItem._isTemp) {
    const saved = DB.addFoodItem({
      name: _selectedFoodItem.name,
      calories_per_100g: _selectedFoodItem.calories_per_100g || 0,
      protein_per_100g:  _selectedFoodItem.protein_per_100g  || 0,
      carbs_per_100g:    _selectedFoodItem.carbs_per_100g    || 0,
      fat_per_100g:      _selectedFoodItem.fat_per_100g      || 0,
      typical_serving_g: _selectedFoodItem.typical_serving_g || 100,
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

function renderRSFavoritesView() {
  const container = document.getElementById('rs-favorites-content');
  if (!container) return;
  container.innerHTML = '';

  const favorites  = DB.getFavorites();
  const frequents  = DB.getFrequentItems(8);

  // ── Favoritos ──
  const favResolved = favorites.map(fav => resolveItemLabel(fav)).filter(Boolean);
  if (favResolved.length > 0) {
    const title = document.createElement('div');
    title.className = 'rs-fav-section-title';
    title.textContent = '⭐ Tus favoritos';
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

  // ── Frecuentes ──
  const freqResolved = frequents.map(f => resolveItemLabel(f)).filter(Boolean);
  if (freqResolved.length > 0) {
    const title2 = document.createElement('div');
    title2.className = 'rs-fav-section-title';
    title2.textContent = '🔥 Más usados (últimos 30 días)';
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
    container.innerHTML = '<div class="rs-result-empty">Aún no tienes favoritos ni frecuentes.<br>Regístra alimentos para que aparezcan aquí 🌱</div>';
  }
}
function resolveItemLabel({ type, reference_id }) {
  const emojis = { desayuno:'🌅', almuerzo:'🍽️', cena:'🌙', merienda:'🥪', food_item:'🥗', liquid:'💧' };
  if (type === 'meal') {
    const r = DB.getRecipeById(reference_id);
    if (!r) return null;
    return { label: r.name, emoji: emojis[r.meal_type] || '🍳', fav: { type, reference_id } };
  }
  if (type === 'food_item') {
    const fi = DB.getFoodItemById(reference_id);
    if (!fi) return null;
    return { label: fi.name, emoji: '🥗', fav: { type, reference_id } };
  }
  if (type === 'ingredient') {
    const ing = DB.getIngredientById(reference_id);
    if (!ing) return null;
    return { label: ing.name, emoji: '🥕', fav: { type, reference_id } };
  }
  return null;
}
function quickRegisterFav({ type, reference_id }) {
  if (type === 'meal') {
    DB.addFoodLog({ type: 'meal', reference_id, planned: false });
    const r = DB.getRecipeById(reference_id);
    showToast(`✅ ${r?.name || 'Receta'} registrada`);
  } else if (type === 'food_item') {
    const fi = DB.getFoodItemById(reference_id);
    const qty = fi?.typical_serving_g || 100;
    DB.addFoodLog({ type: 'food_item', reference_id, quantity_g: qty, planned: false });
    showToast(`✅ ${fi?.name || 'Alimento'} (${qty}g) registrado`);
  }
  closeRegisterSheet();
  renderDiaryScreen();
  renderDailyMacros();
}

