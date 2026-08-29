"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeNetCarbs, ketoVerdict } from "@/lib/calculations/netCarbs";
import { suggestUsage } from "@/lib/calculations/ingredientFit";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { MealTemplate } from "@/lib/types/domain";
import type { ProfileKey } from "@/lib/calculations/menuRotation";
import type { FoodCategory } from "@/lib/supabase/database.types";

const TAG_OPTIONS = ["flour", "pasta_alt", "bread_alt", "sweetener", "cheese", "nut", "savory"];
const CATEGORY_OPTIONS: FoodCategory[] = ["ingredient", "snack", "breakfast", "lunch", "dinner", "dessert", "beverage"];

export function CheckerForm({
  selfId,
  householdId,
  profileKey,
  mealTemplates,
}: {
  selfId: string;
  householdId: string | null;
  profileKey?: ProfileKey;
  mealTemplates: MealTemplate[];
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<FoodCategory>("ingredient");
  const [servingLabel, setServingLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [totalCarbs, setTotalCarbs] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugarAlcohols, setSugarAlcohols] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const netCarbs = computeNetCarbs(Number(totalCarbs) || 0, Number(fiber) || 0, Number(sugarAlcohols) || 0);
  const verdict = ketoVerdict(netCarbs);
  const suggestions = useMemo(
    () => suggestUsage({ name: name || "This ingredient", tags }, mealTemplates, profileKey),
    [name, tags, mealTemplates, profileKey]
  );

  const hasNutrition = totalCarbs !== "";

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setSaved(false);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("foods").insert({
      household_id: householdId,
      name,
      brand: brand || null,
      category,
      default_serving_label: servingLabel || null,
      calories: Number(calories) || 0,
      total_carbs_g: Number(totalCarbs) || 0,
      fiber_g: Number(fiber) || 0,
      sugar_alcohols_g: Number(sugarAlcohols) || 0,
      tags,
      is_new_discovery: true,
      created_by: selfId,
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ingredient / product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Brand (optional)"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory)}
            className="w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm capitalize"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Serving size, e.g. 1 tortilla"
            value={servingLabel}
            onChange={(e) => setServingLabel(e.target.value)}
            className="w-full rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
        </div>

        <p className="text-xs text-cafe">From the nutrition label, per serving:</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            type="number"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Total carbs (g)"
            value={totalCarbs}
            onChange={(e) => {
              setTotalCarbs(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Fiber (g)"
            value={fiber}
            onChange={(e) => {
              setFiber(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Sugar alcohols (g)"
            value={sugarAlcohols}
            onChange={(e) => {
              setSugarAlcohols(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-2 text-sm"
          />
        </div>

        <div>
          <p className="mb-1 text-xs text-cafe">What kind of ingredient is this? (helps with usage ideas)</p>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs capitalize ${
                  tags.includes(tag) ? "bg-oro-viejo text-cream" : "bg-arena text-cafe"
                }`}
              >
                {tag.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {hasNutrition && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cafe">Net carbs</p>
              <p className="font-display text-2xl text-chocolate">{netCarbs.toFixed(1)}g</p>
            </div>
            <Badge tone={verdict.verdict === "great" ? "great" : verdict.verdict === "ok" ? "ok" : "over"}>
              {verdict.verdict === "great" ? "Keto-friendly" : verdict.verdict === "ok" ? "Fits in moderation" : "Watch out"}
            </Badge>
          </div>
          <p className="text-sm text-cafe">{verdict.message}</p>

          {suggestions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-cafe">Where it could fit in your rotation:</p>
              <ul className="flex flex-col gap-1">
                {suggestions.map((s) => (
                  <li key={s.template.id} className="text-sm text-chocolate">
                    • {s.suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleSave} disabled={!name.trim() || saving} variant="secondary">
            {saved ? "Saved to your foods ✓" : saving ? "Saving..." : "Save to my foods"}
          </Button>
        </Card>
      )}
    </div>
  );
}
