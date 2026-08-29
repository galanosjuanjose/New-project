import { describe, expect, it } from "vitest";
import { suggestUsage } from "./ingredientFit";
import type { MealTemplate } from "@/lib/types/domain";

const templates: MealTemplate[] = [
  {
    id: "pancakes",
    name: "Birch Benders Keto Pancakes",
    mealType: "breakfast",
    appliesTo: "both",
    baseCalories: 260,
    baseNetCarbsG: 5,
    tags: ["pancake"],
  },
  {
    id: "palmini",
    name: "Ground Beef & Palmini Pasta",
    mealType: "lunch",
    appliesTo: "both",
    baseCalories: 420,
    baseNetCarbsG: 6,
    tags: ["pasta_alt"],
  },
  {
    id: "quesadilla",
    name: "Mission Zero Quesadilla",
    mealType: "dinner",
    appliesTo: "mariana_only",
    baseCalories: 380,
    baseNetCarbsG: 3,
    tags: ["bread_alt"],
  },
];

describe("suggestUsage", () => {
  it("suggests a pancake slot for a new keto flour", () => {
    const result = suggestUsage({ name: "Wheat-free keto flour blend", tags: ["flour"] }, templates);
    expect(result.map((r) => r.template.id)).toEqual(["pancakes"]);
    expect(result[0].suggestion).toMatch(/Birch Benders Keto Pancakes/);
  });

  it("suggests a pasta slot for a new pasta alternative", () => {
    const result = suggestUsage({ name: "Shirataki noodles", tags: ["pasta_alt"] }, templates);
    expect(result.map((r) => r.template.id)).toEqual(["palmini"]);
  });

  it("suggests bread/tortilla slots for a new bread alternative", () => {
    const result = suggestUsage({ name: "Carbquik tortillas", tags: ["bread_alt"] }, templates);
    expect(result.map((r) => r.template.id)).toEqual(["quesadilla"]);
  });

  it("respects a profile filter", () => {
    const result = suggestUsage(
      { name: "Carbquik tortillas", tags: ["bread_alt"] },
      templates,
      "juan"
    );
    expect(result).toEqual([]);
  });

  it("returns no suggestions for an untagged/unrelated ingredient", () => {
    expect(suggestUsage({ name: "Mystery snack", tags: ["cheese"] }, templates)).toEqual([]);
  });
});
