"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { CollectorStatus } from "@/lib/types";

export function relTime(iso: string, locale: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale === "am" ? "am" : "en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400 * 2) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

/** Shows when the catalogue was last refreshed from the web and lets visitors trigger a refresh. */
export function LiveRefresh({ onUpdated }: { onUpdated?: () => void }) {
  const t = useTranslations("scholarships.live");
  const locale = useLocale();
  const [st, setSt] = useState<CollectorStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const wasRunning = useRef(false);

  const poll = useCallback(() => {
    api.collectorStatus().then((s) => {
      if (wasRunning.current && !s.running) onUpdated?.();
      wasRunning.current = s.running;
      setSt(s);
    }).catch(() => undefined);
  }, [onUpdated]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, st?.running ? 4000 : 60000);
    return () => clearInterval(id);
  }, [poll, st?.running]);

  if (!st) return null;
  const last = st.lastSuccessAt;
  const run = st.lastRun;
  const found = run?.status === "ok" ? run.stats.discovered ?? 0 : 0;
  const updated = run?.status === "ok" ? run.stats.updated ?? 0 : 0;

  const refresh = () => {
    setFailed(false);
    api.runCollector().then(() => { wasRunning.current = true; setSt({ ...st, running: true }); }).catch(() => setFailed(true));
  };

  return (
    <div className="relative mt-5 overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-card to-gold/10 p-4" data-testid="live-refresh">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Globe2 size={18} />
          <span className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-card ${st.running ? "animate-ping bg-gold" : "bg-primary"}`} />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{t("title", { hours: st.intervalHours })}</p>
          <p className="text-muted-foreground">
            {st.running ? t("running") : last ? t("last", { when: relTime(last, locale) }) : t("never")}
            {!st.running && st.nextRunAt && <> · {t("next", { when: relTime(st.nextRunAt, locale) })}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary"><Sparkles size={12} />{t("found", { count: st.totals.discovered })}</span>
          {run?.status === "ok" && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{t("lastRunStats", { found, updated, checked: run.stats.checked ?? 0 })}</span>}
          {st.enabled && (
            <button onClick={refresh} disabled={st.running} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 font-medium transition hover:border-primary hover:text-primary disabled:opacity-60">
              {st.running ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}{st.running ? t("refreshing") : t("refresh")}
            </button>
          )}
        </div>
      </div>
      {failed && <p className="mt-2 text-xs text-red">{t("failed")}</p>}
    </div>
  );
}
