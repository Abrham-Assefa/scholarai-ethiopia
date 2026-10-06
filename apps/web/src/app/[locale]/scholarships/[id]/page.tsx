"use client";

import { use, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CalendarDays, ExternalLink, FileText, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { Scholarship } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/api-error";
import { daysLabel } from "@/lib/utils";

export default function ScholarshipDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("scholarships");
  const locale = useLocale();
  const [s, setS] = useState<Scholarship | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.scholarship(id).then(setS).catch((e) => setError(e.message)); }, [id]);

  if (error) return <ApiError message={error} />;
  if (!s) return <div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40" /></div>;

  return (
    <div className="space-y-6">
      <Link href="/scholarships" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} />{t("back")}</Link>
      <div>
        <div className="mb-2 flex flex-wrap gap-1">
          <Badge variant={s.fundingType === "full" ? "default" : "muted"}>{s.fundingType === "full" ? t("full") : t("partial")}</Badge>
          {s.tags.slice(0, 4).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>
        <h1 className="text-3xl font-bold">{s.title}</h1>
        {s.provider && <p className="mt-1 text-muted-foreground">{s.provider}</p>}
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1"><MapPin size={14} />{s.countries.join(", ")}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{t("deadline")}: {s.deadlineText ?? s.deadline ?? "—"} · <strong>{daysLabel(s.daysLeft, locale)}</strong></span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild><a href={s.url} target="_blank" rel="noreferrer">{t("apply")} <ExternalLink size={14} /></a></Button>
          <Button variant="gold" asChild><Link href={`/cv?target=${s.id}`}><FileText size={14} /> {t("buildCV")}</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>{t("covers")}</CardTitle></CardHeader><CardContent><p className="text-sm">{s.covers || "—"}</p>{s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t("eligibility")}</CardTitle></CardHeader><CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("levels")}</dt><dd>{s.level.join(", ")}</dd></div>
            {s.eligibility.minGpa && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("minGpa")}</dt><dd>{s.eligibility.minGpa}</dd></div>}
            {s.eligibility.workYearsMin ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("workYears")}</dt><dd>{t("years", { n: s.eligibility.workYearsMin })}</dd></div> : null}
            {s.eligibility.englishTest && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("english")}</dt><dd>{s.eligibility.englishTest}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("field")}</dt><dd className="text-right">{s.fields.join(", ")}</dd></div>
          </dl>
        </CardContent></Card>
      </div>

      {s.requiredDocuments && s.requiredDocuments.length > 0 && (
        <Card><CardHeader><CardTitle>{t("docs")}</CardTitle></CardHeader><CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">{s.requiredDocuments.map((d) => <li key={d} className="flex gap-2"><span className="text-primary">✓</span>{d}</li>)}</ul>
        </CardContent></Card>
      )}
    </div>
  );
}
