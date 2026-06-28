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