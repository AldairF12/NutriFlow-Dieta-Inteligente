// ============================================================
// app.js — Lógica principal de la aplicación v2
// ============================================================

let _isTabSwitching = false;

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initNavigation();
  _isTabSwitching = true;
  renderDiaryScreen();
  renderRecipesScreen();
  renderPantryScreen();
  renderProfileScreen();
  _isTabSwitching = false;
});

// ──────────────────────────────────────────────
// NAVEGACIÓN
// ──────────────────────────────────────────────
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens  = document.querySelectorAll('.screen');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.screen;
      navItems.forEach(n => n.classList.remove('active'));
      screens.forEach(s  => { s.classList.remove('active'); s.scrollTop = 0; });
      item.classList.add('active');
      const activeScreen = document.getElementById(`screen-${target}`);
      activeScreen.classList.add('active');
      activeScreen.scrollTop = 0;
      window.scrollTo(0, 0);

      _isTabSwitching = true;
      if (target === 'diary')     renderDiaryScreen();
      if (target === 'recipes')   renderRecipesScreen();
      if (target === 'pantry')    renderPantryScreen();
      if (target === 'dashboard') renderDashboardScreen();
      if (target === 'profile')   renderProfileScreen();
      _isTabSwitching = false;
    });
  });
}

// ──────────────────────────────────────────────
// AUXILIAR: LIMPIEZA DE CLASES DE ANIMACIÓN DE ENTRADA
// ──────────────────────────────────────────────
function cleanupAnimationClasses() {
  setTimeout(() => {
    document.querySelectorAll('.section-entering, .section-appearing, .item-entering').forEach(el => {
      el.classList.remove('section-entering', 'section-appearing', 'item-entering');
    });
  }, 850);
}

// ──────────────────────────────────────────────
// PANTALLA: DIARIO
// ──────────────────────────────────────────────
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

function animateNumber(elementId, targetValue, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const currentText = el.textContent || '';
  const currentVal = parseFloat(currentText.replace(/[^\d.]/g, '')) || 0;
  const targetVal = parseFloat(targetValue) || 0;

  if (currentVal === targetVal) {
    el.textContent = targetVal + suffix;
    return;
  }

  const duration = 350;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = progress * (2 - progress); // easeOutQuad
    const val = Math.round(currentVal + (targetVal - currentVal) * eased);
    el.textContent = val + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = targetVal + suffix;
    }
  }
  requestAnimationFrame(update);
}

function renderDailyMacros() {
  const m = getDailyMacroSummary();
  animateNumber('macro-cal', m.calories, ' kcal');
  animateNumber('macro-prot', m.protein, 'g');
  animateNumber('macro-carb', m.carbs, 'g');
  animateNumber('macro-fat', m.fat, 'g');
}

// ──────────────────────────────────────────────
// SECCIÓN DE HIDRATACIÓN
// ──────────────────────────────────────────────
// compact=true cuando va debajo de recetas (no es el elemento principal)
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

// ──────────────────────────────────────────────
// SECCIÓN UPCOMING (próxima comida)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// SECCIÓN DE RECETAS
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// DONUT CHART SVG
// ──────────────────────────────────────────────
function buildMacroChart(macros) {
  const SIZE   = 68;
  const R      = 24;
  const STROKE = 7;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const CIRC   = 2 * Math.PI * R;

  const protKcal = macros.protein * 4;
  const carbKcal = macros.carbs   * 4;
  const fatKcal  = macros.fat     * 9;
  const total    = protKcal + carbKcal + fatKcal || 1;

  const protPct  = protKcal / total;
  const carbPct  = carbKcal / total;
  const fatPct   = fatKcal  / total;

  // Calcular los dasharray y offset de cada segmento
  function segment(pct, offset) {
    const dash = pct * CIRC;
    const gap  = CIRC - dash;
    return { dash, gap, offset };
  }

  const seg1 = segment(protPct, 0);
  const seg2 = segment(carbPct, -(protPct * CIRC));
  const seg3 = segment(fatPct,  -((protPct + carbPct) * CIRC));

  // Rotación para comenzar en la parte superior
  const rotate = -90;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('width', SIZE);
  svg.setAttribute('height', SIZE);
  svg.style.overflow = 'visible';

  // Pista de fondo
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', CX); track.setAttribute('cy', CY);
  track.setAttribute('r', R); track.setAttribute('fill', 'none');
  track.setAttribute('stroke', '#f0f0f5'); track.setAttribute('stroke-width', STROKE);
  svg.appendChild(track);

  // Donut con colores pastel
  const colors = ['#93c5fd', '#fcd9a0', '#f9a8d4'];
  const shadows = [
    'drop-shadow(0 1px 3px rgba(147,197,253,0.70))',
    'drop-shadow(0 1px 3px rgba(252,217,160,0.70))',
    'drop-shadow(0 1px 3px rgba(249,168,212,0.70))'
  ];
  const segs = [seg1, seg2, seg3];

  segs.forEach((s, i) => {
    if (s.dash < 0.5) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CX); circle.setAttribute('cy', CY);
    circle.setAttribute('r', R); circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', colors[i]);
    circle.setAttribute('stroke-width', STROKE);
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('stroke-dasharray', `${s.dash} ${s.gap}`);
    circle.setAttribute('stroke-dashoffset', s.offset);
    circle.setAttribute('transform', `rotate(${rotate} ${CX} ${CY})`);
    circle.style.filter = shadows[i];
    circle.style.transition = 'stroke-dasharray 0.4s ease';
    svg.appendChild(circle);
  });

  // Wrapper con texto central
  const wrap = document.createElement('div');
  wrap.className = 'donut-wrap';
  wrap.style.width = SIZE + 'px';
  wrap.style.height = SIZE + 'px';
  wrap.appendChild(svg);

  const center = document.createElement('div');
  center.className = 'donut-center-text';
  center.innerHTML = `
    <span class="donut-kcal">${macros.calories}</span>
    <span class="donut-lbl">kcal</span>
  `;
  wrap.appendChild(center);

  // Leyenda
  const legend = document.createElement('div');
  legend.className = 'macro-legend';
  const items = [
    { cls: 'prot', label: 'Proteína', val: macros.protein + 'g' },
    { cls: 'carb', label: 'Carbos',   val: macros.carbs   + 'g' },
    { cls: 'fat',  label: 'Grasa',    val: macros.fat     + 'g' },
  ];
  items.forEach(it => {
    legend.innerHTML += `
      <div class="legend-item">
        <span class="legend-dot ${it.cls}"></span>
        <span class="legend-label">${it.label}</span>
        <span class="legend-val">${it.val}</span>
      </div>`;
  });

  // Área completa
  const area = document.createElement('div');
  area.className = 'macro-chart-area';
  area.appendChild(wrap);
  area.appendChild(legend);
  return area;
}

