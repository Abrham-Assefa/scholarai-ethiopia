"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Infinity as InfinityIcon, Radar } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { flagFor, useAllScholarships } from "./geo";

const EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const AM = ["ጃን", "ፌብ", "ማር", "ኤፕ", "ሜይ", "ጁን", "ጁላ", "ኦገ", "ሴፕ", "ኦክ", "ኖቬ", "ዲሴ"];
const DAY = 86_400_000;
const S = 560, C = S / 2, R_IN = 120, R_OUT = 236;
const r2 = (n: number) => Math.round(n * 100) / 100;
/** month index (0..12, fractional) → SVG point; Jan sits at 12 o'clock. */
const polar = (m: number, r: number) => {
  const a = ((m / 12) * 360 - 90) * (Math.PI / 180);
  return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))] as const;
};
const sector = (m: number, r1: number, r0: number) => {
  const [a, b] = polar(m + 0.03, r1), [c, d] = polar(m + 0.97, r1), [e, f] = polar(m + 0.97, r0), [g, h] = polar(m + 0.03, r0);
  return `M${a} ${b} A${r1} ${r1} 0 0 1 ${c} ${d} L${e} ${f} A${r0} ${r0} 0 0 0 ${g} ${h} Z`;
};
const tone = (d: number) => (d < 30 ? "#e23b3b" : d < 90 ? "#f2b705" : "#15a854");

type Item = ReturnType<typeof useAllScholarships>[number];
type Dot = { s: Item; m: number; x: number; y: number; days: number; at: Date };

