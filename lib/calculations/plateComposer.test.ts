import { describe, expect, it } from "vitest";
import { computePlateNutrition, generatePlate, plateSignature, type PlateFood } from "./plateComposer";

function food(overrides: Partial<PlateFood>): PlateFood {
  return {
    id: "id",
    name: "name",
    tags: [],
    calories: 100,
    totalCarbsG: 5,
    fiberG: 2,
    sugarAlcoholsG: 0,
    ...overrides,
  };
}

describe("computePlateNutrition", () => {
  it("sums quantity-scaled macros across ingredients", () => {
    const chicken = food({ id: "chicken", calories: 200, totalCarbsG: 0, fiberG: 0 });
    const broccoli = food({ id: "broccoli", calories: 55, totalCarbsG: 11, fiberG: 5 });
    const totals = computePlateNutrition([
      { food: chicken, quantity: 1.5 },
      { food: broccoli, quantity: 1 },
    ]);
    expect(totals.totalCalories).toBe(200 * 1.5 + 55);
    expect(totals.totalCarbsG).toBe(11);
    expect(totals.totalFiberG).toBe(5);
    expect(totals.totalNetCarbsG).toBe(6);
  });

  it("returns zeroed totals for an empty ingredient list", () => {
    const totals = computePlateNutrition([]);
    expect(totals.totalCalories).toBe(0);
    expect(totals.totalNetCarbsG).toBe(0);
  });
});

const proteins: PlateFood[] = [
  food({ id: "chicken-breast", name: "Chicken breast", calories: 187 }),
  food({ id: "ground-beef", name: "Ground beef", calories: 290 }),
];
const veggies: PlateFood[] = [
  food({ id: "asparagus", name: "Asparagus", calories: 40 }),
  food({ id: "carrots", name: "Carrots", calories: 55 }),
  food({ id: "bell-pepper", name: "Bell pepper", calories: 30, tags: ["stuffable"] }),
];
const seasonings: PlateFood[] = [
  food({ id: "garlic", name: "Garlic", calories: 4 }),
  food({ id: "black-pepper", name: "Black pepper", calories: 6 }),
];
const breading: PlateFood[] = [food({ id: "pork-rinds", name: "pork rinds", calories: 160, tags: ["breading"] })];

describe("generatePlate", () => {
  it("returns null when there are no proteins or no vegetables", () => {
    expect(generatePlate([], veggies, seasonings, breading)).toBeNull();
    expect(generatePlate(proteins, [], seasonings, breading)).toBeNull();
  });

  it("generates a plate with a protein and at least one vegetable", () => {
    const plate = generatePlate(proteins, veggies, seasonings, breading, { rng: () => 0 });
    expect(plate).not.toBeNull();
    expect(plate!.ingredients.length).toBeGreaterThan(1);
    expect(proteins.some((p) => p.id === plate!.ingredients[0].food.id)).toBe(true);
  });

  it("scales the protein quantity by portionScale but not the vegetables", () => {
    const plate = generatePlate(proteins, veggies, [], [], { rng: () => 0, portionScale: 0.6 });
    const proteinIngredient = plate!.ingredients.find((i) => proteins.some((p) => p.id === i.food.id));
    const vegIngredient = plate!.ingredients.find((i) => veggies.some((v) => v.id === i.food.id));
    expect(proteinIngredient!.quantity).toBe(0.6);
    expect(vegIngredient!.quantity).toBe(1);
  });

  it("computes totals matching computePlateNutrition over its own ingredients", () => {
    const plate = generatePlate(proteins, veggies, seasonings, breading, { rng: () => 0.5 })!;
    const totals = computePlateNutrition(plate.ingredients);
    expect(plate.totalCalories).toBe(totals.totalCalories);
    expect(plate.totalNetCarbsG).toBe(totals.totalNetCarbsG);
  });

  it("avoids repeating an excluded signature when an alternative exists", () => {
    const first = generatePlate(proteins, veggies, seasonings, breading, { rng: () => 0 })!;
    const firstSignature = plateSignature(
      first.cookingMethod,
      first.ingredients[0].food,
      first.ingredients.slice(1).filter((i) => veggies.some((v) => v.id === i.food.id)).map((i) => i.food)
    );
    const second = generatePlate(proteins, veggies, seasonings, breading, {
      rng: () => 0.9,
      excludeSignatures: new Set([firstSignature]),
    })!;
    const secondSignature = plateSignature(
      second.cookingMethod,
      second.ingredients[0].food,
      second.ingredients.slice(1).filter((i) => veggies.some((v) => v.id === i.food.id)).map((i) => i.food)
    );
    expect(secondSignature).not.toBe(firstSignature);
  });

  it("only picks the stuffed method when a stuffable vegetable is available", () => {
    const noStuffable = veggies.filter((v) => !v.tags.includes("stuffable"));
    for (let i = 0; i < 10; i++) {
      const plate = generatePlate(proteins, noStuffable, seasonings, breading, { rng: () => i / 10 });
      expect(plate?.cookingMethod).not.toBe("stuffed");
    }
  });

  it("only picks the breaded method when a breading ingredient is available", () => {
    for (let i = 0; i < 10; i++) {
      const plate = generatePlate(proteins, veggies, seasonings, [], { rng: () => i / 10 });
      expect(plate?.cookingMethod).not.toBe("breaded");
    }
  });
});
