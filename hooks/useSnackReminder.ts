import { useEffect, useRef } from "react";
import { hoursSinceLastLog, shouldShowSnackReminder } from "@/lib/calculations/reminderLogic";
import { showNudge } from "@/lib/notifications/browserNotify";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function useSnackReminder(
  lastLoggedAtMs: number | null,
  caloriesConsumed: number,
  netCarbsConsumed: number,
  calorieTarget: number,
  netCarbTargetLow: number,
  netCarbTargetHigh: number
) {
  const notifiedForRef = useRef<number | null>(null);

  useEffect(() => {
    function check() {
      if (lastLoggedAtMs === null || notifiedForRef.current === lastLoggedAtMs) return;
      const now = new Date();
      const hours = hoursSinceLastLog(new Date(lastLoggedAtMs), now);
      const shouldShow = shouldShowSnackReminder(
        hours,
        { caloriesConsumed, netCarbsConsumed },
        { calorieTarget, netCarbTargetLow, netCarbTargetHigh },
        now.getHours()
      );
      if (shouldShow) {
        showNudge("Snack time?", "You're under budget today and it's been a few hours since your last item.");
        notifiedForRef.current = lastLoggedAtMs;
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [lastLoggedAtMs, caloriesConsumed, netCarbsConsumed, calorieTarget, netCarbTargetLow, netCarbTargetHigh]);
}
