"use client";

import { use, useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft, BadgeCheck, CalendarClock, CalendarDays, CheckCircle2, ExternalLink, FileText,
  Gift, Lightbulb, Link2, ListOrdered, MapPin, Scale, ShieldCheck, Users,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { Scholarship } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/api-error";
import { daysLabel } from "@/lib/utils";

function Section({ icon, title, children, className = "" }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((x) => (
        <li key={x} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /><span>{x}</span></li>
      ))}
    </ul>
  );
}

function host(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

export default function ScholarshipDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("scholarships");
  const locale = useLocale();
  const [s, setS] = useState<Scholarship | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { setError(null); api.scholarship(id).then(setS).catch((e) => setError(e.message)); }, [id]);
  useEffect(load, [load]);

  if (error) return <ApiError message={error} onRetry={load} />;
  if (!s) return <div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  const d = s.details ?? {};
  const docs = d.documents?.length ? d.documents : s.requiredDocuments ?? [];
  const estimated = !!s.deadline && s.deadlineConfirmed === false;
  const rolling = s.status === "rolling" && !s.deadline;
  const urgent = typeof s.daysLeft === "number" && s.daysLeft <= 30;

  return (
    <div className="space-y-6">
      <Link href="/scholarships" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} />{t("back")}</Link>

      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8">
        <div className="flag-stripe absolute inset-x-0 top-0 h-1" aria-hidden />
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge variant={s.fundingType === "full" ? "default" : "muted"}>{s.fundingType === "full" ? t("full") : t("partial")}</Badge>
              {s.eligibility.ethiopiansEligible !== false && <Badge variant="outline" className="gap-1"><BadgeCheck size={12} />{t("eligibleBadge")}</Badge>}
              {s.level.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
            </div>
            <h1 className="text-balance text-3xl font-bold leading-tight md:text-4xl">{s.title}</h1>
            {s.provider && <p className="mt-2 text-muted-foreground">{s.provider}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-primary" />{s.countries.join(", ")}</span>
              {s.covers && <span className="inline-flex items-center gap-1.5"><Gift size={15} className="text-primary" />{s.covers}</span>}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild><a href={s.url} target="_blank" rel="noreferrer">{t("apply")} <ExternalLink size={14} /></a></Button>
              <Button variant="gold" asChild><Link href={`/cv?target=${s.id}`}><FileText size={14} /> {t("buildCV")}</Link></Button>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-5 lg:w-72" data-testid="deadline-panel">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><CalendarDays size={13} />{t("deadline")}</p>
            <p className="mt-1 text-2xl font-bold">
              {rolling ? t("rolling") : s.deadline ? new Date(s.deadline + "T00:00:00").toLocaleDateString(locale === "am" ? "am-ET" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
            {!rolling && s.deadline && <p className={`mt-0.5 text-sm font-semibold ${urgent ? "text-red" : "text-primary"}`}>{daysLabel(s.daysLeft, locale)}</p>}
            {s.deadlineText && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.deadlineText}</p>}
            {s.deadline && (
              <p className={`mt-3 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-xs ${estimated ? "bg-gold/15 text-amber-800 dark:text-gold" : "bg-primary/10 text-primary"}`}>
                {estimated ? <CalendarClock size={14} className="mt-px shrink-0" /> : <ShieldCheck size={14} className="mt-px shrink-0" />}
                <span><strong>{estimated ? t("estimated") : t("confirmed")}</strong>{estimated && <> · {t("estimatedHint")}</>}</span>
              </p>
            )}
            {d.applicationOpens && (
              <div className="mt-4 border-t pt-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("opens")}</p>
                <p className="mt-1">{d.applicationOpens}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {(d.overview || s.description) && (
        <Section icon={<Lightbulb size={16} />} title={t("overview")}>
          <p className="text-[15px] leading-relaxed text-foreground/90">{d.overview ?? s.description}</p>
        </Section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {d.whoCanApply?.length ? <Section icon={<Users size={16} />} title={t("whoCanApply")}><Bullets items={d.whoCanApply} /></Section> : null}
        {d.benefits?.length ? <Section icon={<Gift size={16} />} title={t("benefits")}><Bullets items={d.benefits} /></Section> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {d.howToApply?.length ? (
          <Section icon={<ListOrdered size={16} />} title={t("howToApply")}>
            <ol className="space-y-3 text-sm">
              {d.howToApply.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}
        <Section icon={<Scale size={16} />} title={t("eligibility")}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("levels")}</dt><dd className="text-right">{s.level.join(", ")}</dd></div>
            {s.eligibility.minGpa ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("minGpa")}</dt><dd>{s.eligibility.minGpa}</dd></div> : null}
            {s.eligibility.workYearsMin ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("workYears")}</dt><dd>{t("years", { n: s.eligibility.workYearsMin })}</dd></div> : null}
            {s.eligibility.ageLimit ? <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("ageLimit")}</dt><dd>{t("ageMax", { n: s.eligibility.ageLimit })}</dd></div> : null}
            {s.eligibility.englishTest && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("english")}</dt><dd>{s.eligibility.englishTest}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("field")}</dt><dd className="text-right">{s.fields.join(", ")}</dd></div>
          </dl>
          {d.selection && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("selection")}</p>
              <p className="text-sm leading-relaxed">{d.selection}</p>
            </div>
          )}
        </Section>
      </div>

      {docs.length > 0 && (
        <Section icon={<FileText size={16} />} title={t("docs")}>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">{docs.map((x) => <li key={x} className="flex gap-2"><span className="text-primary">✓</span>{x}</li>)}</ul>
        </Section>
      )}

      {d.ethiopiaTips?.length ? (
        <Card className="border-gold/50 bg-gold/5" data-testid="ethiopia-tips">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/20 text-lg" aria-hidden>🇪🇹</span>
              {t("tips")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {d.ethiopiaTips.map((x) => <li key={x} className="flex gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-gold" /><span>{x}</span></li>)}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {s.sources?.length ? (
        <div className="rounded-xl border p-4 text-sm">
          <p className="mb-2 flex items-center gap-1.5 font-medium"><Link2 size={14} />{t("sources")}</p>
          <ul className="flex flex-wrap gap-2">
            {s.sources.map((u) => (
              <li key={u}><a href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">{host(u)} <ExternalLink size={11} /></a></li>
            ))}
          </ul>
          {s.lastVerified && <p className="mt-3 text-xs text-muted-foreground">{t("lastVerified", { date: s.lastVerified })}</p>}
        </div>
      ) : null}
    </div>
  );
}
