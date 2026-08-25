// ============================================================
// ai.js — Módulo de integración con Gemini API
// Depende de: db.js, calc.js
// ============================================================

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

const AI = {

  // ────────────────────────────────────────────
  // CONFIGURACIÓN
  // ────────────────────────────────────────────

  getKey() {
    const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
    return (prefs.geminiApiKey || prefs.gemini_api_key || '').trim();
  },

  isConfigured() {
    return this.getKey().length > 10;
  },

  // ────────────────────────────────────────────
  // LLAMADA BASE A LA API
  // ────────────────────────────────────────────

  async _call(prompt) {
    const key = this.getKey();
    if (!key) {
      console.warn('[NutriFlow AI] ⚠️ No hay API Key configurada.');
      throw new Error('NO_KEY');
    }

    console.log('[NutriFlow AI] 🚀 Iniciando consulta a Gemini API...');
    console.log('[NutriFlow AI] 📝 Prompt:', prompt);

    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[NutriFlow AI] 🔄 Intentando con modelo: ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
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

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log(`[NutriFlow AI] ✅ Respuesta exitosa con ${model}:`, text);
          return text;
        }

        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        console.warn(`[NutriFlow AI] ⚠️ Error en modelo ${model} (${res.status}):`, errMsg);
        lastError = new Error(errMsg);
        
        // Si el modelo no existe o fue descontinuado (404), intentamos el siguiente modelo
        if (res.status !== 404 && !errMsg.includes('not found') && !errMsg.includes('no longer available')) {
          throw lastError;
        }
      } catch (e) {
        lastError = e;
        if (e.message === 'NO_KEY') throw e;
      }
    }

    console.error('[NutriFlow AI] ❌ Fallaron todos los modelos disponibles:', lastError);
    throw lastError || new Error('No se pudo conectar con Gemini AI.');
  },

  /**
   * Consulta a Gemini para obtener la información nutricional de un ingrediente o alimento.
   * @param {string} foodName — nombre del alimento a buscar
   * @param {boolean} forceAI — si es true, consulta directamente a Gemini sin caché
   * @returns {{ item, fromCache: boolean }}
   */
  async fetchNutritionInfo(foodName, forceAI = false) {
    if (!forceAI) {
      // 1. Buscar en food_items guardados
      const localFoodItem = DB.getFoodItemByExactName(foodName);
      if (localFoodItem) {
        console.log('[NutriFlow AI] ⚡ Encontrado en food_items local:', localFoodItem);
        return { item: localFoodItem, fromCache: true };
      }

      // 2. Buscar entre ingredientes de recetas
      const localIngredient = DB.ingredients.find(i =>
        i.name.toLowerCase().trim() === foodName.toLowerCase().trim()
      );
      if (localIngredient) {
        console.log('[NutriFlow AI] ⚡ Encontrado en ingredientes local:', localIngredient);
        return { item: localIngredient, fromCache: true };
      }
    }

    // 3. Consultar Gemini
    console.log('[NutriFlow AI] 🤖 Consultando a Gemini para:', foodName);
    const prompt = `Devuelve SOLO un objeto JSON válido (sin markdown, sin bloques de código, sin texto extra) con la información nutricional de "${foodName}" por cada 100 gramos. Usa exactamente este formato JSON:
{
  "name": "nombre oficial del alimento en español con mayúscula inicial (ej. Plátano, Harina de almendras)",
  "category": "una de: Proteína, Cereal, Verdura, Fruta, Lácteo, Grasa, Legumbre, Especia, Otro",
  "calories_per_100g": número entero,
  "protein_per_100g": número decimal con un decimal,
  "carbs_per_100g": número decimal con un decimal,
  "fat_per_100g": número decimal con un decimal,
  "typical_serving_g": número entero
}`;

    const raw = await this._call(prompt);

    // Limpiar la respuesta por si Gemini añade markdown
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      console.log('[NutriFlow AI] 📦 Datos parseados:', parsed);
    } catch (e) {
      console.error('[NutriFlow AI] ❌ Error parseando JSON:', raw, e);
      throw new Error('Gemini devolvió un formato inesperado. Intenta con otro nombre.');
    }

    // 4. Devolver objeto temporal
    return { item: { ...parsed, _isTemp: true, source: 'gemini' }, fromCache: false };
  },

  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // REGISTRO POR VOZ
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /**
   * Extrae el nombre del alimento y la cantidad en gramos de un texto natural.
   * @param {string} transcript - Ej. "me com\u00ed doscientos gramos de pollo asado"
   * @returns {Promise<{food_name: string, quantity_g: number}>}
   */
  async parseVoiceInput(transcript) {
    const prompt = `Extrae el alimento y la cantidad en gramos del siguiente texto. 
Devuelve SOLO un objeto JSON v\u00e1lido (NUNCA un array, sin texto adicional) con esta estructura exacta. Si hay varios alimentos, \u00fanelos en un solo nombre (ej. "huevos con pan"):
{
  "food_name": "nombre del alimento o combinaci\u00f3n (MANT\u00c9N modificadores importantes como 'sin az\u00facar', 'frito', 'light', etc.)",
  "quantity_g": numero entero en gramos (SI el usuario NO especifica una cantidad exacta ni un peso, devuelve null. NO intentes adivinar ni estimar la porci\u00f3n aqu\u00ed),
  "meal_type": "Desayuno" | "Almuerzo" | "Cena" | "Merienda" | "Snack" (Infiere por el contexto como "cen\u00e9", "almorc\u00e9". Usa "Snack" si no es claro)
}

Texto del usuario: "${transcript}"`;

    const raw = await this._call(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();

    console.log("============== \u{1f916} RESPUESTA CRUDA DE GEMINI ==============");
    console.log(raw);
    console.log("==========================================================");
    
    try {
      let result = JSON.parse(cleaned);
      if (Array.isArray(result)) {
        if (result.length > 0) {
          result = {
            food_name: result.map(r => r.food_name).join(" con "),
            quantity_g: result.reduce((sum, r) => sum + (Number(r.quantity_g) || 0), 0) || null,
            meal_type: result[0].meal_type || 'Snack'
          };
        } else {
          throw new Error('Array vac\u00edo');
        }
      }
      return result;
    } catch {
      throw new Error('No pude entender el alimento o la cantidad. Por favor, revisa el texto e intenta de nuevo.');
    }
  },

  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // ASISTENTE NUTRICIONAL (CHAT)
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

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
      contextBlock = `\nCONTEXTO: El usuario no ha proporcionado contexto de su progreso para esta pregunta, resp\u00f3ndela de manera general.\n`;
    }

    // Formatear historial
    // Solo tomar los \u00faltimos 6 mensajes para no sobrecargar el token limit
    const recentHistory = chatHistory.slice(-6).map(msg => {
      const name = msg.role === 'user' ? 'Usuario' : 'NutriBot';
      return `${name}: ${msg.text}`;
    }).join('\n\n');

    const prompt = `Eres NutriBot, un asistente nutricional experto, amigable y pr\u00e1ctico. Responde SIEMPRE en espa\u00f1ol. 

REGLAS DE INTERACCI\u00d3N:
- Usa emojis de forma equilibrada para hacer la charla amena, sin saturar.
- NO saludes en cada mensaje ("Hola", "Qu\u00e9 tal"). Ve directo al punto para mantener la fluidez de la conversaci\u00f3n.
- Limita tus respuestas a m\u00e1ximo 180 palabras para que sean r\u00e1pidas de leer.
- Puedes usar markdown para negritas (**texto**) y listas (* o -).

${contextBlock}
HISTORIAL DE CONVERSACI\u00d3N RECIENTE:
${recentHistory || 'No hay mensajes previos.'}

NUEVO MENSAJE DEL USUARIO: ${userMessage}

Responde directamente al nuevo mensaje del usuario tomando en cuenta el historial para dar continuidad a la conversaci\u00f3n.`;

    return await this._call(prompt);
  },

  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // INSIGHT DIARIO PARA EL DASHBOARD
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  /**
   * Genera un resumen motivador del d\u00eda para el Dashboard.
   * @returns {string}
   */
    async getDailySummary(dateStr) {
    const todayIso = (typeof getDashTodayIso === 'function') ? getDashTodayIso() : new Date().toISOString().slice(0, 10);
    const targetDate = dateStr || todayIso;
    const isToday = (targetDate === todayIso);

    const consumed = (typeof getDailyMacroSummary === 'function') ? getDailyMacroSummary(targetDate) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
    const goals = prefs.goals || { calories: 2000, protein: 150, carbs: 220, fat: 65 };
    const { plan, extra } = (typeof getPlanVsExtraSummary === 'function') ? getPlanVsExtraSummary(targetDate) : { plan: { calories: 0, entries: 0 }, extra: { calories: 0, entries: 0 } };

    const logs = (window.DB && typeof window.DB.getLogsByDate === 'function')
      ? window.DB.getLogsByDate(targetDate)
      : (window.DB && typeof window.DB.getTodayLogs === 'function') ? window.DB.getTodayLogs() : [];

    const meals = logs
      .filter(l => l.type === 'meal')
      .map(l => window.DB.getRecipeById(l.reference_id)?.name)
      .filter(Boolean);

    const extras = logs
      .filter(l => l.type === 'food_item')
      .map(l => window.DB.getFoodItemById(l.reference_id)?.name)
      .filter(Boolean);

    if (meals.length === 0 && extras.length === 0 && consumed.calories === 0) {
      return isToday 
        ? '¡Empieza tu día! Registra tus comidas o agua para generar un análisis inteligente.'
        : 'No hay registros de comidas o hidratación en esta fecha histórica.';
    }

    const calPct = Math.round((consumed.calories / (goals.calories || 2000)) * 100);
    const protPct = Math.round((consumed.protein / (goals.protein || 150)) * 100);
    const totalConsumed = plan.calories + extra.calories;
    const adherencia = totalConsumed > 0 ? Math.round((plan.calories / totalConsumed) * 100) : 100;

    const prompt = `Eres un asistente nutricional empático y experto. Genera UN SOLO párrafo de máximo 75 palabras en español, motivador y conciso, que evalúe el día (${targetDate}) del usuario. No repitas mecánicamente los números que ya ve en pantalla; enfócate en su balance de proteína y adherencia, y da un consejo práctico y positivo.

Fecha: ${targetDate} (${isToday ? 'Hoy' : 'Día Histórico'})
Calorías: ${consumed.calories}/${goals.calories} (${calPct}%)
Proteína: ${consumed.protein}g/${goals.protein}g (${protPct}%)
Del plan: ${plan.calories} kcal (${plan.entries} comidas)
Extras: ${extra.calories} kcal (${extra.entries} registros)
Adherencia al plan: ${adherencia}%
Comidas: ${meals.join(', ') || 'ninguna'}
Extras: ${extras.join(', ') || 'ninguno'}

Párrafo:`;

    const summaryText = await this._call(prompt);
    
    // Persistir el resumen generado por fecha en localStorage
    try {
      localStorage.setItem('nutriflow_ai_summary_' + targetDate, JSON.stringify({
        text: summaryText,
        timestamp: Date.now()
      }));
    } catch(e) {}

    return summaryText;
  }
};

window.AI = AI;