function buildEmptyState(msg) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `<div class="empty-icon">🌿</div><p>${msg}</p>`;
  return div;
}

function getMealTypeEmoji(type) {
  const m = { desayuno: '🌅', almuerzo: '☀️', merienda: '🍎', cena: '🌙' };
  return m[type] || '🍽️';
}

// ──────────────────────────────────────────────
// REGISTRAR COMIDA / LÍQUIDO
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// MODAL DE DETALLE DE RECETA
// ──────────────────────────────────────────────
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

document.getElementById('modal-close').addEventListener('click', closeRecipeModal);
document.getElementById('modal-overlay').addEventListener('click', closeRecipeModal);

// ──────────────────────────────────────────────
// POPOVER DE AJUSTE DE INGREDIENTE
// ──────────────────────────────────────────────
let _popoverIngId    = null;
let _popoverRecipe   = null;
let _popoverQty      = 0;

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

// ──────────────────────────────────────────────
// DESPENSA · FILTRO Y BÚSQUEDA
// ──────────────────────────────────────────────
let _pantryFilterActive = false;
let _pantrySearchQuery  = '';

function initPantryToolbar() {
  const searchInput = document.getElementById('pantry-search');
  const filterBtn   = document.getElementById('btn-pantry-filter');
  if (!searchInput || !filterBtn) return;

  searchInput.addEventListener('input', () => {
    _pantrySearchQuery = searchInput.value.trim().toLowerCase();
    renderPantryScreen();
  });

  filterBtn.addEventListener('click', () => {
    _pantryFilterActive = !_pantryFilterActive;
    filterBtn.classList.toggle('active', _pantryFilterActive);
    filterBtn.setAttribute('aria-pressed', String(_pantryFilterActive));
    renderPantryScreen();
  });
}

function pantryItemVisible(ing) {
  if (_pantrySearchQuery && !ing.name.toLowerCase().includes(_pantrySearchQuery)) return false;
  if (_pantryFilterActive) {
    const item = DB.getPantryItem(ing.id);
    const qty  = item ? item.quantity_available : 0;
    // Usar la misma lógica que getMissingIngredientsList:
    // solo recetas SIN ingredientes no deseados (excluir recetas de disliked)
    const riForIng = DB.state ? DB.state.recipe_ingredients.filter(ri => ri.ingredient_id === ing.id) : [];
    const needed = riForIng.some(ri => {
      if (qty >= ri.quantity) return false; // suficiente stock para esta receta
      return !recipeHasDislikedIngredients(ri.recipe_id);
    });
    if (!needed) return false;
  }
  return true;
}

// ──────────────────────────────────────────────
// LISTA DE COMPRAS (Sheet Modal + FAB)
// ──────────────────────────────────────────────
function getMissingIngredientsList() {
  const map = new Map(); // ingId → { ing, maxNeeded, availQty, recipes[] }

  for (const type of ['desayuno','almuerzo','merienda','cena']) {
    const recipes = DB.recipes.filter(r => r.meal_type === type);
    for (const recipe of recipes) {
      if (recipeHasDislikedIngredients(recipe.id)) continue;
      const ris = DB.getRecipeIngredients(recipe.id);
      for (const ri of ris) {
        const pantry = DB.getPantryItem(ri.ingredient_id);
        const avail  = pantry ? pantry.quantity_available : 0;
        if (avail >= ri.quantity) continue; // OK, no falta
        if (!map.has(ri.ingredient_id)) {
          const ing = DB.getIngredientById(ri.ingredient_id);
          map.set(ri.ingredient_id, { ing, maxNeeded: ri.quantity, availQty: avail, recipes: [recipe.name] });
        } else {
          const entry = map.get(ri.ingredient_id);
          entry.maxNeeded = Math.max(entry.maxNeeded, ri.quantity);
          if (!entry.recipes.includes(recipe.name)) entry.recipes.push(recipe.name);
        }
      }
    }
  }
  return [...map.values()];
}

function updateShoppingFab() {
  const list   = getMissingIngredientsList();
  const badge  = document.getElementById('shopping-fab-badge');
  const icon   = document.getElementById('shopping-fab-icon');
  const count  = list.length;
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  if (icon) {
    if (count > 0) {
      icon.classList.remove('cart-sleepy');
      icon.classList.add('cart-lively');
    } else {
      icon.classList.remove('cart-lively');
      icon.classList.add('cart-sleepy');
    }
  }
}

function renderShoppingList(isFirstOpen) {
  const body = document.getElementById('shopping-list-body');
  if (!body) return;
  const list = getMissingIngredientsList();

  body.innerHTML = '';

  if (list.length === 0) {
    body.innerHTML = `
      <div class="shopping-empty">
        <span class="shopping-empty-icon">🎉</span>
        Tienes todo lo necesario en tu despensa.
      </div>`;
  } else {
    list.forEach(({ ing, maxNeeded, availQty, recipes }) => {
      if (!ing) return;
      const item = document.createElement('div');
      item.className = 'shopping-item';
      item.dataset.ingId = ing.id;
      if (isFirstOpen) item.classList.add('item-entering');
      item.innerHTML = `
        <div class="shopping-item-check"></div>
        <div class="shopping-item-info">
          <div class="shopping-item-name">${ing.name}</div>
          <div class="shopping-item-detail">Tienes ${availQty}g · Necesitas mín. ${maxNeeded}g</div>
          <div class="shopping-item-recipes">En: ${recipes.slice(0, 2).join(', ')}${recipes.length > 2 ? ' +' + (recipes.length - 2) + ' más' : ''}</div>
        </div>
        <span class="shopping-item-arrow">›</span>
      `;
      item.addEventListener('click', () => {
        openIngredientPopover(ing.id, ing.name, maxNeeded, null);
      });
      body.appendChild(item);
    });
  }
}

