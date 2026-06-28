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