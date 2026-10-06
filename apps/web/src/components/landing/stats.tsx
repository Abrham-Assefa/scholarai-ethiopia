"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useCountUp } from "./use-count-up";

function Stat({ value, label, color }: { value: number | null; label: string; color: string }) {
  const n = useCountUp(value);
  return (
    <div className="reveal reveal-5">
      <dt className={`text-3xl font-extrabold tabular-nums tracking-tight ${color}`}>{value === null ? "…" : n}<span className="text-lg">+</span></dt>
      <dd className="text-sm text-muted-foreground">{label}</dd>
    </div>
  );
}

export function Stats() {
  const t = useTranslations("landing");
  const [s, setS] = useState<{ open: number; countries: number; conferences: number } | null>(null);
  useEffect(() => { api.stats().then(setS).catch(() => setS({ open: 40, countries: 20, conferences: 25 })); }, []);
  return (
    <dl className="mt-10 flex flex-wrap gap-10" data-testid="live-stats">
      <Stat value={s?.open ?? null} label={t("liveCount", { count: "" }).trim()} color="text-primary" />
      <Stat value={s?.countries ?? null} label={t("countries", { count: "" }).trim()} color="text-gold" />
      <Stat value={s?.conferences ?? null} label={t("conferences", { count: "" }).trim()} color="text-red" />
    </dl>
  );
}
