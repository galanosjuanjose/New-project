"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeWeightLogs } from "@/hooks/useRealtimeFoodLogs";
import { movingAverage } from "@/lib/calculations/tdeeProjection";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WeightChart } from "@/components/weight/WeightChart";
import { ProjectionCard } from "@/components/weight/ProjectionCard";
import type { ProfileRow, WeightLogRow } from "@/lib/supabase/database.types";

export function WeightView({
  viewingProfile,
  isSelf,
  initialWeightLogs,
}: {
  viewingProfile: ProfileRow;
  isSelf: boolean;
  initialWeightLogs: WeightLogRow[];
}) {
  const [logs, setLogs] = useState(initialWeightLogs);
  const [weightInput, setWeightInput] = useState(viewingProfile.weight_lb?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("profile_id", viewingProfile.id)
      .order("logged_at", { ascending: true });
    setLogs(data ?? []);
  }, [viewingProfile.id]);

  useRealtimeWeightLogs([viewingProfile.id], refetch);

  async function handleLogToday() {
    const weightLb = Number(weightInput);
    if (!weightLb) return;
    setSaving(true);
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("weight_logs")
      .upsert({ profile_id: viewingProfile.id, weight_lb: weightLb, logged_at: today }, { onConflict: "profile_id,logged_at" });
    setSaving(false);
    refetch();
  }

  const weightHistory = useMemo(
    () => logs.map((l) => ({ date: l.logged_at, weightLb: l.weight_lb })),
    [logs]
  );

  const chartData = useMemo(() => {
    const avgs = movingAverage(weightHistory, 7);
    return weightHistory.map((w, i) => ({ date: w.date.slice(5), weightLb: w.weightLb, avg: Number(avgs[i].avg.toFixed(1)) }));
  }, [weightHistory]);

  return (
    <div className="flex flex-col gap-4">
      {!isSelf && (
        <Card className="bg-salvia/30 text-sm">Viewing {viewingProfile.display_name}&apos;s weight (read-only).</Card>
      )}

      {isSelf && (
        <Card className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Today's weight (lb)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-full rounded-lg border border-salvia bg-cream px-3 py-3 text-sm"
          />
          <Button onClick={handleLogToday} disabled={saving}>
            {saving ? "Saving..." : "Log today"}
          </Button>
        </Card>
      )}

      {logs.length > 0 ? (
        <Card>
          <WeightChart data={chartData} />
        </Card>
      ) : (
        <Card className="text-sm text-cafe">No weight logged yet.</Card>
      )}

      <ProjectionCard
        tdeeKcal={viewingProfile.tdee_kcal}
        calorieTarget={viewingProfile.calorie_target}
        weightHistory={weightHistory}
      />
    </div>
  );
}
