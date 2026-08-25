let _shoppingViewCards = localStorage.getItem('nutriflow_shopping_view') === 'cards';

function getMissingIngredientsList() {
  const map = new Map();
  for (const type of ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack']) {
    const recipes = window.DB.recipes.filter(r => (r.meal_type || '').toLowerCase() === type);
    for (const recipe of recipes) {
      if (typeof recipeHasDislikedIngredients === 'function' && recipeHasDislikedIngredients(recipe.id)) continue;
      const ris = window.DB.getRecipeIngredients(recipe.id);
      for (const ri of ris) {
        const pantry = window.DB.getPantryItem(ri.ingredient_id);
        const avail  = pantry ? pantry.quantity_available : 0;
        if (avail >= ri.quantity) continue;
        if (!map.has(ri.ingredient_id)) {
          const ing = window.DB.getIngredientById(ri.ingredient_id);
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

  const viewToggle = document.getElementById('btn-shopping-view');
  if (viewToggle) {
    viewToggle.innerHTML = _shoppingViewCards ? '\u{1f4c4}' : '\u{1f5bc}\ufe0f';
    viewToggle.title = _shoppingViewCards ? 'Cambiar a Vista Compacta' : 'Cambiar a Vista de Tarjetas';
  }
  if (_shoppingViewCards) {
    body.classList.add('view-cards');
  } else {
    body.classList.remove('view-cards');
  }

  body.innerHTML = '';

  if (list.length === 0) {
    body.innerHTML = `
      <div class="shopping-empty">
        <span class="shopping-empty-icon">\u{1f389}</span>
        Tienes todo lo necesario en tu despensa.
      </div>`;
  } else {
    list.forEach(({ ing, maxNeeded, availQty, recipes }) => {
      if (!ing) return;
      const item = document.createElement('div');
      item.className = 'shopping-item';
      item.dataset.ingId = ing.id;
      if (isFirstOpen) item.classList.add('item-entering');
      
      const emoji = typeof getCategoryEmoji === 'function' ? getCategoryEmoji(ing.category) : '\u{1f6d2}';
      
      item.innerHTML = `
        <div class="shopping-item-check"></div>
        <div class="shopping-item-info">
          <div class="shopping-item-emoji">${emoji}</div>
          <div class="shopping-item-name">${ing.name}</div>
          <div class="shopping-item-detail">Tienes ${availQty}g \u00b7 Necesitas m\u00edn. ${maxNeeded}g</div>
          <div class="shopping-item-recipes">En: ${recipes.slice(0, 2).join(', ')}${recipes.length > 2 ? ' +' + (recipes.length - 2) + ' m\u00e1s' : ''}</div>
        </div>
        <div class="shopping-item-right">
          <button class="shopping-btn-buy" aria-label="Comprar ${ing.name}">Comprar</button>
        </div>
      `;
      item.addEventListener('click', () => {
        if (typeof openIngredientPopover === 'function') {
          openIngredientPopover(ing.id, ing.name, maxNeeded, null);
        }
      });
      body.appendChild(item);
    });
  }
}

function openShoppingModal() {
  const overlay = document.getElementById('shopping-overlay');
  const modal  = document.getElementById('shopping-modal');
  if (!overlay || !modal) return;

  renderShoppingList(true);

  overlay.classList.add('open');
  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeShoppingModal() {
  const modal   = document.getElementById('shopping-modal');
  const overlay = document.getElementById('shopping-overlay');
  if (!overlay || !modal) return;
  
  overlay.classList.remove('open');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  
  setTimeout(() => {
    modal.style.transform  = '';
    modal.style.transition = '';
    overlay.style.opacity  = '';
    overlay.style.transition = '';
  }, 450);
}

function initShoppingModal() {
  const fab = document.getElementById('btn-shopping-fab');
  const closeBtn = document.getElementById('shopping-close');
  const overlay = document.getElementById('shopping-overlay');
  
  if(fab) fab.addEventListener('click', openShoppingModal);
  if(closeBtn) closeBtn.addEventListener('click', closeShoppingModal);
  if(overlay) overlay.addEventListener('click', closeShoppingModal);
  
  const viewToggle = document.getElementById('btn-shopping-view');
  if (viewToggle) {
    viewToggle.addEventListener('click', () => {
      _shoppingViewCards = !_shoppingViewCards;
      localStorage.setItem('nutriflow_shopping_view', _shoppingViewCards ? 'cards' : 'compact');
      viewToggle.innerHTML = _shoppingViewCards ? '\u{1f4c4}' : '\u{1f5bc}\ufe0f';
      viewToggle.title = _shoppingViewCards ? 'Cambiar a Vista Compacta' : 'Cambiar a Vista de Tarjetas';
      
      const body = document.getElementById('shopping-list-body');
      if (body) {
        if (_shoppingViewCards) {
          body.classList.add('view-cards');
        } else {
          body.classList.remove('view-cards');
        }
      }
    });
  }

  initShoppingModalGestures();
}

function initShoppingModalGestures() {
  const modal  = document.getElementById('shopping-modal');
  if (!modal) return;
  const handle = modal.querySelector('.modal-handle');
  const header = modal.querySelector('.shopping-modal-header');

  let startY = 0, currentY = 0, isDragging = false;

  function onTouchStart(e) {
    if (e.target.closest('.modal-close')) { isDragging = false; return; }
    startY = e.touches[0].clientY;
    isDragging = true;
    modal.style.transition = 'none';
    const overlay = document.getElementById('shopping-overlay');
    if(overlay) overlay.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      currentY = deltaY;
      modal.style.transform = `translateX(-50%) translate3d(0, ${currentY}px, 0)`;
      const overlay = document.getElementById('shopping-overlay');
      const progress = Math.min(1, currentY / 300);
      if(overlay) overlay.style.opacity = (1 - progress * 0.85).toString();
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
    if(overlay) overlay.style.transition = 'opacity 0.4s ease';
    if (currentY > 110) {
      modal.style.transform = 'translateX(-50%) translate3d(0, 105%, 0)';
      if(overlay) overlay.style.opacity = '0';
      closeShoppingModal();
    } else {
      modal.style.transform = 'translateX(-50%) translate3d(0, 0, 0)';
      if(overlay) overlay.style.opacity = '';
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
