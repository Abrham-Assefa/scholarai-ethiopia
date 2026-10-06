"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api, getToken } from "@/lib/api";
import type { Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/api-error";
import { daysLabel } from "@/lib/utils";

type Deadline = { scholarshipId: string; title: string; country: string; deadline: string; daysLeft: number; probability: number | null };

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[] | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { setNoProfile(true); return; }
    Promise.all([api.matches(), api.deadlines(90)])
      .then(([m, d]) => { setMatches(m.items); setDeadlines(d.items); if (m.items.length === 0) setNoProfile(true); })
      .catch((e) => ([400, 401, 404].includes(e.status) ? setNoProfile(true) : setError(e.message)));
  }, []);

  if (noProfile) return (
    <Card className="mx-auto max-w-md text-center"><CardContent className="p-8">
      <p className="text-muted-foreground">{t("noProfile")}</p>
      <Button className="mt-4" asChild><Link href="/onboarding">{t("setup")}</Link></Button>
    </CardContent></Card>
  );
  if (error) return <ApiError message={error} />;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-6 space-y-4">
          {!matches && <><p className="text-sm text-muted-foreground">{t("loading")}</p>{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</>}
          {matches?.map((m) => (
            <Card key={m.scholarshipId} data-testid="match-card"><CardContent className="flex gap-4 p-5">
              <ProgressRing value={m.probability} size={72} label={`${m.probability}% ${t("match")}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/scholarships/${m.scholarshipId}`} className="font-semibold hover:underline">{m.title}</Link>
                    <p className="text-xs text-muted-foreground">{m.country} · {daysLabel(m.daysLeft, locale)} · {t("effort", { hours: m.effortHours })}</p>
                  </div>
                  <Button size="sm" variant="outline" asChild><Link href={`/scholarships/${m.scholarshipId}`}>{t("view")}</Link></Button>
                </div>
                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div><p className="mb-1 font-semibold text-primary">{t("why")}</p><ul className="space-y-0.5">{m.why.slice(0, 3).map((w) => <li key={w}>✓ {w}</li>)}</ul></div>
                  {m.missing.length > 0 && <div><p className="mb-1 font-semibold text-red">{t("missing")}</p><ul className="space-y-0.5">{m.missing.slice(0, 3).map((w) => <li key={w}>• {w}</li>)}</ul></div>}
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </section>
      <aside>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays size={16} />{t("deadlines")}</CardTitle></CardHeader><CardContent>
          {!deadlines && <Skeleton className="h-24" />}
          {deadlines?.length === 0 && <p className="text-sm text-muted-foreground">{t("noDeadlines")}</p>}
          <ul className="space-y-3">
            {deadlines?.slice(0, 10).map((d) => (
              <li key={d.scholarshipId} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0"><Link href={`/scholarships/${d.scholarshipId}`} className="line-clamp-1 hover:underline">{d.title}</Link><p className="text-xs text-muted-foreground">{d.deadline}</p></div>
                <span className={`shrink-0 text-xs font-semibold ${d.daysLeft <= 14 ? "text-red" : d.daysLeft <= 45 ? "text-amber-600" : "text-primary"}`}>{daysLabel(d.daysLeft, locale)}</span>
              </li>
            ))}
          </ul>
          <a className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline" href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/docs`} target="_blank" rel="noreferrer">API <ExternalLink size={10} /></a>
        </CardContent></Card>
      </aside>
    </div>
  );
}
