"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export function LiveStats() {
  const t = useTranslations("landing");
  const [s, setS] = useState<{ open: number; countries: number; conferences: number } | null>(null);
  useEffect(() => { api.stats().then(setS).catch(() => setS({ open: 40, countries: 20, conferences: 25 })); }, []);
  const v = (n?: number) => (s ? n : "…");
  return (
    <dl className="mt-8 flex flex-wrap gap-6 text-sm" data-testid="live-stats">
      <div><dt className="text-2xl font-bold text-primary">{v(s?.open)}</dt><dd className="text-muted-foreground">{t("liveCount", { count: "" }).trim()}</dd></div>
      <div><dt className="text-2xl font-bold text-gold">{v(s?.countries)}</dt><dd className="text-muted-foreground">{t("countries", { count: "" }).trim()}</dd></div>
      <div><dt className="text-2xl font-bold text-red">{v(s?.conferences)}</dt><dd className="text-muted-foreground">{t("conferences", { count: "" }).trim()}</dd></div>
    </dl>
  );
}
