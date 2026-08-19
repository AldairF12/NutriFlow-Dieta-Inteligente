// ============================================================
// calc.js ? C?lculos de NutriFlow y Estado de Pantallas
// ============================================================

const MEAL_SLOTS_META = {
  desayuno: { emoji: '\u{1F305}', label: 'Desayuno', defaultStart: 7, defaultEnd: 11, defaultHour: 8  },
  almuerzo: { emoji: '\u2600\uFE0F', label: 'Almuerzo', defaultStart: 12, defaultEnd: 16, defaultHour: 13 },
  merienda: { emoji: '\u{1F34E}', label: 'Merienda', defaultStart: 16, defaultEnd: 19, defaultHour: 17 },
  cena:     { emoji: '\u{1F319}', label: 'Cena',     defaultStart: 20, defaultEnd: 23, defaultHour: 21 },
};

const MEAL_ORDER = ['desayuno', 'almuerzo', 'merienda', 'cena'];

function getMealHours() {
  const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
  const hours = prefs.mealHours || prefs.meal_hours || {};
  
  function getSlotRange(slot) {
    const val = hours[slot];
    if (val && typeof val === 'object' && val.start != null && val.end != null) {
      return { start: parseInt(val.start, 10), end: parseInt(val.end, 10) };
    }
    if (typeof val === 'number') {
      return { start: Math.max(0, val - 1), end: Math.min(24, val + 2) };
    }
    return {
      start: MEAL_SLOTS_META[slot].defaultStart,
      end:   MEAL_SLOTS_META[slot].defaultEnd,
    };
  }

  return {
    desayuno: getSlotRange('desayuno'),
    almuerzo: getSlotRange('almuerzo'),
    merienda: getSlotRange('merienda'),
    cena:     getSlotRange('cena'),
  };
}

function calcRecipeMacros(recipeId) {
  const recipeIngredients = (window.DB && typeof window.DB.getRecipeIngredients === 'function')
    ? window.DB.getRecipeIngredients(recipeId)
    : [];

  let calories = 0;
  let protein  = 0;
  let carbs    = 0;
  let fat      = 0;

  for (const ri of recipeIngredients) {
    const ing = window.DB.getIngredientById(ri.ingredient_id);
    if (!ing) continue;
    const factor = ri.quantity / 100;
    calories += (ing.calories_per_100g || 0) * factor;
    protein  += (ing.protein_per_100g  || 0) * factor;
    carbs    += (ing.carbs_per_100g    || 0) * factor;
    fat      += (ing.fat_per_100g      || 0) * factor;
  }

  return {
    calories: Math.round(calories),
    protein:  parseFloat(protein.toFixed(1)),
    carbs:    parseFloat(carbs.toFixed(1)),
    fat:      parseFloat(fat.toFixed(1))
  };
}

function getCurrentMealSlot() {
  const now = new Date();
  const h = now.getHours();
  const hours = getMealHours();

  for (const slot of MEAL_ORDER) {
    const r = hours[slot];
    if (h >= r.start && h < r.end) {
      return slot;
    }
  }

  if (h < hours.desayuno.start) return 'desayuno';
  if (h >= hours.cena.end) return 'cena';
  return 'desayuno';
}

function getNextUnloggedSlot() {
  const current = getCurrentMealSlot();
  const startIndex = MEAL_ORDER.indexOf(current);

  for (let i = startIndex; i < MEAL_ORDER.length; i++) {
    const slot = MEAL_ORDER[i];
    if (!hasMealBeenLoggedToday(slot)) return slot;
  }

  for (let i = 0; i < startIndex; i++) {
    const slot = MEAL_ORDER[i];
    if (!hasMealBeenLoggedToday(slot)) return slot;
  }

  return null;
}

function hasMealBeenLoggedToday(mealType) {
  const todayLogs = (window.DB && typeof window.DB.getTodayLogs === 'function')
    ? window.DB.getTodayLogs().filter(l => l.type === 'meal')
    : [];

  for (const log of todayLogs) {
    const recipe = window.DB.getRecipeById(log.reference_id);
    if (recipe && recipe.meal_type === mealType) return true;
  }
  return false;
}

function recipeHasDislikedIngredients(recipeId) {
  const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
  const dislikes = prefs.dislikedIngredients || prefs.disliked_ingredients || [];
  if (!dislikes || !dislikes.length) return false;
  const recipeIngredients = (window.DB && typeof window.DB.getRecipeIngredients === 'function')
    ? window.DB.getRecipeIngredients(recipeId)
    : [];
  return recipeIngredients.some(ri => dislikes.includes(ri.ingredient_id));
}

function checkPantryForRecipe(recipeId) {
  const recipeIngredients = (window.DB && typeof window.DB.getRecipeIngredients === 'function')
    ? window.DB.getRecipeIngredients(recipeId)
    : [];
  const missingIngredients = [];

  for (const ri of recipeIngredients) {
    const pantryItem = (window.DB && typeof window.DB.getPantryItem === 'function')
      ? window.DB.getPantryItem(ri.ingredient_id)
      : null;
    const available  = pantryItem ? pantryItem.quantity_available : 0;
    if (available < ri.quantity) {
      missingIngredients.push({
        ingredient: window.DB.getIngredientById(ri.ingredient_id),
        needed:    ri.quantity,
        available
      });
    }
  }

  return {
    canCook: missingIngredients.length === 0,
    missingIngredients
  };
}

