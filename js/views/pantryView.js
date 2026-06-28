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