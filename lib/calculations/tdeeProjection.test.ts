import { describe, expect, it } from "vitest";
import {
  compareProjectedVsActual,
  linearRegressionTrend,
  movingAverage,
  projectedMonthlyLossLb,
  projectedWeeklyLossLb,
} from "./tdeeProjection";

describe("projectedWeeklyLossLb / projectedMonthlyLossLb", () => {
  it("matches Juan's numbers: 2450 TDEE, 2000 target -> 0.9 lb/week", () => {
    expect(projectedWeeklyLossLb(2450, 2000)).toBeCloseTo(0.9, 5);
  });

  it("matches Mariana's numbers: 1650 TDEE, 1400 target -> 0.5 lb/week", () => {
    expect(projectedWeeklyLossLb(1650, 1400)).toBeCloseTo(0.5, 5);
  });

  it("scales monthly loss from the same deficit", () => {
    expect(projectedMonthlyLossLb(2450, 2000)).toBeCloseTo((450 * 30) / 3500, 5);
  });

  it("returns zero loss at maintenance", () => {
    expect(projectedWeeklyLossLb(2000, 2000)).toBe(0);
  });
});

describe("movingAverage", () => {
  it("averages over the trailing window", () => {
    const weights = [
      { date: "2026-01-01", weightLb: 190 },
      { date: "2026-01-02", weightLb: 189 },
      { date: "2026-01-03", weightLb: 188 },
    ];
    const result = movingAverage(weights, 2);
    expect(result[0].avg).toBe(190);
    expect(result[1].avg).toBe(189.5);
    expect(result[2].avg).toBe(188.5);
  });

  it("returns an empty array for no data", () => {
    expect(movingAverage([], 7)).toEqual([]);
  });
});

describe("linearRegressionTrend", () => {
  it("returns null with fewer than two distinct dates", () => {
    expect(linearRegressionTrend([{ date: "2026-01-01", weightLb: 190 }])).toBeNull();
    expect(
      linearRegressionTrend([
        { date: "2026-01-01", weightLb: 190 },
        { date: "2026-01-01", weightLb: 190.5 },
      ])
    ).toBeNull();
  });

  it("fits a straight-line loss trend", () => {
    const weights = [
      { date: "2026-01-01", weightLb: 190 },
      { date: "2026-01-08", weightLb: 189 },
      { date: "2026-01-15", weightLb: 188 },
    ];
    const trend = linearRegressionTrend(weights)!;
    expect(trend.slopePerDay).toBeCloseTo(-1 / 7, 5);
    expect(trend.slopePerWeek).toBeCloseTo(-1, 5);
  });
});

describe("compareProjectedVsActual", () => {
  it("flags on-pace when within tolerance", () => {
    expect(compareProjectedVsActual(0.9, -0.9).interpretation).toMatch(/on pace/i);
  });

  it("flags faster-than-projected loss", () => {
    const result = compareProjectedVsActual(0.9, -1.5);
    expect(result.deltaLb).toBeGreaterThan(0);
    expect(result.interpretation).toMatch(/faster/i);
  });

  it("flags slower-than-projected loss", () => {
    const result = compareProjectedVsActual(0.9, -0.2);
    expect(result.deltaLb).toBeLessThan(0);
    expect(result.interpretation).toMatch(/slower/i);
  });
});
