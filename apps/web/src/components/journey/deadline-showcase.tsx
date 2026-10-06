"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Scholarship } from "@/lib/types";
import { airportFor } from "./geo";

const FLAGS: Record<string, string> = {
  Germany: "🇩🇪", UK: "🇬🇧", USA: "🇺🇸", China: "🇨🇳", "South Korea": "🇰🇷", Japan: "🇯🇵", Türkiye: "🇹🇷", Hungary: "🇭🇺",
  Romania: "🇷🇴", Russia: "🇷🇺", India: "🇮🇳", Brunei: "🇧🇳", Azerbaijan: "🇦🇿", Sweden: "🇸🇪", Netherlands: "🇳🇱", France: "🇫🇷",
  Switzerland: "🇨🇭", Australia: "🇦🇺", Rwanda: "🇷🇼", Ghana: "🇬🇭", EU: "🇪🇺", Ethiopia: "🇪🇹", Canada: "🇨🇦", Italy: "🇮🇹",
  Belgium: "🇧🇪", Ireland: "🇮🇪", "New Zealand": "🇳🇿", Taiwan: "🇹🇼", Thailand: "🇹🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦",
};
const flag = (c: string) => FLAGS[c] ?? "🌍";

const levelBadge = (s: Scholarship) =>
  s.level.includes("phd") ? "PhD" : s.level.includes("master") ? "MSc" : s.level.includes("bachelor") ? "UG" : "Short";

const initials = (s: Scholarship) => {
  const src = (s.provider || s.title).replace(/\(.*?\)/g, "");
  const words = src.split(/[\s/–-]+/).filter((w) => /^[A-Za-z]/.test(w) && !/^(of|the|and|for|in|de)$/i.test(w));
  return (words.length >= 2 ? words[0][0] + words[1][0] : src.slice(0, 2)).toUpperCase();
};

function countdown(d: number | null | undefined, am: boolean) {
  if (d == null) return { label: am ? "ክፍት ጊዜ" : "Rolling", cls: "border-primary/40 bg-primary/15 text-primary" };
  const label = d === 0 ? (am ? "ዛሬ ይዘጋል" : "Closes today") : am ? `በ${d} ቀናት ውስጥ` : `in ${d} day${d === 1 ? "" : "s"}`;
  const cls = d < 14 ? "border-red/40 bg-red/15 text-red" : d < 45 ? "border-gold/50 bg-gold/15 text-gold" : "border-primary/40 bg-primary/15 text-primary";
  return { label, cls };
}

const PER = 4;

function Card({ s, i, am, onHover }: { s: Scholarship; i: number; am: boolean; onHover?: (code: string | null) => void }) {
  const cd = countdown(s.daysLeft, am);
  const code = airportFor(s.country).code;
  return (
    <motion.li
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ delay: i * 0.08, type: "spring", stiffness: 180, damping: 22 }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => onHover?.(code === "INT" ? null : code)}
      onMouseLeave={() => onHover?.(null)}
      className="w-[78%] shrink-0 snap-start sm:w-auto"
    >
      <Link
        href={`/scholarships/${s.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,.6)] backdrop-blur-xl transition-colors hover:border-gold/50"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/20 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-0" />
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-sm font-black tracking-tight text-[#fff] shadow-inner">{initials(s)}</span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cd.cls}`}>
            <CalendarClock size={12} />{cd.label}
          </span>
        </div>
        <h3 className="mt-4 text-[15px] font-bold leading-snug">{s.title}</h3>
        {s.provider && !s.title.toLowerCase().startsWith(s.provider.toLowerCase().slice(0, 12)) && <p className="mt-1 line-clamp-1 text-xs text-white/50">{s.provider}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4 text-[11px]">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{flag(s.country)} {s.country}</span>
          <span className="rounded-full bg-gold/15 px-2 py-0.5 font-bold text-gold">{levelBadge(s)}</span>
          {s.fundingType === "full" && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{am ? "ሙሉ ድጋፍ" : "Fully funded"}</span>}
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold">
          {am ? "ይመልከቱ" : "View"} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </motion.li>
  );
}

/** Auto-rotating carousel of the soonest-closing scholarships. */
export function DeadlineShowcase({ items, onHover }: { items: Scholarship[]; onHover?: (code: string | null) => void }) {
  const am = useLocale() === "am";
  const upcoming = useMemo(
    () => items.filter((s) => s.daysLeft == null || s.daysLeft >= 0).sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)).slice(0, 12),
    [items],
  );
  const pages = Math.max(1, Math.ceil(upcoming.length / PER));
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || pages < 2) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), 7000);
    return () => clearInterval(id);
  }, [paused, pages]);
  const slice = upcoming.slice(page * PER, page * PER + PER);
  const go = (d: number) => setPage((p) => (p + d + pages) % pages);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-black shadow-[0_10px_30px_-10px_rgba(242,183,5,.8)]"><CalendarClock size={18} /></span>
          <div>
            <h2 className="text-lg font-black tracking-tight sm:text-xl">{am ? "የሚቃረቡ ቀነ ገደቦች" : "Upcoming deadlines"}</h2>
            <p className="text-xs text-white/50">{am ? "በቅርቡ የሚዘጉ ስኮላርሺፖች · ቀጥታ ከ API" : "Closing soonest · live from the API"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} type="button" aria-label={`${am ? "ገጽ" : "Page"} ${i + 1}`} onClick={() => setPage(i)} className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-gold" : "w-1.5 bg-white/25"}`} />
            ))}
          </div>
          <button type="button" aria-label={am ? "ቀዳሚ" : "Previous"} onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 transition-colors hover:border-gold hover:text-gold"><ChevronLeft size={16} /></button>
          <button type="button" aria-label={am ? "ቀጣይ" : "Next"} onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 transition-colors hover:border-gold hover:text-gold"><ChevronRight size={16} /></button>
        </div>
      </div>
      <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4" data-testid="deadline-showcase">
        <AnimatePresence mode="popLayout">
          {slice.map((s, i) => <Card key={s.id} s={s} i={i} am={am} onHover={onHover} />)}
        </AnimatePresence>
        {upcoming.length === 0 && Array.from({ length: PER }).map((_, i) => <li key={i} className="h-56 w-[78%] shrink-0 animate-pulse rounded-2xl bg-white/5 sm:w-auto" />)}
      </ul>
    </div>
  );
}
