"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CalendarDays } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { Scholarship } from "@/lib/types";
import { daysLabel } from "@/lib/utils";

export function DeadlineTicker() {
  const locale = useLocale();
  const [items, setItems] = useState<Scholarship[]>([]);
  useEffect(() => { api.scholarships({ limit: "40" }).then((r) => setItems(r.items.filter((s) => (s.daysLeft ?? 999) > 0).sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999)).slice(0, 14))).catch(() => undefined); }, []);
  if (items.length === 0) return null;
  const row = [...items, ...items];
  return (
    <div className="relative -mx-4 overflow-hidden border-y bg-muted/40 py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee flex w-max gap-3 px-4">
        {row.map((s, i) => (
          <Link key={`${s.id}-${i}`} href={`/scholarships/${s.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary">
            <span className="font-semibold">{s.title}</span>
            <span className="text-muted-foreground">{s.country}</span>
            <span className={`inline-flex items-center gap-1 ${(s.daysLeft ?? 99) <= 30 ? "text-red" : "text-primary"}`}><CalendarDays size={11} />{daysLabel(s.daysLeft, locale)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
