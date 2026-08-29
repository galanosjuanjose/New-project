# Supabase setup

1. Create a free Supabase project at https://supabase.com.
2. In the SQL editor, run `migrations/0001_init.sql`, then `seed.sql`.
3. Go to Authentication -> Users -> Add user, and create two accounts (one for
   Juan, one for Mariana, email + password). This auto-creates a blank
   `profiles` row for each via the `handle_new_user` trigger.
4. Copy each new user's UUID from the Users table, paste them into
   `seed_household.sql` in place of the two placeholder UUIDs, and run it in
   the SQL editor. This creates the shared household and fills in real
   height/weight/activity/targets for both profiles.
5. In Project Settings -> API, copy the Project URL and anon public key into
   `.env.local` (see `.env.local.example`).
6. Also enable Realtime for `food_logs` and `weight_logs` if it isn't already
   (Database -> Replication) — the init migration adds them to the
   `supabase_realtime` publication, but double-check on the dashboard.
