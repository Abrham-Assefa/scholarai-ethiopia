"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useSpring, useTransform } from "motion/react";
import { ArrowRightLeft, Minus, Plus } from "lucide-react";
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

function Num({ v, d = 1 }: { v: number; d?: number }) {
  const s = useSpring(v, { stiffness: 140, damping: 20 });
  useEffect(() => s.set(v), [v, s]);
  const t = useTransform(s, (x) => x.toFixed(d));
  return <motion.span>{t}</motion.span>;
}

function Flip({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("relative inline-block overflow-hidden align-bottom", className)}>
      <motion.span key={text} initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="inline-block">{text}</motion.span>
    </span>
  );
}

export function GpaExchange() {
  const am = useLocale() === "am";
  const [g, setG] = useState(3.42);
  const c = convertGpa(g);
  const step = (d: number) => setG((x) => Math.round(Math.max(2, Math.min(4, x + d)) * 100) / 100);
  const rows = [
    { flag: "🇩🇪", sys: am ? "ጀርመን · ባቫሪያን ቀመር" : "Germany · Bavarian formula", big: <Num v={c.german} />, sub: c.germanLabel, note: am ? "1.0 ምርጥ · 4.0 ማለፊያ" : "1.0 best · 4.0 pass", good: c.german <= 2.5 },
    { flag: "🇬🇧", sys: am ? "እንግሊዝ · የዲግሪ ክፍል" : "United Kingdom · Degree class", big: <Flip text={c.uk[0]} />, sub: c.uk[1], note: am ? "ብዙ ማስተርስ 2:1 ይጠይቃሉ" : "Most MSc offers ask for a 2:1", good: g >= 3.3 },
    { flag: "🇺🇸", sys: am ? "አሜሪካ · GPA እና ፊደል" : "United States · GPA & letter", big: <><Num v={g} d={2} /><span className="ml-2 text-gold"><Flip text={c.letter} /></span></>, sub: am ? "በ4.0 ሚዛን" : "on the 4.0 scale", note: am ? "ብዙ ፕሮግራሞች ≥3.0 ይፈልጋሉ" : "Many grad programs screen at 3.0", good: g >= 3.3 },
    { flag: "🌍", sys: am ? "መቶኛ" : "Percentage", big: <><Num v={c.pct} />%</>, sub: am ? "የተመጣጠነ" : "linear equivalent", note: am ? "ለማመልከቻ ቅጾች" : "for portals that ask for %", good: c.pct >= 80 },
  ];
  const ticker = [2.5, 2.8, 3.0, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0].map((x) => `${x.toFixed(1)} ETH → ${convertGpa(x).german.toFixed(1)} DE · ${convertGpa(x).uk[0]} UK · ${convertGpa(x).letter} US`);

  return (
    <section className="relative overflow-hidden bg-[var(--lbg)] pb-28 pt-4 text-white">
      {/* exchange ticker */}
      <div className="border-y border-white/10 bg-black/30 py-2.5">
        <div className="ticker flex w-max gap-10 whitespace-nowrap font-mono text-xs text-white/55">
          {[...ticker, ...ticker].map((t, i) => <span key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{t}</span>)}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "04 — የውጤት ምንዛሬ" : "04 — GPA EXCHANGE"}</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          {am ? "GPAዎ ይጓዛል። በውጭ ምን ያህል ዋጋ እንዳለው ይመልከቱ።" : <>Your GPA travels. <span className="text-gold">See what it&apos;s worth abroad.</span></>}
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          {/* input card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/15 via-white/[0.03] to-transparent p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold"><span className="text-2xl">🇪🇹</span>{am ? "የኢትዮጵያ GPA" : "Ethiopian GPA"}</span>
              <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-white/50">ETH · 4.0</span>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <button type="button" aria-label="decrease" onClick={() => step(-0.05)} className="grid h-12 w-12 place-items-center rounded-full border border-white/15 transition-colors hover:border-gold hover:text-gold"><Minus size={18} /></button>
              <p className="font-mono text-7xl font-black tabular-nums tracking-tight sm:text-8xl"><Num v={g} d={2} /></p>
              <button type="button" aria-label="increase" onClick={() => step(0.05)} className="grid h-12 w-12 place-items-center rounded-full border border-white/15 transition-colors hover:border-gold hover:text-gold"><Plus size={18} /></button>
            </div>
            <input type="range" min={2} max={4} step={0.01} value={g} onChange={(e) => setG(Number(e.target.value))} aria-label={am ? "የኢትዮጵያ GPA" : "Ethiopian GPA"} className="gpa-range mt-8 w-full" style={{ ["--p" as string]: `${((g - 2) / 2) * 100}%` }} />
            <div className="mt-2 flex justify-between font-mono text-[10px] text-white/35"><span>2.00</span><span>3.00</span><span>4.00</span></div>
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
              <ArrowRightLeft size={16} className="shrink-0 text-gold" />
              {am ? "በሲቪ ሰሪያችን ውስጥ ያለው ተመሳሳይ ቀመር — ለDAAD እና ለuni-assist ዝግጁ።" : "Same formula our CV maker prints on your Europass — ready for DAAD & uni-assist."}
            </div>
          </div>

          {/* exchange board */}
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 font-mono text-[10px] tracking-[0.25em] text-white/40">
              <span>{am ? "ስርዓት" : "SYSTEM"}</span><span>{am ? "የእርስዎ ውጤት" : "YOUR GRADE"}</span>
            </div>
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <motion.li key={r.sys} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-black/30 px-4 py-4 transition-colors hover:border-gold/40 sm:px-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">{r.flag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{r.sys}</p>
                    <p className="text-[11px] text-white/45">{r.note}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-3xl font-black tabular-nums">{r.big}</p>
                    <p className={cn("text-[11px] font-semibold", r.good ? "text-emerald-300" : "text-white/50")}>{r.sub}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
