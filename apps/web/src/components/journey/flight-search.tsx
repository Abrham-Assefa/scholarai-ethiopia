"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Radar, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Level, Scholarship } from "@/lib/types";
import { cn } from "@/lib/utils";
import { flagFor, useAllScholarships } from "./geo";

const LEVELS: { v: Level; en: string; am: string; short: string }[] = [
  { v: "bachelor", en: "Bachelor's", am: "ባችለር", short: "UG" },
  { v: "master", en: "Master's", am: "ማስተርስ", short: "MSc" },
  { v: "phd", en: "PhD", am: "ፒኤችዲ", short: "PhD" },
];
const FIELDS: { v: string; icon: string; am: string }[] = [
  { v: "Engineering", icon: "⚙️", am: "ምህንድስና" },
  { v: "Health", icon: "🩺", am: "ጤና" },
  { v: "Business", icon: "📈", am: "ቢዝነስ" },
  { v: "Computer Science", icon: "💻", am: "ኮምፒውተር ሳይንስ" },
  { v: "Agriculture", icon: "🌾", am: "ግብርና" },
  { v: "Any", icon: "✨", am: "ማንኛውም" },
];

const minBar = (s: Scholarship) => s.eligibility.minGpa ?? (s.country === "Ethiopia" ? 2.8 : s.fundingType === "full" ? 3.4 : 3.1);
const fieldHit = (s: Scholarship, field: string) => field !== "Any" && s.fields.some((f) => f.toLowerCase().includes(field.toLowerCase().split(" ")[0]));

