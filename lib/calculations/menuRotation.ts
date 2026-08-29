import type { MealTemplate, ProfileQuirks, ProfileTargets } from "@/lib/types/domain";

export type ProfileKey = "juan" | "mariana";

/** Slots the weekly planner fills; snacks are handled separately by snackVariety.ts. */
export const MENU_SLOTS: MealTemplate["mealType"][] = ["breakfast", "lunch", "dinner", "dessert"];

/** How far a day's running total may exceed the target before a template is excluded
 * from consideration (still allowed as a last resort if nothing else fits). */
export const CALORIE_TOLERANCE = 1.15;
export const NET_CARB_TOLERANCE = 1.2;

export function isApplicableToProfile(template: MealTemplate, profile: ProfileKey): boolean {
  return template.appliesTo === "both" || template.appliesTo === `${profile}_only`;
}

export function passesQuirkFilter(template: MealTemplate, quirks: ProfileQuirks): boolean {
  if (quirks.breadPreference === "lettuce_wrap_except_ham_cheese") {
    if (template.tags.includes("bread_bun") && !template.tags.includes("ham_cheese")) {
      return false;
    }
  }
  if (quirks.breadPreference === "keto_bread_always") {
    if (template.tags.includes("lettuce_wrap")) {
      return false;
    }
  }
  return true;
}

export interface DayMeal {
  mealType: MealTemplate["mealType"];
  template: MealTemplate;
}

export interface DayPlan {
  dayIndex: number;
  meals: DayMeal[];
  totalCalories: number;
  totalNetCarbsG: number;
}

export interface GenerateMenuOptions {
  days?: number;
  /** Injectable RNG for deterministic tests; defaults to Math.random. */
  rng?: () => number;
  /** How many previous days' picks to avoid repeating within a slot. */
  noRepeatWithinDays?: number;
}

export function generateWeeklyMenu(
  pools: MealTemplate[],
  profile: ProfileKey,
  quirks: ProfileQuirks,
  targets: ProfileTargets,
  recentHistoryIds: string[] = [],
  options: GenerateMenuOptions = {}
): DayPlan[] {
  const days = options.days ?? 7;
  const noRepeatWithinDays = options.noRepeatWithinDays ?? 2;
  const rng = options.rng ?? Math.random;

  const history: string[][] = recentHistoryIds.length > 0 ? [recentHistoryIds] : [];
  const plan: DayPlan[] = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const recentlyUsed = new Set(history.slice(-noRepeatWithinDays).flat());
    const usedToday: string[] = [];
    const meals: DayMeal[] = [];
    let totalCalories = 0;
    let totalNetCarbsG = 0;

    for (const slot of MENU_SLOTS) {
      const slotPool = pools.filter(
        (t) => t.mealType === slot && isApplicableToProfile(t, profile) && passesQuirkFilter(t, quirks)
      );
      if (slotPool.length === 0) continue;

      const fresh = slotPool.filter((t) => !recentlyUsed.has(t.id) && !usedToday.includes(t.id));
      const candidates = fresh.length > 0 ? fresh : slotPool;

      const withinBudget = candidates.filter(
        (t) =>
          totalCalories + t.baseCalories <= targets.calorieTarget * CALORIE_TOLERANCE &&
          totalNetCarbsG + t.baseNetCarbsG <= targets.netCarbTargetHigh * NET_CARB_TOLERANCE
      );
      const pickFrom = withinBudget.length > 0 ? withinBudget : candidates;
      const chosen = pickFrom[Math.floor(rng() * pickFrom.length)];

      meals.push({ mealType: slot, template: chosen });
      totalCalories += chosen.baseCalories;
      totalNetCarbsG += chosen.baseNetCarbsG;
      usedToday.push(chosen.id);
    }

    history.push(usedToday);
    plan.push({ dayIndex, meals, totalCalories, totalNetCarbsG });
  }

  return plan;
}
