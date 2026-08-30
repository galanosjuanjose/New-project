import { createClient } from "@/lib/supabase/server";
import { getProfileContext } from "@/lib/supabase/profile";
import { FavoritesList } from "@/components/menu/FavoritesList";

export default async function MenuFavoritesPage() {
  const { self } = await getProfileContext();
  const supabase = await createClient();
  const { data: favorites } = await supabase
    .from("meal_templates")
    .select("*")
    .eq("household_id", self.household_id ?? "")
    .eq("created_via", "generated")
    .eq("is_favorite", true)
    .order("meal_type")
    .order("name");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-xl text-chocolate mb-4">Favorites</h1>
      <FavoritesList initialFavorites={favorites ?? []} />
    </div>
  );
}