/** Client-side heuristic so the demo feels instant; the real matcher runs after onboarding. */
export function score(s: Scholarship, gpa: number, field: string) {
  const min = minBar(s);
  const competitive = s.country !== "Ethiopia" && s.fundingType === "full";
  let p = competitive ? 40 + (gpa - min) * 55 : 58 + Math.min(gpa - min, 0.4) * 25;
  if (gpa < min) p -= competitive ? 25 : 10;
  if (fieldHit(s, field)) p += 18;
  if (s.fundingType === "full") p += 6;
  if ((s.daysLeft ?? 99) < 20) p -= 8;
  if (s.daysLeft === null) p -= 4;
  if (s.eligibility.workYearsMin) p -= s.eligibility.workYearsMin * 5;
  if (!s.eligibility.englishTest) p += 3;
  // Stable per-scholarship spread (competitiveness) so ties don't look artificial.
  p += ([...s.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 9) - 4;
  return Math.round(Math.max(8, Math.min(97, p)));
}

function reasons(s: Scholarship, gpa: number, field: string, am: boolean) {
  const out: { ok: boolean; t: string }[] = [];
  const min = minBar(s);
  out.push(gpa >= min
    ? { ok: true, t: am ? `GPA ${gpa.toFixed(2)} ከ~${min.toFixed(1)} በላይ ነው` : `GPA ${gpa.toFixed(2)} clears the ~${min.toFixed(1)} bar` }
    : { ok: false, t: am ? `GPA ከ~${min.toFixed(1)} በታች — ሌሎች ጥንካሬዎችን ያሳዩ` : `Below the ~${min.toFixed(1)} bar — lean on research & essays` });
  if (fieldHit(s, field)) out.push({ ok: true, t: am ? `${field} ተቀባይነት ያለው መስክ ነው` : `${field} is an eligible field` });
  if (s.fundingType === "full") out.push({ ok: true, t: am ? "ሙሉ በሙሉ የተሸፈነ" : "Fully funded — tuition, stipend, flights" });
  if (!s.eligibility.englishTest) out.push({ ok: true, t: am ? "IELTS/TOEFL አያስፈልግም" : "No IELTS/TOEFL required" });
  else out.push({ ok: false, t: am ? `የእንግሊዝኛ ማስረጃ: ${s.eligibility.englishTest}` : `English proof: ${s.eligibility.englishTest}` });
  return out.slice(0, 3);
}

const tone = (p: number) => (p >= 70 ? "#15a854" : p >= 45 ? "#f2b705" : "#e23b3b");
const toneText = (p: number) => (p >= 70 ? "text-emerald-300" : p >= 45 ? "text-gold" : "text-red-300");

function Ring({ p, size, stroke = 6, children }: { p: number; size: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-white/10" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - p / 100), stroke: tone(p) }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Countdown({ s, am }: { s: Scholarship; am: boolean }) {
  const d = s.daysLeft;
  if (d === null || d === undefined) return <span className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/70">{am ? "ተከታታይ" : "Rolling"}</span>;
  const cls = d < 14 ? "border-red/40 bg-red/15 text-red-300" : d < 45 ? "border-gold/40 bg-gold/15 text-gold" : "border-primary/40 bg-primary/15 text-emerald-300";
  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums", cls)}>{am ? `በ${d} ቀናት` : `in ${d} days`}</span>;
}

/** Semicircular instrument gauge driven by the GPA slider. */
function GpaDial({ gpa }: { gpa: number }) {
  const W = 260, H = 150, cx = W / 2, cy = 135, R = 110;
  const f = (gpa - 2) / 2;
  const spring = useSpring(f, { stiffness: 160, damping: 18 });
  useEffect(() => spring.set(f), [f, spring]);
  const arc = (a0: number, a1: number, r: number) => {
    const p = (a: number) => [cx + r * Math.cos(Math.PI - a * Math.PI), cy - r * Math.sin(Math.PI - a * Math.PI)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${r2(x0)} ${r2(y0)} A ${r} ${r} 0 0 1 ${r2(x1)} ${r2(y1)}`;
  };
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const ticks = Array.from({ length: 17 }, (_, i) => i / 16);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px]" aria-hidden>
      <defs>
        <linearGradient id="dialg" x1="0" x2="1">
          <stop offset="0" stopColor="#e23b3b" /><stop offset=".5" stopColor="#f2b705" /><stop offset="1" stopColor="#15a854" />
        </linearGradient>
      </defs>
      <path d={arc(0, 1, R)} fill="none" strokeWidth={14} strokeLinecap="round" className="stroke-white/10" />
      <motion.path d={arc(0, 1, R)} fill="none" stroke="url(#dialg)" strokeWidth={14} strokeLinecap="round" style={{ pathLength: spring }} />
      {ticks.map((t) => {
        const a = Math.PI - t * Math.PI, big = t * 4 % 1 === 0;
        const r0 = R - 20, r1 = R - (big ? 32 : 26);
        return <line key={t} x1={r2(cx + r0 * Math.cos(a))} y1={r2(cy - r0 * Math.sin(a))} x2={r2(cx + r1 * Math.cos(a))} y2={r2(cy - r1 * Math.sin(a))} strokeWidth={big ? 2 : 1} className={big ? "stroke-white/50" : "stroke-white/20"} />;
      })}
      {[2, 2.5, 3, 3.5, 4].map((v, i) => {
        const a = Math.PI - (i / 4) * Math.PI, r = R - 44;
        return <text key={v} x={r2(cx + r * Math.cos(a))} y={r2(cy - r * Math.sin(a) + 4)} textAnchor="middle" className="fill-white/40 font-mono text-[10px]">{v.toFixed(1)}</text>;
      })}
      <g style={{ transform: `rotate(${-90 + f * 180}deg)`, transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box", transition: "transform .6s cubic-bezier(.34,1.56,.64,1)" }}>
        <path d={`M ${cx - 4} ${cy} L ${cx} ${cy - R + 18} L ${cx + 4} ${cy} Z`} className="fill-gold" />
      </g>
      <circle cx={cx} cy={cy} r={9} className="fill-gold" />
      <circle cx={cx} cy={cy} r={4} fill="#050b16" />
    </svg>
  );
}

export function FlightSearch() {
  const am = useLocale() === "am";
  const all = useAllScholarships();
  const [level, setLevel] = useState<Level>("master");
  const [gpa, setGpa] = useState(3.6);
  const [field, setField] = useState("Engineering");
  const pool = useMemo(() => all.filter((s) => s.level.includes(level)), [all, level]);
  const ranked = useMemo(() => pool.map((s) => ({ s, p: score(s, gpa, field) })).sort((a, b) => b.p - a.p), [pool, gpa, field]);
  const [best, ...rest] = ranked.slice(0, 5);
  const strong = ranked.filter((r) => r.p >= 70).length;
  const avg = ranked.length ? Math.round(ranked.reduce((a, r) => a + r.p, 0) / ranked.length) : 0;
  const full = pool.filter((s) => s.fundingType === "full").length;
  const soon = pool.filter((s) => s.daysLeft != null && s.daysLeft >= 0 && s.daysLeft <= 60).length;
  const pct = ((gpa - 2) / 2) * 100;
  const lvl = LEVELS.find((l) => l.v === level)!;

  return (
    <section className="relative overflow-hidden bg-[var(--lbg)] py-28 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="pointer-events-none absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gold/10 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-5">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "04 — ይሞክሩት" : "04 — TRY IT LIVE"}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{am ? "ተንሸራታቹን ያንቀሳቅሱ። ዕድሎችዎ ይቀየራሉ።" : <>Move the dial. <span className="text-emerald-300">Watch your odds move.</span></>}</h2>
          <p className="max-w-xs text-sm text-white/55">{am ? "ይህ ፈጣን ቅድመ-እይታ ነው — ሙሉ ማዛመጃው ከመገለጫዎ በኋላ ይሰራል።" : "An instant preview from live data — the full AI matcher runs after your 2-minute profile."}</p>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_40px_120px_-40px_rgba(0,0,0,.6)] backdrop-blur">
          <div className="cockpit-grid pointer-events-none absolute inset-0 opacity-60" />
          {/* instrument bar */}
          <div className="relative flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3 font-mono text-[11px] tracking-[0.2em] text-white/50 sm:px-8">
            <span className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>{am ? "ቀጥታ · የዕድል ሞተር" : "LIVE · ODDS ENGINE"}</span>
            <span className="hidden items-center gap-2 sm:flex"><Radar size={13} className="text-gold" />{pool.length} {am ? "መዳረሻዎች ተቃኝተዋል" : "ROUTES SCANNED"}</span>
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[380px_1fr]">
            {/* controls */}
            <div className="space-y-8 border-b border-white/10 p-5 sm:p-8 lg:border-b-0 lg:border-r">
              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "ደረጃ" : "CLASS"}</p>
                <div className="relative mt-3 grid grid-cols-3 rounded-2xl border border-white/10 bg-black/30 p-1">
                  {LEVELS.map((l) => (
                    <button key={l.v} type="button" onClick={() => setLevel(l.v)} className={cn("relative rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", level === l.v ? "text-black" : "text-white/70 hover:text-white")}>
                      {level === l.v && <motion.span layoutId="lvl" className="absolute inset-0 rounded-xl bg-gold shadow-[0_0_24px_-4px_rgba(242,183,5,.7)]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                      <span className="relative">{am ? l.am : l.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">GPA · 4.0</p>
                  <span className="font-mono text-[11px] text-white/40">{am ? "ይጎትቱ" : "drag ↔"}</span>
                </div>
                <div className="relative mx-auto mt-2 flex flex-col items-center">
                  <GpaDial gpa={gpa} />
                  <div className="-mt-1 text-center">
                    <motion.p key={gpa.toFixed(2)} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-mono text-4xl font-black tabular-nums">{gpa.toFixed(2)}</motion.p>
                  </div>
                </div>
                <div className="relative mt-4 h-8">
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
                  <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-red via-gold to-primary" style={{ width: `${pct}%` }} />
                  <div className="pointer-events-none absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fff] text-xs text-black shadow-[0_0_0_5px_rgba(242,183,5,.25)]" style={{ left: `${pct}%` }}>✈</div>
                  <input type="range" min={2} max={4} step={0.05} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} aria-label="GPA" className="absolute inset-0 w-full cursor-pointer opacity-0" />
                </div>
              </div>

              <div>
                <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "መስክ" : "FIELD"}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {FIELDS.map((f) => (
                    <motion.button whileTap={{ scale: 0.94 }} key={f.v} type="button" onClick={() => setField(f.v)} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors", field === f.v ? "border-gold bg-gold/15 font-semibold text-gold" : "border-white/10 bg-black/20 text-white/70 hover:border-white/30")}>
                      <span className="text-base">{f.icon}</span><span className="truncate">{am ? f.am : f.v}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Link href="/onboarding" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-[#fff] transition-shadow hover:shadow-[0_0_40px_-5px_rgba(21,168,84,.8)]">
                <Sparkles size={16} />{am ? "ሙሉ ሪፖርቴን ስጠኝ" : "Get my full match report"}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* results */}
            <div className="p-5 sm:p-8">
              <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "ምርጥ ተዛማጅ" : "TOP MATCH"}</p>
              <AnimatePresence mode="wait">
                {best ? (
                  <motion.div key={best.s.id} initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -16, filter: "blur(6px)" }} transition={{ duration: 0.35 }}
                    className="rounded-3xl bg-gradient-to-br from-gold/60 via-white/10 to-primary/60 p-px">
                    <div className="flex flex-col gap-6 rounded-[calc(1.5rem-1px)] bg-[var(--lbg)]/95 p-5 sm:flex-row sm:items-center sm:p-6">
                      <Ring p={best.p} size={132} stroke={10}>
                        <div className="text-center">
                          <p className={cn("font-mono text-4xl font-black tabular-nums", toneText(best.p))}>{best.p}<span className="text-lg">%</span></p>
                          <p className="font-mono text-[9px] tracking-[0.2em] text-white/40">{am ? "ዕድል" : "ODDS"}</p>
                        </div>
                      </Ring>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                          <span className="text-base">{flagFor(best.s.country)}</span>{best.s.country}
                          <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold">{lvl.short}</span>
                          {best.s.fundingType === "full" && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">{am ? "ሙሉ ስኮላርሺፕ" : "Fully funded"}</span>}
                          <Countdown s={best.s} am={am} />
                        </div>
                        <Link href={`/scholarships/${best.s.id}`} className="group mt-2 block">
                          <h3 className="text-xl font-bold leading-snug sm:text-2xl">{best.s.title}<ArrowUpRight size={18} className="ml-1 inline text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></h3>
                        </Link>
                        <ul className="mt-4 space-y-1.5">
                          {reasons(best.s, gpa, field, am).map((r) => (
                            <li key={r.t} className="flex items-start gap-2 text-sm">
                              <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px]", r.ok ? "bg-primary/20 text-emerald-300" : "bg-gold/20 text-gold")}>{r.ok ? <Check size={10} strokeWidth={3} /> : "!"}</span>
                              <span className="text-white/75">{r.t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[220px] animate-pulse rounded-3xl bg-white/5" />
                )}
              </AnimatePresence>

              <p className="mb-3 mt-7 font-mono text-[11px] tracking-[0.2em] text-white/40">{am ? "ሌሎች ጠንካራ አማራጮች" : "ALSO WORTH APPLYING"}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {rest.map(({ s, p }, i) => (
                    <motion.li key={s.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}>
                      <Link href={`/scholarships/${s.id}`} className="group flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 transition-all hover:-translate-y-0.5 hover:border-gold/50">
                        <Ring p={p} size={52} stroke={5}><span className="font-mono text-xs font-black tabular-nums">{p}</span></Ring>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">{s.title}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50"><span>{flagFor(s.country)}</span>{s.country}<span className="text-white/25">·</span>{s.daysLeft == null ? (am ? "ተከታታይ" : "Rolling") : am ? `በ${s.daysLeft} ቀናት` : `${s.daysLeft}d left`}</p>
                        </div>
                        <span className="font-mono text-[10px] text-white/25">#{i + 2}</span>
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {!best && Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-[78px] animate-pulse rounded-2xl bg-white/5" />)}
              </ul>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-white/40">
                  <span>{am ? "የዕድል ስርጭት" : "ODDS ACROSS EVERY ROUTE"}</span><span>{ranked.length}</span>
                </div>
                <div className="relative mt-4 h-14">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
                  {[45, 70].map((x) => <div key={x} className="absolute bottom-0 top-0 border-l border-dashed border-white/15" style={{ left: `${x}%` }}><span className="absolute -top-1 left-1 font-mono text-[9px] text-white/35">{x}%</span></div>)}
                  {ranked.map(({ s, p }, i) => (
                    <motion.span key={s.id} title={`${s.title} · ${p}%`} className="absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-[var(--lbg)]"
                      animate={{ left: `${p}%`, bottom: 4 + (i % 4) * 11, backgroundColor: tone(p) }} transition={{ type: "spring", stiffness: 140, damping: 18 }} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-white/40"><span>{am ? "ረጅም ጉዞ" : "Long shot"}</span><span>{am ? "ተወዳዳሪ" : "Competitive"}</span><span>{am ? "ጠንካራ" : "Strong fit"}</span></div>
              </div>
            </div>
          </div>

          {/* readouts */}
          <div className="relative grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
            {[
              { k: am ? "ጠንካራ ተዛማጆች" : "Strong fits ≥70%", v: strong, c: "text-emerald-300" },
              { k: am ? "አማካይ ዕድል" : "Average odds", v: `${avg}%`, c: "text-gold" },
              { k: am ? "ሙሉ ስኮላርሺፕ" : "Fully funded", v: full, c: "text-white" },
              { k: am ? "በ60 ቀናት ውስጥ" : "Closing ≤ 60 days", v: soon, c: "text-red-300" },
            ].map((x, i) => (
              <div key={x.k} className={cn("px-5 py-4 sm:px-8", i % 2 === 1 && "border-l border-white/10", i >= 2 && "border-t border-white/10 sm:border-t-0", i === 2 && "sm:border-l")}>
                <motion.p key={String(x.v)} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("font-mono text-2xl font-black tabular-nums", x.c)}>{x.v}</motion.p>
                <p className="mt-0.5 text-[11px] text-white/45">{x.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
