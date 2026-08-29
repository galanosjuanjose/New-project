import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-arena/60 p-5 shadow-sm ${className}`}>{children}</div>
  );
}
