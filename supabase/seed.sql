-- Global seed data (household_id = null) drawn from Juan & Mariana's real diet.
-- Run once after 0001_init.sql. Nutrition numbers are reasonable estimates from
-- product labels / typical recipes where an exact label wasn't given — treat as
-- editable starting points, not certified values.

-- ---------------------------------------------------------------------------
-- foods: atomic / branded items used for direct logging and menu components
-- ---------------------------------------------------------------------------
insert into foods
  (name, brand, category, default_serving_label, calories, total_carbs_g, fiber_g, sugar_alcohols_g, protein_g, fat_g, tags)
values
  ('Eggs, fried in tallow', null, 'ingredient', '2 large eggs', 180, 1.2, 0, 0, 12, 14, '{}'),
  ('Bacon', null, 'ingredient', '3 strips', 130, 0.3, 0, 0, 9, 10, '{}'),
  ('Chihuahua cheese', null, 'ingredient', '1 oz', 110, 1, 0, 0, 7, 9, '{cheese}'),
  ('Cheddar cheese', null, 'ingredient', '1 oz', 115, 0.5, 0, 0, 7, 9, '{cheese}'),
  ('Muenster cheese', null, 'ingredient', '1 oz', 100, 0.3, 0, 0, 6, 8, '{cheese}'),
  ('Queso fresco', null, 'ingredient', '1 oz', 80, 1, 0, 0, 5, 6, '{cheese}'),
  ('Birch Benders Keto Pancake Mix', 'Birch Benders', 'ingredient', '3 pancakes made', 230, 9, 5, 0, 8, 12, '{flour}'),
  ('Sugar-free syrup', null, 'ingredient', '2 tbsp', 15, 8, 0, 8, 0, 0, '{sweetener}'),
  ('Atkins Bar - Strawberry', 'Atkins', 'snack', '1 bar', 90, 14, 7, 6, 8, 5, '{bar}'),
  ('Atkins Bar - Peanut Butter Cup', 'Atkins', 'snack', '1 bar', 100, 15, 7, 7, 9, 6, '{bar}'),
  ('Atkins Bar - Chocolate Crunchy', 'Atkins', 'snack', '1 bar', 90, 16, 8, 7, 8, 5, '{bar}'),
  ('Atkins Vanilla Protein Shake', 'Atkins', 'beverage', '1 bottle (11oz)', 160, 3, 1, 1, 15, 9, '{shake}'),
  ('LMNT Electrolyte Packet', 'LMNT', 'beverage', '1 packet', 10, 0, 0, 0, 0, 0, '{electrolyte}'),
  ('Nutritional yeast', null, 'ingredient', '1 tbsp', 20, 2, 1, 0, 3, 0, '{savory}'),
  ('Palmini hearts-of-palm pasta', 'Palmini', 'ingredient', '1/2 package', 20, 4, 2, 0, 1, 0, '{pasta_alt}'),
  ('Ground beef 85/15, cooked', null, 'ingredient', '4 oz', 290, 0, 0, 0, 22, 22, '{}'),
  ('Chicken breast, cooked', null, 'ingredient', '4 oz', 187, 0, 0, 0, 35, 4, '{}'),
  ('Mission Zero Net Carb Tortilla', 'Mission', 'ingredient', '1 tortilla', 60, 8, 8, 0, 3, 2, '{bread_alt}'),
  ('Mission Zero Net Carb Bun', 'Mission', 'ingredient', '1 bun', 90, 12, 12, 0, 4, 3, '{bread_alt}'),
  ('Bettergoods Keto Bun', 'Bettergoods', 'ingredient', '1 bun', 90, 15, 14, 0, 5, 3, '{bread_alt}'),
  ('Halo Top Keto Ice Cream', 'Halo Top', 'dessert', '2 oz', 90, 8, 4, 1, 4, 6, '{dessert}'),
  ('Diet Coke', null, 'beverage', '12 oz can', 0, 0, 0, 0, 0, 0, '{}'),
  ('Strawberry agua fresca (monk fruit)', null, 'beverage', 'small cup', 25, 7, 0, 0, 0, 0, '{sweetener}'),
  ('Beef tallow', null, 'ingredient', '1 tbsp', 115, 0, 0, 0, 0, 13, '{}'),
  ('Swerve / monk fruit sweetener', null, 'ingredient', '1 tsp', 0, 0, 0, 0, 0, 0, '{sweetener}'),
  ('Avocado', null, 'ingredient', '1/2 avocado', 160, 9, 7, 0, 2, 15, '{}'),
  ('Pork rinds', null, 'snack', '1 oz', 160, 0, 0, 0, 17, 9, '{savory}'),
  ('Macadamia nuts', null, 'snack', '1 oz', 200, 4, 2, 0, 2, 21, '{nut}'),
  ('Pepperoni chips', null, 'snack', '1 oz', 140, 1, 0, 0, 6, 12, '{savory}'),
  ('Sugar-free jello cup', null, 'dessert', '1 cup', 10, 0, 0, 0, 1, 0, '{dessert}'),
  ('Hard-boiled egg', null, 'snack', '1 egg', 70, 0.6, 0, 0, 6, 5, '{savory}'),
  ('Celery with cream cheese', null, 'snack', '3 stalks + 2 tbsp', 90, 4, 2, 0, 2, 8, '{veggie}'),
  ('Cheese & salami plate', null, 'snack', '1 oz each', 220, 1, 0, 0, 12, 18, '{cheese,savory}');

