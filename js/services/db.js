// ============================================================
// db.js ? Estado y Persistencia de NutriFlow
// ============================================================

const STORAGE_KEY = 'nutriflow_state';

const initialState = {
  userPreferences: {
    dislikedIngredients: [],
    hiddenRecipes: [],
    favorites: ['rec_001', 'rec_006'],
    frequentItems: ['ing_001', 'ing_014', 'ing_019'],
    geminiApiKey: '',
    goals: {
      calories: 2000,
      protein: 150,
      carbs: 220,
      fat: 65,
    },
    mealHours: {
      desayuno: { start: 7,  end: 11 },
      almuerzo: { start: 12, end: 16 },
      merienda: { start: 16, end: 19 },
      cena:     { start: 20, end: 23 },
    },
  },

  customRecipes: [],
  customRecipeIngredients: [],
  customIngredients: [],

  pantry: [
    { ingredient_id: 'ing_001', quantity_available: 500 },
    { ingredient_id: 'ing_002', quantity_available: 300 },
    { ingredient_id: 'ing_003', quantity_available: 200 },
    { ingredient_id: 'ing_004', quantity_available: 400 },
    { ingredient_id: 'ing_005', quantity_available: 300 },
    { ingredient_id: 'ing_006', quantity_available: 400 },
    { ingredient_id: 'ing_007', quantity_available: 500 },
    { ingredient_id: 'ing_008', quantity_available: 0 },
    { ingredient_id: 'ing_009', quantity_available: 500 },
    { ingredient_id: 'ing_010', quantity_available: 50 },
    { ingredient_id: 'ing_011', quantity_available: 1000 },
    { ingredient_id: 'ing_012', quantity_available: 0 },
    { ingredient_id: 'ing_013', quantity_available: 200 },
    { ingredient_id: 'ing_014', quantity_available: 600 },
    { ingredient_id: 'ing_015', quantity_available: 200 },
    { ingredient_id: 'ing_016', quantity_available: 0 },
    { ingredient_id: 'ing_017', quantity_available: 300 },
    { ingredient_id: 'ing_018', quantity_available: 300 },
    { ingredient_id: 'ing_019', quantity_available: 500 },
    { ingredient_id: 'ing_020', quantity_available: 500 },
    { ingredient_id: 'ing_021', quantity_available: 0 },
    { ingredient_id: 'ing_022', quantity_available: 0 },
    { ingredient_id: 'ing_023', quantity_available: 400 },
    { ingredient_id: 'ing_024', quantity_available: 500 },
    { ingredient_id: 'ing_025', quantity_available: 300 },
    { ingredient_id: 'ing_026', quantity_available: 400 },
    { ingredient_id: 'ing_027', quantity_available: 0 },
    { ingredient_id: 'ing_028', quantity_available: 400 },
    { ingredient_id: 'ing_029', quantity_available: 200 },
    { ingredient_id: 'ing_030', quantity_available: 150 },
    { ingredient_id: 'ing_031', quantity_available: 0 },
    { ingredient_id: 'ing_032', quantity_available: 200 },
    { ingredient_id: 'ing_033', quantity_available: 0 },
    { ingredient_id: 'ing_034', quantity_available: 500 },
    { ingredient_id: 'ing_035', quantity_available: 0 },
  ],

  foodLogs: [],

  liquids: [
    { id: 'liq_001', name: 'Agua', type: 'Agua', icon: '💧', goal_ml: 2000, current_ml: 0 },
  ],
};

