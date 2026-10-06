"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MousePointer2, Plane } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Globe } from "./globe";
import { DeadlineShowcase } from "./deadline-showcase";
import { Magnetic } from "./magnetic";
import { airportFor, useAllScholarships, type Airport } from "./geo";

const ease = [0.22, 1, 0.36, 1] as const;

function KineticLine({ text, delay, wordClass }: { text: string; delay: number; wordClass?: string }) {
  const words = text.split(" ");
  return (
    <span className="block">
      {words.map((w, i) => (
        <Fragment key={i}>
        <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={`inline-block ${wordClass ?? ""}`}
            initial={{ y: "110%", rotate: 6, filter: "blur(8px)" }}
            animate={{ y: "0%", rotate: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 120, damping: 16, delay: delay + i * 0.07 }}
          >
            {w}
          </motion.span>
        </span>
        {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

export function HeroJourney() {
  const t = useTranslations("landing");
  const am = useLocale() === "am";
  const items = useAllScholarships();
  const [hl, setHl] = useState<string | null>(null);

  const dests = useMemo(() => {
    const seen = new Map<string, Airport>();
    items.forEach((s) => { const a = airportFor(s.country); if (a.code !== "INT") seen.set(a.code, a); });
    return [...seen.values()];
  }, [items]);

  const [di, setDi] = useState(0);
  useEffect(() => {
    if (!dests.length) return;
    const id = setInterval(() => setDi((i) => (i + 1) % dests.length), 2200);
    return () => clearInterval(id);
  }, [dests.length]);
  const next = dests.length ? dests[di % dests.length] : null;

  const lines = am ? [t("title")] : ["Find scholarships.", "Build your CV.", "Never miss a deadline."];

  return (
    <section className="relative isolate overflow-hidden bg-[var(--lbg)] text-white">
      <div className="stars pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute -left-40 top-20 -z-10 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-40 -z-10 h-[420px] w-[420px] rounded-full bg-gold/15 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div className="relative z-10">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <span className="flag-stripe inline-block h-2.5 w-5 rounded-sm" /> {t("badge")}
            <span className="ml-1 rounded-full bg-primary/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">LIVE</span>
          </motion.span>

          <h1 className="mt-6 text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-6xl xl:text-[4.1rem]">
            {lines.map((l, i) => (
              <KineticLine key={l} text={l} delay={0.15 + i * 0.25} wordClass={i === 1 ? "bg-gradient-to-r from-emerald-300 via-gold to-amber-200 bg-clip-text text-transparent" : ""} />
            ))}
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7, ease }}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            {t("subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="mt-6 flex h-10 items-center gap-3 font-mono text-sm text-white/60">
            <Plane size={16} className="text-gold" />
            <span>ADD</span>
            <span className="relative h-px w-12 overflow-hidden bg-white/20"><span className="dash-run absolute inset-y-0 w-4 bg-gold" /></span>
            <span className="relative inline-flex h-8 min-w-[11rem] items-center overflow-hidden">
              <AnimatePresence mode="popLayout">
                {next && (
                  <motion.span key={next.code} initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -28, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }} className="absolute whitespace-nowrap font-bold text-gold">
                    {next.code} · {next.city}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25, duration: 0.6, ease }} className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic>
              <Link href="/onboarding" className="group relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-full bg-gold px-7 text-base font-bold text-black shadow-[0_20px_60px_-15px_rgba(242,183,5,.7)]">
                <span className="absolute inset-0 -translate-x-full bg-white/40 transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{t("cta")}</span>
                <ArrowRight size={18} className="relative transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href="/scholarships" className="inline-flex h-14 items-center rounded-full border border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur transition-colors hover:border-white/50 hover:bg-white/10">
                {t("browse")}
              </Link>
            </Magnetic>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.85, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.6, ease, delay: 0.2 }}
          className="relative -mx-5 h-[420px] sm:h-[520px] lg:mx-0 lg:h-[600px]">
          <Globe destinations={dests} highlight={hl} className="h-full w-full" />
          <p className="keep-dark pointer-events-none absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/60 backdrop-blur">
            <MousePointer2 size={12} /> {am ? "ዓለሙን ይጎትቱት" : "Drag to spin the world"}
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto -mt-6 max-w-6xl px-5 pb-24 lg:mt-2">
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease }}>
          <DeadlineShowcase items={items} onHover={setHl} />
          <p className="mt-3 text-center text-xs text-white/40">{am ? "በካርድ ላይ ያንዣብቡ — መንገዱ በዓለም ላይ ይበራል።" : "Hover a card — its route lights up on the globe."} · {t("verify")}</p>
        </motion.div>
      </div>
    </section>
  );
}
