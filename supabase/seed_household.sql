-- One-time manual step: run AFTER creating the two Supabase Auth users
-- (Dashboard -> Authentication -> Add user) for Juan and Mariana.
-- The handle_new_user() trigger already created a blank `profiles` row for
-- each of them keyed by their auth.users.id — this script fills in the
-- household link and their real stats/targets from the Keto Diet profile.
--
-- UUIDs below are already filled in with the real auth.users ids for this
-- household (Juan = b8d18299-..., Mariana = 226d8123-...).

with new_household as (
  insert into households (name) values ('Juan & Mariana') returning id
)
update profiles
set household_id = new_household.id,
    display_name = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 'Juan'
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 'Mariana'
    end,
    height_in = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 70
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 61
    end,
    weight_lb = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 187
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 128
    end,
    activity_level = 'sedentary',
    tdee_kcal = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 2450
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 1650
    end,
    calorie_target = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 2000
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 1400
    end,
    net_carb_target_low = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 20
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 15
    end,
    net_carb_target_high = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 30
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 25
    end,
    avatar_color = case
      when profiles.id = 'b8d18299-ce81-49e6-ae61-c7ed67c0118e' then 'camel'
      when profiles.id = '226d8123-f0ac-4ed5-b115-db0f909f2547' then 'salvia'
    end
from new_household
where profiles.id in (
  'b8d18299-ce81-49e6-ae61-c7ed67c0118e',
  '226d8123-f0ac-4ed5-b115-db0f909f2547'
);
