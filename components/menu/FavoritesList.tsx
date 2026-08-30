"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MealTemplateRow } from "@/lib/supabase/database.types";

export function FavoritesList({ initialFavorites }: { initialFavorites: MealTemplateRow[] }) {
  const [favorites, setFavorites] = useState(initialFavorites);

  const grouped = useMemo(() => {
    const byMealType = new Map<string, MealTemplateRow[]>();
    for (const fav of favorites) {
      const list = byMealType.get(fav.meal_type) ?? [];
      list.push(fav);
      byMealType.set(fav.meal_type, list);
    }
    return Array.from(byMealType.entries());
  }, [favorites]);

  async function removeFavorite(id: string) {
    const supabase = createClient();
    await supabase.from("meal_templates").update({ is_favorite: false }).eq("id", id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  if (favorites.length === 0) {
    return (
      <Card className="text-sm text-cafe">
        No favorites yet — while building your weekly menu, tap &quot;Save as favorite&quot; on a plate you
        like and it&apos;ll show up here.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {grouped.map(([mealType, items]) => (
        <div key={mealType}>
          <h2 className="mb-2 font-display text-base capitalize text-chocolate">{mealType}</h2>
          <div className="flex flex-col gap-2">
            {items.map((fav) => (
              <Card key={fav.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-chocolate">{fav.name}</p>
                  <p className="text-xs text-cafe">
                    {fav.base_calories} cal · {fav.base_net_carbs_g}g net carbs
                  </p>
                </div>
                <Button variant="secondary" onClick={() => removeFavorite(fav.id)}>
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