function getRecipesForSlot(slot) {
  const allForSlot = (window.DB && window.DB.recipes)
    ? window.DB.recipes.filter(r => r.meal_type === slot)
    : [];
  const canCook    = [];
  const needsToBuy = [];

  for (const recipe of allForSlot) {
    if (recipeHasDislikedIngredients(recipe.id)) continue;

    const pantryCheck = checkPantryForRecipe(recipe.id);
    const macros      = calcRecipeMacros(recipe.id);

    const recipeData = {
      ...recipe,
      macros,
      pantryCheck
    };

    if (pantryCheck.canCook) {
      canCook.push(recipeData);
    } else {
      needsToBuy.push(recipeData);
    }
  }

  return { canCook, needsToBuy };
}

function getDiaryState() {
  const currentSlot = getCurrentMealSlot();
  const isLogged    = hasMealBeenLoggedToday(currentSlot);
  const hours       = getMealHours();

  const slotMeta = {
    key:   currentSlot,
    emoji: MEAL_SLOTS_META[currentSlot].emoji,
    label: MEAL_SLOTS_META[currentSlot].label,
    hour:  hours[currentSlot].start,
  };

  if (!isLogged) {
    const { canCook, needsToBuy } = getRecipesForSlot(currentSlot);
    return {
      slot:           slotMeta,
      isLogged:       false,
      showMealFirst:  true,
      currentRecipes: { canCook, needsToBuy },
      nextSlot:       null,
      nextRecipes:    null,
    };
  }

  const nextSlotKey = getNextUnloggedSlot();

  if (nextSlotKey) {
    const nextSlotMeta = {
      key:   nextSlotKey,
      emoji: MEAL_SLOTS_META[nextSlotKey].emoji,
      label: MEAL_SLOTS_META[nextSlotKey].label,
      hour:  hours[nextSlotKey].start,
    };
    const { canCook, needsToBuy } = getRecipesForSlot(nextSlotKey);
    return {
      slot:           slotMeta,
      isLogged:       true,
      showMealFirst:  false,
      currentRecipes: null,
      nextSlot:       nextSlotMeta,
      nextRecipes:    { canCook, needsToBuy },
    };
  }

  return {
    slot:           slotMeta,
    isLogged:       true,
    showMealFirst:  false,
    currentRecipes: null,
    nextSlot:       null,
    nextRecipes:    null,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '\u00A1Buenos d\u00EDas!';
  if (h < 19) return '\u00A1Buenas tardes!';
  return '\u00A1Buenas noches!';
}

function getDailyMacroSummary(dateStr) {
  let logs = [];
  if (dateStr) {
    logs = (window.DB && typeof window.DB.getLogsByDate === 'function') ? window.DB.getLogsByDate(dateStr) : [];
  } else {
    logs = (window.DB && typeof window.DB.getTodayLogs === 'function') ? window.DB.getTodayLogs() : [];
  }

  let calories = 0, protein = 0, carbs = 0, fat = 0;

  for (const log of logs) {
    if (log.type === 'meal') {
      const m = calcRecipeMacros(log.reference_id);
      calories += m.calories;
      protein  += m.protein;
      carbs    += m.carbs;
      fat      += m.fat;
    } else if (log.type === 'food_item') {
      const fi = window.DB.getFoodItemById(log.reference_id);
      if (fi) {
        const factor = (log.quantity_g || 100) / 100;
        calories += Math.round((fi.calories_per_100g || 0) * factor);
        protein  += parseFloat(((fi.protein_per_100g  || 0) * factor).toFixed(1));
        carbs    += parseFloat(((fi.carbs_per_100g    || 0) * factor).toFixed(1));
        fat      += parseFloat(((fi.fat_per_100g      || 0) * factor).toFixed(1));
      }
    }
  }

  return {
    calories: Math.round(calories),
    protein:  parseFloat(protein.toFixed(1)),
    carbs:    parseFloat(carbs.toFixed(1)),
    fat:      parseFloat(fat.toFixed(1)),
  };
}

function getPlanVsExtraSummary(dateStr) {
  let logs = [];
  if (dateStr) {
    logs = (window.DB && typeof window.DB.getLogsByDate === 'function') ? window.DB.getLogsByDate(dateStr) : [];
  } else {
    logs = (window.DB && typeof window.DB.getTodayLogs === 'function') ? window.DB.getTodayLogs() : [];
  }

  const plan  = { calories: 0, entries: 0 };
  const extra = { calories: 0, entries: 0 };

  for (const log of logs) {
    let cal = 0;
    if (log.type === 'meal') {
      cal = calcRecipeMacros(log.reference_id).calories;
    } else if (log.type === 'food_item') {
      const fi = window.DB.getFoodItemById(log.reference_id);
      if (fi) cal = Math.round((fi.calories_per_100g || 0) * (log.quantity_g || 100) / 100);
    } else if (log.type === 'liquid') {
      continue;
    }

    const isPlanned = (log.type === 'meal' && log.planned !== false) || log.planned === true;
    if (isPlanned) {
      plan.calories += cal;
      plan.entries  += 1;
    } else {
      extra.calories += cal;
      extra.entries  += 1;
    }
  }

  return { plan, extra };
}

function getUpcomingNeedsToBuy() {
  const currentSlot = getCurrentMealSlot();
  const currentIdx  = MEAL_ORDER.indexOf(currentSlot);
  const remainingSlots = MEAL_ORDER.slice(currentIdx);

  const recipesMap = new Map();

  for (const slot of remainingSlots) {
    if (hasMealBeenLoggedToday(slot)) continue;
    const { needsToBuy } = getRecipesForSlot(slot);
    for (const recipeData of needsToBuy) {
      if (!recipesMap.has(recipeData.id)) {
        recipesMap.set(recipeData.id, recipeData);
      }
    }
  }

  return Array.from(recipesMap.values());
}
