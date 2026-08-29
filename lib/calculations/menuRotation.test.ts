import { describe, expect, it } from "vitest";
import {
  generateWeeklyMenu,
  isApplicableToProfile,
  passesQuirkFilter,
} from "./menuRotation";
import type { MealTemplate, ProfileQuirks, ProfileTargets } from "@/lib/types/domain";

const juanQuirks: ProfileQuirks = { breadPreference: "lettuce_wrap_except_ham_cheese", portionScale: 1 };
const marianaQuirks: ProfileQuirks = { breadPreference: "keto_bread_always", portionScale: 0.6 };

const juanTargets: ProfileTargets = { calorieTarget: 2000, netCarbTargetLow: 20, netCarbTargetHigh: 30 };
const marianaTargets: ProfileTargets = { calorieTarget: 1400, netCarbTargetLow: 15, netCarbTargetHigh: 25 };

function template(overrides: Partial<MealTemplate>): MealTemplate {
  return {
    id: "id",
    name: "name",
    mealType: "dinner",
    appliesTo: "both",
    baseCalories: 400,
    baseNetCarbsG: 5,
    tags: [],
    ...overrides,
  };
}

describe("isApplicableToProfile", () => {
  it("matches both, and the profile-specific variant", () => {
    expect(isApplicableToProfile(template({ appliesTo: "both" }), "juan")).toBe(true);
    expect(isApplicableToProfile(template({ appliesTo: "juan_only" }), "juan")).toBe(true);
    expect(isApplicableToProfile(template({ appliesTo: "mariana_only" }), "juan")).toBe(false);
  });
});

describe("passesQuirkFilter", () => {
  it("excludes bread/bun items for Juan unless tagged ham_cheese", () => {
    expect(passesQuirkFilter(template({ tags: ["bread_bun"] }), juanQuirks)).toBe(false);
    expect(passesQuirkFilter(template({ tags: ["bread_bun", "ham_cheese"] }), juanQuirks)).toBe(true);
  });

  it("excludes lettuce-wrap items for Mariana", () => {
    expect(passesQuirkFilter(template({ tags: ["lettuce_wrap"] }), marianaQuirks)).toBe(false);
    expect(passesQuirkFilter(template({ tags: ["bread_bun"] }), marianaQuirks)).toBe(true);
  });
});

const pools: MealTemplate[] = [
  template({ id: "bfast-1", name: "Eggs & Bacon", mealType: "breakfast", baseCalories: 420, baseNetCarbsG: 2 }),
  template({ id: "bfast-2", name: "Keto Pancakes", mealType: "breakfast", baseCalories: 260, baseNetCarbsG: 5, tags: ["pancake"] }),
  template({ id: "lunch-1", name: "Cauliflower Fried Rice", mealType: "lunch", baseCalories: 480, baseNetCarbsG: 9 }),
  template({ id: "lunch-2", name: "Ground Beef Palmini", mealType: "lunch", baseCalories: 420, baseNetCarbsG: 6, tags: ["pasta_alt"] }),
  template({ id: "dinner-1", name: "Burger Lettuce Wrap", mealType: "dinner", appliesTo: "juan_only", baseCalories: 520, baseNetCarbsG: 3, tags: ["lettuce_wrap"] }),
  template({ id: "dinner-2", name: "Ham & Cheese", mealType: "dinner", baseCalories: 380, baseNetCarbsG: 4, tags: ["bread_bun", "ham_cheese"] }),
  template({ id: "dinner-3", name: "Quesadilla", mealType: "dinner", appliesTo: "mariana_only", baseCalories: 380, baseNetCarbsG: 3, tags: ["bread_alt"] }),
  template({ id: "dessert-1", name: "Halo Top", mealType: "dessert", baseCalories: 90, baseNetCarbsG: 3, tags: ["dessert"] }),
];

describe("generateWeeklyMenu", () => {
  it("fills every slot for the requested number of days", () => {
    const plan = generateWeeklyMenu(pools, "juan", juanQuirks, juanTargets, [], { days: 5, rng: () => 0 });
    expect(plan).toHaveLength(5);
    for (const day of plan) {
      expect(day.meals.length).toBeGreaterThan(0);
    }
  });

  it("never gives Juan a bun-based dinner other than the ham & cheese exception", () => {
    const plan = generateWeeklyMenu(pools, "juan", juanQuirks, juanTargets, [], { days: 7, rng: () => Math.random() });
    for (const day of plan) {
      const dinner = day.meals.find((m) => m.mealType === "dinner");
      if (dinner?.template.tags.includes("bread_bun")) {
        expect(dinner.template.tags).toContain("ham_cheese");
      }
    }
  });

  it("never assigns Mariana the lettuce-wrap-only, juan_only dinner", () => {
    const plan = generateWeeklyMenu(pools, "mariana", marianaQuirks, marianaTargets, [], {
      days: 7,
      rng: () => Math.random(),
    });
    for (const day of plan) {
      const dinner = day.meals.find((m) => m.mealType === "dinner");
      expect(dinner?.template.id).not.toBe("dinner-1");
    }
  });

  it("avoids repeating the same breakfast on consecutive days when an alternative exists", () => {
    const plan = generateWeeklyMenu(pools, "juan", juanQuirks, juanTargets, [], {
      days: 4,
      noRepeatWithinDays: 1,
      rng: () => 0,
    });
    const breakfasts = plan.map((d) => d.meals.find((m) => m.mealType === "breakfast")?.template.id);
    for (let i = 1; i < breakfasts.length; i++) {
      expect(breakfasts[i]).not.toBe(breakfasts[i - 1]);
    }
  });

  it("is deterministic given a fixed rng", () => {
    const planA = generateWeeklyMenu(pools, "juan", juanQuirks, juanTargets, [], { days: 3, rng: () => 0.99 });
    const planB = generateWeeklyMenu(pools, "juan", juanQuirks, juanTargets, [], { days: 3, rng: () => 0.99 });
    expect(planA).toEqual(planB);
  });
});
