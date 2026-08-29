import { Card } from "@/components/ui/Card";
import {
  compareProjectedVsActual,
  linearRegressionTrend,
  projectedMonthlyLossLb,
  projectedWeeklyLossLb,
} from "@/lib/calculations/tdeeProjection";
import type { WeightEntry } from "@/lib/types/domain";

export function ProjectionCard({
  tdeeKcal,
  calorieTarget,
  weightHistory,
}: {
  tdeeKcal: number | null;
  calorieTarget: number | null;
  weightHistory: WeightEntry[];
}) {
  if (!tdeeKcal || !calorieTarget) {
    return <Card className="text-sm text-cafe">Set your TDEE and calorie target in Profile to see a projection.</Card>;
  }

  const weeklyProjected = projectedWeeklyLossLb(tdeeKcal, calorieTarget);
  const monthlyProjected = projectedMonthlyLossLb(tdeeKcal, calorieTarget);
  const trend = linearRegressionTrend(weightHistory);
  const comparison = trend ? compareProjectedVsActual(weeklyProjected, trend.slopePerWeek) : null;

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-sm text-cafe">At your current deficit, projected pace:</p>
      <p className="font-display text-xl text-chocolate">
        ~{weeklyProjected.toFixed(1)} lb/week ({monthlyProjected.toFixed(1)} lb/month)
      </p>
      {trend ? (
        <>
          <p className="text-sm text-cafe">
            Your logged trend: {trend.slopePerWeek <= 0 ? "-" : "+"}
            {Math.abs(trend.slopePerWeek).toFixed(1)} lb/week
          </p>
          {comparison && <p className="text-sm text-chocolate">{comparison.interpretation}</p>}
        </>
      ) : (
        <p className="text-sm text-cafe">Log weight on a few different days to see your actual trend.</p>
      )}
    </Card>
  );
}
