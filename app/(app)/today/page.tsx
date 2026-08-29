import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { TodayView } from "@/components/today/TodayView";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function sevenDaysAgoIso() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { self, household } = await getProfileContext();
  const { as } = await searchParams;
  const viewingProfile = household.find((p) => p.id === as) ?? self;
  const isSelf = viewingProfile.id === self.id;

  const supabase = await createClient();

  const [{ data: logs }, { data: foods }, { data: recentSnackLogs }, { data: snackSuggestions }] = await Promise.all([
    supabase
      .from("food_logs")
      .select("*")
      .eq("profile_id", viewingProfile.id)
      .gte("logged_at", startOfTodayIso())
      .order("logged_at", { ascending: false }),
    supabase.from("foods").select("*").order("name"),
    supabase
      .from("food_logs")
      .select("*")
      .eq("profile_id", viewingProfile.id)
      .eq("meal_type", "snack")
      .gte("logged_at", sevenDaysAgoIso()),
    supabase.from("snack_suggestions").select("*").order("name"),
  ]);

  return (
    <TodayView
      key={viewingProfile.id}
      viewingProfile={viewingProfile}
      isSelf={isSelf}
      initialLogs={logs ?? []}
      foods={foods ?? []}
      recentSnackLogs={recentSnackLogs ?? []}
      snackSuggestions={snackSuggestions ?? []}
    />
  );
}
