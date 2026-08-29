"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeFoodLogs } from "@/hooks/useRealtimeFoodLogs";
import { useSnackReminder } from "@/hooks/useSnackReminder";
import { computeRemaining, shouldNudgeSnack } from "@/lib/calculations/dailyBudget";
import { detectRepeatedSnack, suggestAlternatives } from "@/lib/calculations/snackVariety";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogItemSheet } from "@/components/today/LogItemSheet";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import type { FoodLogRow, FoodRow, ProfileRow, SnackSuggestionRow } from "@/lib/supabase/database.types";
import type { FoodLogEntry } from "@/lib/types/domain";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function sevenDaysAgoIso() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function toFoodLogEntry(row: FoodLogRow): FoodLogEntry {
  return {
    id: row.id,
    profileId: row.profile_id,
    foodId: row.food_id,
    customName: row.custom_name,
    mealType: row.meal_type,
    calories: row.calories,
    netCarbsG: row.net_carbs_g,
    loggedAt: row.logged_at,
  };
}

export function TodayView({
  viewingProfile,
  isSelf,
  initialLogs,
  foods,
  recentSnackLogs,
  snackSuggestions,
}: {
  viewingProfile: ProfileRow;
  isSelf: boolean;
  initialLogs: FoodLogRow[];
  foods: FoodRow[];
  recentSnackLogs: FoodLogRow[];
  snackSuggestions: SnackSuggestionRow[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [recentSnacks, setRecentSnacks] = useState(recentSnackLogs);
  const [sheetOpen, setSheetOpen] = useState(false);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [{ data: todayLogs }, { data: snackLogs }] = await Promise.all([
      supabase
        .from("food_logs")
        .select("*")
        .eq("profile_id", viewingProfile.id)
        .gte("logged_at", startOfTodayIso())
        .order("logged_at", { ascending: false }),
      supabase
        .from("food_logs")
        .select("*")
        .eq("profile_id", viewingProfile.id)
        .eq("meal_type", "snack")
        .gte("logged_at", sevenDaysAgoIso()),
    ]);
    setLogs(todayLogs ?? []);
    setRecentSnacks(snackLogs ?? []);
  }, [viewingProfile.id]);

  useRealtimeFoodLogs([viewingProfile.id], refetch);

  const totals = useMemo(
    () => ({
      caloriesConsumed: logs.reduce((sum, l) => sum + l.calories, 0),
      netCarbsConsumed: logs.reduce((sum, l) => sum + l.net_carbs_g, 0),
    }),
    [logs]
  );

  const targets = {
    calorieTarget: viewingProfile.calorie_target ?? 0,
    netCarbTargetLow: viewingProfile.net_carb_target_low ?? 0,
    netCarbTargetHigh: viewingProfile.net_carb_target_high ?? 0,
  };

  const remaining = computeRemaining(totals, targets);
  const nudge = isSelf && shouldNudgeSnack(totals, targets, new Date().getHours());
  const netCarbColor = totals.netCarbsConsumed > targets.netCarbTargetHigh ? "var(--color-terracota)" : "var(--color-salvia)";

  const lastLoggedAtMs = logs.length > 0 ? new Date(logs[0].logged_at).getTime() : null;
  useSnackReminder(
    isSelf ? lastLoggedAtMs : null,
    totals.caloriesConsumed,
    totals.netCarbsConsumed,
    targets.calorieTarget,
    targets.netCarbTargetLow,
    targets.netCarbTargetHigh
  );

  const repeated = useMemo(
    () => detectRepeatedSnack(recentSnacks.map(toFoodLogEntry), new Date()),
    [recentSnacks]
  );
  const repeatedFood = repeated ? foods.find((f) => f.id === repeated.key) : undefined;
  const alternatives = useMemo(() => {
    if (!repeated) return [];
    return suggestAlternatives(
      repeated,
      snackSuggestions.map((s) => ({ id: s.id, name: s.name, calories: s.calories, netCarbsG: s.net_carbs_g, styleTags: s.style_tags })),
      repeatedFood?.tags ?? [],
      { calories: Math.max(remaining.calorieRemaining, 0), netCarbsG: Math.max(remaining.netCarbRemainingToHigh, 0) }
    );
  }, [repeated, repeatedFood, snackSuggestions, remaining]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      {!isSelf && (
        <Card className="bg-salvia/30 text-sm">Viewing {viewingProfile.display_name}&apos;s day (read-only).</Card>
      )}

      <Card className="flex justify-center gap-8">
        <ProgressRing
          value={totals.caloriesConsumed}
          max={targets.calorieTarget}
          color="var(--color-oliva)"
          label={`${Math.round(totals.caloriesConsumed)}`}
          sublabel={`of ${targets.calorieTarget} cal`}
        />
        <ProgressRing
          value={totals.netCarbsConsumed}
          max={targets.netCarbTargetHigh}
          color={netCarbColor}
          label={`${totals.netCarbsConsumed.toFixed(1)}g`}
          sublabel={`of ${targets.netCarbTargetHigh}g net carbs`}
        />
      </Card>

      <div className="flex justify-between text-sm text-cafe">
        <span>{Math.max(remaining.calorieRemaining, 0).toFixed(0)} cal remaining</span>
        <span>{Math.max(remaining.netCarbRemainingToHigh, 0).toFixed(1)}g net carbs remaining</span>
      </div>

      {nudge && (
        <Card className="bg-salvia/25 text-sm text-cafe">
          You&apos;re well under budget today — might be a good time for a snack.
        </Card>
      )}

      {isSelf && repeated && alternatives.length > 0 && (
        <Card className="flex flex-col gap-1 bg-salvia/20 text-sm">
          <p className="text-cafe">
            You&apos;ve had {repeatedFood?.name ?? "that snack"} {repeated.count}x this week — try something
            different:
          </p>
          <ul>
            {alternatives.map((alt) => (
              <li key={alt.id} className="text-chocolate">
                • {alt.name} ({alt.calories} cal, {alt.netCarbsG}g net carbs)
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isSelf && (
        <div className="flex items-center justify-between">
          <Button onClick={() => setSheetOpen(true)}>+ Log item</Button>
          <NotificationPermissionPrompt />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {logs.length === 0 && <p className="text-sm text-cafe">Nothing logged yet today.</p>}
        {logs.map((log) => (
          <Card key={log.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-chocolate">{log.custom_name ?? "Item"}</p>
              <p className="text-xs text-cafe capitalize">{log.meal_type}</p>
            </div>
            <div className="text-right text-sm text-cafe">
              <p>{log.calories} cal</p>
              <p>{log.net_carbs_g}g net carbs</p>
            </div>
          </Card>
        ))}
      </div>

      {sheetOpen && (
        <LogItemSheet
          profileId={viewingProfile.id}
          foods={foods}
          onClose={() => setSheetOpen(false)}
          onLogged={() => {
            setSheetOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
