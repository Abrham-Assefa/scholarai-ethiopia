"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { animate, motion, useInView, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { Magnetic } from "./magnetic";

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, to]);
  return <span ref={ref} className="tabular-nums">{n}</span>;
}

export function BigStats() {
  const am = useLocale() === "am";
  const [s, setS] = useState({ total: 40, countries: 27, conferences: 25 });
  useEffect(() => { api.stats().then((r) => setS(r)).catch(() => undefined); }, []);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["8%", "-18%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-18%", "8%"]);
  const items = [
    { n: s.total, l: am ? "ክፍት ስኮላርሺፖች" : "open scholarships", c: "text-gold" },
    { n: s.countries, l: am ? "አገሮች" : "destinations", c: "text-emerald-300" },
    { n: s.conferences, l: am ? "የተደገፉ ኮንፈረንሶች" : "funded conferences", c: "text-red-300" },
    { n: 0, l: am ? "ብር — ሙሉ በሙሉ ነፃ" : "birr — completely free", c: "text-white" },
  ];
  return (
    <section ref={ref} className="relative overflow-hidden bg-[#050b16] py-24 text-white">
      <motion.p style={{ x: x1 }} className="whitespace-nowrap text-[18vw] font-black leading-none tracking-tighter text-white/[0.04]">ADDIS ✈ BERLIN ✈ SEOUL ✈ TOKYO</motion.p>
      <div className="mx-auto -mt-[10vw] grid max-w-6xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
        {items.map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring", stiffness: 90, damping: 16 }} className="border-l border-white/15 pl-5">
            <p className={`font-mono text-6xl font-black sm:text-7xl ${it.c}`}><Counter to={it.n} /></p>
            <p className="mt-2 text-sm text-white/55">{it.l}</p>
          </motion.div>
        ))}
      </div>
      <motion.p style={{ x: x2 }} className="mt-6 whitespace-nowrap text-[18vw] font-black leading-none tracking-tighter text-white/[0.04]">LONDON ✈ PARIS ✈ KIGALI ✈ DOHA</motion.p>
    </section>
  );
}

export function PassportFinale() {
  const t = useTranslations("landing");
  const am = useLocale() === "am";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25%" });
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#050b16] via-[#07261a] to-[#050b16] py-28 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "06 — መሳፈር" : "06 — FINAL CALL"}</p>
          <h2 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{am ? "የመጨረሻ ጥሪ።" : <>Final call<br />for boarding.</>}</h2>
          <p className="mt-5 max-w-md text-lg text-white/60">{am ? "መገለጫዎን ዛሬ ይሙሉ — ተዛማጆችዎ፣ ሲቪዎ እና የቀነ ገደብ ራዳርዎ በሁለት ደቂቃ ውስጥ ዝግጁ ይሆናሉ።" : "Complete your profile today. Your matches, CV and deadline radar are ready in two minutes."}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Magnetic>
              <Link href="/onboarding" className="group inline-flex h-14 items-center gap-2 rounded-full bg-gold px-8 text-base font-bold text-black shadow-[0_20px_60px_-15px_rgba(242,183,5,.7)]">
                {t("cta")} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href="/cv" className="inline-flex h-14 items-center rounded-full border border-white/20 px-8 font-semibold transition-colors hover:bg-white/10">{am ? "ሲቪ ይገንቡ" : "Build my CV"}</Link>
            </Magnetic>
          </div>
        </div>

        <motion.div ref={ref} animate={inView ? { x: [0, -6, 6, -3, 3, 0], rotate: [-4, -4.5, -3.5, -4, -4] } : { rotate: -4 }} transition={{ delay: 0.75, duration: 0.4 }}
          className="relative mx-auto aspect-[1.42/1] w-full max-w-[520px] rounded-2xl bg-[#f5efdc] p-6 text-slate-800 shadow-[0_50px_100px_-30px_rgba(0,0,0,.8)]">
          <div className="absolute inset-0 rounded-2xl opacity-[0.25] [background:repeating-linear-gradient(45deg,transparent_0_10px,rgba(7,140,63,.12)_10px_11px),repeating-linear-gradient(-45deg,transparent_0_10px,rgba(242,183,5,.12)_10px_11px)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-slate-500"><span>ፓስፖርት · PASSPORT</span><span>ETH</span></div>
            <div className="mt-4 flex gap-4">
              <div className="grid h-28 w-24 place-items-center rounded-md bg-slate-300/60 text-4xl">🎓</div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <p className="text-slate-500">SURNAME / ስም</p><p className="font-bold">{am ? "እርስዎ" : "YOU"}</p>
                <p className="text-slate-500">NATIONALITY</p><p className="font-bold">ETHIOPIAN 🇪🇹</p>
                <p className="text-slate-500">DESTINATION</p><p className="font-bold">{am ? "ዓለም" : "THE WORLD"}</p>
              </div>
            </div>
            <p className="mt-auto truncate font-mono text-[11px] tracking-[0.15em] text-slate-500">P&lt;ETHSCHOLARAI&lt;&lt;YOUR&lt;FUTURE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
          </div>
          <motion.div initial={{ scale: 3, opacity: 0, rotate: -40 }} animate={inView ? { scale: 1, opacity: 1, rotate: -14 } : {}} transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 18 }}
            className="absolute right-5 top-1/2 grid h-40 w-40 -translate-y-1/2 place-items-center rounded-full border-[5px] border-double border-primary text-center text-primary mix-blend-multiply sm:h-44 sm:w-44">
            <div>
              <p className="font-mono text-[10px] font-bold tracking-[0.2em]">ADDIS ABABA</p>
              <p className="my-1 text-2xl font-black tracking-tight">{am ? "ተቀባይነት" : "ADMITTED"}</p>
              <p className="font-mono text-[10px] font-bold">★ 2026 ★</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  return <motion.div style={{ scaleX }} className="flag-stripe fixed inset-x-0 top-0 z-[60] h-1 origin-left" />;
}
