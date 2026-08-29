/** Per-serving net-carb ceiling used for the "is this keto?" heuristic. Mirrors the
 * `is_keto_friendly` generated column in supabase/migrations/0001_init.sql — keep in sync. */
export const KETO_NET_CARB_THRESHOLD_G = 10;

export function computeNetCarbs(
  totalCarbsG: number,
  fiberG: number,
  sugarAlcoholsG: number
): number {
  return Math.max(totalCarbsG - fiberG - sugarAlcoholsG, 0);
}

export function isKetoFriendly(
  netCarbsG: number,
  threshold: number = KETO_NET_CARB_THRESHOLD_G
): boolean {
  return netCarbsG <= threshold;
}

export type KetoVerdictTier = "great" | "ok" | "over";

export interface KetoVerdict {
  verdict: KetoVerdictTier;
  message: string;
}

export function ketoVerdict(netCarbsG: number): KetoVerdict {
  if (netCarbsG <= 5) {
    return { verdict: "great", message: "Great fit — low net carbs for a single serving." };
  }
  if (netCarbsG <= KETO_NET_CARB_THRESHOLD_G) {
    return { verdict: "ok", message: "Fits in moderation — keep an eye on your remaining daily budget." };
  }
  return { verdict: "over", message: "Likely to blow a meaningful chunk of your daily net-carb budget." };
}
