// ============================================================
// calc.js — Lógica de negocio y cálculo de macros
// ============================================================

const MEAL_SLOTS_META = {
  desayuno: { label: 'Desayuno', emoji: '🌅' },
  almuerzo: { label: 'Almuerzo', emoji: '☀️' },
  merienda: { label: 'Merienda', emoji: '🍎' },
  cena:     { label: 'Cena',     emoji: '🌙' },
};
const MEAL_ORDER = ['desayuno', 'almuerzo', 'merienda', 'cena'];

/**
 * Lee los rangos horarios definidos por el usuario (o usa los valores por defecto).
 */
function getMealHours() {
  const prefs = DB.userPreferences;
  return prefs.meal_hours || {
    desayuno: { start: 6,  end: 12 },
    almuerzo: { start: 12, end: 17 },
    merienda: { start: 17, end: 19 },
    cena:     { start: 19, end: 23 },
  };
}

/**
 * Calcula los macros totales de una receta basándose en sus ingredientes.
 */
function calcRecipeMacros(recipeId) {
  const recipeIngredients = DB.getRecipeIngredients(recipeId);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const ri of recipeIngredients) {
    const ingredient = DB.getIngredientById(ri.ingredient_id);
    if (!ingredient) continue;
    const factor = ri.quantity / 100;
    totals.calories += ingredient.calories_per_100g * factor;
    totals.protein  += ingredient.protein_per_100g  * factor;
    totals.carbs    += ingredient.carbs_per_100g    * factor;
    totals.fat      += ingredient.fat_per_100g      * factor;
  }

  return {
    calories: Math.round(totals.calories),
    protein:  Math.round(totals.protein  * 10) / 10,
    carbs:    Math.round(totals.carbs    * 10) / 10,
    fat:      Math.round(totals.fat      * 10) / 10,
  };
}

/**
 * Determina el turno de comida actual usando los rangos del usuario.
 */
function getCurrentMealSlot() {
  const hour  = new Date().getHours();
  const hours = getMealHours();

  for (const type of MEAL_ORDER) {
    const { start, end } = hours[type];
    if (hour >= start && hour < end) {
      return { type, ...MEAL_SLOTS_META[type] };
    }
  }
  return { type: 'entre_comidas', label: 'Descansando', emoji: '💤' };
}

/**
 * Devuelve el siguiente turno de comida que aún no ha sido registrado hoy.
 * @param {string} afterType — tipo desde el que buscar (exclusive)
 */
function getNextUnloggedSlot(afterType) {
  const startIdx = afterType === 'entre_comidas'
    ? 0
    : MEAL_ORDER.indexOf(afterType) + 1;

  for (let i = startIdx; i < MEAL_ORDER.length; i++) {
    const type = MEAL_ORDER[i];
    if (!hasMealBeenLoggedToday(type)) {
      return { type, ...MEAL_SLOTS_META[type] };
    }
  }
  return null;
}

/**
 * Detecta si el usuario ya registró la comida del turno indicado hoy.
 */
function hasMealBeenLoggedToday(mealType) {
  if (mealType === 'entre_comidas') return true;
  const todayLogs = DB.getTodayLogs().filter(l => l.type === 'meal');
  for (const log of todayLogs) {
    const recipe = DB.getRecipeById(log.reference_id);
    if (recipe && recipe.meal_type === mealType) return true;
  }
  return false;
}

/**
 * Verifica si una receta tiene ingredientes no deseados por el usuario.
 */
function recipeHasDislikedIngredients(recipeId) {
  const dislikes = DB.userPreferences.disliked_ingredients;
  if (!dislikes.length) return false;
  const recipeIngredients = DB.getRecipeIngredients(recipeId);
  return recipeIngredients.some(ri => dislikes.includes(ri.ingredient_id));
}

/**
 * Verifica disponibilidad en despensa para una receta.
 */
function checkPantryForRecipe(recipeId) {
  const recipeIngredients = DB.getRecipeIngredients(recipeId);
  const missingIngredients = [];

  for (const ri of recipeIngredients) {
    const pantryItem = DB.getPantryItem(ri.ingredient_id);
    const available  = pantryItem ? pantryItem.quantity_available : 0;
    if (available < ri.quantity) {
      missingIngredients.push({
        ingredient: DB.getIngredientById(ri.ingredient_id),
        needed:    ri.quantity,
        available
      });
    }
  }
  return { canCook: missingIngredients.length === 0, missingIngredients };
}

/**
 * Obtiene las recetas filtradas para un tipo de comida específico.
 */
function getRecipesForSlot(mealType) {
  const eligible = DB.recipes.filter(r => {
    if (r.meal_type !== mealType) return false;
    if (recipeHasDislikedIngredients(r.id)) return false;
    return true;
  });

  const canCook = [], needsToBuy = [];
  for (const recipe of eligible) {
    const check   = checkPantryForRecipe(recipe.id);
    const macros  = calcRecipeMacros(recipe.id);
    const enriched = { ...recipe, macros, pantryCheck: check };
    check.canCook ? canCook.push(enriched) : needsToBuy.push(enriched);
  }
  return { canCook, needsToBuy };
}

