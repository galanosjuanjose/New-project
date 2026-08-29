-- One-time manual step: run AFTER creating the two Supabase Auth users
-- (Dashboard -> Authentication -> Add user) for Juan and Mariana.
-- The handle_new_user() trigger already created a blank `profiles` row for
-- each of them keyed by their auth.users.id — this script fills in the
-- household link and their real stats/targets from the Keto Diet profile.
--
-- Replace the two UUIDs below with the actual auth.users ids
-- (Dashboard -> Authentication -> Users -> copy the "User UID" column).

with new_household as (
  insert into households (name) values ('Juan & Mariana') returning id
)
update profiles
set household_id = new_household.id,
    display_name = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 'Juan'
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 'Mariana'
    end,
    height_in = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 70
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 61
    end,
    weight_lb = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 187
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 128
    end,
    activity_level = 'sedentary',
    tdee_kcal = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 2450
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 1650
    end,
    calorie_target = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 2000
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 1400
    end,
    net_carb_target_low = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 20
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 15
    end,
    net_carb_target_high = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 30
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 25
    end,
    avatar_color = case
      when profiles.id = '00000000-0000-0000-0000-000000000001' then 'camel'
      when profiles.id = '00000000-0000-0000-0000-000000000002' then 'salvia'
    end
from new_household
where profiles.id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);
