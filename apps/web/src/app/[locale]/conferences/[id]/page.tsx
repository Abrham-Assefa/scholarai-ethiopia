"use client";

import { use, useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft, BadgeCheck, CalendarClock, CalendarDays, CheckCircle2, ExternalLink, Gift, Lightbulb, Link2,
  ListOrdered, MapPin, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { Conference } from "@/lib/types";
import { countdown, urgencyTone } from "@/lib/conferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/api-error";
import { FavoriteButton } from "@/components/favorite-button";

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card>
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
      {items.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" /><span>{x}</span></li>)}
    </ul>
  );
}

function host(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

export default function ConferenceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("conferences");
  const locale = useLocale();
  const [c, setC] = useState<Conference | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => { setError(null); api.conference(id).then(setC).catch((e) => setError(e.message)); }, [id]);
  useEffect(load, [load]);

  if (error) return <ApiError message={error} onRetry={load} />;
  if (!c) return <div className="space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  const d = c.details ?? {};
  const cd = countdown(c);
  const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale === "am" ? "am-ET" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const estimated = !!c.startDate && c.dateConfirmed === false;
  const official = c.url?.startsWith("http") ? c.url : undefined;

  return (
    <div className="space-y-6">
      <Link href="/conferences" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} />{t("back")}</Link>

      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-gold/10 p-6 md:p-8">
        <div className="flag-stripe absolute inset-x-0 top-0 h-1" aria-hidden />
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge variant={c.fundingType === "full" ? "default" : "gold"}>{c.fundingType === "full" ? t("full") : t("partial")}</Badge>
              {c.ethiopiansEligible && <Badge variant="outline" className="gap-1"><BadgeCheck size={12} />{t("eligibleBadge")}</Badge>}
            </div>
            <h1 className="text-balance text-3xl font-bold leading-tight md:text-4xl">{c.title}</h1>
            {c.origin === "discovered" && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-amber-800 dark:text-gold" data-testid="auto-collected">
                <Sparkles size={14} className="mt-px shrink-0" />
                <span>{t("autoCollected", { source: host(c.sources?.at(-1) ?? c.url ?? ""), date: c.discoveredAt ?? "" })}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {c.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-primary" />{c.location}</span>}
              {c.when && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-primary" />{c.when}</span>}
              {c.audience && <span className="inline-flex items-center gap-1.5"><Users size={15} className="text-primary" />{c.audience}</span>}
            </div>
            {c.funding && <p className="mt-3 inline-flex items-start gap-1.5 text-sm"><Gift size={15} className="mt-0.5 shrink-0 text-primary" />{c.funding}</p>}
            {official && (
              <div className="mt-5">
                <Button asChild><a href={official} target="_blank" rel="noreferrer">{t("site")} <ExternalLink size={14} /></a></Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-background/70 p-5 backdrop-blur lg:w-72" data-testid="deadline-panel">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><CalendarDays size={13} />{t("deadline")}</p>
            {c.deadline ? <p className="mt-1 text-2xl font-bold">{fmt(c.deadline)}</p> : <p className="mt-1 text-sm text-muted-foreground">{t("noDeadline")}</p>}
            {cd && (
              <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${urgencyTone(cd.n)}`}>
                {cd.kind === "apply" ? (cd.n === 0 ? t("applyToday") : t("applyIn", { n: cd.n })) : t("startsIn", { n: cd.n })}
              </span>
            )}
            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("eventDates")}</p>
              <p className="mt-1 text-sm font-medium">{c.startDate ? (c.when ?? fmt(c.startDate)) : t("tba")}</p>
              {c.startDate && <p className={`mt-3 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-xs ${estimated ? "bg-gold/15 text-amber-800 dark:text-gold" : "bg-primary/10 text-primary"}`}>
                {estimated ? <CalendarClock size={14} className="mt-px shrink-0" /> : <ShieldCheck size={14} className="mt-px shrink-0" />}
                <span><strong>{estimated ? t("estimated") : t("confirmed")}</strong>{estimated && <> · {t("estimatedHint")}</>}</span>
              </p>}
            </div>
          </div>
        </div>
      </div>

      {(d.overview || c.description) && (
        <Section icon={<Lightbulb size={16} />} title={t("overview")}>
          <p className="text-[15px] leading-relaxed text-foreground/90">{d.overview ?? c.description}</p>
        </Section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {d.whoCanApply?.length ? <Section icon={<Users size={16} />} title={t("whoCanApply")}><Bullets items={d.whoCanApply} /></Section> : null}
        {d.benefits?.length ? <Section icon={<Gift size={16} />} title={t("benefits")}><Bullets items={d.benefits} /></Section> : null}
      </div>

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

      {d.ethiopiaTips?.length ? (
        <Card className="border-gold/50 bg-gold/5" data-testid="ethiopia-tips">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/20 text-lg" aria-hidden>🇪🇹</span>{t("tips")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {d.ethiopiaTips.map((x) => <li key={x} className="flex gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-gold" /><span>{x}</span></li>)}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {(c.sources?.length || c.lastChecked) ? (
        <div className="rounded-xl border p-4 text-sm">
          {c.sources?.length ? (
            <>
              <p className="mb-2 flex items-center gap-1.5 font-medium"><Link2 size={14} />{t("sources")}</p>
              <ul className="flex flex-wrap gap-2">
                {c.sources.map((u) => (
                  <li key={u}><a href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">{host(u)} <ExternalLink size={11} /></a></li>
                ))}
              </ul>
            </>
          ) : null}
          {c.lastVerified && <p className="mt-3 text-xs text-muted-foreground">{t("lastVerified", { date: c.lastVerified })}</p>}
          {c.lastChecked && <p className="mt-1 text-xs text-muted-foreground">{t(c.checkStatus === "unreachable" ? "lastCheckedDown" : "lastChecked", { date: c.lastChecked })}</p>}
        </div>
      ) : null}
    </div>
  );
}