function openShoppingModal() {
  const overlay = document.getElementById('shopping-overlay');
  const modal  = document.getElementById('shopping-modal');

  renderShoppingList(true);

  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeShoppingModal() {
  const modal   = document.getElementById('shopping-modal');
  const overlay = document.getElementById('shopping-overlay');
  overlay.classList.remove('open');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  // Limpiar estilos inline del swipe para no interferir con futuras aperturas
  setTimeout(() => {
    modal.style.transform  = '';
    modal.style.transition = '';
    overlay.style.opacity  = '';
    overlay.style.transition = '';
  }, 450);
}

function initShoppingModal() {
  document.getElementById('btn-shopping-fab').addEventListener('click', openShoppingModal);
  document.getElementById('shopping-close').addEventListener('click', closeShoppingModal);
  document.getElementById('shopping-overlay').addEventListener('click', closeShoppingModal);
  initShoppingModalGestures();
}

function initShoppingModalGestures() {
  const modal  = document.getElementById('shopping-modal');
  const handle = modal.querySelector('.modal-handle');
  const header = modal.querySelector('.shopping-modal-header');

  let startY = 0, currentY = 0, isDragging = false;

  function onTouchStart(e) {
    if (e.target.closest('.modal-close')) { isDragging = false; return; }
    startY = e.touches[0].clientY;
    isDragging = true;
    modal.style.transition = 'none';
    const overlay = document.getElementById('shopping-overlay');
    overlay.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      currentY = deltaY;
      modal.style.transform = `translateX(-50%) translate3d(0, ${currentY}px, 0)`;
      const overlay = document.getElementById('shopping-overlay');
      const progress = Math.min(1, currentY / 300);
      overlay.style.opacity = (1 - progress * 0.85).toString();
    } else {
      currentY = 0;
      modal.style.transform = 'translateX(-50%) translate3d(0, 0, 0)';
    }
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    modal.style.transition = 'transform 0.42s cubic-bezier(0.32,0.72,0,1)';
    const overlay = document.getElementById('shopping-overlay');
    overlay.style.transition = 'opacity 0.4s ease';
    if (currentY > 110) {
      modal.style.transform = 'translateX(-50%) translate3d(0, 105%, 0)';
      overlay.style.opacity = '0';
      closeShoppingModal();
    } else {
      modal.style.transform = 'translateX(-50%) translate3d(0, 0, 0)';
      overlay.style.opacity = '';
    }
    currentY = 0;
  }

  [handle, header].forEach(el => {
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: true });
    el.addEventListener('touchend',   onTouchEnd);
  });
}

