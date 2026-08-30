import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { PlateBuilder } from "@/components/menu/PlateBuilder";
import type { ProfileKey } from "@/lib/calculations/menuRotation";

function inferProfileKey(displayName: string): ProfileKey {
  return displayName.toLowerCase() === "mariana" ? "mariana" : "juan";
}

export default async function MenuBuildPage() {
  const { self } = await getProfileContext();
  const supabase = await createClient();

  const [
    { data: proteins },
    { data: vegetables },
    { data: seasoningFoods },
    { data: breadingFoods },
    { data: seasonings },
    { data: poolSelection },
    { data: favorites },
  ] = await Promise.all([
    supabase.from("foods").select("*").eq("food_group", "protein").order("name"),
    supabase.from("foods").select("*").eq("food_group", "vegetable").order("name"),
    supabase.from("foods").select("*").eq("food_group", "seasoning").order("name"),
    supabase.from("foods").select("*").contains("tags", ["breading"]),
    supabase.from("seasonings").select("*").eq("household_id", self.household_id ?? ""),
    supabase.from("ingredient_pool_selections").select("*").eq("household_id", self.household_id ?? "").maybeSingle(),
    supabase
      .from("meal_templates")
      .select("*")
      .eq("household_id", self.household_id ?? "")
      .eq("created_via", "generated")
      .eq("is_favorite", true)
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-1">Build a plate</h1>
      <p className="mb-4 text-sm text-cafe">
        Pick what you have, then swipe through combinations for the week.
      </p>
      <PlateBuilder
        self={self}
        proteins={proteins ?? []}
        vegetables={vegetables ?? []}
        seasoningFoods={seasoningFoods ?? []}
        breadingFoods={breadingFoods ?? []}
        initialSeasonings={seasonings ?? []}
        initialPoolSelection={poolSelection ?? null}
        initialFavorites={favorites ?? []}
        profileKey={inferProfileKey(self.display_name)}
      />
    </div>
  );
}
