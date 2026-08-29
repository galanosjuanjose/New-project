import { describe, expect, it } from "vitest";
import { detectRepeatedSnack, suggestAlternatives } from "./snackVariety";
import type { FoodLogEntry, SnackSuggestion } from "@/lib/types/domain";

const now = new Date("2026-08-29T18:00:00Z");

function snackLog(overrides: Partial<FoodLogEntry>): FoodLogEntry {
  return {
    id: "log",
    profileId: "juan",
    foodId: "atkins-strawberry",
    customName: null,
    mealType: "snack",
    calories: 90,
    netCarbsG: 1,
    loggedAt: now.toISOString(),
    ...overrides,
  };
}

describe("detectRepeatedSnack", () => {
  it("flags a snack logged 3+ times within the window", () => {
    const logs = [
      snackLog({ loggedAt: "2026-08-27T12:00:00Z" }),
      snackLog({ loggedAt: "2026-08-28T12:00:00Z" }),
      snackLog({ loggedAt: "2026-08-29T12:00:00Z" }),
    ];
    const result = detectRepeatedSnack(logs, now);
    expect(result).not.toBeNull();
    expect(result?.key).toBe("atkins-strawberry");
    expect(result?.count).toBe(3);
  });

  it("does not flag when under the threshold", () => {
    const logs = [
      snackLog({ loggedAt: "2026-08-28T12:00:00Z" }),
      snackLog({ loggedAt: "2026-08-29T12:00:00Z" }),
    ];
    expect(detectRepeatedSnack(logs, now)).toBeNull();
  });

  it("ignores logs outside the trailing window", () => {
    const logs = [
      snackLog({ loggedAt: "2026-08-01T12:00:00Z" }),
      snackLog({ loggedAt: "2026-08-02T12:00:00Z" }),
      snackLog({ loggedAt: "2026-08-03T12:00:00Z" }),
    ];
    expect(detectRepeatedSnack(logs, now)).toBeNull();
  });

  it("ignores non-snack meal types", () => {
    const logs = [
      snackLog({ mealType: "breakfast", loggedAt: "2026-08-27T12:00:00Z" }),
      snackLog({ mealType: "breakfast", loggedAt: "2026-08-28T12:00:00Z" }),
      snackLog({ mealType: "breakfast", loggedAt: "2026-08-29T12:00:00Z" }),
    ];
    expect(detectRepeatedSnack(logs, now)).toBeNull();
  });
});

describe("suggestAlternatives", () => {
  const suggestions: SnackSuggestion[] = [
    { id: "1", name: "Atkins Bar", calories: 90, netCarbsG: 1, styleTags: ["bar"] },
    { id: "2", name: "Macadamia Nuts", calories: 200, netCarbsG: 2, styleTags: ["nut"] },
    { id: "3", name: "Pork Rinds", calories: 160, netCarbsG: 0, styleTags: ["savory"] },
    { id: "4", name: "Big Cheese Board", calories: 500, netCarbsG: 3, styleTags: ["cheese"] },
  ];

  it("excludes the repeated style and filters by remaining budget", () => {
    const result = suggestAlternatives(
      { key: "atkins-strawberry", count: 3 },
      suggestions,
      ["bar"],
      { calories: 250, netCarbsG: 5 }
    );
    expect(result.map((r) => r.id)).toEqual(["2", "3"]);
  });

  it("respects the limit", () => {
    const result = suggestAlternatives(
      { key: "x", count: 3 },
      suggestions,
      [],
      { calories: 1000, netCarbsG: 10 },
      2
    );
    expect(result).toHaveLength(2);
  });
});
