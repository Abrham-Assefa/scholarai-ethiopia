"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { motion, useSpring, useTransform } from "motion/react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mirrors services/ai/scholarai_ai/cv_maker/gpa.py (modified Bavarian formula, Nmin = 2.0). */
export function convertGpa(g: number) {
  const c = Math.max(2, Math.min(4, g));
  const german = Math.round((1 + (3 * (4 - c)) / 2) * 10) / 10;
  const germanLabel = german <= 1.5 ? "sehr gut" : german <= 2.5 ? "gut" : german <= 3.5 ? "befriedigend" : "ausreichend";
  const uk = g >= 3.7 ? ["1st", "First-class honours"] : g >= 3.3 ? ["2:1", "Upper second-class"] : g >= 2.7 ? ["2:2", "Lower second-class"] : g >= 2 ? ["3rd", "Third-class"] : ["—", "Fail"];
  const bands: [number, string][] = [[3.85, "A"], [3.5, "A-"], [3.15, "B+"], [2.85, "B"], [2.5, "B-"], [2.15, "C+"], [1.85, "C"], [1.5, "C-"], [1, "D"]];
  const letter = bands.find(([cut]) => g >= cut)?.[1] ?? "F";
  return { german, germanLabel, uk, letter, pct: Math.round((g / 4) * 1000) / 10 };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const clampG = (x: number) => r2(Math.max(2, Math.min(4, x)));

function Num({ v, d = 1 }: { v: number; d?: number }) {
  const s = useSpring(v, { stiffness: 140, damping: 20 });
  useEffect(() => s.set(v), [v, s]);
  const t = useTransform(s, (x) => x.toFixed(d));
  return <motion.span>{t}</motion.span>;
}

function Flip({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("relative inline-block overflow-hidden align-bottom", className)}>
      <motion.span key={text} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="inline-block">{text}</motion.span>
    </span>
  );
}

/* ---------- circular dial ---------- */
const SIZE = 360, CX = 180, CY = 180, R = 124, START = 135, SWEEP = 270;
const pt = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180;
  return [r2(CX + r * Math.cos(a)), r2(CY + r * Math.sin(a))] as const;
};
const [sx, sy] = pt(START), [ex, ey] = pt(START + SWEEP);
const ARC = `M${sx} ${sy} A${R} ${R} 0 1 1 ${ex} ${ey}`;
const TICKS = Array.from({ length: 21 }, (_, i) => {
  const deg = START + (SWEEP * i) / 20, major = i % 5 === 0;
  const [x1, y1] = pt(deg, R + 14), [x2, y2] = pt(deg, R + (major ? 26 : 20));
  const [lx, ly] = pt(deg, R + 38);
  return { x1, y1, x2, y2, major, lx, ly, label: (2 + i * 0.1).toFixed(1) };
});

function ethClass(g: number, am: boolean) {
  if (g >= 3.75) return am ? "እጅግ ከፍተኛ ማዕረግ" : "Very Great Distinction";
  if (g >= 3.25) return am ? "ከፍተኛ ማዕረግ" : "Great Distinction";
  if (g >= 2.75) return am ? "ማዕረግ" : "Distinction";
  return am ? "አጥጋቢ" : "Satisfactory";
}

function Dial({ g, setG, am }: { g: number; setG: (n: number) => void; am: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const p = useSpring((g - 2) / 2, { stiffness: 160, damping: 22 });
  useEffect(() => p.set((g - 2) / 2), [g, p]);
  const kx = useTransform(p, (v) => pt(START + SWEEP * v)[0]);
  const ky = useTransform(p, (v) => pt(START + SWEEP * v)[1]);

  const fromPointer = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * SIZE - CX;
    const y = ((e.clientY - box.top) / box.height) * SIZE - CY;
    let rel = ((Math.atan2(y, x) * 180) / Math.PI - START + 720) % 360;
    if (rel > SWEEP) rel = rel > SWEEP + (360 - SWEEP) / 2 ? 0 : SWEEP;
    setG(clampG(2 + (rel / SWEEP) * 2));
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      {/* pulsing aura */}
      <motion.div aria-hidden className="absolute inset-[18%] rounded-full blur-3xl"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.95, 1.05, 0.95] }} transition={{ duration: 4, repeat: Infinity }}
        style={{ background: `radial-gradient(circle, ${g >= 3.3 ? "rgba(21,168,84,.55)" : g >= 2.75 ? "rgba(242,183,5,.5)" : "rgba(226,59,59,.5)"}, transparent 70%)` }} />
      <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative w-full touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); fromPointer(e); }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)} onPointerCancel={() => (dragging.current = false)}>
        <defs>
          <linearGradient id="gx-arc" x1="0" y1="1" x2="1" y2="1">
            <stop offset="0" stopColor="#e23b3b" /><stop offset=".5" stopColor="#f2b705" /><stop offset="1" stopColor="#15a854" />
          </linearGradient>
          <filter id="gx-glow"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {/* rotating orbit ring */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ originX: "50%", originY: "50%" }}>
          <circle cx={CX} cy={CY} r={R - 22} fill="none" stroke="currentColor" strokeOpacity=".12" strokeDasharray="2 8" />
        </motion.g>
        {TICKS.map((t, i) => (
          <g key={i}>
            <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeOpacity={t.major ? 0.6 : 0.2} strokeWidth={t.major ? 2 : 1} />
            {t.major && <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle" className="fill-current font-mono text-[10px] opacity-40">{t.label}</text>}
          </g>
        ))}
        <path d={ARC} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="14" strokeLinecap="round" />
        <motion.path d={ARC} fill="none" stroke="url(#gx-arc)" strokeWidth="14" strokeLinecap="round" filter="url(#gx-glow)" opacity=".7" style={{ pathLength: p }} />
        <motion.path d={ARC} fill="none" stroke="url(#gx-arc)" strokeWidth="14" strokeLinecap="round" style={{ pathLength: p }} />
        <motion.circle cx={kx} cy={ky} r="20" fill="#f2b705" initial={{ opacity: 0.15 }} animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <motion.circle cx={kx} cy={ky} r="11" fill="#fff" stroke="#f2b705" strokeWidth="5" />
      </svg>
      {/* centre readout */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.25em] text-white/50"><span className="text-base">🇪🇹</span>ETH · 4.0</span>
        <p className="font-mono text-6xl font-black tabular-nums tracking-tight sm:text-7xl"><Num v={g} d={2} /></p>
        <span className="mt-1 text-xs font-semibold text-gold"><Flip text={ethClass(g, am)} /></span>
      </div>
    </div>
  );
}

