import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/database.types";

export interface ProfileContext {
  self: ProfileRow;
  household: ProfileRow[];
}

/** Fetches the signed-in user's profile plus every profile in their household
 * (for the profile switcher). Redirects to /login if somehow unauthenticated —
 * middleware.ts already guards routes, this is a defensive fallback. */
export async function getProfileContext(): Promise<ProfileContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: self } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!self) redirect("/login");

  const { data: household } = self.household_id
    ? await supabase.from("profiles").select("*").eq("household_id", self.household_id)
    : { data: [self] };

  return { self, household: household ?? [self] };
}
