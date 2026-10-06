"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { Link } from "@/i18n/routing";
import type { Scholarship } from "@/lib/types";
import { ADDIS, airportFor, fmtDeadline, useAllScholarships } from "./geo";

function Barcode({ seed }: { seed: string }) {
  const bars = Array.from({ length: 34 }, (_, i) => ((seed.charCodeAt(i % seed.length) * (i + 7)) % 4) + 1);
  return <div className="flex h-10 items-stretch gap-[2px]">{bars.map((w, i) => <span key={i} className="bg-slate-900" style={{ width: w }} />)}</div>;
}

function BoardingPass({ s, i }: { s: Scholarship; i: number }) {
  const am = useLocale() === "am";
  const ap = airportFor(s.country);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const seat = s.fundingType === "full" ? "FULL" : "PART";
  const flight = `SA${(100 + i * 37) % 900}`;
  return (
    <motion.div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -10, y: ((e.clientX - r.left) / r.width - 0.5) * 14 });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      style={{ transformPerspective: 900 }}
      className="group shrink-0"
    >
      <Link href={`/scholarships/${s.id}`} className="flex w-[340px] overflow-hidden rounded-2xl bg-[#fbf7ec] text-slate-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)] sm:w-[520px]">
        <div className="relative flex-1 p-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-primary"><span className="flag-stripe h-2 w-4 rounded-sm" />SCHOLARAI AIR</span>
            <span className="font-mono text-[11px] text-slate-500">{am ? "የመሳፈሪያ ትኬት" : "BOARDING PASS"}</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div><p className="font-mono text-4xl font-black leading-none sm:text-5xl">{ADDIS.code}</p><p className="mt-1 text-[11px] text-slate-500">{ADDIS.city}</p></div>
            <div className="relative mx-3 mb-4 flex-1 border-t-2 border-dashed border-slate-300">
              <span className="absolute -top-[13px] left-0 text-lg text-primary transition-all duration-700 ease-out group-hover:left-[calc(100%-1rem)]">✈</span>
            </div>
            <div className="text-right"><p className="font-mono text-4xl font-black leading-none sm:text-5xl">{ap.code}</p><p className="mt-1 text-[11px] text-slate-500">{ap.city}</p></div>
          </div>
          <p className="mt-4 line-clamp-1 text-sm font-semibold">{s.title}</p>
          <div className="mt-3 grid grid-cols-4 gap-2 font-mono text-[10px] text-slate-500">
            <div><p>FLIGHT</p><p className="text-sm font-bold text-slate-900">{flight}</p></div>
            <div><p>{am ? "ቀነ ገደብ" : "BOARDS"}</p><p className="text-sm font-bold text-red">{fmtDeadline(s)}</p></div>
            <div><p>SEAT</p><p className="text-sm font-bold text-slate-900">{seat}</p></div>
            <div><p>CLASS</p><p className="text-sm font-bold uppercase text-slate-900">{s.level[0]?.replace("-course", "") ?? "—"}</p></div>
          </div>
        </div>
        <div className="relative hidden w-36 flex-col justify-between border-l-2 border-dashed border-slate-300 bg-[#f3ecd9] p-4 transition-transform duration-500 group-hover:translate-x-2 group-hover:rotate-2 sm:flex">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#050b16]" />
          <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#050b16]" />
          <div className="font-mono text-[10px] text-slate-500"><p>PASSENGER</p><p className="text-sm font-bold text-slate-900">{am ? "እርስዎ" : "YOU"}</p></div>
          <div className="font-mono text-[10px] text-slate-500"><p>TO</p><p className="text-sm font-bold text-slate-900">{ap.code}</p></div>
          <Barcode seed={s.id} />
        </div>
      </Link>
    </motion.div>
  );
}

export function BoardingPasses() {
  const am = useLocale() === "am";
  const items = useAllScholarships()
    .filter((s) => s.fundingType === "full" && s.country !== "Ethiopia")
    .slice(0, 10);
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  useLayoutEffect(() => {
    const m = () => setDist(Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth + 40));
    m();
    window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, [items.length]);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const smooth = useSpring(x, { stiffness: 120, damping: 28, mass: 0.6 });
  const skew = useSpring(useTransform(useVelocity(scrollYProgress), [-2, 2], [8, -8]), { stiffness: 300, damping: 40 });
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={wrap} className="relative bg-[#050b16] text-white" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-10 w-full max-w-6xl px-5">
          <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "02 — የመሳፈሪያ ትኬቶች" : "02 — YOUR BOARDING PASSES"}</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            {am ? "እያንዳንዱ ስኮላርሺፕ ወደ አዲስ ሕይወት በረራ ነው።" : <>Every scholarship is a <span className="text-gold">flight</span> to a new life.</>}
          </h2>
          <p className="mt-3 text-white/55">{am ? "ወደ ታች ይሸብልሉ — ትኬቶቹ ይንቀሳቀሳሉ።" : "Keep scrolling — the gate is open."}</p>
        </div>
        <motion.div ref={track} style={{ x: smooth, skewX: skew }} className="flex gap-6 pl-5 will-change-transform sm:pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
          {items.map((s, i) => <BoardingPass key={s.id} s={s} i={i} />)}
          {items.length === 0 && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-52 w-[520px] shrink-0 animate-pulse rounded-2xl bg-white/5" />)}
        </motion.div>
        <div className="mx-auto mt-10 h-1 w-full max-w-6xl px-5"><div className="h-full overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-gradient-to-r from-primary via-gold to-red" style={{ width: bar }} /></div></div>
      </div>
    </section>
  );
}
