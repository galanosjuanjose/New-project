-- Ingredient database for the plate builder: common keto vegetables, a few more
-- proteins, and a seasonings library. Run after 0002_plate_builder.sql.
-- Nutrition numbers are reasonable per-serving estimates, not certified values.

-- ---------------------------------------------------------------------------
-- vegetables
-- ---------------------------------------------------------------------------
insert into foods
  (name, category, food_group, default_serving_label, calories, total_carbs_g, fiber_g, sugar_alcohols_g, protein_g, fat_g, tags)
values
  ('Asparagus', 'ingredient', 'vegetable', '1 cup cooked', 40, 7.4, 3.6, 0, 4.3, 0.4, '{}'),
  ('Broccoli', 'ingredient', 'vegetable', '1 cup cooked', 55, 11.2, 5.1, 0, 3.7, 0.6, '{}'),
  ('Cauliflower', 'ingredient', 'vegetable', '1 cup cooked', 28, 5.1, 2.9, 0, 2.3, 0.3, '{}'),
  ('Zucchini', 'ingredient', 'vegetable', '1 cup cooked', 20, 4.3, 1.4, 0, 1.5, 0.4, '{stuffable}'),
  ('Bell pepper', 'ingredient', 'vegetable', '1 cup raw sliced', 30, 7, 2.5, 0, 1, 0.3, '{stuffable}'),
  ('Spinach', 'ingredient', 'vegetable', '1 cup cooked', 41, 6.8, 4.3, 0, 5.3, 0.5, '{}'),
  ('Kale', 'ingredient', 'vegetable', '1 cup cooked', 36, 7.3, 2.6, 0, 2.5, 0.5, '{}'),
  ('Cucumber', 'ingredient', 'vegetable', '1 cup raw sliced', 16, 3.8, 0.5, 0, 0.7, 0.1, '{}'),
  ('Cabbage', 'ingredient', 'vegetable', '1 cup cooked', 34, 7.9, 3.6, 0, 1.9, 0.2, '{}'),
  ('Brussels sprouts', 'ingredient', 'vegetable', '1 cup cooked', 56, 11.1, 4.1, 0, 4, 0.8, '{}'),
  ('Green beans', 'ingredient', 'vegetable', '1 cup cooked', 44, 9.9, 4, 0, 2.4, 0.4, '{}'),
  ('Mushrooms', 'ingredient', 'vegetable', '1 cup cooked', 44, 8.3, 2, 0, 4.7, 0.6, '{}'),
  ('Celery', 'ingredient', 'vegetable', '1 cup raw chopped', 16, 3, 1.6, 0, 0.7, 0.2, '{}'),
  ('Radish', 'ingredient', 'vegetable', '1 cup raw sliced', 19, 3.9, 1.9, 0, 0.8, 0.1, '{}'),
  ('Carrots', 'ingredient', 'vegetable', '1 cup cooked sliced', 55, 12.8, 4.6, 0, 1.2, 0.3, '{}'),
  ('Tomato', 'ingredient', 'vegetable', '1 cup raw chopped', 32, 7, 2.2, 0, 1.6, 0.4, '{}'),
  ('Onion', 'ingredient', 'vegetable', '1 cup cooked chopped', 92, 21.3, 2.9, 0, 2.3, 0.2, '{}'),
  ('Eggplant', 'ingredient', 'vegetable', '1 cup cooked cubed', 35, 8.6, 2.4, 0, 0.8, 0.2, '{}'),
  ('Artichoke', 'ingredient', 'vegetable', '1 medium, cooked', 60, 13.5, 6.9, 0, 4.2, 0.4, '{stuffable}'),
  ('Bok choy', 'ingredient', 'vegetable', '1 cup cooked', 20, 3, 1.7, 0, 2.6, 0.3, '{}'),
  ('Swiss chard', 'ingredient', 'vegetable', '1 cup cooked', 35, 7.2, 3.7, 0, 3.3, 0.1, '{}'),
  ('Snow peas', 'ingredient', 'vegetable', '1 cup cooked', 67, 11.3, 4.5, 0, 5.2, 0.3, '{}'),
  ('Okra', 'ingredient', 'vegetable', '1 cup cooked', 36, 7.5, 4, 0, 3, 0.2, '{}'),
  ('Turnip', 'ingredient', 'vegetable', '1 cup cooked cubed', 34, 8, 3.1, 0, 1.1, 0.1, '{}'),
  ('Leeks', 'ingredient', 'vegetable', '1 cup cooked', 42, 10.2, 1.3, 0, 1, 0.3, '{}'),
  ('Fennel bulb', 'ingredient', 'vegetable', '1 cup cooked', 27, 6.3, 2.6, 0, 1.1, 0.2, '{}');