/**
 * Obtiene el estado completo del diario para renderizado multi-sección.
 */
function getDiaryState() {
  const slot         = getCurrentMealSlot();
  const mealLogged   = hasMealBeenLoggedToday(slot.type);
  const isBetween    = slot.type === 'entre_comidas';
  const showMealFirst = !isBetween && !mealLogged; // es hora de comer y aún no come

  let currentRecipes = null;
  if (!isBetween && !mealLogged) {
    currentRecipes = getRecipesForSlot(slot.type);
  }

  const nextSlot = getNextUnloggedSlot(
    mealLogged ? slot.type : (isBetween ? 'entre_comidas' : slot.type)
  );
  let nextRecipes = null;
  if (nextSlot) {
    nextRecipes = getRecipesForSlot(nextSlot.type);
  }

  return { slot, showMealFirst, currentRecipes, nextSlot, nextRecipes };
}

/**
 * Saludo según la hora del día.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return '¡Buenos días! 🌸';
  if (hour >= 12 && hour < 19) return '¡Buenas tardes! ☀️';
  return '¡Buenas noches! 🌙';
}

/**
 * Resumen de macros del día completo.
 */
function getDailyMacroSummary() {
  const todayLogs = DB.getTodayLogs();
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const log of todayLogs) {
    if (log.type === 'meal') {
      // Recetas del plan o libres
      const macros = calcRecipeMacros(log.reference_id);
      totals.calories += macros.calories;
      totals.protein  += macros.protein;
      totals.carbs    += macros.carbs;
      totals.fat      += macros.fat;
    } else if (log.type === 'food_item') {
      // Alimentos libres (con cantidad en gramos)
      const fi = DB.getFoodItemById(log.reference_id);
      if (fi) {
        const qty = log.quantity_g || 100;
        const factor = qty / 100;
        totals.calories += (fi.calories_per_100g || 0) * factor;
        totals.protein  += (fi.protein_per_100g  || 0) * factor;
        totals.carbs    += (fi.carbs_per_100g    || 0) * factor;
        totals.fat      += (fi.fat_per_100g      || 0) * factor;
      }
    }
  }

  return {
    calories: Math.round(totals.calories),
    protein:  Math.round(totals.protein  * 10) / 10,
    carbs:    Math.round(totals.carbs    * 10) / 10,
    fat:      Math.round(totals.fat      * 10) / 10,
  };
}

// Alias mantenido para compatibilidad con renderDiaryScreen legacy
function getFilteredRecipesForNow() {
  const slot        = getCurrentMealSlot();
  const alreadyLogged = hasMealBeenLoggedToday(slot.type);
  if (slot.type === 'entre_comidas' || alreadyLogged) {
    return { slot, showHydration: true, canCook: [], needsToBuy: [] };
  }
  const { canCook, needsToBuy } = getRecipesForSlot(slot.type);
  return { slot, showHydration: false, canCook, needsToBuy };
}

/**
 * Obtiene todas las recetas faltantes por comprar del catálogo completo.
 */
function getUpcomingNeedsToBuy() {
  const needsToBuy = [];
  for (const type of MEAL_ORDER) {
    const recipes = getRecipesForSlot(type);
    needsToBuy.push(...recipes.needsToBuy);
  }
  return needsToBuy;
}

/**
 * Separa las calorías y entradas del día en dos grupos:
 *   - plan: recetas del plan nutricional (planned === true)
 *   - extra: alimentos libres o recetas fuera del plan (planned === false, food_item)
 * @returns {{ plan: {calories, entries}, extra: {calories, entries} }}
 */
function getPlanVsExtraSummary() {
  const todayLogs = DB.getTodayLogs();
  const plan  = { calories: 0, entries: 0 };
  const extra = { calories: 0, entries: 0 };

  for (const log of todayLogs) {
    if (log.type === 'liquid') continue; // líquidos no cuentan aquí

    if (log.type === 'meal') {
      const macros = calcRecipeMacros(log.reference_id);
      if (log.planned === true) {
        plan.calories  += macros.calories;
        plan.entries   += 1;
      } else {
        extra.calories += macros.calories;
        extra.entries  += 1;
      }
    } else if (log.type === 'food_item') {
      const fi = DB.getFoodItemById(log.reference_id);
      if (fi) {
        const qty = log.quantity_g || 100;
        const kcal = Math.round((fi.calories_per_100g || 0) * qty / 100);
        extra.calories += kcal;
        extra.entries  += 1;
      }
    }
  }

  plan.calories  = Math.round(plan.calories);
  extra.calories = Math.round(extra.calories);
  return { plan, extra };
}