-- ---------------------------------------------------------------------------
-- meal_templates: composite dishes from their real rotation
-- ---------------------------------------------------------------------------
insert into meal_templates
  (name, meal_type, applies_to, base_calories, base_net_carbs_g, portion_note, tags)
values
  ('Eggs, Bacon & Cheese', 'breakfast', 'both', 420, 2, '2-3 eggs, 2-3 strips bacon, 1oz cheese, cooked in beef tallow', '{}'),
  ('Birch Benders Keto Pancakes', 'breakfast', 'both', 260, 5, '3 pancakes with sugar-free syrup', '{pancake}'),
  ('Keto Bread Turkey Sandwich', 'breakfast', 'both', 300, 4, 'turkey deli meat on keto bread', '{bread_bun}'),
  ('Cauliflower Fried Rice', 'lunch', 'both', 480, 9, 'chicken breast, pork chop, bacon, peppers, onion, cauliflower rice, beef tallow', '{}'),
  ('Ground Beef & Palmini Pasta', 'lunch', 'both', 420, 6, 'ground beef, Palmini pasta, tomato sauce, parmesan', '{pasta_alt}'),
  ('Roasted Chicken, Cucumber-Tomato Salad & Tzatziki', 'lunch', 'juan_only', 400, 7, '13oz chicken portion for Juan', '{}'),
  ('Roasted Chicken Leg & Cucumbers', 'lunch', 'mariana_only', 320, 4, '4.5oz chicken portion for Mariana', '{}'),
  ('Mission Zero Quesadilla', 'dinner', 'mariana_only', 380, 3, 'chihuahua cheese, sometimes chicken, on Mission Zero tortilla', '{bread_alt}'),
  ('Eggs, Bacon & Cheese (Dinner)', 'dinner', 'juan_only', 420, 2, 'Juan often swaps a tortilla dinner for this instead', '{}'),
  ('Burger Patty, Bacon, Cheddar & Mustard', 'dinner', 'juan_only', 520, 3, '4oz 85/15 patty, lettuce wrap (Juan avoids buns except ham & cheese)', '{lettuce_wrap}'),
  ('Burger Patty, Bacon, Cheddar & Mustard (Bun)', 'dinner', 'mariana_only', 540, 5, '4oz 85/15 patty on keto bun', '{bread_bun}'),
  ('Ham & Cheese Sandwich', 'dinner', 'both', 380, 4, 'on a keto bun/bread for both, including Juan', '{bread_bun,ham_cheese}'),
  ('Breaded Chicken Cutlet Sandwich', 'dinner', 'both', 460, 5, 'pork crumb coating, fried in beef tallow; Mariana on keto bun, Juan on lettuce wrap', '{bread_bun,fried}'),
  ('Halo Top Keto Ice Cream', 'dessert', 'both', 90, 3, '1-3oz serving, most nights', '{dessert}');

-- ---------------------------------------------------------------------------
-- snack_suggestions: their regulars plus fresh keto-friendly variety
-- ---------------------------------------------------------------------------
insert into snack_suggestions (name, calories, net_carbs_g, style_tags)
values
  ('Atkins Bar - Strawberry', 90, 1, '{bar}'),
  ('Atkins Bar - Peanut Butter Cup', 100, 1, '{bar}'),
  ('Atkins Bar - Chocolate Crunchy', 90, 1, '{bar}'),
  ('Atkins Vanilla Protein Shake', 160, 1, '{shake}'),
  ('LMNT Electrolyte Packet', 10, 0, '{electrolyte}'),
  ('Nutritional yeast (1 tbsp)', 20, 1, '{savory}'),
  ('Cheese & salami plate', 220, 1, '{cheese,savory}'),
  ('Celery with cream cheese', 90, 2, '{veggie}'),
  ('Hard-boiled egg', 70, 0, '{savory}'),
  ('Pepperoni chips', 140, 1, '{savory}'),
  ('Macadamia nuts (1oz)', 200, 2, '{nut}'),
  ('Pork rinds (1oz)', 160, 0, '{savory}'),
  ('Halo Top Keto mini cup', 90, 3, '{dessert}'),
  ('Sugar-free jello cup', 10, 0, '{dessert}');
