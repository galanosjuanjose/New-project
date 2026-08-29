import { describe, expect, it } from "vitest";
import { computeRemaining, shouldNudgeSnack } from "./dailyBudget";
import type { ProfileTargets } from "@/lib/types/domain";

const juan: ProfileTargets = { calorieTarget: 2000, netCarbTargetLow: 20, netCarbTargetHigh: 30 };

describe("computeRemaining", () => {
  it("computes remaining calories and net carb headroom", () => {
    const result = computeRemaining({ caloriesConsumed: 1200, netCarbsConsumed: 8 }, juan);
    expect(result.calorieRemaining).toBe(800);
    expect(result.netCarbRemainingToLow).toBe(12);
    expect(result.netCarbRemainingToHigh).toBe(22);
    expect(result.isUnderBudget).toBe(true);
  });

  it("is not under budget once within the threshold of target", () => {
    const result = computeRemaining({ caloriesConsumed: 1800, netCarbsConsumed: 25 }, juan);
    expect(result.isUnderBudget).toBe(false);
  });
});

describe("shouldNudgeSnack", () => {
  it("nudges in the afternoon when well under budget with carb headroom", () => {
    expect(shouldNudgeSnack({ caloriesConsumed: 1000, netCarbsConsumed: 5 }, juan, 15)).toBe(true);
  });

  it("does not nudge in the morning even if under budget", () => {
    expect(shouldNudgeSnack({ caloriesConsumed: 1000, netCarbsConsumed: 5 }, juan, 9)).toBe(false);
  });

  it("does not nudge once near the calorie target", () => {
    expect(shouldNudgeSnack({ caloriesConsumed: 1900, netCarbsConsumed: 5 }, juan, 15)).toBe(false);
  });

  it("does not nudge once at the net carb ceiling", () => {
    expect(shouldNudgeSnack({ caloriesConsumed: 1000, netCarbsConsumed: 30 }, juan, 15)).toBe(false);
  });
});
