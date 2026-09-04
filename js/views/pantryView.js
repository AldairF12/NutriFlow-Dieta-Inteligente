// ============================================================
// pantryView.js ? Control de Despensa con Toggle Cards vs Lista
// ============================================================

let _pantryViewCards = localStorage.getItem('nutriflow_pantry_view') === 'cards';
let _pantryFilterActive = false;
let _pantrySearchQuery = '';

function initPantryToolbar() {
  const searchInput = document.getElementById('pantry-search');
  const filterBtn   = document.getElementById('btn-pantry-filter');
  const viewToggle  = document.getElementById('btn-pantry-view');
  
  if (searchInput) {
    searchInput.oninput = () => {
      _pantrySearchQuery = searchInput.value.trim().toLowerCase();
      renderPantryScreen();
    };
  }

  if (filterBtn) {
    filterBtn.onclick = () => {
      _pantryFilterActive = !_pantryFilterActive;
      filterBtn.classList.toggle('active', _pantryFilterActive);
      filterBtn.setAttribute('aria-pressed', String(_pantryFilterActive));
      renderPantryScreen();
    };
  }
  
  if (viewToggle) {
    updatePantryViewToggleBtn(viewToggle);
    viewToggle.onclick = () => {
      _pantryViewCards = !_pantryViewCards;
      localStorage.setItem('nutriflow_pantry_view', _pantryViewCards ? 'cards' : 'compact');
      updatePantryViewToggleBtn(viewToggle);
      renderPantryScreen();
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPantryToolbar);
} else {
  initPantryToolbar();
}

function updatePantryViewToggleBtn(btn) {
  if (!btn) return;
  const icon = btn.querySelector('.btn-view-icon');
  if (icon) icon.textContent = _pantryViewCards ? '\u{1F4C4}' : '\u{1F5BC}\uFE0F';
  btn.title = _pantryViewCards ? 'Cambiar a Vista de Lista Compacta' : 'Cambiar a Vista de Tarjetas';
}

function pantryItemVisible(ing) {
  if (_pantrySearchQuery) {
    const normQ = typeof normalizeSearchText === 'function' ? normalizeSearchText(_pantrySearchQuery) : _pantrySearchQuery.toLowerCase();
    const normName = typeof normalizeSearchText === 'function' ? normalizeSearchText(ing.name || '') : (ing.name || '').toLowerCase();
    if (!normName.includes(normQ)) return false;
  }
  if (_pantryFilterActive) {
    const item = (window.DB && typeof window.DB.getPantryItem === 'function') ? window.DB.getPantryItem(ing.id) : null;
    const qty  = item ? item.quantity_available : 0;
    const riForIng = (window.DB.recipeIngredients || (window.DB.state && window.DB.state.recipe_ingredients) || []).filter(ri => ri.ingredient_id === ing.id);
    const needed = riForIng.some(ri => {
      if (qty >= ri.quantity) return false;
      return typeof recipeHasDislikedIngredients === 'function' ? !recipeHasDislikedIngredients(ri.recipe_id) : true;
    });
    if (!needed) return false;
  }
  return true;
}

function renderPantryScreen() {
  const container = document.getElementById('pantry-list');
  if (!container) return;
  container.innerHTML = '';

  if (_pantryViewCards) {
    container.classList.add('view-cards');
  } else {
    container.classList.remove('view-cards');
  }

  const filterBtn   = document.getElementById('btn-pantry-filter');
  const viewToggle  = document.getElementById('btn-pantry-view');
  
  if (filterBtn) filterBtn.classList.toggle('active', _pantryFilterActive);
  if (viewToggle) updatePantryViewToggleBtn(viewToggle);

  let anyVisible = false;
  const ingredientsList = window.DB.ingredients || (window.DB.state && window.DB.state.ingredients) || [];

  ingredientsList.forEach(ing => {
    if (!pantryItemVisible(ing)) return;
    anyVisible = true;
    const item = (window.DB && typeof window.DB.getPantryItem === 'function') ? window.DB.getPantryItem(ing.id) : null;
    let qty  = item ? item.quantity_available : 0;
    const cls  = qty === 0 ? 'qty-zero' : qty < 100 ? 'qty-low' : 'qty-ok';

    const el = document.createElement('div');
    el.className = 'pantry-item';
    el.dataset.id = ing.id;
    if (typeof _isTabSwitching !== 'undefined' && _isTabSwitching) el.classList.add('item-entering');
    
    const emoji = typeof getCategoryEmoji === 'function' ? getCategoryEmoji(ing.category) : '\u{1F37D}\uFE0F';
    el.innerHTML = `
      <div class="pantry-emoji-art">${emoji}</div>
      <div class="pantry-info">
        <div class="pantry-name">${ing.name}</div>
        <div class="pantry-category">${ing.category || ''}</div>
        <div class="pantry-cal">${ing.calories_per_100g || 0} kcal/100g</div>
      </div>
      <div class="pantry-controls">
        <span class="pantry-qty ${cls}">${qty}g</span>
        <div class="pantry-btns">
          <button class="btn-qty btn-minus" aria-label="Reducir ${ing.name}">\u2212</button>
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
      window.DB.updatePantryQuantity(ing.id, newQty);
      
      const isStillVisible = pantryItemVisible(ing);
      if (isStillVisible) {
        qty = newQty;
        const qtySpan = el.querySelector('.pantry-qty');
        if (qtySpan) {
          qtySpan.textContent = `${newQty}g`;
          qtySpan.className = `pantry-qty ${newQty === 0 ? 'qty-zero' : newQty < 100 ? 'qty-low' : 'qty-ok'}`;
          qtySpan.classList.remove('btn-pop-feedback');
          void qtySpan.offsetWidth; 
          qtySpan.classList.add('btn-pop-feedback');
        }
        if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
        if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
        if (typeof updateShoppingFab === 'function') updateShoppingFab();
      } else {
        el.classList.add('checked-out');
        setTimeout(() => {
          renderPantryScreen();
          if (typeof renderRecipesScreen === 'function') renderRecipesScreen();
          if (typeof renderDiaryScreen === 'function') renderDiaryScreen();
          if (typeof updateShoppingFab === 'function') updateShoppingFab();
        }, 350);
      }
    };

    el.querySelector('.btn-minus').addEventListener('click', (e) => {
      e.stopPropagation();
      handleQtyChange(-50);
    });
    el.querySelector('.btn-plus').addEventListener('click', (e) => {
      e.stopPropagation();
      handleQtyChange(50);
    });

    const infoEl = el.querySelector('.pantry-info');
    const qtySpan = el.querySelector('.pantry-qty');
    const openPop = () => {
      if (typeof openIngredientPopover === 'function') {
        openIngredientPopover(ing.id, ing.name, qty, null);
      }
    };
    if (infoEl) {
      infoEl.style.cursor = 'pointer';
      infoEl.title = 'Toca para ajustar stock';
      infoEl.addEventListener('click', openPop);
    }
    if (qtySpan) {
      qtySpan.style.cursor = 'pointer';
      qtySpan.title = 'Toca para ajustar stock';
      qtySpan.addEventListener('click', openPop);
    }

    container.appendChild(el);
  });

  if (!anyVisible) {
    const msg = document.createElement('div');
    msg.className = 'empty-state';
    msg.style.padding = '40px 24px';
    msg.innerHTML = `<div class="empty-icon">${_pantryFilterActive ? '\u2713' : '\u{1F50D}'}</div>
      <p>${_pantryFilterActive ? '\u00A1Todo en orden! No faltan ingredientes.' : 'No hay ingredientes que coincidan.'}</p>`;
    container.appendChild(msg);
  }
  if (typeof cleanupAnimationClasses === 'function') cleanupAnimationClasses();
}
