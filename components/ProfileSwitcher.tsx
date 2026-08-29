"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProfileRow } from "@/lib/supabase/database.types";

export function ProfileSwitcher({ household, selfId }: { household: ProfileRow[]; selfId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("as") ?? selfId;

  if (household.length <= 1) return null;

  function selectProfile(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === selfId) {
      params.delete("as");
    } else {
      params.set("as", id);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex gap-1 rounded-full bg-arena p-1">
      {household.map((p) => (
        <button
          key={p.id}
          onClick={() => selectProfile(p.id)}
          className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm transition ${
            p.id === activeId ? "bg-oro-viejo text-cream" : "text-cafe hover:bg-camel/30"
          }`}
        >
          {p.display_name || "Profile"}
        </button>
      ))}
    </div>
  );
}