function Countdown({ at, now, am }: { at: Date; now: number; am: boolean }) {
  const ms = Math.max(0, at.getTime() - now);
  const parts = [Math.floor(ms / DAY), Math.floor(ms / 3_600_000) % 24, Math.floor(ms / 60_000) % 60, Math.floor(ms / 1000) % 60];
  const lbl = am ? ["ቀን", "ሰዓት", "ደቂቃ", "ሰከንድ"] : ["DAYS", "HRS", "MIN", "SEC"];
  return (
    <div className="grid grid-cols-4 gap-2">
      {parts.map((v, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-black/30 px-1 py-3 text-center sm:px-2">
          <div className="relative h-9 overflow-hidden font-mono text-2xl font-black tabular-nums leading-9 sm:text-3xl">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={v} initial={{ y: -36, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 36, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="block">
                {String(v).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="font-mono text-[9px] tracking-[0.2em] text-white/45">{lbl[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function SeasonCalendar() {
  const am = useLocale() === "am";
  const all = useAllScholarships();
  const L = am ? AM : EN;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const today = now ? new Date(now) : null;
  const dayKey = today ? today.toDateString() : "";

  const dots = useMemo<Dot[]>(() => {
    if (!dayKey) return [];
    const t0 = new Date(dayKey).getTime();
    const lane: Record<number, number> = {};
    return all
      .filter((s) => s.deadline)
      .map((s) => {
        let at = new Date(s.deadline!);
        while (at.getTime() < t0) at = new Date(at.getFullYear() + 1, at.getMonth(), at.getDate());
        return { s, at };
      })
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map(({ s, at }) => {
        const mi = at.getMonth();
        const k = (lane[mi] = (lane[mi] ?? -1) + 1);
        const m = mi + (at.getDate() - 1) / 31 + (k % 3) * 0.06;
        const [x, y] = polar(m, R_IN + 22 + ((k * 23) % 96));
        return { s, m, x, y, at, days: Math.ceil((at.getTime() - t0) / DAY) };
      });
  }, [all, dayKey]);

  const rolling = all.filter((s) => !s.deadline).length;
  const perMonth = Array.from({ length: 12 }, (_, i) => dots.filter((d) => d.at.getMonth() === i).length);
  const maxM = Math.max(1, ...perMonth);
  const [hover, setHover] = useState<Dot | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const focus = hover ?? dots[0] ?? null;
  const todayM = today ? today.getMonth() + (today.getDate() - 1) / 31 : 0;
  const [hx, hy] = polar(todayM, R_OUT + 8);
  const list = (month === null ? dots : dots.filter((d) => d.at.getMonth() === month)).slice(0, 5);
  const in30 = dots.filter((d) => d.days <= 30).length;

  return (
    <section className="relative overflow-hidden bg-[var(--lbg)] py-28 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-red/50 to-transparent" />
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "05 — የማመልከቻ ራዳር" : "05 — DEADLINE RADAR"}</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          {am ? "ዓመቱ በሙሉ፣ በአንድ ራዳር ላይ።" : <>The whole year, <span className="text-red-300">on one radar.</span></>}
        </h2>
        <p className="mt-4 max-w-xl text-sm text-white/55">
          {am ? "እያንዳንዱ ነጥብ ስኮላርሺፕ ነው። ቀይ በቅርቡ ይዘጋል፣ ወርቅ በ3 ወር ውስጥ፣ አረንጓዴ ጊዜ አለዎት።" : "Every dot is a scholarship. Red closes soon, gold within 3 months, green — you have time. Hover to lock on."}
        </p>

        <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          {/* radar wheel */}
          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -20 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 60, damping: 16 }}
            className="relative mx-auto w-full min-w-0 max-w-[560px]">
            <div aria-hidden className="radar-sweep absolute inset-[7%] rounded-full" />
            <svg viewBox={`0 0 ${S} ${S}`} className="relative w-full">
              {[R_IN, R_IN + 40, R_IN + 80, R_OUT - 2].map((r) => <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="currentColor" strokeOpacity=".08" strokeDasharray={r === R_OUT - 2 ? undefined : "3 6"} />)}
              {Array.from({ length: 12 }, (_, i) => {
                const on = month === i, heat = perMonth[i] / maxM;
                const [lx, ly] = polar(i + 0.5, R_OUT + 24);
                return (
                  <g key={i} className="cursor-pointer" onClick={() => setMonth(on ? null : i)}>
                    <path d={sector(i, R_OUT + 10, R_OUT)} fill={on ? "#f2b705" : "currentColor"} fillOpacity={on ? 1 : 0.08 + heat * 0.35} className="transition-all" />
                    <path d={sector(i, R_OUT - 2, R_IN)} fill={on ? "#f2b705" : "transparent"} fillOpacity=".06" className="hover:fill-current hover:[fill-opacity:.04]" />
                    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className={cn("font-mono text-[11px] font-bold", on ? "fill-[#f2b705]" : "fill-current opacity-50")}>{L[i]}</text>
                  </g>
                );
              })}
              {today && (
                <g>
                  <line x1={C} y1={C} x2={hx} y2={hy} stroke="#e23b3b" strokeWidth="2" strokeDasharray="4 4" />
                  <circle cx={hx} cy={hy} r="6" fill="#e23b3b" />
                  <circle cx={hx} cy={hy} r="6" fill="none" stroke="#e23b3b" className="radar-ping" />
                </g>
              )}
              {dots.map((d, i) => {
                const dim = month !== null && d.at.getMonth() !== month;
                const on = focus?.s.id === d.s.id;
                return (
                  <motion.g key={d.s.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: dim ? 0.15 : 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.02 }}
                    style={{ transformOrigin: `${d.x}px ${d.y}px` }} className="cursor-pointer"
                    onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)} onClick={() => setHover(d)}>
                    <circle cx={d.x} cy={d.y} r="14" fill="transparent" />
                    {on && <circle cx={d.x} cy={d.y} r="13" fill="none" stroke={tone(d.days)} strokeWidth="2" className="radar-ping" />}
                    <circle cx={d.x} cy={d.y} r={on ? 7 : 5} fill={tone(d.days)} style={{ filter: `drop-shadow(0 0 6px ${tone(d.days)})`, transition: "r .2s" }} />
                  </motion.g>
                );
              })}
              {focus && <line x1={C} y1={C} x2={focus.x} y2={focus.y} stroke={tone(focus.days)} strokeOpacity=".5" strokeWidth="1.5" />}
            </svg>
            {/* core */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="grid h-[38%] w-[38%] place-items-center rounded-full border border-white/10 bg-[color-mix(in_srgb,var(--lbg)_88%,transparent)] p-3 text-center shadow-2xl backdrop-blur">
                <AnimatePresence mode="wait">
                  {focus ? (
                    <motion.div key={focus.s.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.18 }}>
                      <div className="text-2xl">{flagFor(focus.s.country)}</div>
                      <div className="font-mono text-3xl font-black leading-none sm:text-4xl" style={{ color: tone(focus.days) }}>{focus.days}</div>
                      <div className="font-mono text-[9px] tracking-[0.2em] text-white/50">{am ? "ቀናት ቀርተዋል" : "DAYS LEFT"}</div>
                      <div className="mx-auto mt-1 line-clamp-2 max-w-[150px] text-[10px] font-semibold leading-tight text-white/80">{focus.s.title}</div>
                    </motion.div>
                  ) : (
                    <Radar className="text-white/30" />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* mission panel */}
          <div className="min-w-0 space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.25em] text-white/45">
                <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-red" />{am ? "ቀጣዩ መዝጊያ" : "NEXT TO CLOSE"}</span>
                {dots[0] && <span>{flagFor(dots[0].s.country)} {dots[0].s.country}</span>}
              </div>
              {dots[0] && now ? (
                <>
                  <Link href={`/scholarships/${dots[0].s.id}`} className="mt-3 block text-lg font-bold leading-snug hover:text-gold">{dots[0].s.title}</Link>
                  <div className="mt-5"><Countdown at={new Date(dots[0].at.getTime() + DAY - 1000)} now={now} am={am} /></div>
                </>
              ) : (
                <div className="mt-4 h-28 animate-pulse rounded-2xl bg-white/5" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { v: in30, l: am ? "በ30 ቀን ውስጥ" : "in 30 days", c: "text-red-300" },
                { v: dots.length, l: am ? "በራዳር ላይ" : "on radar", c: "text-gold" },
                { v: rolling, l: am ? "ተከታታይ" : "rolling", c: "text-emerald-300", icon: true },
              ].map((k) => (
                <div key={k.l} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className={cn("flex items-center gap-1 font-mono text-2xl font-black", k.c)}>{k.v}{k.icon && <InfinityIcon size={14} />}</div>
                  <div className="text-[11px] text-white/50">{k.l}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-mono tracking-[0.2em] text-white/45">{month === null ? (am ? "በቅርቡ የሚዘጉ" : "CLOSING SOON") : L[month]}</span>
                {month !== null && <button type="button" onClick={() => setMonth(null)} className="text-gold hover:underline">{am ? "ሁሉንም አሳይ" : "Show all"}</button>}
              </div>
              <AnimatePresence mode="wait">
                <motion.ul key={month ?? "all"} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-2">
                  {list.map((d) => (
                    <li key={d.s.id} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}>
                      <Link href={`/scholarships/${d.s.id}`} className={cn("group flex items-center gap-3 rounded-xl border bg-black/20 p-3 transition-all hover:translate-x-1", focus?.s.id === d.s.id ? "border-gold/50" : "border-white/10")}>
                        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: tone(d.days) }} />
                        <span className="text-lg">{flagFor(d.s.country)}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{d.s.title}</span>
                        <span className="shrink-0 font-mono text-xs font-bold" style={{ color: tone(d.days) }}>{am ? `${d.days} ቀን` : `${d.days}d`}</span>
                        <ArrowUpRight size={14} className="shrink-0 text-white/30 group-hover:text-gold" />
                      </Link>
                    </li>
                  ))}
                  {list.length === 0 && <li className="text-sm text-white/45">{am ? "በዚህ ወር ምንም የሚዘጋ የለም — ሰነዶችን ለማዘጋጀት ጥሩ ጊዜ።" : "Nothing closes this month — a perfect window to prep documents."}</li>}
                </motion.ul>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
