import type { ReactNode } from "react";

type Tone = "great" | "ok" | "over" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  great: "bg-salvia/30 text-cafe",
  ok: "bg-camel/30 text-cafe",
  over: "bg-terracota/20 text-terracota",
  neutral: "bg-arena text-cafe",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