/* ---------- destination card ---------- */
function Card({ i, flag, sys, note, big, sub, good, meter }: { i: number; flag: string; sys: string; note: string; big: ReactNode; sub: string; good: boolean; meter: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
      transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 160, damping: 20 }}
      whileHover={{ y: -6, rotateX: 4, rotateY: i % 2 ? -4 : 4 }} style={{ transformPerspective: 900 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[color-mix(in_srgb,var(--lbg)_85%,transparent)] p-5 shadow-2xl backdrop-blur-xl transition-colors hover:border-gold/50">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.span whileHover={{ rotate: [0, -12, 12, 0] }} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-2xl">{flag}</motion.span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{sys}</p>
            <p className="text-[11px] text-white/45">{note}</p>
          </div>
        </div>
        <motion.span key={String(good)} initial={{ scale: 0 }} animate={{ scale: 1 }}
          className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", good ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-gold shadow-[0_0_12px_#f2b705]")} />
      </div>
      <div className="mt-5 flex items-end justify-between gap-2">
        <p className="font-mono text-4xl font-black tabular-nums leading-none">{big}</p>
        <p className={cn("text-right text-xs font-semibold", good ? "text-emerald-300" : "text-white/55")}><Flip text={sub} /></p>
      </div>
      <div className="mt-4">{meter}</div>
    </motion.div>
  );
}

