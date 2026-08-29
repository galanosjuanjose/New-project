"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Database, FoodRow, LogMealType } from "@/lib/supabase/database.types";

type FoodLogInsert = Database["public"]["Tables"]["food_logs"]["Insert"];

const MEAL_TYPES: LogMealType[] = ["breakfast", "lunch", "dinner", "snack", "dessert", "beverage"];

export function LogItemSheet({
  profileId,
  foods,
  onClose,
  onLogged,
}: {
  profileId: string;
  foods: FoodRow[];
  onClose: () => void;
  onLogged: () => void;
}) {
  const [mealType, setMealType] = useState<LogMealType>("snack");
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodRow | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customNetCarbs, setCustomNetCarbs] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return foods.slice(0, 12);
    const q = search.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q)).slice(0, 12);
  }, [foods, search]);

  async function handleSubmit() {
    setSaving(true);
    const supabase = createClient();

    const payload: FoodLogInsert = selectedFood
      ? {
          profile_id: profileId,
          food_id: selectedFood.id,
          custom_name: selectedFood.name,
          meal_type: mealType,
          calories: selectedFood.calories * quantity,
          net_carbs_g: selectedFood.net_carbs_g * quantity,
          total_carbs_g: selectedFood.total_carbs_g * quantity,
          fiber_g: selectedFood.fiber_g * quantity,
          sugar_alcohols_g: selectedFood.sugar_alcohols_g * quantity,
          quantity,
        }
      : {
          profile_id: profileId,
          food_id: null,
          custom_name: customName,
          meal_type: mealType,
          calories: Number(customCalories) || 0,
          net_carbs_g: Number(customNetCarbs) || 0,
          total_carbs_g: null,
          fiber_g: null,
          sugar_alcohols_g: null,
          quantity: 1,
        };

    await supabase.from("food_logs").insert(payload);
    setSaving(false);
    onLogged();
  }

  const canSubmit = selectedFood ? true : customName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-chocolate/40 sm:items-center">
      <Card className="w-full max-w-md rounded-b-none bg-cream sm:rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-chocolate">Log an item</h2>
          <button onClick={onClose} className="text-cafe">
            ✕
          </button>
        </div>

        <label className="mb-1 block text-xs text-cafe">Meal type</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as LogMealType)}
          className="mb-3 w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm capitalize"
        >
          {MEAL_TYPES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {!customMode && (
          <>
            <input
              type="text"
              placeholder="Search foods..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedFood(null);
              }}
              className="mb-2 w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
            />
            <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-camel/50">
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-arena ${
                    selectedFood?.id === food.id ? "bg-arena" : ""
                  }`}
                >
                  <span>{food.name}</span>
                  <span className="text-xs text-cafe">
                    {food.calories} cal / {food.net_carbs_g}g
                  </span>
                </button>
              ))}
              {filteredFoods.length === 0 && (
                <p className="px-3 py-2 text-sm text-cafe">No matches — try a custom entry.</p>
              )}
            </div>

            {selectedFood && (
              <div className="mb-3 flex items-center gap-2 text-sm">
                <label className="text-cafe">Quantity</label>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="w-20 rounded-lg border border-camel bg-cream px-2 py-1"
                />
                <span className="text-cafe">
                  = {(selectedFood.calories * quantity).toFixed(0)} cal /{" "}
                  {(selectedFood.net_carbs_g * quantity).toFixed(1)}g net carbs
                </span>
              </div>
            )}

            <button onClick={() => setCustomMode(true)} className="mb-3 text-xs text-oro-viejo underline">
              Or add a custom item
            </button>
          </>
        )}

        {customMode && (
          <div className="mb-3 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Calories"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                className="w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Net carbs (g)"
                value={customNetCarbs}
                onChange={(e) => setCustomNetCarbs(e.target.value)}
                className="w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
              />
            </div>
            <button onClick={() => setCustomMode(false)} className="self-start text-xs text-oro-viejo underline">
              Back to search
            </button>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="w-full">
          {saving ? "Logging..." : "Log it"}
        </Button>
      </Card>
    </div>
  );
}
