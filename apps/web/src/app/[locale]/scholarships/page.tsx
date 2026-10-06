"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Scholarship } from "@/lib/types";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScholarshipCard } from "@/components/scholarship-card";
import { ApiError } from "@/components/api-error";

const LEVELS = ["bachelor", "master", "phd", "postdoc", "short-course"];

export default function ScholarshipsPage() {
  const t = useTranslations("scholarships");
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [country, setCountry] = useState("");
  const [field, setField] = useState("");
  const [funding, setFunding] = useState("");
  const [all, setAll] = useState<Scholarship[] | null>(null);
  const [items, setItems] = useState<Scholarship[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.scholarships({ limit: "200" }).then((r) => setAll(r.items)).catch(() => undefined); }, []);

  const load = useCallback(() => {
    setError(null);
    api.scholarships({ q, level, country, field, funding, limit: "200" }).then((r) => setItems(r.items)).catch((e) => setError(String(e.message)));
  }, [q, level, country, field, funding]);

  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);

  const countries = useMemo(() => Array.from(new Set((all ?? []).map((s) => s.country))).sort(), [all]);
  const fields = useMemo(() => Array.from(new Set((all ?? []).flatMap((s) => s.fields))).sort(), [all]);

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("subtitle", { count: all?.length ?? "…" })}</p>

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

      {error && <div className="mt-6"><ApiError message={error} onRetry={load} /></div>}
      {!error && items && <p className="mt-6 text-sm text-muted-foreground">{t("results", { count: items.length })}</p>}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="scholarship-grid">
        {!items && !error && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        {items?.map((s) => <ScholarshipCard key={s.id} s={s} />)}
      </div>
      {items?.length === 0 && <p className="mt-8 text-center text-muted-foreground">{t("empty")}</p>}
    </div>
  );
}
