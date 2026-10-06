"use client";
import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Level, Scholarship } from "@/lib/types";
import { cn } from "@/lib/utils";
import { airportFor, fmtDeadline, useAllScholarships } from "./geo";

const LEVELS: { v: Level; en: string; am: string }[] = [
  { v: "bachelor", en: "Bachelor's", am: "ባችለር" },
  { v: "master", en: "Master's", am: "ማስተርስ" },
  { v: "phd", en: "PhD", am: "ፒኤችዲ" },
];
const FIELDS = ["Engineering", "Health", "Business", "Computer Science", "Agriculture", "Any"];

/** Client-side heuristic so the demo feels instant; the real matcher runs after onboarding. */
export function score(s: Scholarship, gpa: number, field: string) {
  const min = s.eligibility.minGpa ?? (s.country === "Ethiopia" ? 2.8 : s.fundingType === "full" ? 3.4 : 3.1);
  const competitive = s.country !== "Ethiopia" && s.fundingType === "full";
  let p = competitive ? 40 + (gpa - min) * 55 : 58 + Math.min(gpa - min, 0.4) * 25;
  if (gpa < min) p -= competitive ? 25 : 10;
  if (field !== "Any" && s.fields.some((f) => f.toLowerCase().includes(field.toLowerCase().split(" ")[0]))) p += 18;
  if (s.fundingType === "full") p += 6;
  if ((s.daysLeft ?? 99) < 20) p -= 8;
  if (s.daysLeft === null) p -= 4;
  if (s.eligibility.workYearsMin) p -= s.eligibility.workYearsMin * 5;
  if (!s.eligibility.englishTest) p += 3;
  // Stable per-scholarship spread (competitiveness) so ties don't look artificial.
  p += ([...s.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 9) - 4;
  return Math.round(Math.max(8, Math.min(97, p)));
}

export function FlightSearch() {
  const am = useLocale() === "am";
  const all = useAllScholarships();
  const [level, setLevel] = useState<Level>("master");
  const [gpa, setGpa] = useState(3.6);
  const [field, setField] = useState("Engineering");
  const pool = useMemo(() => all.filter((s) => s.level.includes(level)), [all, level]);
  const top = pool.map((s) => ({ s, p: score(s, gpa, field) })).sort((a, b) => b.p - a.p).slice(0, 5);
  const pct = ((gpa - 2) / 2) * 100;

  return (
    <section className="relative overflow-hidden bg-[#050b16] py-28 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "04 — ይሞክሩት" : "04 — TRY IT LIVE"}</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{am ? "ተንሸራታቹን ያንቀሳቅሱ። ዕድሎችዎ ይቀየራሉ።" : <>Move the slider. <span className="text-emerald-300">Watch your odds move.</span></>}</h2>

        <div className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-7">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "ደረጃ" : "CLASS"}</p>
              <div className="relative mt-3 inline-flex rounded-full border border-white/10 bg-black/30 p-1">
                {LEVELS.map((l) => (
                  <button key={l.v} type="button" onClick={() => setLevel(l.v)} className={cn("relative rounded-full px-4 py-2 text-sm font-semibold transition-colors", level === l.v ? "text-black" : "text-white/70 hover:text-white")}>
                    {level === l.v && <motion.span layoutId="lvl" className="absolute inset-0 rounded-full bg-gold" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                    <span className="relative">{am ? l.am : l.en}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-end justify-between">
                <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">GPA</p>
                <motion.span key={gpa.toFixed(1)} initial={{ scale: 1.25, color: "#f2b705" }} animate={{ scale: 1, color: "#ffffff" }} className="font-mono text-4xl font-black tabular-nums">{gpa.toFixed(2)}</motion.span>
              </div>
              <div className="relative mt-4 h-10">
                <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/10" />
                <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-red via-gold to-primary" style={{ width: `${pct}%` }} />
                <div className="pointer-events-none absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm text-black shadow-[0_0_0_6px_rgba(242,183,5,.25)]" style={{ left: `${pct}%` }}>✈</div>
                <input type="range" min={2} max={4} step={0.05} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} aria-label="GPA" className="absolute inset-0 w-full cursor-pointer opacity-0" />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-white/30"><span>2.00</span><span>3.00</span><span>4.00</span></div>
            </div>
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "መስክ" : "FIELD"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FIELDS.map((f) => (
                  <motion.button whileTap={{ scale: 0.9 }} key={f} type="button" onClick={() => setField(f)} className={cn("rounded-full border px-3.5 py-1.5 text-xs transition-colors", field === f ? "border-gold bg-gold/15 font-semibold text-gold" : "border-white/15 text-white/70 hover:border-white/40")}>{f}</motion.button>
                ))}
              </div>
            </div>
            <Link href="/onboarding" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-bold text-white transition-shadow hover:shadow-[0_0_40px_-5px_rgba(21,168,84,.8)]">
              <Sparkles size={16} />{am ? "ሙሉ ሪፖርቴን ስጠኝ" : "Get my full match report"}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div>
            <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "ምርጥ በረራዎች" : "BEST ROUTES"} · {pool.length} {am ? "ስኮላርሺፖች" : "SCHOLARSHIPS"}</p>
            <LayoutGroup>
              <ul className="space-y-2.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {top.map(({ s, p }, i) => (
                    <motion.li key={s.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}>
                      <Link href={`/scholarships/${s.id}`} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-3 transition-colors hover:border-gold/50">
                        <span className="w-6 text-center font-mono text-lg font-black text-white/30">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{s.title}</p>
                          <p className="font-mono text-[11px] text-white/45">ADD → {airportFor(s.country).code} · {s.country} · {fmtDeadline(s)}</p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.div className={cn("h-full rounded-full", p >= 70 ? "bg-primary" : p >= 45 ? "bg-gold" : "bg-red")} animate={{ width: `${p}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                          </div>
                        </div>
                        <span className={cn("font-mono text-2xl font-black tabular-nums", p >= 70 ? "text-emerald-300" : p >= 45 ? "text-gold" : "text-red-300")}>{p}%</span>
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {top.length === 0 && Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-[74px] animate-pulse rounded-2xl bg-white/5" />)}
              </ul>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
