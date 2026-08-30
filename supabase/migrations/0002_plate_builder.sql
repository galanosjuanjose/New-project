-- Ingredient-based plate builder: food_group classification, generated/favorite
-- meal_templates, their ingredient breakdown, a household seasonings list, and
-- a remembered ingredient pool selection. Run this after 0001_init.sql (and
-- seed.sql / seed_household.sql if not already run).

-- ---------------------------------------------------------------------------
-- foods: classify by food group so the picker can filter proteins/veg/seasonings
-- ---------------------------------------------------------------------------
alter table foods
  add column food_group text not null default 'other'
    check (food_group in ('protein', 'vegetable', 'seasoning', 'dairy', 'fat', 'other'));

-- Backfill food_group for the existing seed.sql rows (by name, global rows only).
update foods set food_group = 'protein'
  where household_id is null
    and name in ('Ground beef 85/15, cooked', 'Chicken breast, cooked', 'Bacon', 'Hard-boiled egg');
update foods set food_group = 'dairy'
  where household_id is null
    and name in ('Chihuahua cheese', 'Cheddar cheese', 'Muenster cheese', 'Queso fresco');
update foods set food_group = 'fat'
  where household_id is null
    and name in ('Beef tallow', 'Avocado', 'Macadamia nuts (1oz)', 'Macadamia nuts');
update foods set food_group = 'vegetable'
  where household_id is null and name = 'Palmini hearts-of-palm pasta';
update foods set food_group = 'seasoning'
  where household_id is null and name = 'Nutritional yeast';

-- Pork rinds double as a breading ingredient for the plate builder's "breaded" method.
update foods set tags = array_append(tags, 'breading')
  where household_id is null and name in ('Pork rinds', 'Pork rinds (1oz)') and not ('breading' = any(tags));

-- ---------------------------------------------------------------------------
-- meal_templates: distinguish generated/favorited plates from the authored pool
-- ---------------------------------------------------------------------------
alter table meal_templates
  add column created_via text not null default 'authored'
    check (created_via in ('authored', 'generated')),
  add column is_favorite boolean not null default false;

-- ---------------------------------------------------------------------------
-- plate_ingredients: composition of a generated plate (household-scoped
-- meal_templates row -> its ingredient breakdown). Macros are computed by
-- summing quantity-scaled foods nutrition, not stored redundantly here.
-- ---------------------------------------------------------------------------
create table plate_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_template_id uuid not null references meal_templates (id) on delete cascade,
  food_id uuid not null references foods (id) on delete restrict,
  quantity numeric not null default 1,
  unit text not null default 'serving',
  created_at timestamptz not null default now()
);

create index plate_ingredients_meal_template_idx on plate_ingredients (meal_template_id);

-- ---------------------------------------------------------------------------
-- seasonings: a household's registered on/off seasoning list, layered over
-- seasoning-tagged foods rows (which carry the actual nutrition/food_group).
-- ---------------------------------------------------------------------------
create table seasonings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  food_id uuid not null references foods (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (household_id, food_id)
);

-- ---------------------------------------------------------------------------
-- ingredient_pool_selections: remembers the household's last picked
-- proteins/veggies as a pre-filled starting point next time.
-- ---------------------------------------------------------------------------
create table ingredient_pool_selections (
  household_id uuid primary key references households (id) on delete cascade,
  protein_food_ids uuid[] not null default '{}',
  vegetable_food_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table plate_ingredients enable row level security;
alter table seasonings enable row level security;
alter table ingredient_pool_selections enable row level security;

-- plate_ingredients: visible/writable by anyone who can see the parent plate
create policy "plate_ingredients: select" on plate_ingredients
  for select using (
    exists (
      select 1 from meal_templates mt
      where mt.id = plate_ingredients.meal_template_id
        and (mt.household_id is null or is_household_member(mt.household_id))
    )
  );
create policy "plate_ingredients: insert" on plate_ingredients
  for insert with check (
    exists (
      select 1 from meal_templates mt
      where mt.id = plate_ingredients.meal_template_id
        and mt.household_id = my_household_id()
    )
  );
create policy "plate_ingredients: delete" on plate_ingredients
  for delete using (
    exists (
      select 1 from meal_templates mt
      where mt.id = plate_ingredients.meal_template_id
        and mt.household_id = my_household_id()
    )
  );

-- seasonings: household members can read/write their own household's list
create policy "seasonings: select" on seasonings
  for select using (is_household_member(household_id));
create policy "seasonings: insert" on seasonings
  for insert with check (household_id = my_household_id());
create policy "seasonings: update" on seasonings
  for update using (household_id = my_household_id());
create policy "seasonings: delete" on seasonings
  for delete using (household_id = my_household_id());

-- ingredient_pool_selections: household members can read/write their own row
create policy "ingredient_pool_selections: select" on ingredient_pool_selections
  for select using (is_household_member(household_id));
create policy "ingredient_pool_selections: upsert" on ingredient_pool_selections
  for insert with check (household_id = my_household_id());
create policy "ingredient_pool_selections: update" on ingredient_pool_selections
  for update using (household_id = my_household_id());