let appState = JSON.parse(JSON.stringify(initialState));

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      if (!parsed.userPreferences) parsed.userPreferences = JSON.parse(JSON.stringify(initialState.userPreferences));
      if (!parsed.userPreferences.dislikedIngredients) {
        parsed.userPreferences.dislikedIngredients = parsed.userPreferences.disliked_ingredients || [];
      }
      if (!parsed.userPreferences.hiddenRecipes) {
        parsed.userPreferences.hiddenRecipes = [];
      }
      delete parsed.userPreferences.disliked_ingredients;

      let loadedKey = (parsed.userPreferences.geminiApiKey || parsed.userPreferences.gemini_api_key || '').trim();
      parsed.userPreferences.geminiApiKey = loadedKey;
      delete parsed.userPreferences.gemini_api_key;
      
      if (!parsed.liquids || !parsed.liquids.length) parsed.liquids = initialState.liquids;
      parsed.liquids.forEach(l => {
        if (!l.type) l.type = l.name || 'Agua';
      });

      if (!Array.isArray(parsed.customRecipes)) parsed.customRecipes = [];
      if (!Array.isArray(parsed.customRecipeIngredients)) parsed.customRecipeIngredients = [];
      if (!Array.isArray(parsed.customIngredients)) parsed.customIngredients = [];

      // Cleanup static data from old localStorage state if it exists
      delete parsed.ingredients;
      delete parsed.recipes;
      delete parsed.recipe_ingredients;
      
      // Preserve custom food items (IDs like fi_1724...) but drop static ones (IDs like fi_001)
      if (parsed.foodItems) {
        parsed.foodItems = parsed.foodItems.filter(fi => fi.id && fi.id.length > 10);
      }
      appState = parsed;
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    appState = JSON.parse(JSON.stringify(initialState));
  }
}

let persistTimeout = null;
function persistState() {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Error persisting state to localStorage:', e);
    }
  }, 300);
}

function resetState() {
  appState = JSON.parse(JSON.stringify(initialState));
  persistState();
}

// O(1) Lookups for static data
const CATALOG_INGREDIENTS_MAP = new Map(CATALOG_INGREDIENTS.map(i => [i.id, i]));
const CATALOG_RECIPES_MAP = new Map(CATALOG_RECIPES.map(r => [r.id, r]));
const CATALOG_FOOD_ITEMS_MAP = new Map(CATALOG_FOOD_ITEMS.map(fi => [fi.id, fi]));

