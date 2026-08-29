import type { ProfileTargets } from "@/lib/types/domain";

export interface DailyTotals {
  caloriesConsumed: number;
  netCarbsConsumed: number;
}

export interface RemainingBudget {
  calorieRemaining: number;
  netCarbRemainingToLow: number;
  netCarbRemainingToHigh: number;
  isUnderBudget: boolean;
}

/** How far under the calorie target counts as "worth nudging" — matches the couple's
 * observed pattern of landing 400-1000+ calories under target most days. */
export const UNDER_BUDGET_CALORIE_THRESHOLD = 300;

export function computeRemaining(totals: DailyTotals, profile: ProfileTargets): RemainingBudget {
  const calorieRemaining = profile.calorieTarget - totals.caloriesConsumed;
  return {
    calorieRemaining,
    netCarbRemainingToLow: profile.netCarbTargetLow - totals.netCarbsConsumed,
    netCarbRemainingToHigh: profile.netCarbTargetHigh - totals.netCarbsConsumed,
    isUnderBudget: calorieRemaining > UNDER_BUDGET_CALORIE_THRESHOLD,
  };
}

/** Hour of day (24h, local time) after which it's worth flagging an under-budget day. */
export const SNACK_NUDGE_EARLIEST_HOUR = 14;

export function shouldNudgeSnack(
  totals: DailyTotals,
  profile: ProfileTargets,
  currentHour: number
): boolean {
  const { calorieRemaining, netCarbRemainingToHigh } = computeRemaining(totals, profile);
  return (
    currentHour >= SNACK_NUDGE_EARLIEST_HOUR &&
    calorieRemaining > UNDER_BUDGET_CALORIE_THRESHOLD &&
    netCarbRemainingToHigh > 0
  );
}
