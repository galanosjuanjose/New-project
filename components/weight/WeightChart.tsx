"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface WeightChartPoint {
  date: string;
  weightLb: number;
  avg: number;
}

export function WeightChart({ data }: { data: WeightChartPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-arena)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-cafe)" }} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--color-cafe)" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--color-cream)", border: "1px solid var(--color-salvia)" }}
          />
          <Line type="monotone" dataKey="weightLb" stroke="var(--color-salvia)" dot={{ r: 2 }} name="Weight" />
          <Line type="monotone" dataKey="avg" stroke="var(--color-oliva)" dot={false} name="7-day avg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
