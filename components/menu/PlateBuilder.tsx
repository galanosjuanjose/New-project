"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  generatePlate,
  plateSignature,
  type GeneratedPlate,
  type PlateFood,
} from "@/lib/calculations/plateComposer";
import type { ProfileKey } from "@/lib/calculations/menuRotation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SwipeCard } from "@/components/menu/SwipeCard";
import type {
  FoodRow,
  IngredientPoolSelectionRow,
  MealTemplateRow,
  ProfileRow,
  SeasoningRow,
} from "@/lib/supabase/database.types";

const PORTION_SCALE: Record<ProfileKey, number> = { juan: 1, mariana: 0.6 };
const DAYS_TO_FILL = 7;

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date();
  d.setDate(d.getDate() + index);
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

function toPlateFood(food: FoodRow): PlateFood {
  return {
    id: food.id,
    name: food.name,
    tags: food.tags,
    calories: food.calories,
    totalCarbsG: food.total_carbs_g,
    fiberG: food.fiber_g,
    sugarAlcoholsG: food.sugar_alcohols_g,
  };
}

export function PlateBuilder({
  self,
  proteins,
  vegetables,
  seasoningFoods,
  breadingFoods,
  initialSeasonings,
  initialPoolSelection,
  initialFavorites,
  profileKey,
}: {
  self: ProfileRow;
  proteins: FoodRow[];
  vegetables: FoodRow[];
  seasoningFoods: FoodRow[];
  breadingFoods: FoodRow[];
  initialSeasonings: SeasoningRow[];
  initialPoolSelection: IngredientPoolSelectionRow | null;
  initialFavorites: MealTemplateRow[];
  profileKey: ProfileKey;
}) {
  const [step, setStep] = useState<"pick" | "swipe" | "done">("pick");
  const [mealType, setMealType] = useState<"lunch" | "dinner">("lunch");
  const [proteinSearch, setProteinSearch] = useState("");
  const [vegSearch, setVegSearch] = useState("");
  const [selectedProteinIds, setSelectedProteinIds] = useState<Set<string>>(
    new Set(initialPoolSelection?.protein_food_ids ?? [])
  );
  const [selectedVegIds, setSelectedVegIds] = useState<Set<string>>(
    new Set(initialPoolSelection?.vegetable_food_ids ?? [])
  );
  const [localSeasoningFoods, setLocalSeasoningFoods] = useState(seasoningFoods);
  const [seasoningActive, setSeasoningActive] = useState<Map<string, boolean>>(
    new Map(initialSeasonings.map((s) => [s.food_id, s.is_active]))
  );
  const [newSeasoningName, setNewSeasoningName] = useState("");
  const [favorites, setFavorites] = useState(initialFavorites);
  const [showFavorites, setShowFavorites] = useState(false);

  const [dayIndex, setDayIndex] = useState(0);
  const [excludeSignatures, setExcludeSignatures] = useState<Set<string>>(new Set());
  const [candidate, setCandidate] = useState<GeneratedPlate | null>(null);
  const [confirmed, setConfirmed] = useState<{ mealTemplateId: string; plate: GeneratedPlate } | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProteins = useMemo(() => {
    const q = proteinSearch.toLowerCase();
    return proteins.filter((f) => f.name.toLowerCase().includes(q));
  }, [proteins, proteinSearch]);

  const filteredVeg = useMemo(() => {
    const q = vegSearch.toLowerCase();
    return vegetables.filter((f) => f.name.toLowerCase().includes(q));
  }, [vegetables, vegSearch]);

  const favoritesForMealType = useMemo(
    () => favorites.filter((f) => f.meal_type === mealType),
    [favorites, mealType]
  );

  function toggleSet(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function toggleSeasoning(foodId: string) {
    if (!self.household_id) return;
    const nextActive = !(seasoningActive.get(foodId) ?? false);
    setSeasoningActive((prev) => new Map(prev).set(foodId, nextActive));
    const supabase = createClient();
    await supabase
      .from("seasonings")
      .upsert(
        { household_id: self.household_id, food_id: foodId, is_active: nextActive },
        { onConflict: "household_id,food_id" }
      );
  }

  async function addSeasoning() {
    if (!newSeasoningName.trim() || !self.household_id) return;
    const supabase = createClient();
    const { data: food } = await supabase
      .from("foods")
      .insert({
        household_id: self.household_id,
        name: newSeasoningName.trim(),
        category: "ingredient",
        food_group: "seasoning",
        calories: 0,
        total_carbs_g: 0,
        fiber_g: 0,
        created_by: self.id,
      })
      .select()
      .single();
    if (food) {
      setLocalSeasoningFoods((prev) => [...prev, food]);
      setNewSeasoningName("");
      await toggleSeasoning(food.id);
    }
  }

  function buildPools() {
    const proteinPool = proteins.filter((f) => selectedProteinIds.has(f.id)).map(toPlateFood);
    const vegPool = vegetables.filter((f) => selectedVegIds.has(f.id)).map(toPlateFood);
    const activeSeasoningPool = localSeasoningFoods
      .filter((f) => seasoningActive.get(f.id))
      .map(toPlateFood);
    const breadingPool = breadingFoods.map(toPlateFood);
    return { proteinPool, vegPool, activeSeasoningPool, breadingPool };
  }

  function generateForCurrentDay(exclude: Set<string>) {
    const { proteinPool, vegPool, activeSeasoningPool, breadingPool } = buildPools();
    const plate = generatePlate(proteinPool, vegPool, activeSeasoningPool, breadingPool, {
      portionScale: PORTION_SCALE[profileKey],
      excludeSignatures: exclude,
    });
    setCandidate(plate);
    setConfirmed(null);
  }

  async function handleContinueToSwipe() {
    if (selectedProteinIds.size === 0 || selectedVegIds.size === 0 || !self.household_id) return;
    const supabase = createClient();
    await supabase.from("ingredient_pool_selections").upsert({
      household_id: self.household_id,
      protein_food_ids: Array.from(selectedProteinIds),
      vegetable_food_ids: Array.from(selectedVegIds),
      updated_at: new Date().toISOString(),
    });
    setDayIndex(0);
    setExcludeSignatures(new Set());
    setStep("swipe");
    generateForCurrentDay(new Set());
  }

  function candidateSignature(plate: GeneratedPlate) {
    const protein = plate.ingredients.find((i) => selectedProteinIds.has(i.food.id))?.food;
    const veggies = plate.ingredients.filter((i) => selectedVegIds.has(i.food.id)).map((i) => i.food);
    if (!protein) return plate.cookingMethod;
    return plateSignature(plate.cookingMethod, protein, veggies);
  }

  function handleReject() {
    if (!candidate) return;
    const nextExclude = new Set(excludeSignatures).add(candidateSignature(candidate));
    setExcludeSignatures(nextExclude);
    generateForCurrentDay(nextExclude);
  }

  async function handleAccept() {
    if (!candidate || !self.household_id) return;
    setSaving(true);
    const supabase = createClient();
    const dayDate = addDaysIso(dayIndex);

    const { data: template } = await supabase
      .from("meal_templates")
      .insert({
        household_id: self.household_id,
        name: candidate.name,
        meal_type: mealType,
        applies_to: profileKey === "juan" ? "juan_only" : "mariana_only",
        base_calories: Math.round(candidate.totalCalories),
        base_net_carbs_g: Number(candidate.totalNetCarbsG.toFixed(1)),
        created_via: "generated",
        tags: [],
      })
      .select()
      .single();

    if (!template) {
      setSaving(false);
      return;
    }

    await supabase.from("plate_ingredients").insert(
      candidate.ingredients.map((ing) => ({
        meal_template_id: template.id,
        food_id: ing.food.id,
        quantity: ing.quantity,
        unit: "serving",
      }))
    );

    await supabase
      .from("weekly_menu_items")
      .delete()
      .eq("profile_id", self.id)
      .eq("day_date", dayDate)
      .eq("meal_type", mealType);
    await supabase.from("weekly_menu_items").insert({
      household_id: self.household_id,
      profile_id: self.id,
      day_date: dayDate,
      meal_type: mealType,
      meal_template_id: template.id,
    });

    setConfirmed({ mealTemplateId: template.id, plate: candidate });
    setSaving(false);
  }

  async function handleSaveFavorite() {
    if (!confirmed) return;
    const supabase = createClient();
    await supabase.from("meal_templates").update({ is_favorite: true }).eq("id", confirmed.mealTemplateId);
    setFavorites((prev) => [
      ...prev,
      {
        id: confirmed.mealTemplateId,
        household_id: self.household_id!,
        name: confirmed.plate.name,
        meal_type: mealType,
        applies_to: profileKey === "juan" ? "juan_only" : "mariana_only",
        base_calories: Math.round(confirmed.plate.totalCalories),
        base_net_carbs_g: Number(confirmed.plate.totalNetCarbsG.toFixed(1)),
        portion_note: null,
        tags: [],
        created_via: "generated",
        is_favorite: true,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  function handleNextDay() {
    if (dayIndex + 1 >= DAYS_TO_FILL) {
      setStep("done");
      return;
    }
    const nextIndex = dayIndex + 1;
    setDayIndex(nextIndex);
    setExcludeSignatures(new Set());
    generateForCurrentDay(new Set());
  }

  async function handlePickFavorite(favorite: MealTemplateRow) {
    if (!self.household_id) return;
    setSaving(true);
    const supabase = createClient();
    const dayDate = addDaysIso(dayIndex);
    await supabase
      .from("weekly_menu_items")
      .delete()
      .eq("profile_id", self.id)
      .eq("day_date", dayDate)
      .eq("meal_type", mealType);
    await supabase.from("weekly_menu_items").insert({
      household_id: self.household_id,
      profile_id: self.id,
      day_date: dayDate,
      meal_type: mealType,
      meal_template_id: favorite.id,
    });
    setShowFavorites(false);
    setSaving(false);
    handleNextDay();
  }

  if (step === "done") {
    return (
      <Card className="text-center">
        <p className="text-sm text-chocolate">
          All {DAYS_TO_FILL} days of {mealType} are set for the week. Head back to the weekly menu to see it.
        </p>
      </Card>
    );
  }

  if (step === "pick") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-full bg-arena p-1 self-start">
          {(["lunch", "dinner"] as const).map((mt) => (
            <button
              key={mt}
              onClick={() => setMealType(mt)}
              className={`min-h-11 rounded-full px-4 text-sm capitalize transition ${
                mealType === mt ? "bg-oliva text-cream" : "text-cafe"
              }`}
            >
              {mt}
            </button>
          ))}
        </div>

        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-base text-chocolate">Proteins</h2>
          <input
            type="text"
            placeholder="Search proteins..."
            value={proteinSearch}
            onChange={(e) => setProteinSearch(e.target.value)}
            className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
          />
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {filteredProteins.map((food) => (
              <label
                key={food.id}
                className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-chocolate hover:bg-arena/50"
              >
                <input
                  type="checkbox"
                  checked={selectedProteinIds.has(food.id)}
                  onChange={() => setSelectedProteinIds((prev) => toggleSet(prev, food.id))}
                  className="h-5 w-5 accent-oliva"
                />
                {food.name}
              </label>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-base text-chocolate">Vegetables</h2>
          <input
            type="text"
            placeholder="Search vegetables..."
            value={vegSearch}
            onChange={(e) => setVegSearch(e.target.value)}
            className="rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
          />
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {filteredVeg.map((food) => (
              <label
                key={food.id}
                className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-chocolate hover:bg-arena/50"
              >
                <input
                  type="checkbox"
                  checked={selectedVegIds.has(food.id)}
                  onChange={() => setSelectedVegIds((prev) => toggleSet(prev, food.id))}
                  className="h-5 w-5 accent-oliva"
                />
                {food.name}
              </label>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-base text-chocolate">Seasonings</h2>
          <p className="text-xs text-cafe">Registered once — toggle on/off depending on what you have.</p>
          <div className="flex flex-wrap gap-2">
            {localSeasoningFoods.map((food) => {
              const active = seasoningActive.get(food.id) ?? false;
              return (
                <button
                  key={food.id}
                  onClick={() => toggleSeasoning(food.id)}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs ${
                    active ? "bg-oliva text-cream" : "bg-arena text-cafe"
                  }`}
                >
                  {food.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a seasoning..."
              value={newSeasoningName}
              onChange={(e) => setNewSeasoningName(e.target.value)}
              className="w-full rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
            />
            <Button variant="secondary" onClick={addSeasoning}>
              + Add
            </Button>
          </div>
        </Card>

        <Button
          onClick={handleContinueToSwipe}
          disabled={selectedProteinIds.size === 0 || selectedVegIds.size === 0}
        >
          Continue to swipe
        </Button>
      </div>
    );
  }

  // step === "swipe"
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-cafe">
        Day {dayIndex + 1} of {DAYS_TO_FILL} — {dayLabel(dayIndex)} {mealType}
      </p>

      {!confirmed && candidate && (
        <SwipeCard plate={candidate} onAccept={handleAccept} onReject={handleReject} />
      )}
      {!confirmed && !candidate && (
        <Card className="text-sm text-cafe">
          Couldn&apos;t find a combination — pick more proteins/vegetables or add a breading ingredient for
          breaded dishes.
        </Card>
      )}

      {confirmed && (
        <Card className="w-full max-w-sm flex flex-col gap-2">
          <h3 className="font-display text-lg text-chocolate">{confirmed.plate.name}</h3>
          <ul className="flex flex-col gap-1 text-sm text-cafe">
            {confirmed.plate.ingredients.map((ing, i) => (
              <li key={`${ing.food.id}-${i}`} className="flex justify-between">
                <span>
                  {ing.food.name} ({ing.quantity}×)
                </span>
                <span>
                  {Math.round(ing.food.calories * ing.quantity)} cal /{" "}
                  {(ing.food.totalCarbsG * ing.quantity).toFixed(1)}g carbs
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-salvia/40 pt-2 text-sm font-medium text-chocolate">
            <span>{Math.round(confirmed.plate.totalCalories)} cal total</span>
            <span>{confirmed.plate.totalNetCarbsG.toFixed(1)}g net carbs</span>
          </div>
          <Button variant="secondary" onClick={handleSaveFavorite}>
            ♥ Save as favorite
          </Button>
          <Button onClick={handleNextDay}>Next day</Button>
        </Card>
      )}

      {!confirmed && (
        <Button variant="secondary" onClick={() => setShowFavorites(true)} disabled={saving}>
          Pick one of your usuals
        </Button>
      )}

      {showFavorites && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-chocolate/40 sm:items-center">
          <Card className="w-full max-w-md rounded-b-none bg-cream sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg text-chocolate">Your usual {mealType}s</h2>
              <button
                onClick={() => setShowFavorites(false)}
                className="flex h-11 w-11 items-center justify-center text-lg text-cafe"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {favoritesForMealType.length === 0 && (
              <p className="text-sm text-cafe">No favorites saved yet for {mealType}.</p>
            )}
            <div className="flex flex-col gap-2">
              {favoritesForMealType.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => handlePickFavorite(fav)}
                  disabled={saving}
                  className="flex min-h-11 items-center justify-between rounded-lg border border-salvia px-3 py-3 text-left text-sm hover:bg-arena/50"
                >
                  <span>{fav.name}</span>
                  <span className="text-xs text-cafe">
                    {fav.base_calories} cal / {fav.base_net_carbs_g}g
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
