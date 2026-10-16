"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import type { Scholarship } from "@/lib/types";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScholarshipCard } from "@/components/scholarship-card";
import { ApiError } from "@/components/api-error";
import { LiveRefresh } from "@/components/live-refresh";

const LEVELS = ["bachelor", "master", "phd", "postdoc", "short-course"];

export default function ScholarshipsPage() {
  const t = useTranslations("scholarships");
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [field, setField] = useState("");
  const [funding, setFunding] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [all, setAll] = useState<Scholarship[] | null>(null);
  const [items, setItems] = useState<Scholarship[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { favorites, scholarshipCount } = useFavorites();

  const loadAll = useCallback(() => { api.scholarships({ limit: "200" }).then((r) => setAll(r.items)).catch(() => undefined); }, []);
  useEffect(loadAll, [loadAll]);

  const load = useCallback(() => {
    setError(null);
    api.scholarships({ q, level, country, field, funding, origin: onlyNew ? "discovered" : undefined, limit: "200" }).then((r) => setItems(r.items)).catch((e) => setError(String(e.message)));
  }, [q, level, country, field, funding, onlyNew]);
  const refreshAll = useCallback(() => { loadAll(); load(); }, [loadAll, load]);

  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);

  const countries = useMemo(() => Array.from(new Set((all ?? []).map((s) => s.country))).sort(), [all]);
  const fields = useMemo(() => Array.from(new Set((all ?? []).flatMap((s) => s.fields))).sort(), [all]);

  const displayedItems = useMemo(() => {
    if (!items) return null;
    if (!onlyFavorites) return items;
    return items.filter((s) => favorites.scholarships.includes(s.id));
  }, [items, onlyFavorites, favorites.scholarships]);

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("subtitle", { count: all?.length ?? "…" })}</p>
      <LiveRefresh onUpdated={refreshAll} />

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} />
        </div>
        <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t("level")}>
          <option value="">{t("level")}: {t("any")}</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Select value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t("country")}>
          <option value="">{t("country")}: {t("any")}</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={field} onChange={(e) => setField(e.target.value)} aria-label={t("field")}>
          <option value="">{t("field")}: {t("any")}</option>
          {fields.map((f) => <option key={f} value={f}>{f}</option>)}
        </Select>
        <Select value={funding} onChange={(e) => setFunding(e.target.value)} aria-label={t("funding")} className="md:col-start-5">
          <option value="">{t("funding")}: {t("any")}</option>
          <option value="full">{t("full")}</option>
          <option value="partial">{t("partial")}</option>
        </Select>
      </div>

      {error && <div className="mt-6"><ApiError message={error} onRetry={() => { load(); if (!all) loadAll(); }} /></div>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        {!error && displayedItems ? <p className="text-sm text-muted-foreground">{t("results", { count: displayedItems.length })}</p> : <span />}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setOnlyFavorites((v) => !v);
              if (!onlyFavorites) setOnlyNew(false);
            }}
            aria-pressed={onlyFavorites}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              onlyFavorites
                ? "border-amber-500 bg-amber-500 text-black shadow-xs"
                : "border-border hover:border-amber-500/70 hover:text-amber-600"
            }`}
          >
            <Bookmark className={`h-3 w-3 ${onlyFavorites ? "fill-black text-black" : "text-amber-500"}`} />
            <span>Saved Favorites</span>
            {scholarshipCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${onlyFavorites ? "bg-black/20 text-black" : "bg-muted text-muted-foreground"}`}>
                {scholarshipCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setOnlyNew((v) => !v);
              if (!onlyNew) setOnlyFavorites(false);
            }}
            aria-pressed={onlyNew}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${onlyNew ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:text-primary"}`}
          >
            ✨ {t("onlyNew")}
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="scholarship-grid">
        {!displayedItems && !error && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        {displayedItems?.map((s) => <ScholarshipCard key={s.id} s={s} />)}
      </div>
      {displayedItems?.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          {onlyFavorites ? "No favorited scholarships yet. Click the bookmark icon on any scholarship to save it here!" : t("empty")}
        </p>
      )}
    </div>
  );
}
