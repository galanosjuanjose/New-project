import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Subscribes to Postgres Changes for `table` scoped to a set of profile ids (a
 * household), plus a focus/visibility refetch fallback for missed/dropped events. */
function useRealtimeByProfile(table: "food_logs" | "weight_logs", profileIds: string[], onChange: () => void) {
  useEffect(() => {
    if (profileIds.length === 0) return;
    const supabase = createClient();

    const channels = profileIds.map((profileId) =>
      supabase
        .channel(`${table}:${profileId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `profile_id=eq.${profileId}` },
          onChange
        )
        .subscribe()
    );

    function handleRefetch() {
      if (document.visibilityState === "visible") onChange();
    }
    window.addEventListener("focus", handleRefetch);
    document.addEventListener("visibilitychange", handleRefetch);

    return () => {
      for (const channel of channels) supabase.removeChannel(channel);
      window.removeEventListener("focus", handleRefetch);
      document.removeEventListener("visibilitychange", handleRefetch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, profileIds.join(","), onChange]);
}

export function useRealtimeFoodLogs(profileIds: string[], onChange: () => void) {
  useRealtimeByProfile("food_logs", profileIds, onChange);
}

export function useRealtimeWeightLogs(profileIds: string[], onChange: () => void) {
  useRealtimeByProfile("weight_logs", profileIds, onChange);
}
