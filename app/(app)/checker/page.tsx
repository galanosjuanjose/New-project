import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { CheckerForm } from "@/components/checker/CheckerForm";
import type { ProfileKey } from "@/lib/calculations/menuRotation";

function inferProfileKey(displayName: string): ProfileKey | undefined {
  const lower = displayName.toLowerCase();
  if (lower === "juan") return "juan";
  if (lower === "mariana") return "mariana";
  return undefined;
}

export default async function CheckerPage() {
  const { self } = await getProfileContext();
  const supabase = await createClient();
  const { data: mealTemplates } = await supabase.from("meal_templates").select("*").order("name");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-1">Is this keto?</h1>
      <p className="mb-4 text-sm text-cafe">
        Spot something new at the store? Check the label numbers and see where it could fit in
        your rotation.
      </p>
      <CheckerForm
        selfId={self.id}
        householdId={self.household_id}
        profileKey={inferProfileKey(self.display_name)}
        mealTemplates={(mealTemplates ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          mealType: t.meal_type,
          appliesTo: t.applies_to,
          baseCalories: t.base_calories,
          baseNetCarbsG: t.base_net_carbs_g,
          tags: t.tags,
        }))}
      />
    </div>
  );
}
