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

  // Recordatorios de Comidas y Notificaciones Locales
  renderNotificationsSettings();

  // Metas nutricionales
  renderGoalsSettings();

  // Estado de API Key de IA
  renderAIKeySettings();

  // Almacenamiento y Respaldo Local
  renderStorageManager();
}

function renderNotificationsSettings() {
  const container = document.getElementById('notif-reminders-list');
  const banner = document.getElementById('notif-permission-banner');
  const btnTest = document.getElementById('btn-test-notification');

  if (!container || !window.NotificationService) return;

  const perm = window.NotificationService.getPermission();

  // 1. Render Banner de Permisos
  if (banner) {
    if (perm === 'granted') {
      banner.className = 'notif-permission-banner granted';
      banner.innerHTML = `
        <div class="notif-perm-icon">🟢</div>
        <div class="notif-perm-text">
          <strong>Notificaciones activas</strong>
          <span>Recibirás los recordatorios en este dispositivo.</span>
        </div>
      `;
    } else if (perm === 'denied') {
      banner.className = 'notif-permission-banner denied';
      banner.innerHTML = `
        <div class="notif-perm-icon">⚠️</div>
        <div class="notif-perm-text">
          <strong>Permiso bloqueado</strong>
          <span>Habilita las notificaciones en los ajustes de tu navegador para recibir alertas.</span>
        </div>
      `;
    } else {
      banner.className = 'notif-permission-banner default';
      banner.innerHTML = `
        <div class="notif-perm-icon">🔔</div>
        <div class="notif-perm-text">
          <strong>Activa los recordatorios</strong>
          <span>Tú registra. Nosotros hacemos las cuentas 🥑</span>
        </div>
        <button type="button" class="btn-enable-notif" id="btn-enable-notif">Permitir</button>
      `;
      const btnEnable = banner.querySelector('#btn-enable-notif');
      if (btnEnable) {
        btnEnable.onclick = async () => {
          await window.NotificationService.requestPermission();
          renderNotificationsSettings();
        };
      }
    }
  }

  // 2. Render Lista de Recordatorios
  container.innerHTML = '';
  const reminders = window.NotificationService.getReminders();
  const copyMatrix = window.NOTIFICATION_COPY_MATRIX || {};

  Object.entries(copyMatrix).forEach(([mealKey, meta]) => {
    const config = reminders[mealKey] || { enabled: false, time: '08:00' };
    const sampleCopy = meta.variants?.warm?.body || meta.variants?.minimal?.body || '';

    const row = document.createElement('div');
    row.className = `notif-reminder-row ${config.enabled ? 'active' : ''}`;
    row.innerHTML = `
      <div class="notif-row-left">
        <span class="notif-meal-emoji">${meta.emoji}</span>
        <div class="notif-meal-info">
          <div class="notif-meal-label">${meta.label}</div>
          <div class="notif-meal-preview">"${sampleCopy}"</div>
        </div>
      </div>
      <div class="notif-row-controls">
        <input type="time" class="notif-time-input" value="${config.time || '08:00'}" aria-label="Hora de ${meta.label}">
        <label class="notif-switch" title="${config.enabled ? 'Desactivar recordatorio' : 'Activar recordatorio'}">
          <input type="checkbox" class="notif-switch-input" ${config.enabled ? 'checked' : ''} aria-label="Activar ${meta.label}">
          <span class="notif-switch-slider"></span>
        </label>
      </div>
    `;

    // Eventos
    const timeInput = row.querySelector('.notif-time-input');
    const switchInput = row.querySelector('.notif-switch-input');

    if (timeInput) {
      timeInput.onchange = () => {
        window.NotificationService.updateReminder(mealKey, { time: timeInput.value });
        if (typeof showToast === 'function') showToast(`⏰ Hora de ${meta.label} ajustada a ${timeInput.value}`);
      };
    }

    if (switchInput) {
      switchInput.onchange = async () => {
        const isChecked = switchInput.checked;
        if (isChecked && window.NotificationService.getPermission() !== 'granted') {
          const res = await window.NotificationService.requestPermission();
          if (res !== 'granted') {
            switchInput.checked = false;
            return;
          }
          renderNotificationsSettings();
        }
        window.NotificationService.updateReminder(mealKey, { enabled: isChecked });
        row.classList.toggle('active', isChecked);
        if (typeof showToast === 'function') {
          showToast(isChecked ? `🔔 Recordatorio de ${meta.label} activado` : `🔕 Recordatorio de ${meta.label} desactivado`);
        }
      };
    }

    container.appendChild(row);
  });

  // 3. Botón de prueba local (inmediata)
  if (btnTest) {
    btnTest.onclick = async () => {
      if (window.NotificationService.getPermission() !== 'granted') {
        const res = await window.NotificationService.requestPermission();
        if (res !== 'granted') return;
        renderNotificationsSettings();
      }
      window.NotificationService.sendTestNotification();
      if (typeof showToast === 'function') showToast('🔔 Notificación de prueba enviada');
    };
  }

  // 4. Cloudflare Worker Sync (Modo segundo plano / pantalla bloqueada)
  const workerInput = document.getElementById('notif-worker-url');
  const btnSync = document.getElementById('btn-sync-cloudflare');
  const badgeBg = document.getElementById('notif-bg-badge');
  const testRow = document.getElementById('notif-bg-test-row');
  const btnTestPush = document.getElementById('btn-test-cloud-push');

  if (workerInput) {
    const savedUrl = window.NotificationService.getWorkerUrl();
    if (savedUrl) {
      workerInput.value = savedUrl;
    }
  }

  // Verificar estado de suscripción Push en segundo plano
  if (window.NotificationService.isPushSubscribed) {
    window.NotificationService.isPushSubscribed().then(isSub => {
      const hasUrl = !!(workerInput && workerInput.value.trim());
      if (isSub && hasUrl) {
        if (badgeBg) {
          badgeBg.textContent = '🟢 Conectado';
          badgeBg.className = 'notif-bg-badge connected';
        }
        if (testRow) testRow.style.display = 'flex';
      } else {
        if (badgeBg) {
          badgeBg.textContent = 'No conectado';
          badgeBg.className = 'notif-bg-badge';
        }
        if (testRow) testRow.style.display = 'none';
      }
    });
  }

  if (btnSync && workerInput) {
    btnSync.onclick = async () => {
      const url = workerInput.value.trim();
      if (!url) {
        if (typeof showToast === 'function') showToast('⚠️ Ingresa la URL de tu Cloudflare Worker');
        workerInput.focus();
        return;
      }

      btnSync.disabled = true;
      btnSync.textContent = 'Conectando...';

      try {
        const res = await window.NotificationService.syncWithCloudflare(url);
        if (typeof showToast === 'function') {
          showToast('☁️ ¡Conectado a Cloudflare! Recordatorios en segundo plano activos 🥑');
        }
        if (badgeBg) {
          badgeBg.textContent = '🟢 Conectado';
          badgeBg.className = 'notif-bg-badge connected';
        }
        if (testRow) testRow.style.display = 'flex';
        renderNotificationsSettings();
      } catch (err) {
        console.error('[NutriFlow Sync]', err);
        if (typeof showToast === 'function') {
          showToast(`❌ Error: ${err.message || 'No se pudo sincronizar'}`);
        }
      } finally {
        btnSync.disabled = false;
        btnSync.textContent = 'Sincronizar';
      }
    };
  }

  if (btnTestPush) {
    btnTestPush.onclick = async () => {
      btnTestPush.disabled = true;
      if (typeof showToast === 'function') {
        showToast('📱 Enviando... ¡Bloquea tu pantalla ahora! 🥑');
      }

      try {
        await window.NotificationService.sendTestPushCloudflare();
        setTimeout(() => {
          btnTestPush.disabled = false;
        }, 3000);
      } catch (err) {
        console.error('[NutriFlow Test Push]', err);
        if (typeof showToast === 'function') {
          showToast(`❌ ${err.message || 'Error enviando push'}`);
        }
        btnTestPush.disabled = false;
      }
    };
  }
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
    const cal = liq.calories_per_100ml || liq.calories_per_100g || 0;
    const prot = liq.protein_per_100ml || liq.protein_per_100g || 0;
    const carb = liq.carbs_per_100ml || liq.carbs_per_100g || 0;
    const fat = liq.fat_per_100ml || liq.fat_per_100g || 0;
    const macroStr = cal > 0 ? `<strong style="color:#0284c7;">${cal} kcal/100ml</strong> (P:${prot}g C:${carb}g G:${fat}g)` : '<span style="color:#0284c7;">0 kcal (Hidratación pura)</span>';

    item.innerHTML = `
      <span class="liquid-manage-icon">${liq.icon || '\u{1F4A7}'}</span>
      <div class="liquid-manage-info">
        <div class="liquid-manage-name">${liq.name}</div>
        <div class="liquid-manage-type">${liq.type || 'Agua'} • ${macroStr}</div>
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
    const cal = parseFloat(document.getElementById('liq-cal')?.value) || 0;
    const prot = parseFloat(document.getElementById('liq-prot')?.value) || 0;
    const carb = parseFloat(document.getElementById('liq-carb')?.value) || 0;
    const fat = parseFloat(document.getElementById('liq-fat')?.value) || 0;

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
      calories_per_100ml: cal,
      protein_per_100ml: prot,
      carbs_per_100ml: carb,
      fat_per_100ml: fat,
      goal_ml: 2000,
      current_ml: 0
    };

    if (!window.DB.state.liquids) window.DB.state.liquids = [];
    window.DB.state.liquids.push(newLiquid);
    persistState();

    document.getElementById('liq-icon').value = '';
    document.getElementById('liq-name').value = '';
    document.getElementById('liq-type').value = 'water';
    if (document.getElementById('liq-cal')) document.getElementById('liq-cal').value = '';
    if (document.getElementById('liq-prot')) document.getElementById('liq-prot').value = '';
    if (document.getElementById('liq-carb')) document.getElementById('liq-carb').value = '';
    if (document.getElementById('liq-fat')) document.getElementById('liq-fat').value = '';

    renderLiquidsManager();
    if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
    showToast(`\u2705 "${name}" a\u00F1adido`);
  });
}

function deleteRecipe(recipeId) {
  const recipe = window.DB.getRecipeById(recipeId);
  const name = recipe ? recipe.name : 'esta receta';

  if (recipe && recipe.isCustom) {
    if (!confirm(`¿Deseas eliminar definitivamente "${name}"? Esta acción no se puede deshacer.`)) return;
    window.DB.deleteCustomRecipe(recipeId);
    showToast('🗑️ Receta eliminada');
  } else {
    if (!confirm(`¿Deseas ocultar "${name}" de tu catálogo?`)) return;
    window.DB.toggleHideRecipe(recipeId);
    showToast('👁️ Receta ocultada');
  }

  if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
  if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
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
  const cards = Array.from(document.querySelectorAll('.settings-card'));

  function closeCard(det, fast = false, cb) {
    if (!det || !det.hasAttribute('open')) {
      if (typeof cb === 'function') cb();
      return;
    }
    const b = det.querySelector('.settings-card-body');
    const chev = det.querySelector('.settings-card-chevron');
    if (chev) chev.classList.remove('open');
    det.classList.remove('card-active');

    if (!b) {
      det.removeAttribute('open');
      if (typeof cb === 'function') cb();
      return;
    }

    if (fast) {
      // Cierre inmediato/rápido de la tarjeta anterior para no saturar la CPU con 2 animaciones a la vez
      det.removeAttribute('open');
      b.style.cssText = '';
      if (typeof cb === 'function') cb();
      return;
    }

    // Cierre suave cuando el usuario toca la misma tarjeta para plegarla
    b.style.overflow = 'hidden';
    b.style.height   = b.offsetHeight + 'px';
    b.style.opacity  = '1';

    requestAnimationFrame(() => {
      b.style.transition = 'height 0.20s ease-out, opacity 0.15s ease';
      b.style.height  = '0';
      b.style.opacity = '0';
    });

    setTimeout(() => {
      det.removeAttribute('open');
      b.style.cssText = '';
      if (typeof cb === 'function') cb();
    }, 210);
  }

  cards.forEach(details => {
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

      const isOpen = details.hasAttribute('open');

      function once(fn) {
        let called = false;
        return function() { if (!called) { called = true; fn(); } };
      }

      if (isOpen) {
        // Cerrar esta tarjeta
        closeCard(details, false, () => {
          isAnimating = false;
        });
      } else {
        // 1. Cerrar cualquier otra tarjeta que estuviera abierta de forma limpia
        cards.forEach(otherCard => {
          if (otherCard !== details && otherCard.hasAttribute('open')) {
            closeCard(otherCard, true);
          }
        });

        // 2. Abrir esta tarjeta con transición rápida optimizada para 60fps
        details.setAttribute('open', '');
        details.classList.add('card-active');
        const targetH = body.scrollHeight;

        body.style.overflow = 'hidden';
        body.style.height   = '0';
        body.style.opacity  = '0';

        requestAnimationFrame(() => {
          body.style.transition = 'height 0.24s cubic-bezier(0.2, 0, 0, 1), opacity 0.18s ease 0.04s';
          body.style.height  = targetH + 'px';
          body.style.opacity = '1';
          if (chevron) chevron.classList.add('open');
        });

        const onOpen = once(() => {
          body.removeEventListener('transitionend', onHeightEnd);
          body.style.cssText = '';
          isAnimating = false;

          // Scroll suave solo si el inicio de la tarjeta queda fuera de vista
          setTimeout(() => {
            const rect = details.getBoundingClientRect();
            if (rect.top < 65 || rect.bottom > window.innerHeight) {
              details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 50);
        });

        function onHeightEnd(ev) {
          if (ev.propertyName === 'height') onOpen();
        }
        body.addEventListener('transitionend', onHeightEnd);
        setTimeout(onOpen, 300);
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

// ============================================================
// GESTIÓN DE ALMACENAMIENTO LOCAL Y RESPALDO
// ============================================================

const ACTIVE_PREF_KEYS = [
  'nutriflow_pantry_view',
  'nutriflow_shopping_view',
  'nutriflow_recipes_view',
  'nutriflow_worker_url',
  'nutriflow_last_notified_v1',
  'nf_collapse_upcoming',
  'nf_collapse_needsbuy'
];

function getStorageStats() {
  // En JavaScript (DOMStrings), cada carácter representa una unidad de código UTF-16 (2 bytes de memoria).
  // Multiplicar (key.length + value.length) * 2 es el estándar para medir el uso real en localStorage.
  let totalBytes = 0;
  let nutriFlowBytes = 0;
  let diaryBytes = 0;
  let pantryBytes = 0;
  let prefsBytes = 0;
  let aiBytes = 0;
  let logsBytes = 0;
  let legacyBytes = 0;
  let otherBytes = 0;

  // 1. Desglose del estado principal (nutriflow_state)
  const rawState = localStorage.getItem('nutriflow_state') || '';
  const stateBytes = rawState ? (('nutriflow_state'.length + rawState.length) * 2) : 0;

  if (rawState) {
    try {
      const parsed = JSON.parse(rawState);
      for (const [key, val] of Object.entries(parsed)) {
        if (!val) continue;
        const partBytes = (key.length + JSON.stringify(val).length) * 2;
        if (key === 'foodLogs') {
          diaryBytes += partBytes;
        } else if (['pantry', 'customRecipes', 'customRecipeIngredients', 'customIngredients', 'foodItems', 'recipes', 'ingredients', 'recipe_ingredients'].includes(key)) {
          pantryBytes += partBytes;
        } else if (['userPreferences', 'liquids'].includes(key)) {
          prefsBytes += partBytes;
        } else {
          prefsBytes += partBytes;
        }
      }

      // La envoltura JSON restante ("key": ...) se asigna suavemente a preferencias
      const stateSubtotal = diaryBytes + pantryBytes + prefsBytes;
      if (stateBytes > stateSubtotal) {
        prefsBytes += (stateBytes - stateSubtotal);
      }
    } catch (e) {
      prefsBytes = stateBytes;
    }
  }

  // 2. Desglose de todas las demás claves en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) || '';
    const itemBytes = (key.length + val.length) * 2;
    totalBytes += itemBytes;

    if (key === 'nutriflow_state') {
      // Ya desglosado exactamente arriba
      continue;
    }

    if (key.startsWith('nutriflow_chat') || key.startsWith('nutriflow_ai_summary')) {
      aiBytes += itemBytes;
    } else if (key === 'nutriflow_logs') {
      logsBytes += itemBytes;
    } else if (ACTIVE_PREF_KEYS.includes(key)) {
      prefsBytes += itemBytes;
    } else if (key === 'nutriflow_v2' || (key.startsWith('nutriflow_') && !ACTIVE_PREF_KEYS.includes(key))) {
      // Claves obsoletas de versiones anteriores de la app (ej. nutriflow_v2)
      legacyBytes += itemBytes;
    } else {
      // Clave que no pertenece a NutriFlow (otros proyectos en localhost o claves del navegador)
      otherBytes += itemBytes;
    }
  }

  nutriFlowBytes = diaryBytes + pantryBytes + prefsBytes + aiBytes + logsBytes + legacyBytes;

  const quotaMb = 5;
  const quotaBytes = quotaMb * 1024 * 1024;
  const pct = Math.max(0.1, (totalBytes / quotaBytes) * 100);
  const nutriPct = Math.max(0.1, (nutriFlowBytes / quotaBytes) * 100);

  return {
    totalKb: (totalBytes / 1024).toFixed(1),
    nutriFlowKb: (nutriFlowBytes / 1024).toFixed(1),
    activeNutriFlowKb: ((nutriFlowBytes - legacyBytes) / 1024).toFixed(1),
    quotaMb,
    pct: pct < 1 ? pct.toFixed(1) : Math.round(pct),
    nutriPct: nutriPct < 1 ? nutriPct.toFixed(1) : Math.round(nutriPct),
    diaryKb: (diaryBytes / 1024).toFixed(1),
    pantryKb: (pantryBytes / 1024).toFixed(1),
    prefsKb: (prefsBytes / 1024).toFixed(1),
    aiKb: (aiBytes / 1024).toFixed(1),
    logsKb: (logsBytes / 1024).toFixed(1),
    legacyKb: (legacyBytes / 1024).toFixed(1),
    otherKb: (otherBytes / 1024).toFixed(1),
    hasLegacy: legacyBytes > 0,
    hasOther: otherBytes > 0
  };
}

function renderStorageManager() {
  const summaryEl = document.getElementById('storage-summary-text');
  const badgeEl = document.getElementById('storage-status-badge');
  const barEl = document.getElementById('storage-bar-fill');
  const diaryEl = document.getElementById('storage-kb-diary');
  const pantryEl = document.getElementById('storage-kb-pantry');
  const prefsEl = document.getElementById('storage-kb-prefs');
  const aiEl = document.getElementById('storage-kb-ai');
  const logsEl = document.getElementById('storage-kb-logs');
  const legacyRow = document.getElementById('storage-row-legacy');
  const legacyEl = document.getElementById('storage-kb-legacy');
  const otherRow = document.getElementById('storage-row-other');
  const otherEl = document.getElementById('storage-kb-other');

  if (!summaryEl) return;

  const stats = getStorageStats();

  if (stats.hasOther) {
    summaryEl.textContent = `NutriFlow: ${stats.nutriFlowKb} KB · Total en navegador: ${stats.totalKb} KB de ${stats.quotaMb} MB (${stats.pct}%)`;
  } else {
    summaryEl.textContent = `${stats.totalKb} KB de ${stats.quotaMb} MB utilizados (${stats.pct}%)`;
  }
  
  if (barEl) {
    barEl.style.width = `${Math.max(1, Math.min(100, parseFloat(stats.pct)))}%`;
  }

  if (badgeEl) {
    const numPct = parseFloat(stats.pct);
    if (numPct < 60) {
      badgeEl.textContent = 'Óptimo ✨';
      badgeEl.className = 'storage-status-badge optimal';
    } else if (numPct < 85) {
      badgeEl.textContent = 'Atención ⚠️';
      badgeEl.className = 'storage-status-badge warning';
    } else {
      badgeEl.textContent = 'Casi lleno 🔴';
      badgeEl.className = 'storage-status-badge critical';
    }
  }

  if (diaryEl) diaryEl.textContent = `${stats.diaryKb} KB`;
  if (pantryEl) pantryEl.textContent = `${stats.pantryKb} KB`;
  if (prefsEl) prefsEl.textContent = `${stats.prefsKb} KB`;
  if (aiEl) aiEl.textContent = `${stats.aiKb} KB`;
  if (logsEl) logsEl.textContent = `${stats.logsKb} KB`;

  if (legacyRow && legacyEl) {
    if (stats.hasLegacy) {
      legacyRow.style.display = 'flex';
      legacyEl.textContent = `${stats.legacyKb} KB`;
    } else {
      legacyRow.style.display = 'none';
    }
  }

  if (otherRow && otherEl) {
    if (stats.hasOther) {
      otherRow.style.display = 'flex';
      otherEl.textContent = `${stats.otherKb} KB`;
    } else {
      otherRow.style.display = 'none';
    }
  }
}

function exportBackupData() {
  try {
    const state = (window.DB && window.DB.state) ? window.DB.state : JSON.parse(localStorage.getItem('nutriflow_state') || '{}');
    const backup = {
      app: 'NutriFlow',
      version: '6.0',
      exportedAt: new Date().toISOString(),
      state: state,
      // Propiedades de primer nivel para total compatibilidad con la importación
      ingredients: state.customIngredients || [],
      recipes: state.customRecipes || [],
      recipe_ingredients: state.customRecipeIngredients || [],
      liquids: state.liquids || [],
      pantry: state.pantry || [],
      foodLogs: state.foodLogs || [],
      userPreferences: state.userPreferences || {}
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    a.href = url;
    a.download = `nutriflow_respaldo_${datePart}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('📥 Copia de seguridad exportada');
  } catch (err) {
    console.error('[NutriFlow Storage] Error al exportar respaldo:', err);
    if (typeof showToast === 'function') showToast('⚠️ Error al generar copia de seguridad');
  }
}

function initStorageManager() {
  const btnExport = document.getElementById('btn-export-backup');
  if (btnExport) {
    btnExport.onclick = (e) => {
      e.stopPropagation();
      exportBackupData();
    };
  }

  const btnPurge = document.getElementById('btn-purge-legacy');
  if (btnPurge) {
    btnPurge.onclick = (e) => {
      e.stopPropagation();
      try {
        localStorage.removeItem('nutriflow_v2');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nutriflow_v') && key !== 'nutriflow_state') {
            localStorage.removeItem(key);
          }
        }
      } catch (err) {}
      if (typeof showToast === 'function') {
        showToast('🧹 Datos antiguos de v2 eliminados');
      }
      renderStorageManager();
    };
  }

  const debugCard = document.getElementById('scard-debug');
  if (debugCard) {
    const header = debugCard.querySelector('.settings-card-header');
    if (header) {
      header.addEventListener('click', () => {
        setTimeout(renderStorageManager, 50);
      });
    }
  }
}

// Inicializar al cargar el documento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStorageManager);
} else {
  initStorageManager();
}

