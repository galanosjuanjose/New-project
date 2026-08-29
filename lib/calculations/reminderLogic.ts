import type { DailyTotals, RemainingBudget } from "./dailyBudget";
import { computeRemaining } from "./dailyBudget";
import type { ProfileTargets } from "@/lib/types/domain";

export const SNACK_GAP_HOURS = 3.5;
export const WAKING_HOURS_START = 8;
export const WAKING_HOURS_END = 21;

export function hoursSinceLastLog(lastLoggedAt: Date, now: Date): number {
  return (now.getTime() - lastLoggedAt.getTime()) / (1000 * 60 * 60);
}

export function isWithinWakingHours(hour: number): boolean {
  return hour >= WAKING_HOURS_START && hour < WAKING_HOURS_END;
}

export function shouldShowSnackReminder(
  hoursSinceLast: number,
  totals: DailyTotals,
  profile: ProfileTargets,
  currentHour: number
): boolean {
  if (!isWithinWakingHours(currentHour)) return false;
  if (hoursSinceLast < SNACK_GAP_HOURS) return false;

  const remaining: RemainingBudget = computeRemaining(totals, profile);
  return remaining.isUnderBudget && remaining.netCarbRemainingToHigh > 0;
}
