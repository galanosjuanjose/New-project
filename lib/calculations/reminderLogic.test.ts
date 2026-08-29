import { describe, expect, it } from "vitest";
import { hoursSinceLastLog, isWithinWakingHours, shouldShowSnackReminder } from "./reminderLogic";
import type { ProfileTargets } from "@/lib/types/domain";

const juan: ProfileTargets = { calorieTarget: 2000, netCarbTargetLow: 20, netCarbTargetHigh: 30 };

describe("hoursSinceLastLog", () => {
  it("computes elapsed hours", () => {
    const last = new Date("2026-08-29T12:00:00Z");
    const now = new Date("2026-08-29T16:00:00Z");
    expect(hoursSinceLastLog(last, now)).toBe(4);
  });
});

describe("isWithinWakingHours", () => {
  it("is true during the day", () => {
    expect(isWithinWakingHours(14)).toBe(true);
  });

  it("is false late at night or early morning", () => {
    expect(isWithinWakingHours(6)).toBe(false);
    expect(isWithinWakingHours(22)).toBe(false);
  });
});

describe("shouldShowSnackReminder", () => {
  it("reminds when the gap is long, under budget, and within waking hours", () => {
    expect(
      shouldShowSnackReminder(4, { caloriesConsumed: 1000, netCarbsConsumed: 5 }, juan, 15)
    ).toBe(true);
  });

  it("does not remind before the gap threshold", () => {
    expect(
      shouldShowSnackReminder(2, { caloriesConsumed: 1000, netCarbsConsumed: 5 }, juan, 15)
    ).toBe(false);
  });

  it("does not remind outside waking hours", () => {
    expect(
      shouldShowSnackReminder(5, { caloriesConsumed: 1000, netCarbsConsumed: 5 }, juan, 23)
    ).toBe(false);
  });

  it("does not remind once at the net carb ceiling", () => {
    expect(
      shouldShowSnackReminder(5, { caloriesConsumed: 1000, netCarbsConsumed: 30 }, juan, 15)
    ).toBe(false);
  });

  it("does not remind once near the calorie target", () => {
    expect(
      shouldShowSnackReminder(5, { caloriesConsumed: 1900, netCarbsConsumed: 5 }, juan, 15)
    ).toBe(false);
  });
});
