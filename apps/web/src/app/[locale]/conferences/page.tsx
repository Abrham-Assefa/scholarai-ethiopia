"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type { Conference } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/api-error";

export default function ConferencesPage() {
  const t = useTranslations("conferences");
  const [items, setItems] = useState<Conference[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setError(null); api.conferences().then((r) => setItems(r.items)).catch((e) => setError(e.message)); };
  useEffect(load, []);
  return (
    <div>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      {error && <div className="mt-6"><ApiError message={error} onRetry={load} /></div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!items && !error && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        {items?.map((c) => (
          <Card key={c.id} className="flex flex-col"><CardContent className="flex flex-1 flex-col p-5">
            <div className="mb-2 flex flex-wrap gap-1">
              <Badge variant={c.fundingType === "full" ? "default" : "gold"}>{c.funding || c.fundingType}</Badge>
              {(c.age.min || c.age.max) && <Badge variant="outline">{t("age")} {c.age.min ?? ""}–{c.age.max ?? ""}</Badge>}
            </div>
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.audience || c.description}</p>
            <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin size={12} />{c.location}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{c.when}</span>
            </div>
            {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">{t("site")} <ExternalLink size={12} /></a>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
