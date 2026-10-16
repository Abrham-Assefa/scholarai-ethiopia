"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowRight, Bookmark, CalendarClock, Globe2, MapPin, Plane, Search, Sparkles, Ticket, Timer, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useFavorites } from "@/lib/favorites";
import type { Conference } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/api-error";
import { LiveRefresh } from "@/components/live-refresh";
import { countdown, isNewEvent, isOnline, keyDate, urgencyTone as tone } from "@/lib/conferences";

type Filter = "all" | "full" | "partial" | "soon" | "online" | "new" | "favorites";

function Stat({ icon, value, label, delay }: { icon: React.ReactNode; value: number; label: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl border bg-card/70 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </motion.div>
  );
}

export default function ConferencesPage() {
  const t = useTranslations("conferences");
  const locale = useLocale();
  const [items, setItems] = useState<Conference[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { favorites, conferenceCount } = useFavorites();

  const load = useCallback(() => {
    setError(null);
    api.conferences().then((r) => setItems(r.items)).catch((e) => setError(String(e.message)));
  }, []);
  useEffect(load, [load]);

  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { month: "long", year: "numeric" }), [locale]);
  const fmtShort = useMemo(() => new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { month: "short" }), [locale]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (items ?? []).filter((c) => {
      if (needle && !`${c.title} ${c.location} ${c.description} ${c.audience}`.toLowerCase().includes(needle)) return false;
      if (filter === "favorites") return favorites.conferences.includes(c.id);
      if (filter === "full") return c.fundingType === "full";
      if (filter === "partial") return c.fundingType !== "full";
      if (filter === "soon") return typeof c.daysLeft === "number" && c.daysLeft >= 0 && c.daysLeft <= 30;
      if (filter === "online") return isOnline(c);
      if (filter === "new") return c.origin === "discovered";
      return true;
    });
  }, [items, q, filter, favorites.conferences]);

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Conference[] }[] = [];
    for (const c of shown) {
      const d = keyDate(c);
      const key = d ? d.slice(0, 7) : "tba";
      let g = out.find((x) => x.key === key);
      if (!g) {
        g = { key, label: d ? fmtMonth.format(new Date(d + "T00:00:00")) : t("tba"), items: [] };
        out.push(g);
      }
      g.items.push(c);
    }
    return out;
  }, [shown, fmtMonth, t]);

  const all = items ?? [];
  const stats = {
    open: all.length,
    full: all.filter((c) => c.fundingType === "full").length,
    soon: all.filter((c) => typeof c.daysLeft === "number" && c.daysLeft >= 0 && c.daysLeft <= 30).length,
    found: all.filter((c) => c.origin === "discovered").length,
  };
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("all") },
    { id: "favorites", label: `★ Saved (${conferenceCount})` },
    { id: "full", label: t("full") },
    { id: "partial", label: t("partial") },
    { id: "soon", label: t("closingSoon") },
    { id: "online", label: t("online") },
    { id: "new", label: `✨ ${t("onlyNew")}` },
  ];

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-gold/10 p-6 md:p-10">
        <div className="flag-stripe absolute inset-x-0 top-0 h-1" aria-hidden />
        <Plane className="pointer-events-none absolute -right-6 -top-4 h-40 w-40 rotate-12 text-primary/5 md:h-64 md:w-64" aria-hidden />
        <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
          {t("kicker")}
        </p>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle", { count: all.length })}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<Ticket size={14} />} value={stats.open} label={t("statOpen")} delay={0.05} />
          <Stat icon={<Plane size={14} />} value={stats.full} label={t("statFull")} delay={0.1} />
          <Stat icon={<Timer size={14} />} value={stats.soon} label={t("statSoon")} delay={0.15} />
          <Stat icon={<Sparkles size={14} />} value={stats.found} label={t("statFound")} delay={0.2} />
        </div>
      </section>

      <LiveRefresh scope="conferences" onUpdated={load} />

      <div className="sticky top-16 z-10 -mx-1 mt-6 flex flex-col gap-3 rounded-2xl border bg-background/85 p-3 backdrop-blur md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} aria-label={t("search")}
            className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} data-testid={`filter-${f.id}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary hover:text-primary"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-6"><ApiError message={error} onRetry={load} /></div>}
      {!items && !error && <div className="mt-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>}
      {items && <p className="mt-5 text-sm text-muted-foreground">{t("results", { count: shown.length })}</p>}
      {items && shown.length === 0 && <p className="mt-10 text-center text-muted-foreground">{t("empty")}</p>}

      <div className="mt-3 space-y-8">
        {groups.map((g) => (
          <section key={g.key} aria-label={g.label}>
            <h2 className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarClock size={15} className="text-primary" />{g.label}<span className="h-px flex-1 bg-border" />
            </h2>
            <ol className="relative space-y-3 border-l-2 border-dashed border-primary/25 pl-5 md:pl-7">
              {g.items.map((c, i) => <EventRow key={c.id} c={c} i={i} fmtShort={fmtShort} />)}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function EventRow({ c, i, fmtShort }: { c: Conference; i: number; fmtShort: Intl.DateTimeFormat }) {
  const t = useTranslations("conferences");
  const d = keyDate(c);
  const date = d ? new Date(d + "T00:00:00") : null;
  const cd = countdown(c);
  const estimated = !!c.startDate && c.dateConfirmed === false;
  return (
    <motion.li initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(i, 6) * 0.04 }} className="relative" data-testid="conference-row">
      <span className={`absolute -left-[27px] top-6 h-3 w-3 rounded-full ring-4 ring-background md:-left-[35px] ${c.fundingType === "full" ? "bg-primary" : "bg-gold"}`} aria-hidden />
      <Link href={`/conferences/${c.id}`}
        className="group flex gap-4 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5">
        <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl border text-center md:w-20 ${c.fundingType === "full" ? "bg-primary/5" : "bg-gold/10"}`}>
          {date ? (
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{fmtShort.format(date)}</span>
              <span className="text-2xl font-bold leading-none md:text-3xl">{date.getDate()}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">{c.deadline ? t("deadline") : t("eventDates")}</span>
            </>
          ) : <Globe2 className="text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {isNewEvent(c) && <Badge className="gap-1 bg-gold text-black hover:bg-gold"><Sparkles size={11} />{t("new")}</Badge>}
            <Badge variant={c.fundingType === "full" ? "default" : "gold"}>{c.fundingType === "full" ? t("full") : t("partial")}</Badge>
            {estimated && <Badge variant="outline" className="text-[10px]">{t("estimated")}</Badge>}
          </div>
          <h3 className="text-pretty font-semibold leading-snug group-hover:text-primary">{c.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {c.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{c.location}</span>}
            {c.when && <span className="inline-flex items-center gap-1"><CalendarClock size={12} />{c.when}</span>}
            {c.audience && <span className="hidden items-center gap-1 sm:inline-flex"><Users size={12} /><span className="line-clamp-1">{c.audience}</span></span>}
          </div>
          {c.funding && c.funding !== "Full" && <p className="mt-2 line-clamp-1 text-xs text-foreground/80">💸 {c.funding}</p>}
          {cd && (
            <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 sm:hidden ${tone(cd.n)}`}>
              {cd.kind === "apply" ? (cd.n === 0 ? t("applyToday") : t("applyIn", { n: cd.n })) : t("startsIn", { n: cd.n })}
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2 sm:flex">
          <div className="flex items-center gap-2">
            {cd && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone(cd.n)}`} data-testid="countdown">
                {cd.kind === "apply" ? (cd.n === 0 ? t("applyToday") : t("applyIn", { n: cd.n })) : t("startsIn", { n: cd.n })}
              </span>
            )}
            <FavoriteButton id={c.id} type="conference" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100">
            {t("details")} <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
