// ============================================================
// db.js — Estado de la aplicación y sincronización con localStorage
// ============================================================

const STORAGE_KEY = 'nutriflow_v2';

const initialState = {
  ingredients: [
    { id: 'ing_001', name: 'Huevo entero', category: 'Proteína', calories_per_100g: 143, protein_per_100g: 13, carbs_per_100g: 1, fat_per_100g: 10 },
    { id: 'ing_002', name: 'Clara de huevo', category: 'Proteína', calories_per_100g: 52, protein_per_100g: 11, carbs_per_100g: 1, fat_per_100g: 0 },
    { id: 'ing_003', name: 'Espinaca', category: 'Verdura', calories_per_100g: 23, protein_per_100g: 3, carbs_per_100g: 4, fat_per_100g: 0 },
    { id: 'ing_004', name: 'Tomate', category: 'Verdura', calories_per_100g: 18, protein_per_100g: 1, carbs_per_100g: 4, fat_per_100g: 0 },
    { id: 'ing_005', name: 'Cebolla', category: 'Verdura', calories_per_100g: 40, protein_per_100g: 1, carbs_per_100g: 9, fat_per_100g: 0 },
    { id: 'ing_006', name: 'Pan integral', category: 'Carbohidrato', calories_per_100g: 250, protein_per_100g: 10, carbs_per_100g: 40, fat_per_100g: 4 },
    { id: 'ing_007', name: 'Yogur griego natural', category: 'Proteína', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3, fat_per_100g: 0 },
    { id: 'ing_008', name: 'Fresas', category: 'Fruta', calories_per_100g: 32, protein_per_100g: 1, carbs_per_100g: 8, fat_per_100g: 0 },
    { id: 'ing_009', name: 'Avena', category: 'Carbohidrato', calories_per_100g: 389, protein_per_100g: 17, carbs_per_100g: 66, fat_per_100g: 7 },
    { id: 'ing_010', name: 'Canela', category: 'Carbohidrato', calories_per_100g: 247, protein_per_100g: 4, carbs_per_100g: 80, fat_per_100g: 1 },
    { id: 'ing_011', name: 'Leche descremada', category: 'Proteína', calories_per_100g: 35, protein_per_100g: 3, carbs_per_100g: 5, fat_per_100g: 0 },
    { id: 'ing_012', name: 'Manzana', category: 'Fruta', calories_per_100g: 52, protein_per_100g: 0, carbs_per_100g: 14, fat_per_100g: 0 },
    { id: 'ing_013', name: 'Mantequilla de maní', category: 'Grasa', calories_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50 },
    { id: 'ing_014', name: 'Pechuga de pollo', category: 'Proteína', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 4 },
    { id: 'ing_015', name: 'Lechuga', category: 'Verdura', calories_per_100g: 15, protein_per_100g: 1, carbs_per_100g: 3, fat_per_100g: 0 },
    { id: 'ing_016', name: 'Plátano', category: 'Fruta', calories_per_100g: 89, protein_per_100g: 1, carbs_per_100g: 23, fat_per_100g: 0 },
    { id: 'ing_017', name: 'Proteína en polvo', category: 'Proteína', calories_per_100g: 370, protein_per_100g: 80, carbs_per_100g: 5, fat_per_100g: 2 },
    { id: 'ing_018', name: 'Pepino', category: 'Verdura', calories_per_100g: 15, protein_per_100g: 1, carbs_per_100g: 4, fat_per_100g: 0 },
    { id: 'ing_019', name: 'Aceite de oliva', category: 'Grasa', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
    { id: 'ing_020', name: 'Arroz integral cocido', category: 'Carbohidrato', calories_per_100g: 111, protein_per_100g: 3, carbs_per_100g: 23, fat_per_100g: 1 },
    { id: 'ing_021', name: 'Pescado blanco', category: 'Proteína', calories_per_100g: 105, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 2 },
    { id: 'ing_022', name: 'Brócoli', category: 'Verdura', calories_per_100g: 34, protein_per_100g: 3, carbs_per_100g: 7, fat_per_100g: 0 },
    { id: 'ing_023', name: 'Zanahoria', category: 'Verdura', calories_per_100g: 41, protein_per_100g: 1, carbs_per_100g: 10, fat_per_100g: 0 },
    { id: 'ing_024', name: 'Papa cocida', category: 'Carbohidrato', calories_per_100g: 87, protein_per_100g: 2, carbs_per_100g: 20, fat_per_100g: 0 },
    { id: 'ing_025', name: 'Atún al agua', category: 'Proteína', calories_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1 },
    { id: 'ing_026', name: 'Garbanzos cocidos', category: 'Carbohidrato', calories_per_100g: 164, protein_per_100g: 9, carbs_per_100g: 27, fat_per_100g: 3 },
    { id: 'ing_027', name: 'Pimiento', category: 'Verdura', calories_per_100g: 20, protein_per_100g: 1, carbs_per_100g: 5, fat_per_100g: 0 },
    { id: 'ing_028', name: 'Lentejas cocidas', category: 'Carbohidrato', calories_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0 },
    { id: 'ing_029', name: 'Ensalada verde', category: 'Verdura', calories_per_100g: 15, protein_per_100g: 1, carbs_per_100g: 3, fat_per_100g: 0 },
    { id: 'ing_030', name: 'Hummus', category: 'Grasa', calories_per_100g: 166, protein_per_100g: 8, carbs_per_100g: 14, fat_per_100g: 10 },
    { id: 'ing_031', name: 'Almendras', category: 'Grasa', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
    { id: 'ing_032', name: 'Queso fresco bajo en grasa', category: 'Proteína', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3, fat_per_100g: 4 },
    { id: 'ing_033', name: 'Aguacate', category: 'Grasa', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15 },
    { id: 'ing_034', name: 'Champiñones', category: 'Verdura', calories_per_100g: 22, protein_per_100g: 3, carbs_per_100g: 3, fat_per_100g: 0 },
    { id: 'ing_035', name: 'Calabacín', category: 'Verdura', calories_per_100g: 17, protein_per_100g: 1, carbs_per_100g: 3, fat_per_100g: 0 },
    { id: 'ing_036', name: 'Verduras variadas', category: 'Verdura', calories_per_100g: 25, protein_per_100g: 1, carbs_per_100g: 5, fat_per_100g: 0 },
    { id: 'ing_037', name: 'Caldo bajo en grasa', category: 'Verdura', calories_per_100g: 10, protein_per_100g: 1, carbs_per_100g: 1, fat_per_100g: 0 },
    { id: 'ing_038', name: 'Tofu firme', category: 'Proteína', calories_per_100g: 144, protein_per_100g: 16, carbs_per_100g: 3, fat_per_100g: 9 },
  ],

  recipes: [
    { id: 'rec_001', name: 'Omelette de verduras', meal_type: 'desayuno', instructions: 'Batir los huevos y claras. Picar la espinaca, tomate y cebolla. Cocinar todo en una sartén y servir con pan integral.' },
    { id: 'rec_002', name: 'Yogur con frutas', meal_type: 'desayuno', instructions: 'Mezclar el yogur con las fresas lavadas y cortadas. Añadir la avena y espolvorear canela al gusto.' },
    { id: 'rec_003', name: 'Avena proteica', meal_type: 'desayuno', instructions: 'Cocinar la avena con la leche descremada. Servir con trozos de manzana y la mantequilla de maní por encima.' },
    { id: 'rec_004', name: 'Sándwich saludable', meal_type: 'desayuno', instructions: 'Armar el sándwich usando el pan integral, la pechuga, rodajas de tomate y lechuga fresca.' },
    { id: 'rec_005', name: 'Batido nutritivo', meal_type: 'desayuno', instructions: 'Licuar la leche descremada, plátano, espinaca y proteína en polvo hasta obtener una mezcla homogénea.' },
    { id: 'rec_006', name: 'Pollo con ensalada', meal_type: 'almuerzo', instructions: 'Servir la pechuga de pollo cocida con arroz integral. Acompañar con ensalada de lechuga, tomate y pepino aderezada con aceite de oliva.' },
    { id: 'rec_007', name: 'Pescado al horno', meal_type: 'almuerzo', instructions: 'Hornear el pescado junto con el brócoli, zanahoria y papa cocida en trozos.' },
    { id: 'rec_008', name: 'Ensalada de atún', meal_type: 'almuerzo', instructions: 'Mezclar el atún escurrido con garbanzos, lechuga, tomate y pepino picados. Aderezar con aceite de oliva.' },
    { id: 'rec_009', name: 'Salteado de pollo', meal_type: 'almuerzo', instructions: 'Cortar el pollo y saltearlo en sartén con brócoli, pimiento y zanahoria. Servir sobre una cama de arroz integral.' },
    { id: 'rec_010', name: 'Lentejas con verduras', meal_type: 'almuerzo', instructions: 'Mezclar las lentejas cocidas con la cebolla, zanahoria y tomate picados. Acompañar con ensalada verde.' },
    { id: 'rec_011', name: 'Yogur y fruta', meal_type: 'merienda', instructions: 'Servir el yogur griego en un tazón acompañado con la manzana cortada en dados.' },
    { id: 'rec_012', name: 'Hummus y vegetales', meal_type: 'merienda', instructions: 'Cortar la zanahoria y el pepino en bastones. Usarlos para dipear en el hummus.' },
    { id: 'rec_013', name: 'Frutos secos', meal_type: 'merienda', instructions: 'Consumir las almendras enteras o troceadas como snack.' },
    { id: 'rec_014', name: 'Queso fresco y fruta', meal_type: 'merienda', instructions: 'Picar el queso fresco y servir junto a las fresas frescas.' },
    { id: 'rec_015', name: 'Tostada con aguacate', meal_type: 'merienda', instructions: 'Tostar el pan integral, untar el aguacate aplastado y colocar rodajas de tomate encima.' },
    { id: 'rec_016', name: 'Ensalada con pollo', meal_type: 'cena', instructions: 'Hacer el pollo a la plancha. Cortar en tiras y servir sobre lechuga, tomate y pepino. Aderezar con aceite.' },
    { id: 'rec_017', name: 'Tortilla de verduras', meal_type: 'cena', instructions: 'Batir los huevos y mezclar con champiñones y espinaca picados. Cocinar en sartén y servir con ensalada verde.' },
    { id: 'rec_018', name: 'Pescado y verduras', meal_type: 'cena', instructions: 'Cocinar el pescado a la plancha o al vapor. Servir junto al brócoli y calabacín cocidos.' },
    { id: 'rec_019', name: 'Sopa de verduras', meal_type: 'cena', instructions: 'Hervir el caldo, añadir las verduras variadas hasta ablandar y agregar el pollo desmenuzado.' },
    { id: 'rec_020', name: 'Salteado de tofu', meal_type: 'cena', instructions: 'Saltear el tofu en cubos con las verduras mixtas. Servir todo junto con el arroz cocido.' },
  ],

  recipe_ingredients: [
    { id: 'ri_001', recipe_id: 'rec_001', ingredient_id: 'ing_001', quantity: 100 },
    { id: 'ri_002', recipe_id: 'rec_001', ingredient_id: 'ing_002', quantity: 60 },
    { id: 'ri_003', recipe_id: 'rec_001', ingredient_id: 'ing_003', quantity: 50 },
    { id: 'ri_004', recipe_id: 'rec_001', ingredient_id: 'ing_004', quantity: 80 },
    { id: 'ri_005', recipe_id: 'rec_001', ingredient_id: 'ing_005', quantity: 30 },
    { id: 'ri_006', recipe_id: 'rec_001', ingredient_id: 'ing_006', quantity: 60 },
    { id: 'ri_007', recipe_id: 'rec_002', ingredient_id: 'ing_007', quantity: 200 },
    { id: 'ri_008', recipe_id: 'rec_002', ingredient_id: 'ing_008', quantity: 150 },
    { id: 'ri_009', recipe_id: 'rec_002', ingredient_id: 'ing_009', quantity: 30 },
    { id: 'ri_010', recipe_id: 'rec_002', ingredient_id: 'ing_010', quantity: 2 },
    { id: 'ri_011', recipe_id: 'rec_003', ingredient_id: 'ing_009', quantity: 50 },
    { id: 'ri_012', recipe_id: 'rec_003', ingredient_id: 'ing_011', quantity: 250 },
    { id: 'ri_013', recipe_id: 'rec_003', ingredient_id: 'ing_012', quantity: 150 },
    { id: 'ri_014', recipe_id: 'rec_003', ingredient_id: 'ing_013', quantity: 15 },
    { id: 'ri_015', recipe_id: 'rec_004', ingredient_id: 'ing_006', quantity: 60 },
    { id: 'ri_016', recipe_id: 'rec_004', ingredient_id: 'ing_014', quantity: 80 },
    { id: 'ri_017', recipe_id: 'rec_004', ingredient_id: 'ing_004', quantity: 50 },
    { id: 'ri_018', recipe_id: 'rec_004', ingredient_id: 'ing_015', quantity: 30 },
    { id: 'ri_019', recipe_id: 'rec_005', ingredient_id: 'ing_011', quantity: 250 },
    { id: 'ri_020', recipe_id: 'rec_005', ingredient_id: 'ing_016', quantity: 100 },
    { id: 'ri_021', recipe_id: 'rec_005', ingredient_id: 'ing_003', quantity: 50 },
    { id: 'ri_022', recipe_id: 'rec_005', ingredient_id: 'ing_017', quantity: 30 },
    { id: 'ri_023', recipe_id: 'rec_006', ingredient_id: 'ing_014', quantity: 150 },
    { id: 'ri_024', recipe_id: 'rec_006', ingredient_id: 'ing_015', quantity: 100 },
    { id: 'ri_025', recipe_id: 'rec_006', ingredient_id: 'ing_004', quantity: 100 },
    { id: 'ri_026', recipe_id: 'rec_006', ingredient_id: 'ing_018', quantity: 100 },
    { id: 'ri_027', recipe_id: 'rec_006', ingredient_id: 'ing_019', quantity: 10 },
    { id: 'ri_028', recipe_id: 'rec_006', ingredient_id: 'ing_020', quantity: 120 },
    { id: 'ri_029', recipe_id: 'rec_007', ingredient_id: 'ing_021', quantity: 180 },
    { id: 'ri_030', recipe_id: 'rec_007', ingredient_id: 'ing_022', quantity: 150 },
    { id: 'ri_031', recipe_id: 'rec_007', ingredient_id: 'ing_023', quantity: 100 },
    { id: 'ri_032', recipe_id: 'rec_007', ingredient_id: 'ing_024', quantity: 150 },
    { id: 'ri_033', recipe_id: 'rec_008', ingredient_id: 'ing_025', quantity: 120 },
    { id: 'ri_034', recipe_id: 'rec_008', ingredient_id: 'ing_015', quantity: 100 },
    { id: 'ri_035', recipe_id: 'rec_008', ingredient_id: 'ing_004', quantity: 100 },
    { id: 'ri_036', recipe_id: 'rec_008', ingredient_id: 'ing_018', quantity: 100 },
    { id: 'ri_037', recipe_id: 'rec_008', ingredient_id: 'ing_026', quantity: 100 },
    { id: 'ri_038', recipe_id: 'rec_008', ingredient_id: 'ing_019', quantity: 10 },
    { id: 'ri_039', recipe_id: 'rec_009', ingredient_id: 'ing_014', quantity: 150 },
    { id: 'ri_040', recipe_id: 'rec_009', ingredient_id: 'ing_022', quantity: 150 },
    { id: 'ri_041', recipe_id: 'rec_009', ingredient_id: 'ing_027', quantity: 100 },
    { id: 'ri_042', recipe_id: 'rec_009', ingredient_id: 'ing_023', quantity: 100 },
    { id: 'ri_043', recipe_id: 'rec_009', ingredient_id: 'ing_020', quantity: 100 },
    { id: 'ri_044', recipe_id: 'rec_010', ingredient_id: 'ing_028', quantity: 200 },
    { id: 'ri_045', recipe_id: 'rec_010', ingredient_id: 'ing_005', quantity: 50 },
    { id: 'ri_046', recipe_id: 'rec_010', ingredient_id: 'ing_023', quantity: 80 },
    { id: 'ri_047', recipe_id: 'rec_010', ingredient_id: 'ing_004', quantity: 100 },
    { id: 'ri_048', recipe_id: 'rec_010', ingredient_id: 'ing_029', quantity: 150 },
    { id: 'ri_049', recipe_id: 'rec_011', ingredient_id: 'ing_007', quantity: 170 },
    { id: 'ri_050', recipe_id: 'rec_011', ingredient_id: 'ing_012', quantity: 150 },
    { id: 'ri_051', recipe_id: 'rec_012', ingredient_id: 'ing_030', quantity: 40 },
    { id: 'ri_052', recipe_id: 'rec_012', ingredient_id: 'ing_023', quantity: 100 },
    { id: 'ri_053', recipe_id: 'rec_012', ingredient_id: 'ing_018', quantity: 100 },
    { id: 'ri_054', recipe_id: 'rec_013', ingredient_id: 'ing_031', quantity: 25 },
    { id: 'ri_055', recipe_id: 'rec_014', ingredient_id: 'ing_032', quantity: 60 },
    { id: 'ri_056', recipe_id: 'rec_014', ingredient_id: 'ing_008', quantity: 150 },
    { id: 'ri_057', recipe_id: 'rec_015', ingredient_id: 'ing_006', quantity: 30 },
    { id: 'ri_058', recipe_id: 'rec_015', ingredient_id: 'ing_033', quantity: 50 },
    { id: 'ri_059', recipe_id: 'rec_015', ingredient_id: 'ing_004', quantity: 50 },
    { id: 'ri_060', recipe_id: 'rec_016', ingredient_id: 'ing_014', quantity: 150 },
    { id: 'ri_061', recipe_id: 'rec_016', ingredient_id: 'ing_015', quantity: 100 },
    { id: 'ri_062', recipe_id: 'rec_016', ingredient_id: 'ing_004', quantity: 100 },
    { id: 'ri_063', recipe_id: 'rec_016', ingredient_id: 'ing_018', quantity: 100 },
    { id: 'ri_064', recipe_id: 'rec_016', ingredient_id: 'ing_019', quantity: 10 },
    { id: 'ri_065', recipe_id: 'rec_017', ingredient_id: 'ing_001', quantity: 150 },
    { id: 'ri_066', recipe_id: 'rec_017', ingredient_id: 'ing_034', quantity: 100 },
    { id: 'ri_067', recipe_id: 'rec_017', ingredient_id: 'ing_003', quantity: 50 },
    { id: 'ri_068', recipe_id: 'rec_017', ingredient_id: 'ing_029', quantity: 100 },
    { id: 'ri_069', recipe_id: 'rec_018', ingredient_id: 'ing_021', quantity: 150 },
    { id: 'ri_070', recipe_id: 'rec_018', ingredient_id: 'ing_022', quantity: 200 },
    { id: 'ri_071', recipe_id: 'rec_018', ingredient_id: 'ing_035', quantity: 150 },
    { id: 'ri_072', recipe_id: 'rec_019', ingredient_id: 'ing_014', quantity: 120 },
    { id: 'ri_073', recipe_id: 'rec_019', ingredient_id: 'ing_036', quantity: 300 },
    { id: 'ri_074', recipe_id: 'rec_019', ingredient_id: 'ing_037', quantity: 200 },
    { id: 'ri_075', recipe_id: 'rec_020', ingredient_id: 'ing_038', quantity: 180 },
    { id: 'ri_076', recipe_id: 'rec_020', ingredient_id: 'ing_036', quantity: 250 },
    { id: 'ri_077', recipe_id: 'rec_020', ingredient_id: 'ing_020', quantity: 80 },
  ],

  liquids: [
    { id: 'liq_001', name: 'Leche descremada', type: 'milk', icon: '🥛' },
    { id: 'liq_002', name: 'Leche vegetal', type: 'milk', icon: '🥛' },
    { id: 'liq_003', name: 'Agua', type: 'water', icon: '💧' },
    { id: 'liq_004', name: 'Caldo bajo en grasa', type: 'broth', icon: '🍲' },
  ],

  // Despensa generada con los nuevos IDs — mezcla de disponibles e insuficientes
  pantry: [
    { ingredient_id: 'ing_001', quantity_available: 300 },
    { ingredient_id: 'ing_002', quantity_available: 200 },
    { ingredient_id: 'ing_003', quantity_available: 150 },
    { ingredient_id: 'ing_004', quantity_available: 400 },
    { ingredient_id: 'ing_005', quantity_available: 100 },
    { ingredient_id: 'ing_006', quantity_available: 200 },
    { ingredient_id: 'ing_007', quantity_available: 500 },
    { ingredient_id: 'ing_008', quantity_available: 300 },
    { ingredient_id: 'ing_009', quantity_available: 200 },
    { ingredient_id: 'ing_010', quantity_available: 50 },
    { ingredient_id: 'ing_011', quantity_available: 500 },
    { ingredient_id: 'ing_012', quantity_available: 300 },
    { ingredient_id: 'ing_013', quantity_available: 0 }, // sin stock
    { ingredient_id: 'ing_014', quantity_available: 300 },
    { ingredient_id: 'ing_015', quantity_available: 200 },
    { ingredient_id: 'ing_016', quantity_available: 200 },
    { ingredient_id: 'ing_017', quantity_available: 0 }, // sin stock
    { ingredient_id: 'ing_018', quantity_available: 200 },
    { ingredient_id: 'ing_019', quantity_available: 300 },
    { ingredient_id: 'ing_020', quantity_available: 250 },
    { ingredient_id: 'ing_021', quantity_available: 300 },
    { ingredient_id: 'ing_022', quantity_available: 400 },
    { ingredient_id: 'ing_023', quantity_available: 300 },
    { ingredient_id: 'ing_024', quantity_available: 300 },
    { ingredient_id: 'ing_025', quantity_available: 200 },
    { ingredient_id: 'ing_026', quantity_available: 0 }, // sin stock
    { ingredient_id: 'ing_027', quantity_available: 200 },
    { ingredient_id: 'ing_028', quantity_available: 400 },
    { ingredient_id: 'ing_029', quantity_available: 300 },
    { ingredient_id: 'ing_030', quantity_available: 100 },
    { ingredient_id: 'ing_031', quantity_available: 100 },
    { ingredient_id: 'ing_032', quantity_available: 100 },
    { ingredient_id: 'ing_033', quantity_available: 100 },
    { ingredient_id: 'ing_034', quantity_available: 200 },
    { ingredient_id: 'ing_035', quantity_available: 300 },
    { ingredient_id: 'ing_036', quantity_available: 600 },
    { ingredient_id: 'ing_037', quantity_available: 500 },
    { ingredient_id: 'ing_038', quantity_available: 360 },
  ],

  user_preferences: {
    disliked_ingredients: [],
    meal_hours: {
      desayuno: { start: 6, end: 12 },
      almuerzo: { start: 12, end: 17 },
      merienda: { start: 17, end: 19 },
      cena: { start: 19, end: 23 }
    },
    goals: {
      calories: 2000,
      protein: 150,
      carbs: 220,
      fat: 65
    },
    gemini_api_key: '',
    favorites: []   // [{ type: 'food_item'|'recipe'|'liquid', reference_id }]
  },

  // Alimentos descubiertos por IA o añadidos manualmente (no ligados a recetas)
  food_items: [],

  food_logs: [
    // Log de ayer para no afectar el día actual
    {
      id: 'log_sample',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      type: 'meal',
      reference_id: 'rec_006'
    }
  ]
};

// ============================================================
// GESTIÓN DEL ESTADO
// ============================================================

let appState = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appState = JSON.parse(saved);
    } else {
      appState = JSON.parse(JSON.stringify(initialState));
      persistState();
    }
  } catch (e) {
    console.warn('Error cargando estado, usando inicial:', e);
    appState = JSON.parse(JSON.stringify(initialState));
  }
  return appState;
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Error guardando estado:', e);
  }
}

