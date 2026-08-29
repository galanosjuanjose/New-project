-- Keto Kitchen schema
-- Run this once against a fresh Supabase project (SQL editor or `supabase db push`),
-- then supabase/seed.sql, then create the two Auth users and run
-- supabase/seed_household.sql to attach them to a household with real targets.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid references households (id) on delete set null,
  display_name text not null default '',
  height_in numeric,
  weight_lb numeric,
  activity_level text not null default 'sedentary'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  tdee_kcal numeric,
  calorie_target numeric,
  net_carb_target_low numeric,
  net_carb_target_high numeric,
  avatar_color text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new Supabase Auth user is created.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Helper used throughout RLS: is the current user a member of a given household?
create function is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and household_id = target_household_id
  );
$$;

-- Helper: the current user's own household id.
create function my_household_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select household_id from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- foods (shared library; household_id null = global seed food)
-- ---------------------------------------------------------------------------
create table foods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade,
  name text not null,
  brand text,
  category text not null
    check (category in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage', 'ingredient')),
  default_serving_label text,
  calories numeric not null default 0,
  total_carbs_g numeric not null default 0,
  fiber_g numeric not null default 0,
  sugar_alcohols_g numeric not null default 0,
  protein_g numeric,
  fat_g numeric,
  net_carbs_g numeric generated always as (
    greatest(total_carbs_g - fiber_g - sugar_alcohols_g, 0)
  ) stored,
  is_keto_friendly boolean generated always as (
    greatest(total_carbs_g - fiber_g - sugar_alcohols_g, 0) <= 10
  ) stored,
  tags text[] not null default '{}',
  is_new_discovery boolean not null default false,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- meal_templates (seeded meal pools; household_id null = global seed)
-- ---------------------------------------------------------------------------
create table meal_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade,
  name text not null,
  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
  applies_to text not null default 'both'
    check (applies_to in ('both', 'juan_only', 'mariana_only')),
  base_calories numeric not null default 0,
  base_net_carbs_g numeric not null default 0,
  portion_note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- food_logs (nutrition values are snapshotted at log time)
-- ---------------------------------------------------------------------------
create table food_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  food_id uuid references foods (id) on delete set null,
  meal_template_id uuid references meal_templates (id) on delete set null,
  custom_name text,
  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage')),
  calories numeric not null default 0,
  net_carbs_g numeric not null default 0,
  total_carbs_g numeric,
  fiber_g numeric,
  sugar_alcohols_g numeric,
  quantity numeric not null default 1,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index food_logs_profile_logged_at_idx on food_logs (profile_id, logged_at desc);

-- ---------------------------------------------------------------------------
-- weight_logs
-- ---------------------------------------------------------------------------
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  weight_lb numeric not null,
  logged_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (profile_id, logged_at)
);

-- ---------------------------------------------------------------------------
-- snack_suggestions (curated variety-nudge table; household_id null = global)
-- ---------------------------------------------------------------------------
create table snack_suggestions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade,
  name text not null,
  calories numeric not null default 0,
  net_carbs_g numeric not null default 0,
  style_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- weekly_menu_items (persists a generated week so both partners see the same plan)
-- ---------------------------------------------------------------------------
create table weekly_menu_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  day_date date not null,
  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
  meal_template_id uuid not null references meal_templates (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index weekly_menu_items_profile_day_idx on weekly_menu_items (profile_id, day_date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table households enable row level security;
alter table profiles enable row level security;
alter table foods enable row level security;
alter table meal_templates enable row level security;
alter table food_logs enable row level security;
alter table weight_logs enable row level security;
alter table snack_suggestions enable row level security;
alter table weekly_menu_items enable row level security;

-- households: members can read their own household
create policy "households: select own" on households
  for select using (is_household_member(id));

-- profiles: read anyone in your household, write only yourself
create policy "profiles: select household" on profiles
  for select using (household_id is not null and household_id = my_household_id());
create policy "profiles: select self" on profiles
  for select using (id = auth.uid());
create policy "profiles: update self" on profiles
  for update using (id = auth.uid());

-- foods: read global seed rows or your household's; write to your own household
create policy "foods: select" on foods
  for select using (household_id is null or is_household_member(household_id));
create policy "foods: insert own household" on foods
  for insert with check (household_id = my_household_id());
create policy "foods: update own household" on foods
  for update using (household_id = my_household_id());

-- meal_templates: read global or your household's; household members can add their own
create policy "meal_templates: select" on meal_templates
  for select using (household_id is null or is_household_member(household_id));
create policy "meal_templates: insert own household" on meal_templates
  for insert with check (household_id = my_household_id());

-- snack_suggestions: read global or your household's
create policy "snack_suggestions: select" on snack_suggestions
  for select using (household_id is null or is_household_member(household_id));

-- food_logs: any household member can read; you can only write your own rows
create policy "food_logs: select household" on food_logs
  for select using (
    profile_id in (select id from profiles where household_id = my_household_id())
  );
create policy "food_logs: insert self" on food_logs
  for insert with check (profile_id = auth.uid());
create policy "food_logs: update self" on food_logs
  for update using (profile_id = auth.uid());
create policy "food_logs: delete self" on food_logs
  for delete using (profile_id = auth.uid());

-- weight_logs: any household member can read; you can only write your own rows
create policy "weight_logs: select household" on weight_logs
  for select using (
    profile_id in (select id from profiles where household_id = my_household_id())
  );
create policy "weight_logs: insert self" on weight_logs
  for insert with check (profile_id = auth.uid());
create policy "weight_logs: update self" on weight_logs
  for update using (profile_id = auth.uid());
create policy "weight_logs: delete self" on weight_logs
  for delete using (profile_id = auth.uid());

-- weekly_menu_items: any household member can read/write within their household
create policy "weekly_menu_items: select household" on weekly_menu_items
  for select using (is_household_member(household_id));
create policy "weekly_menu_items: insert household" on weekly_menu_items
  for insert with check (is_household_member(household_id));
create policy "weekly_menu_items: delete household" on weekly_menu_items
  for delete using (is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Realtime: broadcast changes on the tables the app subscribes to
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table food_logs;
alter publication supabase_realtime add table weight_logs;
