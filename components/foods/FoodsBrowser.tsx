"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeNetCarbs, isKetoFriendly } from "@/lib/calculations/netCarbs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { FoodCategory, FoodRow } from "@/lib/supabase/database.types";

export function FoodsBrowser({
  initialFoods,
  selfId,
  householdId,
}: {
  initialFoods: FoodRow[];
  selfId: string;
  householdId: string | null;
}) {
  const [foods, setFoods] = useState(initialFoods);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("ingredient");
  const [calories, setCalories] = useState("");
  const [totalCarbs, setTotalCarbs] = useState("");
  const [fiber, setFiber] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return foods;
    const q = search.toLowerCase();
    return foods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q));
  }, [foods, search]);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("foods")
      .insert({
        household_id: householdId,
        name,
        category,
        calories: Number(calories) || 0,
        total_carbs_g: Number(totalCarbs) || 0,
        fiber_g: Number(fiber) || 0,
        created_by: selfId,
      })
      .select()
      .single();
    setSaving(false);
    if (data) {
      setFoods((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setCalories("");
      setTotalCarbs("");
      setFiber("");
      setFormOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
        />
        <Button variant="secondary" onClick={() => setFormOpen((v) => !v)}>
          + Add
        </Button>
      </div>

      {formOpen && (
        <Card className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory)}
            className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm capitalize"
          >
            {(["ingredient", "snack", "breakfast", "lunch", "dinner", "dessert", "beverage"] as FoodCategory[]).map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
            />
            <input
              type="number"
              placeholder="Total carbs"
              value={totalCarbs}
              onChange={(e) => setTotalCarbs(e.target.value)}
              className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
            />
            <input
              type="number"
              placeholder="Fiber"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
            />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save food"}
          </Button>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((food) => {
          const netCarbs = computeNetCarbs(food.total_carbs_g, food.fiber_g, food.sugar_alcohols_g);
          return (
            <Card key={food.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-chocolate">
                  {food.name} {food.brand && <span className="text-cafe">({food.brand})</span>}
                </p>
                <p className="text-xs text-cafe">
                  {food.calories} cal · {netCarbs.toFixed(1)}g net carbs
                  {food.default_serving_label ? ` · ${food.default_serving_label}` : ""}
                </p>
              </div>
              <Badge tone={isKetoFriendly(netCarbs) ? "great" : "over"}>
                {isKetoFriendly(netCarbs) ? "Keto" : "Watch"}
              </Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
