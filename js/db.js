// ============================================================
// db.js ? Estado y Persistencia de NutriFlow
// ============================================================

const STORAGE_KEY = 'nutriflow_state';

const initialState = {
  userPreferences: {
    dislikedIngredients: [],
    disliked_ingredients: [],
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

  ingredients: [
    { id: 'ing_001', name: 'Huevo', category: 'Prote\u00EDna', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
    { id: 'ing_002', name: 'Espinaca', category: 'Verdura', calories_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
    { id: 'ing_003', name: 'Champi\u00F1ones', category: 'Verdura', calories_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3 },
    { id: 'ing_004', name: 'Tomate', category: 'Verdura', calories_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2 },
    { id: 'ing_005', name: 'Cebolla', category: 'Verdura', calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.1 },
    { id: 'ing_006', name: 'Pan integral', category: 'Cereal', calories_per_100g: 247, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3.4 },
    { id: 'ing_007', name: 'Yogur griego', category: 'L\u00E1cteo', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
    { id: 'ing_008', name: 'Fresas', category: 'Fruta', calories_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3 },
    { id: 'ing_009', name: 'Avena', category: 'Cereal', calories_per_100g: 389, protein_per_100g: 16.9, carbs_per_100g: 66.3, fat_per_100g: 6.9 },
    { id: 'ing_010', name: 'Canela', category: 'Especia', calories_per_100g: 247, protein_per_100g: 4, carbs_per_100g: 81, fat_per_100g: 1.2 },
    { id: 'ing_011', name: 'Leche descremada', category: 'L\u00E1cteo', calories_per_100g: 34, protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 0.1 },
    { id: 'ing_012', name: 'Manzana', category: 'Fruta', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
    { id: 'ing_013', name: 'Mantequilla de man\u00ED', category: 'Grasa', calories_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50 },
    { id: 'ing_014', name: 'Pechuga de pollo', category: 'Prote\u00EDna', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
    { id: 'ing_015', name: 'Lechuga', category: 'Verdura', calories_per_100g: 15, protein_per_100g: 1.4, carbs_per_100g: 2.9, fat_per_100g: 0.2 },
    { id: 'ing_016', name: 'Pl\u00E1tano', category: 'Fruta', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 22.8, fat_per_100g: 0.3 },
    { id: 'ing_017', name: 'Prote\u00EDna en polvo', category: 'Prote\u00EDna', calories_per_100g: 380, protein_per_100g: 80, carbs_per_100g: 5, fat_per_100g: 3 },
    { id: 'ing_018', name: 'Pepino', category: 'Verdura', calories_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3.6, fat_per_100g: 0.1 },
    { id: 'ing_019', name: 'Aceite de oliva', category: 'Grasa', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
    { id: 'ing_020', name: 'Arroz integral cocido', category: 'Cereal', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9 },
    { id: 'ing_021', name: 'Pescado blanco', category: 'Prote\u00EDna', calories_per_100g: 90, protein_per_100g: 18, carbs_per_100g: 0, fat_per_100g: 1.5 },
    { id: 'ing_022', name: 'Br\u00F3coli', category: 'Verdura', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4 },
    { id: 'ing_023', name: 'Zanahoria', category: 'Verdura', calories_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.2 },
    { id: 'ing_024', name: 'Papa cocida', category: 'Cereal', calories_per_100g: 87, protein_per_100g: 1.9, carbs_per_100g: 20, fat_per_100g: 0.1 },
    { id: 'ing_025', name: 'At\u00FAn al agua', category: 'Prote\u00EDna', calories_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1 },
    { id: 'ing_026', name: 'Garbanzos cocidos', category: 'Legumbre', calories_per_100g: 164, protein_per_100g: 8.9, carbs_per_100g: 27, fat_per_100g: 2.6 },
    { id: 'ing_027', name: 'Pimiento', category: 'Verdura', calories_per_100g: 20, protein_per_100g: 0.9, carbs_per_100g: 4.6, fat_per_100g: 0.2 },
    { id: 'ing_028', name: 'Lentejas cocidas', category: 'Legumbre', calories_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4 },
    { id: 'ing_029', name: 'Hummus', category: 'Legumbre', calories_per_100g: 166, protein_per_100g: 7.9, carbs_per_100g: 14.3, fat_per_100g: 9.6 },
    { id: 'ing_030', name: 'Almendras', category: 'Grasa', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
    { id: 'ing_031', name: 'Queso fresco', category: 'L\u00E1cteo', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3.5, fat_per_100g: 4.5 },
    { id: 'ing_032', name: 'Aguacate', category: 'Grasa', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 8.5, fat_per_100g: 14.7 },
    { id: 'ing_033', name: 'Calabac\u00EDn', category: 'Verdura', calories_per_100g: 17, protein_per_100g: 1.2, carbs_per_100g: 3.1, fat_per_100g: 0.3 },
    { id: 'ing_034', name: 'Caldo de verduras', category: 'Verdura', calories_per_100g: 7, protein_per_100g: 0.6, carbs_per_100g: 1.1, fat_per_100g: 0.1 },
    { id: 'ing_035', name: 'Tofu', category: 'Prote\u00EDna', calories_per_100g: 76, protein_per_100g: 8, carbs_per_100g: 1.9, fat_per_100g: 4.8 },
  ],

  recipes: [
    { id: 'rec_001', name: 'Omelette de verduras', meal_type: 'desayuno', instructions: 'Batir los huevos, saltear los vegetales y cocinar a fuego medio.' },
    { id: 'rec_002', name: 'Yogur con frutas', meal_type: 'desayuno', instructions: 'Mezclar el yogur con las fresas lavadas y cortadas. A\u00F1adir la avena y canela.' },
    { id: 'rec_003', name: 'Avena proteica', meal_type: 'desayuno', instructions: 'Cocinar la avena con la leche descremada. Servir con manzana y mantequilla de man\u00ED.' },
    { id: 'rec_004', name: 'S\u00E1ndwich saludable', meal_type: 'desayuno', instructions: 'Armar el s\u00E1ndwich usando pan integral, pechuga, tomate y lechuga.' },
    { id: 'rec_005', name: 'Batido nutritivo', meal_type: 'desayuno', instructions: 'Licuar leche descremada, pl\u00E1tano, espinaca y prote\u00EDna en polvo.' },
    { id: 'rec_006', name: 'Pollo con ensalada', meal_type: 'almuerzo', instructions: 'Pechuga de pollo con arroz integral, ensalada de lechuga, tomate y pepino.' },
    { id: 'rec_007', name: 'Pescado al horno', meal_type: 'almuerzo', instructions: 'Hornear el pescado con br\u00F3coli, zanahoria y papa cocida.' },
    { id: 'rec_008', name: 'Ensalada de at\u00FAn', meal_type: 'almuerzo', instructions: 'Mezclar at\u00FAn con garbanzos, lechuga, tomate y pepino con aceite de oliva.' },
    { id: 'rec_009', name: 'Salteado de pollo', meal_type: 'almuerzo', instructions: 'Pollo salteado con br\u00F3coli, pimiento y zanahoria sobre arroz integral.' },
    { id: 'rec_010', name: 'Lentejas con verduras', meal_type: 'almuerzo', instructions: 'Lentejas cocidas con cebolla, zanahoria y tomate.' },
    { id: 'rec_011', name: 'Yogur y fruta', meal_type: 'merienda', instructions: 'Yogur griego con manzana picada.' },
    { id: 'rec_012', name: 'Hummus y vegetales', meal_type: 'merienda', instructions: 'Bastones de zanahoria y pepino para dipear en hummus.' },
    { id: 'rec_013', name: 'Frutos secos', meal_type: 'merienda', instructions: 'Almendras enteras o troceadas como snack.' },
    { id: 'rec_014', name: 'Queso fresco y fruta', meal_type: 'merienda', instructions: 'Queso fresco con fresas.' },
    { id: 'rec_015', name: 'Tostada con aguacate', meal_type: 'merienda', instructions: 'Pan integral tostado con aguacate y rodajas de tomate.' },
    { id: 'rec_016', name: 'Ensalada con pollo', meal_type: 'cena', instructions: 'Pollo a la plancha sobre lechuga, tomate y pepino con aceite de oliva.' },
    { id: 'rec_017', name: 'Tortilla de verduras', meal_type: 'cena', instructions: 'Huevos con champi\u00F1ones y espinaca picados.' },
    { id: 'rec_018', name: 'Pescado y verduras', meal_type: 'cena', instructions: 'Pescado a la plancha con br\u00F3coli y calabac\u00EDn.' },
    { id: 'rec_019', name: 'Sopa de verduras', meal_type: 'cena', instructions: 'Caldo de verduras con pollo desmenuzado.' },
    { id: 'rec_020', name: 'Salteado de tofu', meal_type: 'cena', instructions: 'Tofu salteado con verduras y arroz cocido.' },
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
    { id: 'ri_049', recipe_id: 'rec_011', ingredient_id: 'ing_007', quantity: 150 },
    { id: 'ri_050', recipe_id: 'rec_011', ingredient_id: 'ing_012', quantity: 100 },
    { id: 'ri_051', recipe_id: 'rec_012', ingredient_id: 'ing_029', quantity: 60 },
    { id: 'ri_052', recipe_id: 'rec_012', ingredient_id: 'ing_023', quantity: 80 },
    { id: 'ri_053', recipe_id: 'rec_012', ingredient_id: 'ing_018', quantity: 80 },
    { id: 'ri_054', recipe_id: 'rec_013', ingredient_id: 'ing_030', quantity: 30 },
    { id: 'ri_055', recipe_id: 'rec_014', ingredient_id: 'ing_031', quantity: 80 },
    { id: 'ri_056', recipe_id: 'rec_014', ingredient_id: 'ing_008', quantity: 100 },
    { id: 'ri_057', recipe_id: 'rec_015', ingredient_id: 'ing_006', quantity: 60 },
    { id: 'ri_058', recipe_id: 'rec_015', ingredient_id: 'ing_032', quantity: 50 },
    { id: 'ri_059', recipe_id: 'rec_015', ingredient_id: 'ing_004', quantity: 50 },
    { id: 'ri_060', recipe_id: 'rec_016', ingredient_id: 'ing_014', quantity: 120 },
    { id: 'ri_061', recipe_id: 'rec_016', ingredient_id: 'ing_015', quantity: 80 },
    { id: 'ri_062', recipe_id: 'rec_016', ingredient_id: 'ing_004', quantity: 80 },
    { id: 'ri_063', recipe_id: 'rec_016', ingredient_id: 'ing_018', quantity: 80 },
    { id: 'ri_064', recipe_id: 'rec_016', ingredient_id: 'ing_019', quantity: 10 },
    { id: 'ri_065', recipe_id: 'rec_017', ingredient_id: 'ing_001', quantity: 100 },
    { id: 'ri_066', recipe_id: 'rec_017', ingredient_id: 'ing_003', quantity: 60 },
    { id: 'ri_067', recipe_id: 'rec_017', ingredient_id: 'ing_002', quantity: 60 },
    { id: 'ri_068', recipe_id: 'rec_017', ingredient_id: 'ing_015', quantity: 80 },
    { id: 'ri_069', recipe_id: 'rec_018', ingredient_id: 'ing_021', quantity: 150 },
    { id: 'ri_070', recipe_id: 'rec_018', ingredient_id: 'ing_022', quantity: 100 },
    { id: 'ri_071', recipe_id: 'rec_018', ingredient_id: 'ing_033', quantity: 100 },
    { id: 'ri_072', recipe_id: 'rec_019', ingredient_id: 'ing_034', quantity: 300 },
    { id: 'ri_073', recipe_id: 'rec_019', ingredient_id: 'ing_022', quantity: 60 },
    { id: 'ri_074', recipe_id: 'rec_019', ingredient_id: 'ing_023', quantity: 60 },
    { id: 'ri_075', recipe_id: 'rec_019', ingredient_id: 'ing_033', quantity: 60 },
    { id: 'ri_076', recipe_id: 'rec_019', ingredient_id: 'ing_014', quantity: 100 },
    { id: 'ri_077', recipe_id: 'rec_020', ingredient_id: 'ing_035', quantity: 150 },
    { id: 'ri_078', recipe_id: 'rec_020', ingredient_id: 'ing_022', quantity: 80 },
    { id: 'ri_079', recipe_id: 'rec_020', ingredient_id: 'ing_027', quantity: 80 },
    { id: 'ri_080', recipe_id: 'rec_020', ingredient_id: 'ing_020', quantity: 100 },
  ],

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
    { id: 'liq_001', name: 'Agua', type: 'Agua', icon: '\u{1F4A7}', goal_ml: 2000, current_ml: 0 },
  ],

  foodItems: [
    { id: 'fi_001', name: 'Huevo cocido (1 ud ~50g)', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, category: 'Prote\u00EDna' },
    { id: 'fi_002', name: 'Pechuga de pollo a la plancha', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, category: 'Prote\u00EDna' },
    { id: 'fi_003', name: 'At\u00FAn al agua (lata)', calories_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1, category: 'Prote\u00EDna' },
    { id: 'fi_004', name: 'Yogur griego natural', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.4, category: 'L\u00E1cteo' },
    { id: 'fi_005', name: 'Leche descremada', calories_per_100g: 34, protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 0.1, category: 'L\u00E1cteo' },
    { id: 'fi_006', name: 'Queso fresco / panela', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3.5, fat_per_100g: 4.5, category: 'L\u00E1cteo' },
    { id: 'fi_007', name: 'Pl\u00E1tano / banana', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 22.8, fat_per_100g: 0.3, category: 'Fruta' },
    { id: 'fi_008', name: 'Manzana', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, category: 'Fruta' },
    { id: 'fi_009', name: 'Fresas / frutillas', calories_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3, category: 'Fruta' },
    { id: 'fi_010', name: 'Arroz blanco cocido', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, category: 'Cereal' },
    { id: 'fi_011', name: 'Arroz integral cocido', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, category: 'Cereal' },
    { id: 'fi_012', name: 'Pan integral (1 rebanada ~30g)', calories_per_100g: 247, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3.4, category: 'Cereal' },
    { id: 'fi_013', name: 'Avena en hojuelas', calories_per_100g: 389, protein_per_100g: 16.9, carbs_per_100g: 66.3, fat_per_100g: 6.9, category: 'Cereal' },
    { id: 'fi_014', name: 'Aguacate / palta', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 8.5, fat_per_100g: 14.7, category: 'Grasa' },
    { id: 'fi_015', name: 'Aceite de oliva (1 cda ~10g)', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, category: 'Grasa' },
    { id: 'fi_016', name: 'Almendras / nueces', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50, category: 'Grasa' },
    { id: 'fi_017', name: 'Mantequilla de man\u00ED / cacahuate', calories_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50, category: 'Grasa' },
    { id: 'fi_018', name: 'Lentejas cocidas', calories_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4, category: 'Legumbre' },
    { id: 'fi_019', name: 'Garbanzos cocidos', calories_per_100g: 164, protein_per_100g: 8.9, carbs_per_100g: 27, fat_per_100g: 2.6, category: 'Legumbre' },
    { id: 'fi_020', name: 'Br\u00F3coli al vapor', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, category: 'Verdura' },
  ],
};

let appState = JSON.parse(JSON.stringify(initialState));

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const rawStr = JSON.stringify(parsed);
      const hasCorruptedChars = rawStr.includes('??') || rawStr.includes('Prote?na') || rawStr.includes('L?cteo') || rawStr.includes('Br?coli') || rawStr.includes('At?n');
      if (hasCorruptedChars) {
        parsed.ingredients = initialState.ingredients;
        parsed.recipes = initialState.recipes;
        parsed.foodItems = initialState.foodItems;
      }
      if (!parsed.userPreferences) parsed.userPreferences = initialState.userPreferences;
      if (!parsed.userPreferences.dislikedIngredients) {
        parsed.userPreferences.dislikedIngredients = parsed.userPreferences.disliked_ingredients || [];
      }
      parsed.userPreferences.disliked_ingredients = parsed.userPreferences.dislikedIngredients;
      
      if (!parsed.liquids || !parsed.liquids.length) parsed.liquids = initialState.liquids;
      parsed.liquids.forEach(l => {
        if (!l.type) l.type = l.name || 'Agua';
      });

      appState = parsed;
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    appState = JSON.parse(JSON.stringify(initialState));
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Error persisting state to localStorage:', e);
  }
}

function resetState() {
  appState = JSON.parse(JSON.stringify(initialState));
  persistState();
}

const DB = {
  get state() { return appState; },
  get ingredients() { return appState.ingredients; },
  get recipes() { return appState.recipes; },
  get recipeIngredients() { return appState.recipe_ingredients; },
  get pantry() { return appState.pantry; },
  get foodLogs() { return appState.foodLogs; },
  get liquids() { return appState.liquids; },
  get userPreferences() { return appState.userPreferences; },
  get foodItems() { return appState.foodItems || []; },

  getIngredientById(id) {
    return appState.ingredients.find(i => i.id === id) || null;
  },

  getRecipeById(id) {
    return appState.recipes.find(r => r.id === id) || null;
  },

  getRecipeIngredients(recipeId) {
    return appState.recipe_ingredients.filter(ri => ri.recipe_id === recipeId);
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
    appState.userPreferences.geminiApiKey = key;
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
    return (appState.foodItems || []).find(fi => fi.id === id) || null;
  },

  getFoodItemByExactName(name) {
    if (!name) return null;
    const lower = name.trim().toLowerCase();
    return (appState.foodItems || []).find(fi => fi.name.toLowerCase() === lower) || null;
  },

  searchFoodItems(query) {
    if (!query) return appState.foodItems || [];
    const q = query.trim().toLowerCase();
    return (appState.foodItems || []).filter(fi => fi.name.toLowerCase().includes(q) || (fi.category || '').toLowerCase().includes(q));
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