const DB = {
  get state() { return appState; },
  get ingredients() { 
    return [...CATALOG_INGREDIENTS, ...(appState.customIngredients || [])]; 
  },
  get recipes() { 
    const hidden = (appState.userPreferences && appState.userPreferences.hiddenRecipes) ? appState.userPreferences.hiddenRecipes : [];
    const activeCatalog = CATALOG_RECIPES.filter(r => !hidden.includes(r.id));
    return [...activeCatalog, ...(appState.customRecipes || [])]; 
  },
  get allRecipes() {
    return [...CATALOG_RECIPES, ...(appState.customRecipes || [])];
  },
  get customRecipes() {
    return appState.customRecipes || [];
  },
  get recipeIngredients() { 
    return [...CATALOG_RECIPE_INGREDIENTS, ...(appState.customRecipeIngredients || [])]; 
  },
  get pantry() { return appState.pantry; },
  get foodLogs() { return appState.foodLogs; },
  get liquids() { return appState.liquids; },
  get userPreferences() { return appState.userPreferences; },
  get foodItems() { return [...CATALOG_FOOD_ITEMS, ...(appState.foodItems || [])]; },

  getIngredientById(id) {
    if (!id) return null;
    const custom = (appState.customIngredients || []).find(i => i.id === id);
    if (custom) return custom;
    return CATALOG_INGREDIENTS_MAP.get(id) || null;
  },

  getRecipeById(id) {
    if (!id) return null;
    const custom = (appState.customRecipes || []).find(r => r.id === id);
    if (custom) return custom;
    return CATALOG_RECIPES_MAP.get(id) || null;
  },

  getRecipeIngredients(recipeId) {
    if (!recipeId) return [];
    const customRis = (appState.customRecipeIngredients || []).filter(ri => ri.recipe_id === recipeId);
    if (customRis.length > 0) return customRis;
    return CATALOG_RECIPE_INGREDIENTS.filter(ri => ri.recipe_id === recipeId);
  },

  getPantryItem(ingredientId) {
    return appState.pantry.find(p => p.ingredient_id === ingredientId) || null;
  },

  updatePantryQuantity(ingredientId, quantity) {
    const item = appState.pantry.find(p => p.ingredient_id === ingredientId);
    if (item) {
      item.quantity_available = quantity;
    } else {
      appState.pantry.push({ ingredient_id: ingredientId, quantity_available: quantity });
    }
    persistState();
  },

  getTodayLogs() {
    let dateStr = window.ACTIVE_DATE;
    if (!dateStr) {
      const d = new Date();
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return appState.foodLogs.filter(l => l.date === dateStr);
  },

  getLogsByDate(dateStr) {
    return appState.foodLogs.filter(l => l.date === dateStr);
  },

  addFoodLog(log) {
    let dateStr = window.ACTIVE_DATE;
    if (!dateStr) {
      const d = new Date();
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      date: dateStr,
      timestamp: new Date().toISOString(),
      ...log,
    };
    appState.foodLogs.push(newLog);
    persistState();
    return newLog;
  },

  removeFoodLog(logId) {
    appState.foodLogs = appState.foodLogs.filter(l => l.id !== logId);
    persistState();
  },

  toggleDislikedIngredient(ingredientId) {
    if (!appState.userPreferences.dislikedIngredients) {
      appState.userPreferences.dislikedIngredients = appState.userPreferences.disliked_ingredients || [];
    }
    const arr = appState.userPreferences.dislikedIngredients;
    const idx = arr.indexOf(ingredientId);
    if (idx === -1) {
      arr.push(ingredientId);
    } else {
      arr.splice(idx, 1);
    }
    appState.userPreferences.disliked_ingredients = arr;
    persistState();
  },

  toggleFavorite(recipeId) {
    const arr = appState.userPreferences.favorites;
    const idx = arr.indexOf(recipeId);
    if (idx === -1) {
      arr.push(recipeId);
    } else {
      arr.splice(idx, 1);
    }
    persistState();
  },

  isFavorite(recipeId) {
    return (appState.userPreferences.favorites || []).includes(recipeId);
  },

  updateGeminiKey(key) {
    if (!appState.userPreferences) appState.userPreferences = {};
    appState.userPreferences.geminiApiKey = key;
    appState.userPreferences.gemini_api_key = key;
    persistState();
  },

  updateGoals(goals) {
    appState.userPreferences.goals = {
      ...appState.userPreferences.goals,
      ...goals,
    };
    persistState();
  },

  getFoodItemById(id) {
    const custom = (appState.foodItems || []).find(fi => fi.id === id);
    if (custom) return custom;
    return CATALOG_FOOD_ITEMS_MAP.get(id) || null;
  },

  getFoodItemByExactName(name) {
    if (!name) return null;
    const lower = name.trim().toLowerCase();
    const custom = (appState.foodItems || []).find(fi => fi.name.toLowerCase() === lower);
    if (custom) return custom;
    return CATALOG_FOOD_ITEMS.find(fi => fi.name.toLowerCase() === lower) || null;
  },

  searchFoodItems(query) {
    const allItems = [...CATALOG_FOOD_ITEMS, ...(appState.foodItems || [])];
    if (!query) return allItems;
    const q = query.trim().toLowerCase();
    return allItems.filter(fi => fi.name.toLowerCase().includes(q) || (fi.category || '').toLowerCase().includes(q));
  },

  addFoodItem(item) {
    if (!appState.foodItems) appState.foodItems = [];
    const newItem = {
      id: 'fi_' + Date.now(),
      ...item,
    };
    appState.foodItems.push(newItem);
    persistState();
    return newItem;
  },

  getFrequentItems() {
    return appState.userPreferences.frequentItems || [];
  },

  getFavorites() {
    return appState.userPreferences.favorites || [];
  },

  updateFoodLogQty(logId, newQty) {
    const log = appState.foodLogs.find(l => l.id === logId);
    if (log) {
      log.quantity_g = newQty;
      persistState();
    }
  },

  saveRecipe(recipeData, ingredientsArray = []) {
    if (!appState.customRecipes) appState.customRecipes = [];
    if (!appState.customRecipeIngredients) appState.customRecipeIngredients = [];

    const isEdit = Boolean(recipeData.id && appState.customRecipes.some(r => r.id === recipeData.id));
    const recipeId = isEdit 
      ? recipeData.id 
      : ('rec_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

    const savedRecipe = {
      id: recipeId,
      name: (recipeData.name || 'Receta sin nombre').trim(),
      meal_type: (recipeData.meal_type || 'desayuno').toLowerCase(),
      instructions: (recipeData.instructions || '').trim(),
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    if (isEdit) {
      const idx = appState.customRecipes.findIndex(r => r.id === recipeId);
      appState.customRecipes[idx] = savedRecipe;
    } else {
      appState.customRecipes.push(savedRecipe);
    }

    // Replace recipe ingredients
    appState.customRecipeIngredients = appState.customRecipeIngredients.filter(ri => ri.recipe_id !== recipeId);
    
    ingredientsArray.forEach((ing, index) => {
      if (!ing.ingredient_id || !ing.quantity) return;
      appState.customRecipeIngredients.push({
        id: `ri_custom_${Date.now()}_${index}`,
        recipe_id: recipeId,
        ingredient_id: ing.ingredient_id,
        quantity: Math.max(1, Number(ing.quantity) || 100),
      });

      // Ensure item exists in pantry with default 0 if not present
      if (!appState.pantry.some(p => p.ingredient_id === ing.ingredient_id)) {
        appState.pantry.push({ ingredient_id: ing.ingredient_id, quantity_available: 0 });
      }
    });

    persistState();
    return savedRecipe;
  },

  deleteCustomRecipe(recipeId) {
    if (!appState.customRecipes) appState.customRecipes = [];
    if (!appState.customRecipeIngredients) appState.customRecipeIngredients = [];

    appState.customRecipes = appState.customRecipes.filter(r => r.id !== recipeId);
    appState.customRecipeIngredients = appState.customRecipeIngredients.filter(ri => ri.recipe_id !== recipeId);

    if (appState.userPreferences && appState.userPreferences.favorites) {
      appState.userPreferences.favorites = appState.userPreferences.favorites.filter(id => id !== recipeId);
    }

    persistState();
  },

  toggleHideRecipe(recipeId) {
    if (!appState.userPreferences) appState.userPreferences = {};
    if (!Array.isArray(appState.userPreferences.hiddenRecipes)) {
      appState.userPreferences.hiddenRecipes = [];
    }

    const arr = appState.userPreferences.hiddenRecipes;
    const idx = arr.indexOf(recipeId);
    let isHidden = false;

    if (idx === -1) {
      arr.push(recipeId);
      isHidden = true;
    } else {
      arr.splice(idx, 1);
      isHidden = false;
    }

    persistState();
    return isHidden;
  },

  isRecipeHidden(recipeId) {
    return Boolean(appState.userPreferences?.hiddenRecipes?.includes(recipeId));
  },

  saveCustomIngredient(ingData) {
    if (!appState.customIngredients) appState.customIngredients = [];

    const isEdit = Boolean(ingData.id && appState.customIngredients.some(i => i.id === ingData.id));
    const ingId = isEdit 
      ? ingData.id 
      : ('ing_custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

    const savedIng = {
      id: ingId,
      name: (ingData.name || 'Nuevo ingrediente').trim(),
      category: (ingData.category || 'Otro').trim(),
      calories_per_100g: Math.max(0, Number(ingData.calories_per_100g) || 0),
      protein_per_100g: Math.max(0, Number(ingData.protein_per_100g) || 0),
      carbs_per_100g: Math.max(0, Number(ingData.carbs_per_100g) || 0),
      fat_per_100g: Math.max(0, Number(ingData.fat_per_100g) || 0),
      isCustom: true,
    };

    if (isEdit) {
      const idx = appState.customIngredients.findIndex(i => i.id === ingId);
      appState.customIngredients[idx] = savedIng;
    } else {
      appState.customIngredients.push(savedIng);
    }

    // Ensure it exists in pantry
    if (!appState.pantry.some(p => p.ingredient_id === ingId)) {
      appState.pantry.push({ ingredient_id: ingId, quantity_available: 0 });
    }

    persistState();
    return savedIng;
  },

  addCustomIngredient(ingData) {
    return this.saveCustomIngredient(ingData);
  },

  deleteCustomIngredient(ingId) {
    if (!appState.customIngredients) appState.customIngredients = [];
    appState.customIngredients = appState.customIngredients.filter(i => i.id !== ingId);
    appState.pantry = appState.pantry.filter(p => p.ingredient_id !== ingId);
    if (appState.customRecipeIngredients) {
      appState.customRecipeIngredients = appState.customRecipeIngredients.filter(ri => ri.ingredient_id !== ingId);
    }
    persistState();
  },
};

window.DB = DB;
