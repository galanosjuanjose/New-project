import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { WeightView } from "@/components/weight/WeightView";

export default async function WeightPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { self, household } = await getProfileContext();
  const { as } = await searchParams;
  const viewingProfile = household.find((p) => p.id === as) ?? self;
  const isSelf = viewingProfile.id === self.id;

  const supabase = await createClient();
  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("profile_id", viewingProfile.id)
    .order("logged_at", { ascending: true });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-4">Weight</h1>
      <WeightView viewingProfile={viewingProfile} isSelf={isSelf} initialWeightLogs={weightLogs ?? []} />
    </div>
  );
}