// ──────────────────────────────────────────────
// PANTALLA: RECETAS
// ──────────────────────────────────────────────
function renderRecipesScreen() {
  const container = document.getElementById('recipes-list');
  container.innerHTML = '';

  ['desayuno','almuerzo','merienda','cena'].forEach(type => {
    const list = DB.recipes.filter(r => r.meal_type === type);
    if (!list.length) return;

    const section = document.createElement('section');
    section.className = 'content-section';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = getMealTypeEmoji(type) + ' ' + type.charAt(0).toUpperCase() + type.slice(1);
    section.appendChild(title);

    const row = document.createElement('div');
    row.className = 'cards-row';
    list.forEach(recipe => {
      const macros = calcRecipeMacros(recipe.id);
      const pantryCheck = checkPantryForRecipe(recipe.id);
      const card = buildRecipeCard({ ...recipe, macros, pantryCheck }, pantryCheck.canCook);

      // Botón borrar — sólo en pantalla Recetas
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-recipe';
      delBtn.title = 'Eliminar receta';
      delBtn.textContent = '×';
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
    container.appendChild(section);
  });
  cleanupAnimationClasses();
}

function updateRecipeCardState(recipeId) {
  const cards = document.querySelectorAll(`.card-recipe[data-recipe-id="${recipeId}"]`);
  cards.forEach(card => {
    const todayLogs = DB.getTodayLogs().filter(l => l.type === 'meal' && l.reference_id === recipeId);
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
          removeMealLog(recipeId, DB.getRecipeById(recipeId).name);
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

    card.classList.add('card-shine-effect');
    setTimeout(() => card.classList.remove('card-shine-effect'), 800);
  });
}

// ──────────────────────────────────────────────
// PANTALLA: DESPENSA
// ──────────────────────────────────────────────
function renderPantryScreen() {
  const container = document.getElementById('pantry-list');
  container.innerHTML = '';

  // Mantener sincronizado el UI del toolbar con el estado actual
  const searchInput = document.getElementById('pantry-search');
  const filterBtn   = document.getElementById('btn-pantry-filter');
  if (searchInput && searchInput.value.trim() !== _pantrySearchQuery) {
    // No sobreescribir el valor del usuario si está escribiendo
  }
  if (filterBtn) filterBtn.classList.toggle('active', _pantryFilterActive);

  let anyVisible = false;
  DB.ingredients.forEach(ing => {
    if (!pantryItemVisible(ing)) return;
    anyVisible = true;
    const item = DB.getPantryItem(ing.id);
    let qty  = item ? item.quantity_available : 0;
    const cls  = qty === 0 ? 'qty-zero' : qty < 100 ? 'qty-low' : 'qty-ok';

    const el = document.createElement('div');
    el.className = 'pantry-item';
    el.dataset.id = ing.id;
    if (_isTabSwitching) el.classList.add('item-entering');
    el.innerHTML = `
      <div class="pantry-info">
        <div class="pantry-name">${ing.name}</div>
        <div class="pantry-category">${ing.category}</div>
        <div class="pantry-cal">${ing.calories_per_100g} kcal/100g</div>
      </div>
      <div class="pantry-controls">
        <span class="pantry-qty ${cls}">${qty}g</span>
        <div class="pantry-btns">
          <button class="btn-qty btn-minus" aria-label="Reducir ${ing.name}">−</button>
          <button class="btn-qty btn-plus" aria-label="Agregar ${ing.name}">+</button>
        </div>
      </div>
    `;

    const handleQtyChange = (delta) => {
      let newQty;
      if (delta > 0) {
        newQty = qty % 50 === 0 ? qty + 50 : Math.ceil(qty / 50) * 50;
      } else {
        newQty = qty % 50 === 0 ? Math.max(0, qty - 50) : Math.floor(qty / 50) * 50;
      }
      DB.updatePantryQuantity(ing.id, newQty);
      
      const isStillVisible = pantryItemVisible(ing);
      if (isStillVisible) {
        qty = newQty;
        const qtySpan = el.querySelector('.pantry-qty');
        if (qtySpan) {
          qtySpan.textContent = `${newQty}g`;
          qtySpan.className = `pantry-qty ${newQty === 0 ? 'qty-zero' : newQty < 100 ? 'qty-low' : 'qty-ok'}`;
          qtySpan.classList.remove('btn-pop-feedback');
          void qtySpan.offsetWidth; // trigger reflow to restart pop animation
          qtySpan.classList.add('btn-pop-feedback');
        }
        renderRecipesScreen();
        renderDiaryScreen();
        updateShoppingFab();
      } else {
        el.classList.add('checked-out');
        setTimeout(() => {
          renderPantryScreen();
          renderRecipesScreen();
          renderDiaryScreen();
          updateShoppingFab();
        }, 350);
      }
    };

    el.querySelector('.btn-minus').addEventListener('click', () => handleQtyChange(-50));
    el.querySelector('.btn-plus').addEventListener('click', () => handleQtyChange(50));

    container.appendChild(el);
  });

  if (!anyVisible) {
    const msg = document.createElement('div');
    msg.className = 'empty-state';
    msg.style.padding = '40px 24px';
    msg.innerHTML = `<div class="empty-icon">${_pantryFilterActive ? '✅' : '🔍'}</div>
      <p>${_pantryFilterActive ? '¡Todo en orden! No faltan ingredientes.' : 'No hay ingredientes que coincidan.'}</p>`;
    container.appendChild(msg);
  }
  cleanupAnimationClasses();
}

// ──────────────────────────────────────────────
// PANTALLA: PERFIL
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// EDITOR DE HORAS DE COMIDA
// ──────────────────────────────────────────────
const MEAL_LABELS = {
  desayuno: { emoji: '🌅', label: 'Desayuno'  },
  almuerzo: { emoji: '☀️', label: 'Almuerzo'  },
  merienda: { emoji: '🍎', label: 'Merienda'  },
  cena:     { emoji: '🌙', label: 'Cena'      },
};

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

// ──────────────────────────────────────────────
// GESTIÓN DE LÍQUIDOS
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// ELIMINAR RECETA
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// IMPORTAR JSON
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// Inicializar import y formulario de líquidos después del DOM
document.addEventListener('DOMContentLoaded', () => {
  initImport();
  initLiquidForm();
  initModalGestures();
  initIngredientPopover();
  initPantryToolbar();
  initShoppingModal();
  updateShoppingFab();
  initSettingsCardAccordions();
  initGoalsForm();
  initAIKeyForm();
  initAIChat();
  initDashboardAIBtn();
  initRegisterSheet();
});

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

// ──────────────────────────────────────────────
// PANTALLA: DASHBOARD
// ──────────────────────────────────────────────
function renderDashboardScreen() {
  const consumed = getDailyMacroSummary();
  const goals    = DB.userPreferences.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };

  // Fecha
  const dateEl = document.getElementById('dash-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Anillo de calorías ─────────────────────────────────────
  renderCaloriesRing(consumed.calories, goals.calories);

  // ── Barras de macros ───────────────────────────────────────
  renderMacroBars(consumed, goals);

  // ── Plan vs Extras ─────────────────────────────────────────
  renderPlanVsExtra();

  // ── Timeline ───────────────────────────────────────────────
  renderDashTimeline();
}

function renderCaloriesRing(consumed, goal) {
  const container = document.getElementById('dash-calories-ring');
  if (!container) return;

  const SIZE = 160;
  const R    = 62;
  const STROKE = 14;
  const CX = SIZE / 2, CY = SIZE / 2;
  const CIRC = 2 * Math.PI * R;
  const pct  = Math.min(1, consumed / goal);
  const dash = pct * CIRC;
  const gap  = CIRC - dash;

  // Color dinámico según avance
  const hue = pct < 0.5 ? 142 : pct < 0.85 ? 38 : pct < 1 ? 20 : 0;
  const color = `hsl(${hue}, 72%, 52%)`;

  container.innerHTML = `
    <div class="dash-ring-wrap">
      <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${STROKE}" />
        <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
          stroke="${color}"
          stroke-width="${STROKE}"
          stroke-linecap="round"
          stroke-dasharray="${dash} ${gap}"
          stroke-dashoffset="${CIRC * 0.25}"
          transform="rotate(-90 ${CX} ${CY})"
          style="transition: stroke-dasharray 0.7s cubic-bezier(0.34,1.56,0.64,1); filter: drop-shadow(0 0 8px ${color}88)" />
      </svg>
      <div class="dash-ring-center">
        <span class="dash-ring-val">${consumed}</span>
        <span class="dash-ring-unit">kcal</span>
        <span class="dash-ring-goal">/ ${goal}</span>
      </div>
    </div>
    <div class="dash-ring-labels">
      <div class="dash-ring-label-item">
        <span class="dash-ring-pct" style="color:${color}">${Math.round(pct * 100)}%</span>
        <span class="dash-ring-lbl">completado</span>
      </div>
      <div class="dash-ring-label-item">
        <span class="dash-ring-pct">${Math.max(0, goal - consumed)}</span>
        <span class="dash-ring-lbl">kcal restantes</span>
      </div>
    </div>
  `;
}

function renderMacroBars(consumed, goals) {
  const container = document.getElementById('dash-macros-bars');
  if (!container) return;

  const macros = [
    { label: 'Proteína',      key: 'protein', consumed: consumed.protein, goal: goals.protein, unit: 'g',   color: '#93c5fd', icon: '💪' },
    { label: 'Carbohidratos', key: 'carbs',   consumed: consumed.carbs,   goal: goals.carbs,   unit: 'g',   color: '#fcd9a0', icon: '🌾' },
    { label: 'Grasas',        key: 'fat',     consumed: consumed.fat,     goal: goals.fat,     unit: 'g',   color: '#f9a8d4', icon: '🥑' },
  ];

  container.innerHTML = macros.map(m => {
    const pct = Math.min(100, Math.round((m.consumed / (m.goal || 1)) * 100));
    return `
      <div class="dash-macro-bar-row">
        <div class="dash-macro-bar-info">
          <span class="dash-macro-bar-icon">${m.icon}</span>
          <span class="dash-macro-bar-label">${m.label}</span>
          <span class="dash-macro-bar-val">${m.consumed}${m.unit} <span class="dash-macro-bar-goal">/ ${m.goal}${m.unit}</span></span>
        </div>
        <div class="dash-macro-bar-track">
          <div class="dash-macro-bar-fill" style="width:${pct}%; background:${m.color}; box-shadow: 0 0 8px ${m.color}88;"></div>
        </div>
        <span class="dash-macro-bar-pct">${pct}%</span>
      </div>
    `;
  }).join('');
}

function renderDashTimeline() {
  const container = document.getElementById('dash-timeline-list');
  if (!container) return;

  const todayLogs = DB.getTodayLogs();
  const mealLogs     = todayLogs.filter(l => l.type === 'meal');
  const liqLogs      = todayLogs.filter(l => l.type === 'liquid');
  const foodItemLogs = todayLogs.filter(l => l.type === 'food_item');

  if (mealLogs.length === 0 && liqLogs.length === 0 && foodItemLogs.length === 0) {
    container.innerHTML = `<div class="dash-timeline-empty">Nada registrado aún hoy. Empieza a registrar tus comidas! 🌿</div>`;
    return;
  }

  container.innerHTML = '';

  // Recetas del plan y libres
  mealLogs.forEach(log => {
    const recipe = DB.getRecipeById(log.reference_id);
    if (!recipe) return;
    const macros = calcRecipeMacros(recipe.id);
    const isPlanned = log.planned === true;
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot ${isPlanned ? 'meal-dot' : 'extra-dot'}"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${recipe.name}${!isPlanned ? ' <span class="dash-tl-extra-badge">extra</span>' : ''}</div>
        <div class="dash-tl-meta">${getMealTypeEmoji(recipe.meal_type)} ${recipe.meal_type} · ${macros.calories} kcal · ${macros.protein}g prot</div>
      </div>
    `;
    container.appendChild(item);
  });

  // Alimentos libres (food_item)
  foodItemLogs.forEach(log => {
    const fi = DB.getFoodItemById(log.reference_id);
    if (!fi) return;
    const qty  = log.quantity_g || 100;
    const kcal = Math.round((fi.calories_per_100g || 0) * qty / 100);
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot extra-dot"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${fi.name} <span class="dash-tl-extra-badge">extra</span></div>
        <div class="dash-tl-meta">🥗 Alimento libre · ${qty}g · ${kcal} kcal</div>
      </div>
    `;
    container.appendChild(item);
  });

  // Líquidos
  liqLogs.forEach(log => {
    const liq = DB.liquids.find(l => l.id === log.reference_id);
    if (!liq) return;
    const item = document.createElement('div');
    item.className = 'dash-timeline-item';
    item.innerHTML = `
      <div class="dash-tl-dot liquid-dot"></div>
      <div class="dash-tl-content">
        <div class="dash-tl-name">${liq.name}</div>
        <div class="dash-tl-meta">${liq.icon} Hidratación</div>
      </div>
    `;
    container.appendChild(item);
  });
}

// ──────────────────────────────────────────────
// DASHBOARD: SECCIÓN PLAN vs EXTRAS
// ──────────────────────────────────────────────
function renderPlanVsExtra() {
  // Insertar la sección entre dash-macros-bars y dash-ai-card si no existe
  let section = document.getElementById('dash-plan-vs-extra');
  if (!section) {
    const aiCard = document.getElementById('dash-ai-card');
    if (!aiCard) return;
    section = document.createElement('div');
    section.id = 'dash-plan-vs-extra';
    section.className = 'dash-plan-vs-extra-section';
    aiCard.parentNode.insertBefore(section, aiCard);
  }

  const { plan, extra } = getPlanVsExtraSummary();
  const goals = DB.userPreferences.goals || { calories: 2000 };
  const totalCalGoal = goals.calories || 2000;

  const planPct  = Math.min(100, Math.round((plan.calories  / totalCalGoal) * 100));
  const extraPct = Math.min(100, Math.round((extra.calories / totalCalGoal) * 100));

  // Porcentaje del plan cumplido respecto a las kcal totales consumidas
  const totalConsumed = plan.calories + extra.calories;
  const planCompliance = totalConsumed > 0
    ? Math.round((plan.calories / totalConsumed) * 100)
    : 0;

  section.innerHTML = `
    <h2 class="dash-section-title">📊 Plan vs Extras de hoy</h2>
    <div class="dash-pve-cards">
      <div class="dash-pve-card dash-pve-card--plan">
        <div class="dash-pve-icon">📋</div>
        <div class="dash-pve-val">${plan.calories} <span class="dash-pve-unit">kcal</span></div>
        <div class="dash-pve-lbl">Del plan · ${plan.entries} comida${plan.entries !== 1 ? 's' : ''}</div>
        <div class="dash-pve-bar-track">
          <div class="dash-pve-bar-fill dash-pve-bar--plan" style="width:${planPct}%"></div>
        </div>
        <div class="dash-pve-pct">${planPct}% del objetivo</div>
      </div>
      <div class="dash-pve-card dash-pve-card--extra">
        <div class="dash-pve-icon">➕</div>
        <div class="dash-pve-val">${extra.calories} <span class="dash-pve-unit">kcal</span></div>
        <div class="dash-pve-lbl">Extras · ${extra.entries} registro${extra.entries !== 1 ? 's' : ''}</div>
        <div class="dash-pve-bar-track">
          <div class="dash-pve-bar-fill dash-pve-bar--extra" style="width:${extraPct}%"></div>
        </div>
        <div class="dash-pve-pct">${extraPct}% del objetivo</div>
      </div>
    </div>
    ${totalConsumed > 0 ? `
    <div class="dash-pve-compliance">
      <span class="dash-pve-compliance-lbl">Adherencia al plan</span>
      <div class="dash-pve-compliance-bar-track">
        <div class="dash-pve-compliance-bar" style="width:${planCompliance}%"></div>
      </div>
      <span class="dash-pve-compliance-pct" style="color:${planCompliance >= 70 ? '#3ab98d' : planCompliance >= 40 ? '#f59e0b' : '#ef4444'}">${planCompliance}%</span>
    </div>` : ''}
  `;
}

// ──────────────────────────────────────────────
// PERFIL: METAS NUTRICIONALES
// ──────────────────────────────────────────────
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
  if (!btn) return;
  btn.addEventListener('click', () => {
    const calories = parseInt(document.getElementById('goal-calories').value, 10);
    const protein  = parseInt(document.getElementById('goal-protein').value, 10);
    const carbs    = parseInt(document.getElementById('goal-carbs').value, 10);
    const fat      = parseInt(document.getElementById('goal-fat').value, 10);
    if ([calories, protein, carbs, fat].some(n => isNaN(n) || n <= 0)) {
      showToast('⚠️ Por favor ingresa valores válidos');
      return;
    }
    DB.updateGoals({ calories, protein, carbs, fat });
    showToast('🎯 Metas guardadas');
  });
}

// ──────────────────────────────────────────────
// PERFIL: API KEY DE GEMINI
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// CHAT IA (Modal)
// ──────────────────────────────────────────────
let _chatMessages = []; // historial local de la sesión

function openAIChat() {
  const overlay = document.getElementById('ai-chat-overlay');
  const modal   = document.getElementById('ai-chat-modal');
  const keyReq  = document.getElementById('ai-key-required');
  const inputArea = document.getElementById('ai-chat-input-area');

  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.classList.add('modal-open');

  if (!AI.isConfigured()) {
    keyReq.hidden    = false;
    inputArea.hidden = true;
  } else {
    keyReq.hidden    = true;
    inputArea.hidden = false;
    // Mensaje de bienvenida si es el primer mensaje
    if (_chatMessages.length === 0) {
      appendChatMessage('bot', '¡Hola! 👋 Soy NutriBot. Puedo ayudarte con tus dudas nutricionales, sugerirte qué comer según lo que te falta hoy, o responder preguntas sobre tu plan. ¿En qué te ayudo?');
    }
  }
}

function closeAIChat() {
  const overlay = document.getElementById('ai-chat-overlay');
  const modal   = document.getElementById('ai-chat-modal');
  overlay.classList.remove('open');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function appendChatMessage(role, text) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = `chat-msg chat-msg--${role}`;
  msg.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  _chatMessages.push({ role, text });
}

function showChatTyping() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;
  const typing = document.createElement('div');
  typing.className = 'chat-msg chat-msg--bot chat-typing';
  typing.id = 'chat-typing-indicator';
  typing.innerHTML = `<div class="chat-bubble"><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span></div>`;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function removeChatTyping() {
  document.getElementById('chat-typing-indicator')?.remove();
}

async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  const msg   = input.value.trim();
  if (!msg) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('ai-chat-send').disabled = true;

  appendChatMessage('user', msg);
  showChatTyping();

  try {
    const response = await AI.askAssistant(msg);
    removeChatTyping();
    appendChatMessage('bot', response);
  } catch (err) {
    removeChatTyping();
    if (err.message === 'NO_KEY') {
      appendChatMessage('bot', '⚠️ No encontré tu API Key. Ve a Perfil → Asistente IA para configurarla.');
    } else {
      appendChatMessage('bot', `❌ Error: ${err.message}`);
    }
  } finally {
    input.disabled  = false;
    document.getElementById('ai-chat-send').disabled = false;
    input.focus();
  }
}