-- ---------------------------------------------------------------------------
-- proteins
-- ---------------------------------------------------------------------------
insert into foods
  (name, category, food_group, default_serving_label, calories, total_carbs_g, fiber_g, sugar_alcohols_g, protein_g, fat_g, tags)
values
  ('Chicken thighs, cooked', 'ingredient', 'protein', '4 oz', 250, 0, 0, 0, 27, 15, '{}'),
  ('Tilapia, cooked', 'ingredient', 'protein', '4 oz', 145, 0, 0, 0, 30, 3, '{}'),
  ('Salmon, cooked', 'ingredient', 'protein', '4 oz', 233, 0, 0, 0, 25, 14, '{}'),
  ('Pork chop, cooked', 'ingredient', 'protein', '4 oz', 275, 0, 0, 0, 31, 16, '{}'),
  ('Shrimp, cooked', 'ingredient', 'protein', '4 oz', 120, 0.9, 0, 0, 25, 1.4, '{}');

-- ---------------------------------------------------------------------------
-- seasonings
-- ---------------------------------------------------------------------------
insert into foods
  (name, category, food_group, default_serving_label, calories, total_carbs_g, fiber_g, sugar_alcohols_g, protein_g, fat_g, tags)
values
  ('Garlic', 'ingredient', 'seasoning', '1 clove minced', 4, 1, 0.1, 0, 0.2, 0, '{}'),
  ('Onion powder', 'ingredient', 'seasoning', '1 tsp', 8, 1.9, 0.1, 0, 0.2, 0, '{}'),
  ('Paprika', 'ingredient', 'seasoning', '1 tsp', 6, 1.2, 0.8, 0, 0.3, 0.3, '{}'),
  ('Cumin', 'ingredient', 'seasoning', '1 tsp', 8, 0.9, 0.2, 0, 0.4, 0.5, '{}'),
  ('Oregano, dried', 'ingredient', 'seasoning', '1 tsp', 3, 0.7, 0.5, 0, 0.1, 0.1, '{}'),
  ('Basil, dried', 'ingredient', 'seasoning', '1 tsp', 1, 0.2, 0.1, 0, 0.1, 0, '{}'),
  ('Black pepper', 'ingredient', 'seasoning', '1 tsp', 6, 1.5, 0.6, 0, 0.2, 0.1, '{}'),
  ('Salt', 'ingredient', 'seasoning', '1 tsp', 0, 0, 0, 0, 0, 0, '{}'),
  ('Chili powder', 'ingredient', 'seasoning', '1 tsp', 8, 1.4, 0.9, 0, 0.3, 0.4, '{}'),
  ('Italian seasoning', 'ingredient', 'seasoning', '1 tsp', 3, 0.6, 0.4, 0, 0.1, 0.1, '{}'),
  ('Cajun seasoning', 'ingredient', 'seasoning', '1 tsp', 6, 1.2, 0.4, 0, 0.2, 0.1, '{}'),
  ('Lemon juice', 'ingredient', 'seasoning', '1 tbsp', 3, 1.3, 0.1, 0, 0, 0, '{}'),
  ('Apple cider vinegar', 'ingredient', 'seasoning', '1 tbsp', 3, 0.1, 0, 0, 0, 0, '{}'),
  ('Coconut aminos', 'ingredient', 'seasoning', '1 tbsp', 10, 2, 0, 0, 0, 0, '{}'),
  ('Ginger, fresh grated', 'ingredient', 'seasoning', '1 tsp', 2, 0.4, 0.1, 0, 0, 0, '{}');
