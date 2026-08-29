import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { MenuView } from "@/components/menu/MenuView";
import type { ProfileKey } from "@/lib/calculations/menuRotation";

function inferProfileKey(displayName: string): ProfileKey {
  return displayName.toLowerCase() === "mariana" ? "mariana" : "juan";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { self, household } = await getProfileContext();
  const { as } = await searchParams;
  const viewingProfile = household.find((p) => p.id === as) ?? self;
  const isSelf = viewingProfile.id === self.id;

  const supabase = await createClient();
  const [{ data: mealTemplates }, { data: weeklyMenuItems }] = await Promise.all([
    supabase.from("meal_templates").select("*").order("name"),
    supabase
      .from("weekly_menu_items")
      .select("*")
      .eq("profile_id", viewingProfile.id)
      .gte("day_date", todayIso())
      .lte("day_date", addDaysIso(6))
      .order("day_date"),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-4">Weekly menu</h1>
      <MenuView
        viewingProfile={viewingProfile}
        isSelf={isSelf}
        profileKey={inferProfileKey(viewingProfile.display_name)}
        householdId={viewingProfile.household_id}
        mealTemplates={(mealTemplates ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          mealType: t.meal_type,
          appliesTo: t.applies_to,
          baseCalories: t.base_calories,
          baseNetCarbsG: t.base_net_carbs_g,
          tags: t.tags,
        }))}
        initialWeeklyMenuItems={weeklyMenuItems ?? []}
      />
    </div>
  );
}