function initAIChat() {
  const fab     = document.getElementById('btn-ai-fab');
  const overlay = document.getElementById('ai-chat-overlay');
  const closeBtn = document.getElementById('ai-chat-close');
  const sendBtn = document.getElementById('ai-chat-send');
  const input   = document.getElementById('ai-chat-input');
  const goProfile = document.getElementById('btn-go-profile-from-chat');

  if (fab)     fab.addEventListener('click', openAIChat);
  if (overlay) overlay.addEventListener('click', closeAIChat);
  if (closeBtn) closeBtn.addEventListener('click', closeAIChat);

  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  if (goProfile) {
    goProfile.addEventListener('click', () => {
      closeAIChat();
      document.querySelector('[data-screen="profile"]').click();
      // Abrir automáticamente la card de IA
      setTimeout(() => {
        const aiCard = document.getElementById('scard-ai');
        if (aiCard && !aiCard.open) {
          aiCard.querySelector('.settings-card-header')?.click();
        }
      }, 350);
    });
  }
}

// Dashboard: botón de Insight IA
function initDashboardAIBtn() {
  const btn = document.getElementById('btn-dash-refresh-ai');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!AI.isConfigured()) {
      showToast('⚠️ Configura tu API Key en Perfil → Asistente IA');
      return;
    }
    const textEl    = document.getElementById('dash-ai-text');
    const loadingEl = document.getElementById('dash-ai-loading');
    btn.disabled = true;
    btn.textContent = '⏳ Generando…';
    if (loadingEl) loadingEl.hidden = false;
    if (textEl)    textEl.style.opacity = '0.4';
    try {
      const summary = await AI.getDailySummary();
      if (textEl) { textEl.textContent = summary; textEl.style.opacity = '1'; }
    } catch (err) {
      showToast('❌ Error al conectar con Gemini');
      if (textEl) textEl.style.opacity = '1';
    } finally {
      if (loadingEl) loadingEl.hidden = true;
      btn.disabled = false;
      btn.textContent = '✨ Insight IA';
    }
  });
}


