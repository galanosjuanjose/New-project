"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateWeeklyMenu, type ProfileKey } from "@/lib/calculations/menuRotation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MealTemplate, ProfileQuirks } from "@/lib/types/domain";
import type { ProfileRow, WeeklyMenuItemRow } from "@/lib/supabase/database.types";

const QUIRKS: Record<ProfileKey, ProfileQuirks> = {
  juan: { breadPreference: "lettuce_wrap_except_ham_cheese", portionScale: 1 },
  mariana: { breadPreference: "keto_bread_always", portionScale: 0.6 },
};

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DAY_LABELS = ["Today", "Tomorrow"];

function dayLabel(index: number) {
  if (index < DAY_LABELS.length) return DAY_LABELS[index];
  const d = new Date();
  d.setDate(d.getDate() + index);
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

export function MenuView({
  viewingProfile,
  isSelf,
  profileKey,
  householdId,
  mealTemplates,
  initialWeeklyMenuItems,
}: {
  viewingProfile: ProfileRow;
  isSelf: boolean;
  profileKey: ProfileKey;
  householdId: string | null;
  mealTemplates: MealTemplate[];
  initialWeeklyMenuItems: WeeklyMenuItemRow[];
}) {
  const [items, setItems] = useState(initialWeeklyMenuItems);
  const [generating, setGenerating] = useState(false);

  const templateById = useMemo(() => new Map(mealTemplates.map((t) => [t.id, t])), [mealTemplates]);

  const days = useMemo(() => {
    const byDate = new Map<string, WeeklyMenuItemRow[]>();
    for (const item of items) {
      const list = byDate.get(item.day_date) ?? [];
      list.push(item);
      byDate.set(item.day_date, list);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDaysIso(i);
      return { date, items: byDate.get(date) ?? [] };
    });
  }, [items]);

  async function handleGenerate() {
    if (!householdId) return;
    setGenerating(true);

    const targets = {
      calorieTarget: viewingProfile.calorie_target ?? 0,
      netCarbTargetLow: viewingProfile.net_carb_target_low ?? 0,
      netCarbTargetHigh: viewingProfile.net_carb_target_high ?? 0,
    };

    const plan = generateWeeklyMenu(mealTemplates, profileKey, QUIRKS[profileKey], targets, [], { days: 7 });

    const rows = plan.flatMap((day) =>
      day.meals.map((meal) => ({
        household_id: householdId,
        profile_id: viewingProfile.id,
        day_date: addDaysIso(day.dayIndex),
        meal_type: meal.mealType,
        meal_template_id: meal.template.id,
      }))
    );

    const supabase = createClient();
    await supabase
      .from("weekly_menu_items")
      .delete()
      .eq("profile_id", viewingProfile.id)
      .gte("day_date", addDaysIso(0))
      .lte("day_date", addDaysIso(6));
    const { data } = await supabase.from("weekly_menu_items").insert(rows).select();

    setGenerating(false);
    setItems(data ?? []);
  }

  return (
    <div className="flex flex-col gap-4">
      {!isSelf && (
        <Card className="bg-camel/30 text-sm">Viewing {viewingProfile.display_name}&apos;s menu.</Card>
      )}

      {isSelf && (
        <Button onClick={handleGenerate} disabled={generating} className="self-start">
          {generating ? "Generating..." : items.length > 0 ? "Regenerate week" : "Generate this week"}
        </Button>
      )}

      {days.map((day) => {
        const dayIndex = Math.round((new Date(day.date).getTime() - new Date(addDaysIso(0)).getTime()) / 86400000);
        const totalCalories = day.items.reduce((sum, i) => sum + (templateById.get(i.meal_template_id)?.baseCalories ?? 0), 0);
        const totalNetCarbs = day.items.reduce((sum, i) => sum + (templateById.get(i.meal_template_id)?.baseNetCarbsG ?? 0), 0);

        return (
          <Card key={day.date}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-display text-base text-chocolate">{dayLabel(dayIndex)}</h2>
              {day.items.length > 0 && (
                <span className="text-xs text-cafe">
                  {totalCalories} cal · {totalNetCarbs.toFixed(1)}g net carbs
                </span>
              )}
            </div>
            {day.items.length === 0 ? (
              <p className="text-sm text-cafe">No menu generated yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {day.items.map((item) => {
                  const template = templateById.get(item.meal_template_id);
                  return (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="capitalize text-cafe">{item.meal_type}</span>
                      <span className="text-chocolate">{template?.name ?? "Unknown"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
