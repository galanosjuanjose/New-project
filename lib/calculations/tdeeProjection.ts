import type { WeightEntry } from "@/lib/types/domain";

/** Standard rule-of-thumb: ~3500 kcal deficit per pound of fat loss. */
export const KCAL_PER_LB = 3500;

export function projectedWeeklyLossLb(tdeeKcal: number, calorieTarget: number): number {
  return ((tdeeKcal - calorieTarget) * 7) / KCAL_PER_LB;
}

export function projectedMonthlyLossLb(tdeeKcal: number, calorieTarget: number): number {
  return ((tdeeKcal - calorieTarget) * 30) / KCAL_PER_LB;
}

export interface MovingAveragePoint {
  date: string;
  avg: number;
}

/** Simple trailing moving average over a chronologically-sorted weight history. */
export function movingAverage(weights: WeightEntry[], windowDays: number): MovingAveragePoint[] {
  if (weights.length === 0 || windowDays <= 0) return [];
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((entry, i) => {
    const windowStart = Math.max(0, i - windowDays + 1);
    const window = sorted.slice(windowStart, i + 1);
    const avg = window.reduce((sum, w) => sum + w.weightLb, 0) / window.length;
    return { date: entry.date, avg };
  });
}

export interface RegressionTrend {
  slopePerDay: number;
  slopePerWeek: number;
  intercept: number;
}

/** Least-squares linear regression of weight over elapsed days. Needs >= 2 distinct
 * dates; returns null when there isn't enough data to fit a trend. */
export function linearRegressionTrend(weights: WeightEntry[]): RegressionTrend | null {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const uniqueDates = new Set(sorted.map((w) => w.date));
  if (uniqueDates.size < 2) return null;

  const baseTime = new Date(sorted[0].date).getTime();
  const points = sorted.map((w) => ({
    x: (new Date(w.date).getTime() - baseTime) / (1000 * 60 * 60 * 24),
    y: w.weightLb,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slopePerDay = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slopePerDay * sumX) / n;

  return { slopePerDay, slopePerWeek: slopePerDay * 7, intercept };
}

export interface ProjectedVsActual {
  deltaLb: number;
  interpretation: string;
}

export function compareProjectedVsActual(
  projectedWeeklyLoss: number,
  actualWeeklySlopeLb: number
): ProjectedVsActual {
  // actualWeeklySlopeLb is positive when weight is rising, so flip sign to get loss.
  const actualWeeklyLoss = -actualWeeklySlopeLb;
  const deltaLb = actualWeeklyLoss - projectedWeeklyLoss;

  let interpretation: string;
  if (Math.abs(deltaLb) < 0.25) {
    interpretation = "Right on pace with the projection.";
  } else if (deltaLb > 0) {
    interpretation = "Losing faster than the calorie-deficit estimate projected.";
  } else {
    interpretation = "Losing slower than projected — logged intake or activity may not tell the full story.";
  }

  return { deltaLb, interpretation };
}