function Bar({ v }: { v: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-[#e23b3b] via-[#f2b705] to-[#15a854]" animate={{ width: `${Math.max(4, Math.min(100, v * 100))}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
    </div>
  );
}

function Segments({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div className="flex gap-1">
      {labels.map((l, i) => (
        <div key={l} className="flex-1 text-center">
          <motion.div className="h-1.5 rounded-full" animate={{ backgroundColor: i === active ? "#f2b705" : i < active ? "rgba(21,168,84,.6)" : "rgba(127,127,127,.2)" }} />
          <span className={cn("mt-1 block font-mono text-[9px]", i === active ? "text-gold" : "text-white/35")}>{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- beams (desktop) ---------- */
const BEAMS = ["M372 215 C 340 200 340 140 305 140", "M628 215 C 660 200 660 140 695 140", "M372 345 C 340 360 340 420 305 420", "M628 345 C 660 360 660 420 695 420"];

function Beams({ g }: { g: number }) {
  const col = g >= 3.3 ? "#15a854" : g >= 2.75 ? "#f2b705" : "#e23b3b";
  return (
    <svg aria-hidden viewBox="0 0 1000 560" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block">
      {BEAMS.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d={d} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" className="gx-flow" style={{ animationDelay: `${i * -0.3}s`, transition: "stroke .4s" }} vectorEffect="non-scaling-stroke" />
          <circle r="4" fill={col} style={{ transition: "fill .4s" }}>
            <animateMotion dur="1.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" path={d} />
          </circle>
        </g>
      ))}
    </svg>
  );
}

const PRESETS = [2.75, 3.0, 3.25, 3.5, 3.75, 4.0];

export function GpaExchange() {
  const am = useLocale() === "am";
  const [g, setG] = useState(3.42);
  const c = convertGpa(g);
  const step = (d: number) => setG((x) => clampG(x + d));
  const ukIdx = { "3rd": 0, "2:2": 1, "2:1": 2, "1st": 3 }[c.uk[0]] ?? 0;
  const letters = ["C", "B-", "B", "B+", "A-", "A"];
  const letterIdx = Math.max(0, letters.indexOf(c.letter));

  const cards = [
    { flag: "🇩🇪", sys: am ? "ጀርመን" : "Germany", note: am ? "ባቫሪያን ቀመር · 1.0 ምርጥ" : "Bavarian formula · 1.0 best", big: <Num v={c.german} />, sub: c.germanLabel, good: c.german <= 2.5, meter: <Bar v={(4 - c.german) / 3} /> },
    { flag: "🇬🇧", sys: am ? "እንግሊዝ" : "United Kingdom", note: am ? "ብዙ ማስተርስ 2:1 ይጠይቃሉ" : "Most MSc offers ask for 2:1", big: <Flip text={c.uk[0]} />, sub: c.uk[1], good: g >= 3.3, meter: <Segments labels={["3rd", "2:2", "2:1", "1st"]} active={ukIdx} /> },
    { flag: "🇺🇸", sys: am ? "አሜሪካ" : "United States", note: am ? "ብዙ ፕሮግራሞች ≥3.0 ይፈልጋሉ" : "Grad programs screen at 3.0", big: <Flip text={c.letter} className="text-gold" />, sub: am ? "የፊደል ውጤት" : "letter grade", good: g >= 3.3, meter: <Segments labels={letters} active={letterIdx} /> },
    { flag: "🌍", sys: am ? "መቶኛ" : "Percentage", note: am ? "ለማመልከቻ ቅጾች" : "For portals that ask for %", big: <><Num v={c.pct} /><span className="text-2xl">%</span></>, sub: am ? "የተመጣጠነ" : "linear equivalent", good: c.pct >= 80, meter: <Bar v={c.pct / 100} /> },
  ];
  const ticker = [2.5, 2.8, 3.0, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0].map((x) => `${x.toFixed(1)} ETH → ${convertGpa(x).german.toFixed(1)} DE · ${convertGpa(x).uk[0]} UK · ${convertGpa(x).letter} US`);

  return (
    <section className="relative overflow-hidden bg-[var(--lbg)] pb-28 pt-4 text-white">
      <div className="border-y border-white/10 bg-black/30 py-2.5">
        <div className="ticker flex w-max gap-10 whitespace-nowrap font-mono text-xs text-white/55">
          {[...ticker, ...ticker].map((t, i) => <span key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{t}</span>)}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "04 — የውጤት ምንዛሬ" : "04 — GPA EXCHANGE"}</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            {am ? "GPAዎ ይጓዛል። በውጭ ምን ያህል ዋጋ እንዳለው ይመልከቱ።" : <>Your GPA travels. <span className="text-gold">See what it&apos;s worth abroad.</span></>}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/55">
            {am ? "መደወያውን ያሽከርክሩ — ውጤትዎ በአራት የውጤት ስርዓቶች በቀጥታ ይቀየራል።" : "Spin the dial — your grade converts live into four grading systems."}
          </p>
        </div>

        <div className="relative mt-14 grid items-center gap-5 lg:min-h-[560px] lg:grid-cols-[1fr_minmax(320px,360px)_1fr] lg:grid-rows-2 lg:gap-x-10">
          <Beams g={g} />
          <div className="relative z-10 order-first lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Dial g={g} setG={setG} am={am} />
            <div className="mt-2 flex items-center justify-center gap-4">
              <button type="button" aria-label="decrease" onClick={() => step(-0.05)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition-colors hover:border-gold hover:text-gold"><Minus size={16} /></button>
              <input type="range" min={2} max={4} step={0.01} value={g} onChange={(e) => setG(Number(e.target.value))} aria-label={am ? "የኢትዮጵያ GPA" : "Ethiopian GPA"} className="gpa-range w-36" style={{ ["--p" as string]: `${((g - 2) / 2) * 100}%` }} />
              <button type="button" aria-label="increase" onClick={() => step(0.05)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition-colors hover:border-gold hover:text-gold"><Plus size={16} /></button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {PRESETS.map((v) => (
                <button key={v} type="button" onClick={() => setG(v)}
                  className={cn("rounded-full border px-3 py-1 font-mono text-[11px] transition-all", Math.abs(g - v) < 0.005 ? "border-gold bg-gold text-[#0b1a2e]" : "border-white/15 text-white/60 hover:border-gold/60 hover:text-gold")}>
                  {v.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
          {cards.map((cd, i) => (
            <div key={cd.flag} className={cn("relative z-10", i % 2 ? "lg:col-start-3" : "lg:col-start-1", i < 2 ? "lg:row-start-1" : "lg:row-start-2")}>
              <Card i={i} {...cd} />
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-center text-xs text-white/60">
          <Sparkles size={14} className="shrink-0 text-gold" />
          {am ? "በሲቪ ሰሪያችን ውስጥ ያለው ተመሳሳይ ቀመር — ለDAAD እና ለuni-assist ዝግጁ።" : "Same formula our CV maker prints on your Europass — ready for DAAD & uni-assist."}
        </motion.div>
      </div>
    </section>
  );
}