function resetState() {
  appState = JSON.parse(JSON.stringify(initialState));
  persistState();
  return appState;
}

// ============================================================
// API DE ACCESO (DB)
// ============================================================
const DB = {
  get state() { return appState; },
  get ingredients() {
    return [...appState.ingredients].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  },
  get recipes() { return appState.recipes; },
  get recipeIngredients() { return appState.recipe_ingredients; },
  get liquids() { return appState.liquids; },
  get pantry() { return appState.pantry; },
  get userPreferences() { return appState.user_preferences; },
  get foodLogs() { return appState.food_logs; },
  get foodItems() { return appState.food_items || []; },

  getIngredientById(id) { return appState.ingredients.find(i => i.id === id) || null; },
  getRecipeById(id) { return appState.recipes.find(r => r.id === id) || null; },
  getRecipeIngredients(recipeId) {
    return appState.recipe_ingredients.filter(ri => ri.recipe_id === recipeId);
  },
  getPantryItem(ingredientId) {
    return appState.pantry.find(p => p.ingredient_id === ingredientId) || null;
  },
  getFoodItemById(id) { return (appState.food_items || []).find(f => f.id === id) || null; },
  searchFoodItems(query) {
    const q = query.toLowerCase().trim();
    const items = appState.food_items || [];
    return items.filter(f => f && f.name && f.name.toLowerCase().includes(q));
  },

  getFoodItemByExactName(name) {
    if (!name) return null;
    const q = name.toLowerCase().trim();
    return (appState.food_items || []).find(f => f && f.name && f.name.toLowerCase().trim() === q) || null;
  },

  addFoodLog(entry) {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      date: new Date().toISOString().split('T')[0],
      type: entry.type,                          // 'meal' | 'liquid' | 'food_item'
      reference_id: entry.reference_id,
      quantity_g: entry.quantity_g || null,
      planned: entry.planned !== undefined ? entry.planned : (entry.type === 'meal'),
      mealCategory: entry.mealCategory || null
    };
    appState.food_logs.push(newLog);
    persistState();
    return newLog;
  },

  removeFoodLog(logId) {
    appState.food_logs = appState.food_logs.filter(l => l.id !== logId);
    persistState();
  },

  updateFoodLogQty(logId, newQty) {
    const log = appState.food_logs.find(l => l.id === logId);
    if (log) { log.quantity_g = newQty; persistState(); }
  },

  getTodayLogs() {
    const today = new Date().toISOString().split('T')[0];
    return appState.food_logs.filter(l => l.date === today);
  },

  getLogsByDate(dateStr) {
    return appState.food_logs.filter(l => l.date === dateStr);
  },

  updatePantryQuantity(ingredientId, newQuantity) {
    const item = appState.pantry.find(p => p.ingredient_id === ingredientId);
    if (item) {
      item.quantity_available = Math.max(0, newQuantity);
    } else {
      appState.pantry.push({ ingredient_id: ingredientId, quantity_available: Math.max(0, newQuantity) });
    }
    persistState();
  },

  toggleDislikedIngredient(ingredientId) {
    const dislikes = appState.user_preferences.disliked_ingredients;
    const idx = dislikes.indexOf(ingredientId);
    if (idx > -1) dislikes.splice(idx, 1);
    else dislikes.push(ingredientId);
    persistState();
  },

  updateGoals(goals) {
    if (!appState.user_preferences.goals) appState.user_preferences.goals = {};
    Object.assign(appState.user_preferences.goals, goals);
    persistState();
  },

  updateGeminiKey(key) {
    appState.user_preferences.gemini_api_key = key.trim();
    persistState();
  },

  addFoodItem(item) {
    if (!appState.food_items) appState.food_items = [];
    if (!item || !item.name) return null;
    // Evitar duplicados por nombre
    const existing = appState.food_items.find(f => f && f.name && f.name.toLowerCase() === item.name.toLowerCase());
    if (existing) return existing;
    const newItem = {
      id: `fi_${Date.now()}`,
      name: item.name,
      category: item.category || 'Otro',
      calories_per_100g: item.calories_per_100g || 0,
      protein_per_100g: item.protein_per_100g || 0,
      carbs_per_100g: item.carbs_per_100g || 0,
      fat_per_100g: item.fat_per_100g || 0,
      typical_serving_g: item.typical_serving_g || 100,
      source: item.source || 'manual',
      verified: item.verified || false,
      created_at: new Date().toISOString()
    };
    appState.food_items.push(newItem);
    persistState();
    return newItem;
  },

  // ── FAVORITOS ──────────────────────────────────────────────
  getFavorites() {
    return (appState.user_preferences.favorites || []);
  },

  isFavorite(type, referenceId) {
    return (appState.user_preferences.favorites || []).some(
      f => f.type === type && f.reference_id === referenceId
    );
  },

  toggleFavorite(type, referenceId) {
    if (!appState.user_preferences.favorites) appState.user_preferences.favorites = [];
    const favs = appState.user_preferences.favorites;
    const idx = favs.findIndex(f => f.type === type && f.reference_id === referenceId);
    if (idx > -1) favs.splice(idx, 1);
    else favs.push({ type, reference_id: referenceId });
    persistState();
    return idx === -1; // true = added, false = removed
  },

  // ── FRECUENTES ──────────────────────────────────────────────
  /**
   * Devuelve los N alimentos/recetas más registrados en los últimos `days` días.
   * @returns {Array} [{ type, reference_id, count }] ordenados por frecuencia
   */
  getFrequentItems(n = 6, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const counts = new Map();
    (appState.food_logs || [])
      .filter(l => l.date >= cutoffStr && l.type !== 'liquid')
      .forEach(l => {
        const key = `${l.type}::${l.reference_id}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, count]) => {
        const [type, reference_id] = key.split('::');
        return { type, reference_id, count };
      });
  }
};

if (typeof window !== 'undefined') {
  window.DB = DB;
  window.appState = appState;
}
