// ============================================================
// ai.js — Módulo de integración con Gemini API
// Depende de: db.js, calc.js
// ============================================================

//const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

const AI = {

  // ──────────────────────────────────────────────
  // CONFIGURACIÓN
  // ──────────────────────────────────────────────

  getKey() {
    return (DB.userPreferences.gemini_api_key || '').trim();
  },

  isConfigured() {
    return this.getKey().length > 10;
  },

  // ──────────────────────────────────────────────
  // LLAMADA BASE A LA API
  // ──────────────────────────────────────────────

  async _call(prompt) {
    const key = this.getKey();
    if (!key) throw new Error('NO_KEY');

    const res = await fetch(`${GEMINI_BASE_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  // ──────────────────────────────────────────────
  // INFORMACIÓN NUTRICIONAL DE UN ALIMENTO
  // ──────────────────────────────────────────────

  /**
   * Busca primero en la BD local. Si no está, consulta a Gemini,
   * guarda el resultado y lo devuelve.
   * @param {string} foodName — nombre del alimento a buscar
   * @returns {{ item, fromCache: boolean }}
   */
  async fetchNutritionInfo(foodName) {
    // 1. Buscar en food_items guardados (Coincidencia exacta para evitar mezclar platos con ingredientes sueltos)
    const localFoodItem = DB.getFoodItemByExactName(foodName);
    if (localFoodItem) return { item: localFoodItem, fromCache: true };

    // 2. Buscar entre ingredientes de recetas (Coincidencia exacta)
    const localIngredient = DB.ingredients.find(i =>
      i.name.toLowerCase().trim() === foodName.toLowerCase().trim()
    );
    if (localIngredient) return { item: localIngredient, fromCache: true };

    // 3. Consultar Gemini
    const prompt = `Devuelve SOLO un objeto JSON válido (sin markdown, sin texto adicional, sin bloques de código) con la información nutricional de "${foodName}" por cada 100 gramos. Usa exactamente este esquema:
{
  "name": "nombre oficial del alimento en español",
  "category": "una de: Proteína, Carbohidrato, Verdura, Fruta, Grasa, Lácteo, Snack, Bebida, Otro",
  "calories_per_100g": número entero,
  "protein_per_100g": número decimal con un decimal,
  "carbs_per_100g": número decimal con un decimal,
  "fat_per_100g": número decimal con un decimal,
  "typical_serving_g": número entero (porción típica en gramos)
}`;

    const raw = await this._call(prompt);

    console.log("============== 🤖 RESPUESTA CRUDA DE GEMINI ==============");
    console.log(raw);
    console.log("==========================================================");

    // Limpiar la respuesta por si Gemini añade markdown
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Gemini devolvió un formato inesperado. Intenta con otro nombre.');
    }

    // 4. Devolver objeto temporal (no se guarda en DB hasta que el usuario confirme)
    return { item: { ...parsed, _isTemp: true, source: 'gemini' }, fromCache: false };
  },

  // ──────────────────────────────────────────────
  // REGISTRO POR VOZ
  // ──────────────────────────────────────────────

  /**
   * Extrae el nombre del alimento y la cantidad en gramos de un texto natural.
   * @param {string} transcript - Ej. "me comí doscientos gramos de pollo asado"
   * @returns {Promise<{food_name: string, quantity_g: number}>}
   */
  async parseVoiceInput(transcript) {
    const prompt = `Extrae el alimento y la cantidad en gramos del siguiente texto. 
Devuelve SOLO un objeto JSON válido (NUNCA un array, sin texto adicional) con esta estructura exacta. Si hay varios alimentos, únelos en un solo nombre (ej. "huevos con pan"):
{
  "food_name": "nombre del alimento o combinación (MANTÉN modificadores importantes como 'sin azúcar', 'frito', 'light', etc.)",
  "quantity_g": numero entero en gramos (SI el usuario NO especifica una cantidad exacta ni un peso, devuelve null. NO intentes adivinar ni estimar la porción aquí)
}

Texto del usuario: "${transcript}"`;

    const raw = await this._call(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();

    console.log("============== 🤖 RESPUESTA CRUDA DE GEMINI ==============");
    console.log(raw);
    console.log("==========================================================");
    
    try {
      let result = JSON.parse(cleaned);
      if (Array.isArray(result)) {
        if (result.length > 0) {
          result = {
            food_name: result.map(r => r.food_name).join(" con "),
            quantity_g: result.reduce((sum, r) => sum + (Number(r.quantity_g) || 0), 0) || null
          };
        } else {
          throw new Error('Array vacío');
        }
      }
      return result;
    } catch {
      throw new Error('No pude entender el alimento o la cantidad. Por favor, revisa el texto e intenta de nuevo.');
    }
  },

  // ──────────────────────────────────────────────
  // ASISTENTE NUTRICIONAL (CHAT)
  // ──────────────────────────────────────────────

  /**
   * Pregunta al asistente usando la memoria conversacional y el modo de contexto.
   * @param {string} userMessage
   * @param {string} contextMode - 'general' o 'progress'
   * @param {Array} chatHistory - Array de { role, text }
   * @returns {string}
   */
  async askAssistant(userMessage, contextMode = 'general', chatHistory = []) {
    let contextBlock = '';

    if (contextMode === 'progress') {
      const consumed = getDailyMacroSummary();
      const goals = DB.userPreferences.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };
      const todayLogs = DB.getTodayLogs();
      const { plan, extra } = getPlanVsExtraSummary();
  
      // Comidas del plan
      const plannedMeals = todayLogs
        .filter(l => l.type === 'meal' && l.planned === true)
        .map(l => {
          const r = DB.getRecipeById(l.reference_id);
          return r ? `- ${r.name} (${r.meal_type})` : null;
        })
        .filter(Boolean)
        .join('\n') || 'Ninguna del plan aun.';
  
      // Extras registrados
      const extraItems = todayLogs
        .filter(l => (l.type === 'meal' && l.planned === false) || l.type === 'food_item')
        .map(l => {
          if (l.type === 'meal') {
            const r = DB.getRecipeById(l.reference_id);
            return r ? `- ${r.name} (receta extra)` : null;
          }
          if (l.type === 'food_item') {
            const fi = DB.getFoodItemById(l.reference_id);
            const qty = l.quantity_g || 100;
            return fi ? `- ${fi.name} (${qty}g)` : null;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n') || 'Ninguno.';
  
      const liquidSummary = todayLogs
        .filter(l => l.type === 'liquid')
        .map(l => {
          const liq = DB.liquids.find(x => x.id === l.reference_id);
          return liq ? `- ${liq.name}` : null;
        })
        .filter(Boolean)
        .join('\n') || 'Ninguna bebida registrada.';
  
      const calRemain = Math.max(0, goals.calories - consumed.calories);
      const protRemain = Math.max(0, goals.protein - consumed.protein);
      const totalConsumed = plan.calories + extra.calories;
      const adherencia = totalConsumed > 0 ? Math.round((plan.calories / totalConsumed) * 100) : 0;

      contextBlock = `
CONTEXTO ACTUAL DEL USUARIO HOY (${new Date().toLocaleDateString('es-ES')}):
- Calorias: ${consumed.calories} / meta ${goals.calories} (faltan ${calRemain} kcal)
- Proteina: ${consumed.protein}g / meta ${goals.protein}g (faltan ${Math.max(0, protRemain)}g)
- Carbohidratos: ${consumed.carbs}g / meta ${goals.carbs}g
- Grasas: ${consumed.fat}g / meta ${goals.fat}g
- Comidas planificadas registradas: \n${plannedMeals}
- Extras no planificados: \n${extraItems}
- Bebidas: \n${liquidSummary}
- Adherencia al plan: ${adherencia}%
`;
    } else {
      contextBlock = `\nCONTEXTO: El usuario no ha proporcionado contexto de su progreso para esta pregunta, respóndela de manera general.\n`;
    }

    // Formatear historial
    // Solo tomar los últimos 6 mensajes para no sobrecargar el token limit
    const recentHistory = chatHistory.slice(-6).map(msg => {
      const name = msg.role === 'user' ? 'Usuario' : 'NutriBot';
      return `${name}: ${msg.text}`;
    }).join('\n\n');

    const prompt = `Eres NutriBot, un asistente nutricional experto, amigable y práctico. Responde SIEMPRE en español. 

REGLAS DE INTERACCIÓN:
- Usa emojis de forma equilibrada para hacer la charla amena, sin saturar.
- NO saludes en cada mensaje ("Hola", "Qué tal"). Ve directo al punto para mantener la fluidez de la conversación.
- Limita tus respuestas a máximo 180 palabras para que sean rápidas de leer.
- Puedes usar markdown para negritas (**texto**) y listas (* o -).

${contextBlock}
HISTORIAL DE CONVERSACIÓN RECIENTE:
${recentHistory || 'No hay mensajes previos.'}

NUEVO MENSAJE DEL USUARIO: ${userMessage}

Responde directamente al nuevo mensaje del usuario tomando en cuenta el historial para dar continuidad a la conversación.`;

    return await this._call(prompt);
  },

  // ──────────────────────────────────────────────
  // INSIGHT DIARIO PARA EL DASHBOARD
  // ──────────────────────────────────────────────

  /**
   * Genera un resumen motivador del día para el Dashboard.
   * @returns {string}
   */
  async getDailySummary() {
    const consumed = getDailyMacroSummary();
    const goals = DB.userPreferences.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };
    const { plan, extra } = getPlanVsExtraSummary();

    const todayLogs = DB.getTodayLogs();
    const todayMeals = todayLogs
      .filter(l => l.type === 'meal')
      .map(l => DB.getRecipeById(l.reference_id)?.name)
      .filter(Boolean);

    const todayExtras = todayLogs
      .filter(l => l.type === 'food_item')
      .map(l => {
        const fi = DB.getFoodItemById(l.reference_id);
        return fi ? fi.name : null;
      })
      .filter(Boolean);

    if (todayMeals.length === 0 && consumed.calories === 0) {
      return 'Empieza tu dia! Registra tu primera comida para ver tu progreso aqui.';
    }

    const calPct = Math.round((consumed.calories / goals.calories) * 100);
    const protPct = Math.round((consumed.protein / goals.protein) * 100);
    const hour = new Date().getHours();
    const totalConsumed = plan.calories + extra.calories;
    const adherencia = totalConsumed > 0 ? Math.round((plan.calories / totalConsumed) * 100) : 0;

    const prompt = `Eres un asistente nutricional. Genera UN SOLO parrafo de maximo 80 palabras en español, motivador y especifico, que interprete el progreso del usuario. No repitas los numeros exactos que ya ve en pantalla; agrega valor con una recomendacion concreta segun la hora y su adherencia al plan.

Hora: ${hour}:00h
Calorias: ${consumed.calories}/${goals.calories} (${calPct}%)
Proteina: ${consumed.protein}g/${goals.protein}g (${protPct}%)
Del plan: ${plan.calories} kcal (${plan.entries} comidas)
Extras: ${extra.calories} kcal (${extra.entries} registros)
Adherencia al plan: ${adherencia}%
Comidas del plan: ${todayMeals.join(', ') || 'ninguna aun'}
Extras registrados: ${todayExtras.join(', ') || 'ninguno'}

Parrafo:`;

    return await this._call(prompt);
  }
};
