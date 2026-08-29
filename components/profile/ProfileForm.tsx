"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { projectedWeeklyLossLb } from "@/lib/calculations/tdeeProjection";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ActivityLevel, ProfileRow } from "@/lib/supabase/database.types";

const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "active"];

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [heightIn, setHeightIn] = useState(profile.height_in?.toString() ?? "");
  const [weightLb, setWeightLb] = useState(profile.weight_lb?.toString() ?? "");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activity_level);
  const [tdeeKcal, setTdeeKcal] = useState(profile.tdee_kcal?.toString() ?? "");
  const [calorieTarget, setCalorieTarget] = useState(profile.calorie_target?.toString() ?? "");
  const [netCarbLow, setNetCarbLow] = useState(profile.net_carb_target_low?.toString() ?? "");
  const [netCarbHigh, setNetCarbHigh] = useState(profile.net_carb_target_high?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        height_in: Number(heightIn) || null,
        weight_lb: Number(weightLb) || null,
        activity_level: activityLevel,
        tdee_kcal: Number(tdeeKcal) || null,
        calorie_target: Number(calorieTarget) || null,
        net_carb_target_low: Number(netCarbLow) || null,
        net_carb_target_high: Number(netCarbHigh) || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
  }

  const preview =
    tdeeKcal && calorieTarget ? projectedWeeklyLossLb(Number(tdeeKcal), Number(calorieTarget)) : null;

  return (
    <Card className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Display name"
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          setSaved(false);
        }}
        className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm"
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-cafe">
          Height (in)
          <input
            type="number"
            value={heightIn}
            onChange={(e) => {
              setHeightIn(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-cafe">
          Weight (lb)
          <input
            type="number"
            value={weightLb}
            onChange={(e) => {
              setWeightLb(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-cafe">
        Activity level
        <select
          value={activityLevel}
          onChange={(e) => {
            setActivityLevel(e.target.value as ActivityLevel);
            setSaved(false);
          }}
          className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate capitalize"
        >
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-cafe">
        Estimated TDEE (cal/day)
        <input
          type="number"
          value={tdeeKcal}
          onChange={(e) => {
            setTdeeKcal(e.target.value);
            setSaved(false);
          }}
          className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-cafe">
        Daily calorie target
        <input
          type="number"
          value={calorieTarget}
          onChange={(e) => {
            setCalorieTarget(e.target.value);
            setSaved(false);
          }}
          className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-cafe">
          Net carb target (low)
          <input
            type="number"
            value={netCarbLow}
            onChange={(e) => {
              setNetCarbLow(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-cafe">
          Net carb target (high)
          <input
            type="number"
            value={netCarbHigh}
            onChange={(e) => {
              setNetCarbHigh(e.target.value);
              setSaved(false);
            }}
            className="rounded-lg border border-camel bg-cream px-3 py-3 text-sm text-chocolate"
          />
        </label>
      </div>

      {preview !== null && (
        <p className="text-xs text-cafe">Projected pace at these numbers: ~{preview.toFixed(1)} lb/week</p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saved ? "Saved ✓" : saving ? "Saving..." : "Save profile"}
      </Button>
    </Card>
  );
}
