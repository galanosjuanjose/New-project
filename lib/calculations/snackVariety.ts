import type { FoodLogEntry, SnackSuggestion } from "@/lib/types/domain";

export const REPEAT_WINDOW_DAYS = 7;
export const REPEAT_THRESHOLD = 3;

export interface RepeatedSnack {
  key: string;
  count: number;
}

function snackKey(log: FoodLogEntry): string {
  return log.foodId ?? log.customName ?? "unknown";
}

/** Flags a snack that's shown up REPEAT_THRESHOLD+ times in the trailing window —
 * the couple's near-daily Atkins-bar habit is exactly the case this catches. */
export function detectRepeatedSnack(
  logs: FoodLogEntry[],
  now: Date,
  windowDays: number = REPEAT_WINDOW_DAYS,
  repeatThreshold: number = REPEAT_THRESHOLD
): RepeatedSnack | null {
  const windowStart = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const snackLogs = logs.filter(
    (l) => l.mealType === "snack" && new Date(l.loggedAt).getTime() >= windowStart
  );

  const counts = new Map<string, number>();
  for (const log of snackLogs) {
    const key = snackKey(log);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let repeated: RepeatedSnack | null = null;
  for (const [key, count] of counts) {
    if (count >= repeatThreshold && (repeated === null || count > repeated.count)) {
      repeated = { key, count };
    }
  }
  return repeated;
}

export interface RemainingBudget {
  calories: number;
  netCarbsG: number;
}

/** Suggests alternatives with a different style than the repeated snack, that still
 * fit under what's left of today's budget. Returns up to `limit` options. */
export function suggestAlternatives(
  repeated: RepeatedSnack,
  suggestions: SnackSuggestion[],
  repeatedStyleTags: string[],
  remainingBudget: RemainingBudget,
  limit: number = 3
): SnackSuggestion[] {
  return suggestions
    .filter((s) => !s.styleTags.some((tag) => repeatedStyleTags.includes(tag)))
    .filter((s) => s.calories <= remainingBudget.calories && s.netCarbsG <= remainingBudget.netCarbsG)
    .slice(0, limit);
}