// ══════════════════════════════════════════════════════════════
// BOTTOM SHEET · REGISTRO LIBRE
// ══════════════════════════════════════════════════════════════

let _selectedFoodItem = null; // Item seleccionado para gramaje

function openRegisterSheet() {
  const sheet   = document.getElementById('register-sheet');
  const overlay = document.getElementById('register-overlay');
  if (!sheet) return;
  // Siempre empieza en el menú principal
  switchRSView('menu');
  sheet.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeRegisterSheet() {
  const sheet   = document.getElementById('register-sheet');
  const overlay = document.getElementById('register-overlay');
  if (!sheet) return;
  sheet.classList.remove('open');
  overlay.classList.remove('active');
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
  if (viewName === 'plan')      renderRSPlanView();
  if (viewName === 'search')    resetRSSearchView();
  if (viewName === 'recipe')    resetRSRecipeView();
  if (viewName === 'favorites') renderRSFavoritesView();
  if (viewName === 'voice')     resetRSVoiceView();
}

function initRegisterSheet() {
  const fab     = document.getElementById('btn-register-fab');
  const overlay = document.getElementById('register-overlay');

  if (fab)     fab.addEventListener('click', openRegisterSheet);
  if (overlay) overlay.addEventListener('click', closeRegisterSheet);

  // Botones de volver
  ['plan','search','recipe','favorites','voice'].forEach(view => {
    const btn = document.getElementById(`rs-back-${view}`);
    if (btn) btn.addEventListener('click', () => switchRSView('menu'));
  });

  // Botones del menú principal
  document.querySelectorAll('.rs-menu-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchRSView(btn.dataset.view));
  });

  // ── Búsqueda de alimentos ──
  const searchInput = document.getElementById('rs-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleFoodSearch, 280));
  }

  // ── Búsqueda de recetas ──
  const recipeInput = document.getElementById('rs-recipe-input');
  if (recipeInput) {
    recipeInput.addEventListener('input', debounce(handleRecipeSearch, 280));
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

// ────────────────────────────────────────────
// Vista: DESDE MI PLAN
// ────────────────────────────────────────────
function renderRSPlanView() {
  const container = document.getElementById('rs-plan-list');
  if (!container) return;
  container.innerHTML = '';

  const { slot, currentRecipes, nextSlot, nextRecipes } = getDiaryState();
  const todayLogs = DB.getTodayLogs();
  const loggedMealIds = new Set(todayLogs.filter(l => l.type === 'meal').map(l => l.reference_id));

  // Mostrar recetas del turno actual primero, luego del siguiente
  const groups = [
    { label: `🍳 ${slot.label} (ahora)`, recipes: [...(currentRecipes?.canCook || []), ...(currentRecipes?.needsToBuy || [])] },
    { label: nextSlot ? `⏭ ${nextSlot.label} (próximo)` : null, recipes: nextRecipes ? [...(nextRecipes.canCook || []), ...(nextRecipes.needsToBuy || [])] : [] }
  ];

  let hasAny = false;
  groups.forEach(group => {
    if (!group.label || group.recipes.length === 0) return;
    hasAny = true;
    const lbl = document.createElement('div');
    lbl.className = 'rs-fav-section-title';
    lbl.textContent = group.label;
    container.appendChild(lbl);

    group.recipes.forEach(recipe => {
      const isLogged = loggedMealIds.has(recipe.id);
      const item = document.createElement('div');
      item.className = `rs-plan-item${isLogged ? ' already-logged' : ''}`;
      const kcal = calcRecipeMacros(recipe.id).calories;
      item.innerHTML = `
        <div class="rs-plan-icon">${recipe.meal_type === 'desayuno' ? '🌅' : recipe.meal_type === 'almuerzo' ? '🍽️' : recipe.meal_type === 'cena' ? '🌙' : '🍳'}</div>
        <div class="rs-plan-info">
          <div class="rs-plan-name">${recipe.name}</div>
          <div class="rs-plan-meta">${kcal} kcal${isLogged ? ' · Ya registrado' : ''}</div>
        </div>
        ${isLogged ? '<span class="rs-plan-check">✓</span>' : ''}
      `;
      if (!isLogged) {
        item.addEventListener('click', () => {
          DB.addFoodLog({ type: 'meal', reference_id: recipe.id, planned: true });
          showToast(`✅ ${recipe.name} registrado`);
          closeRegisterSheet();
          renderDiaryScreen({ animateUpcoming: true });
          renderDailyMacros();
        });
      }
      container.appendChild(item);
    });
  });

  if (!hasAny) {
    container.innerHTML = '<div class="rs-result-empty">No hay recetas planificadas para hoy 🌿</div>';
  }
}

// ────────────────────────────────────────────
// Vista: BUSCAR ALIMENTO
// ────────────────────────────────────────────
function resetRSSearchView() {
  const searchView = document.getElementById('rs-view-search');
  const confirmEl = document.getElementById('rs-gram-confirm');
  if (searchView && confirmEl && confirmEl.parentNode !== searchView) {
    searchView.appendChild(confirmEl);
  }
  const input   = document.getElementById('rs-search-input');
  const results = document.getElementById('rs-search-results');
  const confirm = document.getElementById('rs-gram-confirm');
  if (input)   input.value = '';
  if (results) results.innerHTML = '<div class="rs-result-empty">Escribe para buscar un alimento 🔍</div>';
  if (confirm) confirm.hidden = true;
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
        const nutritionData = await AI.fetchNutritionInfo(query);
        if (nutritionData) {
          const saved = DB.addFoodItem({ ...nutritionData, source: 'gemini', verified: false });
          results.innerHTML = '';
          results.appendChild(buildFoodResultItem(saved, 'food_item'));
          showToast('✨ Información nutricional encontrada y guardada');
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
    <div class="rs-gram-macro-chip"><span class="rs-gram-macro-chip-val">${kcal}</span><span class="rs-gram-macro-chip-lbl">kcal</span></div>
    <div class="rs-gram-macro-chip"><span class="rs-gram-macro-chip-val">${prot}g</span><span class="rs-gram-macro-chip-lbl">Prot.</span></div>
    <div class="rs-gram-macro-chip"><span class="rs-gram-macro-chip-val">${carb}g</span><span class="rs-gram-macro-chip-lbl">Carbs</span></div>
    <div class="rs-gram-macro-chip"><span class="rs-gram-macro-chip-val">${fat}g</span><span class="rs-gram-macro-chip-lbl">Grasa</span></div>
  `;
}

function saveFreeFoodEntry() {
  const gramInput = document.getElementById('rs-gram-input');
  if (!_selectedFoodItem || !gramInput) return;
  const qty = Math.max(1, parseInt(gramInput.value) || 100);

  // Si es un ingrediente del sistema que aún no está en food_items, lo añadimos
  let refId = _selectedFoodItem.id;
  if (_selectedFoodItem._fromIngredient) {
    // Crear como food_item a partir del ingrediente
    const saved = DB.addFoodItem({
      name: _selectedFoodItem.name,
      calories_per_100g: _selectedFoodItem.calories_per_100g || 0,
      protein_per_100g:  _selectedFoodItem.protein_per_100g  || 0,
      carbs_per_100g:    _selectedFoodItem.carbs_per_100g    || 0,
      fat_per_100g:      _selectedFoodItem.fat_per_100g      || 0,
      typical_serving_g: 100,
      source: 'ingredient'
    });
    refId = saved.id;
  }

  DB.addFoodLog({
    type: 'food_item',
    reference_id: refId,
    quantity_g: qty,
    planned: false
  });

  showToast(`✅ ${_selectedFoodItem.name} (${qty}g) registrado`);
  closeRegisterSheet();
  renderDiaryScreen();
  renderDailyMacros();
}

// ────────────────────────────────────────────
// Vista: BUSCAR RECETA
// ────────────────────────────────────────────
function resetRSRecipeView() {
  const input   = document.getElementById('rs-recipe-input');
  const results = document.getElementById('rs-recipe-results');
  if (input)   input.value = '';
  if (results) {
    results.innerHTML = '';
    // Mostrar todas las recetas al abrir
    renderRecipeResults(DB.recipes);
  }
}

function handleRecipeSearch() {
  const query = document.getElementById('rs-recipe-input')?.value.trim().toLowerCase();
  const filtered = query
    ? DB.recipes.filter(r => r.name.toLowerCase().includes(query))
    : DB.recipes;
  renderRecipeResults(filtered);
}

function renderRecipeResults(recipes) {
  const container = document.getElementById('rs-recipe-results');
  if (!container) return;
  container.innerHTML = '';

  if (recipes.length === 0) {
    container.innerHTML = '<div class="rs-result-empty">No se encontraron recetas 🌿</div>';
    return;
  }

  const todayLogs = DB.getTodayLogs();
  const loggedIds = new Set(todayLogs.filter(l => l.type === 'meal').map(l => l.reference_id));

  recipes.forEach(recipe => {
    const isLogged = loggedIds.has(recipe.id);
    const kcal = calcRecipeMacros(recipe.id).calories;
    const item = document.createElement('div');
    item.className = `rs-plan-item${isLogged ? ' already-logged' : ''}`;
    const typeEmoji = { desayuno:'🌅', almuerzo:'🍽️', cena:'🌙', merienda:'🥪' }[recipe.meal_type] || '🍳';
    item.innerHTML = `
      <div class="rs-plan-icon">${typeEmoji}</div>
      <div class="rs-plan-info">
        <div class="rs-plan-name">${recipe.name}</div>
        <div class="rs-plan-meta">${kcal} kcal · ${recipe.meal_type}${isLogged ? ' · ✓ Registrado' : ''}</div>
      </div>
      ${isLogged ? '<span class="rs-plan-check">✓</span>' : ''}
    `;
    if (!isLogged) {
      item.addEventListener('click', () => {
        DB.addFoodLog({ type: 'meal', reference_id: recipe.id, planned: false });
        showToast(`✅ ${recipe.name} registrado`);
        closeRegisterSheet();
        renderDiaryScreen({ animateUpcoming: true });
        renderDailyMacros();
      });
    }
    container.appendChild(item);
  });
}

// ────────────────────────────────────────────
// Vista: FAVORITOS Y FRECUENTES
// ────────────────────────────────────────────
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

// ────────────────────────────────────────────
// RENDERIZADO DE ALIMENTOS LIBRES EN EL DIARIO
// ────────────────────────────────────────────
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

// ────────────────────────────────────────────
// REGISTRO POR VOZ
// ────────────────────────────────────────────

let recognition = null;
let isRecording = false;

function initVoiceRegistration() {
  const micBtn = document.getElementById('btn-rs-voice-mic');
  const processBtn = document.getElementById('btn-rs-voice-process');

  if (micBtn) {
    micBtn.addEventListener('click', toggleVoiceRecording);
  }
  if (processBtn) {
    processBtn.addEventListener('click', processVoiceInput);
  }

  // Inicializar SpeechRecognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add('recording');
      const hint = document.getElementById('rs-voice-hint');
      if (hint) hint.textContent = 'Escuchando...';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('rs-voice-input');
      const area = document.getElementById('rs-voice-transcript-area');
      
      if (input && area) {
        input.value = transcript;
        area.hidden = false;
      }
    };

    recognition.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error);
      const status = document.getElementById('rs-voice-status');
      if (status) status.textContent = `Error: ${event.error}`;
      stopVoiceRecording();
    };

    recognition.onend = () => {
      stopVoiceRecording();
    };
  } else {
    // No soportado
    if (micBtn) {
      micBtn.disabled = true;
      micBtn.style.opacity = '0.5';
    }
    const hint = document.getElementById('rs-voice-hint');
    if (hint) hint.textContent = 'Tu navegador no soporta registro por voz.';
  }
}

function toggleVoiceRecording() {
  if (!recognition) return;
  if (isRecording) {
    recognition.stop();
  } else {
    // Reset estado
    const input = document.getElementById('rs-voice-input');
    const status = document.getElementById('rs-voice-status');
    const area = document.getElementById('rs-voice-transcript-area');
    if (input) input.value = '';
    if (status) status.textContent = '';
    if (area) area.hidden = true;
    
    recognition.start();
  }
}

function stopVoiceRecording() {
  isRecording = false;
  const micBtn = document.getElementById('btn-rs-voice-mic');
  if (micBtn) micBtn.classList.remove('recording');
  
  const hint = document.getElementById('rs-voice-hint');
  if (hint && hint.textContent === 'Escuchando...') {
    hint.textContent = 'Puedes editar el texto abajo y luego procesarlo.';
  }
}

function resetRSVoiceView() {
  const hint = document.getElementById('rs-voice-hint');
  const input = document.getElementById('rs-voice-input');
  const area = document.getElementById('rs-voice-transcript-area');
  const status = document.getElementById('rs-voice-status');
  
  if (hint) hint.textContent = 'Toca el microfono y dime que comiste (ej. "Me comi dos huevos con 50 gramos de pan")';
  if (input) input.value = '';
  if (area) area.hidden = true;
  if (status) status.textContent = '';
  if (isRecording && recognition) recognition.stop();
}

async function processVoiceInput() {
  const input = document.getElementById('rs-voice-input');
  const status = document.getElementById('rs-voice-status');
  const processBtn = document.getElementById('btn-rs-voice-process');
  
  const text = input?.value.trim();
  if (!text) return;

  if (processBtn) processBtn.disabled = true;
  if (status) status.textContent = 'Procesando con IA... ⏳';

  try {
    const parsed = await AI.parseVoiceInput(text);
    if (!parsed || !parsed.food_name) throw new Error('No se detectó alimento');
    
    if (status) status.textContent = `Analizando: ${parsed.food_name}...`;

    // Buscar si existe en la BD o en favoritos
    const allItems = DB.getFoodItemsList();
    let bestMatch = allItems.find(i => i.name.toLowerCase().includes(parsed.food_name.toLowerCase()) || parsed.food_name.toLowerCase().includes(i.name.toLowerCase()));
    
    // Si no existe, usamos IA para obtener sus macros
    if (!bestMatch) {
      const macroPrompt = `Proporciona la información nutricional por 100g para el alimento: "${parsed.food_name}". Devuelve SOLO un JSON valido sin markdown. Las claves deben ser: name, calories_per_100g, protein_per_100g. Si no tienes datos exactos, estima.`;
      const macroRaw = await AI._call(macroPrompt);
      const macroCleaned = macroRaw.replace(/```json|```/g, '').trim();
      const macroData = JSON.parse(macroCleaned);
      
      bestMatch = {
        id: 'voice_' + Date.now(),
        name: macroData.name || parsed.food_name,
        calories_per_100g: Number(macroData.calories_per_100g) || 0,
        protein_per_100g: Number(macroData.protein_per_100g) || 0,
      };
      // Guardar en DB para uso futuro
      DB.food_items.push(bestMatch);
      DB._save();
    }
    
    if (status) status.textContent = '¡Listo!';
    
    // Pasar al confirmador de gramaje
    currentSelectedFood = bestMatch;
    
    // Ocultar la UI de voz, mostrar el confirmador
    const voiceContainer = document.querySelector('.rs-voice-container');
    const gramConfirm = document.getElementById('rs-gram-confirm'); // usar el mismo del search view
    
    // Movemos el confirmador a la vista actual
    const voiceView = document.getElementById('rs-view-voice');
    if (voiceView && gramConfirm) {
      voiceView.appendChild(gramConfirm);
      gramConfirm.hidden = false;
      if (voiceContainer) voiceContainer.style.display = 'none'; // ocultar
      
      const gramInput = document.getElementById('rs-gram-input');
      if (gramInput) gramInput.value = parsed.quantity_g || 100;
      
      updateGramMacros(); // Refresca UI
    }
    
  } catch (err) {
    console.error('Error parseVoiceInput:', err);
    if (status) status.textContent = 'Error al entender. Intenta editar el texto.';
  } finally {
    if (processBtn) processBtn.disabled = false;
  }
}

// ── Utilidad debounce ──
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
