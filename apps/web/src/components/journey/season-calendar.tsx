"use client";
import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { flagFor, useAllScholarships } from "./geo";

const EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AM = ["ጃን", "ፌብ", "ማር", "ኤፕ", "ሜይ", "ጁን", "ጁላ", "ኦገ", "ሴፕ", "ኦክ", "ኖቬ", "ዲሴ"];

export function SeasonCalendar() {
  const am = useLocale() === "am";
  const all = useAllScholarships();
  const now = new Date().getMonth();
  const months = useMemo(() => {
    const b = Array.from({ length: 12 }, () => [] as typeof all);
    all.forEach((s) => s.deadline && b[new Date(s.deadline).getMonth()].push(s));
    b.forEach((m) => m.sort((a, c) => (a.deadline! < c.deadline! ? -1 : 1)));
    return b;
  }, [all]);
  const rolling = all.filter((s) => !s.deadline).length;
  const max = Math.max(1, ...months.map((m) => m.length));
  const peak = months.reduce((pi, m, i) => (m.length > months[pi].length ? i : pi), 0);
  const [sel, setSel] = useState<number | null>(null);
  const active = sel ?? peak;
  const order = Array.from({ length: 12 }, (_, i) => (now + i) % 12);
  const L = am ? AM : EN;

  return (
    <section className="relative overflow-hidden bg-[var(--lbg)] py-28 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-red/50 to-transparent" />
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "06 — የማመልከቻ ወቅት" : "06 — APPLICATION SEASON"}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            {am ? "የሚቀጥሉት 12 ወራት፣ በአንድ እይታ።" : <>Your next 12 months, <span className="text-red-300">at a glance.</span></>}
          </h2>
          <div className="flex gap-3 text-xs">
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-white/60">{am ? "ከፍተኛ ወር" : "Peak month"} · <b className="text-gold">{L[peak]}</b></span>
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-white/60">{am ? "ተከታታይ" : "Rolling"} · <b className="text-white">{rolling}</b></span>
          </div>
        </div>

        <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur sm:p-8">
          {/* month bars */}
          <div className="grid grid-cols-12 items-end gap-1.5 sm:gap-3" style={{ height: 220 }}>
            {order.map((m, idx) => {
              const n = months[m].length;
              const on = m === active;
              return (
                <button key={m} type="button" onClick={() => setSel(m)} onMouseEnter={() => setSel(m)} aria-label={`${EN[m]}: ${n}`} aria-pressed={on}
                  className="group relative flex h-full flex-col items-center justify-end gap-2">
                  <span className={cn("font-mono text-[10px] font-bold tabular-nums transition-colors sm:text-xs", on ? "text-gold" : "text-white/40")}>{n || ""}</span>
                  <motion.span initial={{ height: 0 }} whileInView={{ height: `${Math.max(4, (n / max) * 150)}px` }} viewport={{ once: true }} transition={{ delay: idx * 0.04, type: "spring", stiffness: 120, damping: 18 }}
                    className={cn("relative w-full overflow-hidden rounded-t-lg rounded-b-sm transition-colors", on ? "bg-gradient-to-t from-gold/40 to-gold" : n ? "bg-gradient-to-t from-primary/20 to-primary/70 group-hover:to-primary" : "bg-white/10")}>
                    {on && <motion.span layoutId="seasonGlow" className="absolute inset-0 shadow-[0_0_30px_rgba(242,183,5,.6)]" />}
                  </motion.span>
                  <span className={cn("text-[10px] font-semibold sm:text-xs", on ? "text-white" : "text-white/45")}>{L[m]}</span>
                  {idx === 0 && <span className="absolute -top-1 rounded-full bg-red px-1.5 py-0.5 text-[8px] font-bold text-[#fff]">{am ? "አሁን" : "NOW"}</span>}
                </button>
              );
            })}
          </div>

          {/* selected month list */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} className="text-gold" />{am ? `${L[active]} የሚዘጉ` : `Closing in ${EN[active]}`} <span className="text-white/40">· {months[active].length}</span></p>
            <AnimatePresence mode="wait">
              <motion.ul key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {months[active].slice(0, 9).map((s) => (
                  <li key={s.id}>
                    <Link href={`/scholarships/${s.id}`} className="group flex h-full items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 transition-colors hover:border-gold/50">
                      <span className="grid w-11 shrink-0 place-items-center rounded-lg bg-white/5 py-1.5 text-center">
                        <span className="font-mono text-lg font-black leading-none">{new Date(s.deadline!).getDate()}</span>
                        <span className="text-[9px] uppercase text-white/45">{L[active]}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold leading-snug">{s.title}</span>
                        <span className="text-[11px] text-white/45">{flagFor(s.country)} {s.country}</span>
                      </span>
                      <ArrowUpRight size={14} className="shrink-0 text-white/30 transition-colors group-hover:text-gold" />
                    </Link>
                  </li>
                ))}
                {months[active].length === 0 && <li className="text-sm text-white/45">{am ? "በዚህ ወር ምንም የሚዘጋ የለም — ለቀጣዩ ይዘጋጁ።" : "Nothing closes this month — a perfect window to prep documents."}</li>}
              </motion.ul>
            </AnimatePresence>
            {months[active].length > 9 && <Link href="/scholarships" className="mt-4 inline-block text-sm font-semibold text-gold hover:underline">{am ? "ሁሉንም ይመልከቱ →" : `See all ${months[active].length} →`}</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
