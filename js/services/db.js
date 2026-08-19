// ============================================================
// db.js ? Estado y Persistencia de NutriFlow
// ============================================================

const STORAGE_KEY = 'nutriflow_state';

const initialState = {
  userPreferences: {
    dislikedIngredients: [],
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
      delete parsed.userPreferences.disliked_ingredients;

      let loadedKey = (parsed.userPreferences.geminiApiKey || parsed.userPreferences.gemini_api_key || '').trim();
      parsed.userPreferences.geminiApiKey = loadedKey;
      delete parsed.userPreferences.gemini_api_key;
      
      if (!parsed.liquids || !parsed.liquids.length) parsed.liquids = initialState.liquids;
      parsed.liquids.forEach(l => {
        if (!l.type) l.type = l.name || 'Agua';
      });

      // Cleanup static data from old localStorage state if it exists
      delete parsed.ingredients;
      delete parsed.recipes;
      delete parsed.recipe_ingredients;
      delete parsed.foodItems;

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
  get ingredients() { return CATALOG_INGREDIENTS; },
  get recipes() { return CATALOG_RECIPES; },
  get recipeIngredients() { return CATALOG_RECIPE_INGREDIENTS; },
  get pantry() { return appState.pantry; },
  get foodLogs() { return appState.foodLogs; },
  get liquids() { return appState.liquids; },
  get userPreferences() { return appState.userPreferences; },
  get foodItems() { return [...CATALOG_FOOD_ITEMS, ...(appState.foodItems || [])]; },

  getIngredientById(id) {
    return CATALOG_INGREDIENTS_MAP.get(id) || null;
  },

  getRecipeById(id) {
    return CATALOG_RECIPES_MAP.get(id) || null;
  },

  getRecipeIngredients(recipeId) {
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
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return appState.foodLogs.filter(l => l.date === today);
  },

  getLogsByDate(dateStr) {
    return appState.foodLogs.filter(l => l.date === dateStr);
  },

  addFoodLog(log) {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      date: today,
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
};

window.DB = DB;
