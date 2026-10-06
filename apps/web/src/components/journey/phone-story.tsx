"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { Bot, FileText, Target, UserRound } from "lucide-react";

function Ring({ value, delay = 0, color = "#15a854" }: { value: number; delay?: number; color?: string }) {
  const mv = useMotionValue(0);
  const dash = useTransform(mv, (v) => `${(v / 100) * 125.6} 125.6`);
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] });
    const u = mv.on("change", (v) => setN(Math.round(v)));
    return () => { c.stop(); u(); };
  }, [mv, value, delay]);
  return (
    <div className="relative h-12 w-12">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="4" /><motion.circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: dash }} /></svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold">{n}%</span>
    </div>
  );
}

function Typing({ text, speed = 28 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <>{text.slice(0, n)}<span className="ml-px inline-block h-3 w-px animate-pulse bg-current align-middle" /></>;
}

function Screen({ step, am }: { step: number; am: boolean }) {
  if (step === 0)
    return (
      <div className="space-y-3">
        <p className="text-xs text-white/50">{am ? "ደረጃ 1 / 5" : "Step 1 of 5"}</p>
        <div className="h-1 overflow-hidden rounded bg-white/10"><motion.div className="h-full bg-gold" initial={{ width: "0%" }} animate={{ width: "60%" }} transition={{ duration: 1.6 }} /></div>
        {[["Name", "Selam Tesfaye"], ["University", "Addis Ababa University"], ["Field", "Software Engineering"]].map(([k, v], i) => (
          <motion.div key={k} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.35 }} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <p className="text-[10px] text-white/40">{k}</p><p className="text-sm font-medium"><Typing text={v} /></p>
          </motion.div>
        ))}
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <div className="flex justify-between text-[10px] text-white/40"><span>GPA</span><span className="font-bold text-gold">3.62 / 4.0</span></div>
          <div className="mt-2 h-1.5 rounded bg-white/10"><motion.div className="h-full rounded bg-gradient-to-r from-primary to-gold" initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ delay: 1, duration: 1 }} /></div>
        </div>
      </div>
    );
  if (step === 1)
    return (
      <div className="space-y-2.5">
        <p className="text-sm font-bold">{am ? "የእርስዎ ተዛማጆች" : "Your matches"}</p>
        {[["DAAD EPOS", "Germany", 92], ["KAIST", "South Korea", 84], ["Chevening", "UK", 71], ["MEXT", "Japan", 66]].map(([t, c, p], i) => (
          <motion.div key={t as string} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 18 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
            <Ring value={p as number} delay={0.2 + i * 0.15} color={i === 0 ? "#f2b705" : "#15a854"} />
            <div><p className="text-sm font-semibold">{t}</p><p className="text-[10px] text-white/50">{c} · {am ? "ሙሉ ድጋፍ" : "Fully funded"}</p></div>
          </motion.div>
        ))}
      </div>
    );
  if (step === 2)
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between"><p className="text-sm font-bold">ATS score</p><Ring value={87} color="#f2b705" /></div>
        <div className="rounded-xl bg-[#fbf7ec] p-3 text-slate-900">
          <p className="text-sm font-black">SELAM TESFAYE</p><p className="text-[10px] text-slate-500">Software Engineer · Addis Ababa</p>
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] font-bold text-primary">EXPERIENCE</p>
            <motion.p initial={{ backgroundColor: "rgba(242,183,5,0)" }} animate={{ backgroundColor: ["rgba(242,183,5,0)", "rgba(242,183,5,.35)", "rgba(242,183,5,0)"] }} transition={{ delay: 0.8, duration: 1.6 }} className="rounded text-[10px] leading-snug">
              • <Typing text="Led a 4-person team to build a clinic booking app used by 1,200 patients." speed={22} />
            </motion.p>
            {[80, 65, 72].map((w, i) => <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />)}
          </div>
        </div>
        <div className="flex gap-2 text-[10px]">{["Europass", "Modern", "PDF ↓"].map((x) => <span key={x} className="rounded-full border border-white/15 px-2 py-1">{x}</span>)}</div>
      </div>
    );
  return (
    <div className="flex h-full flex-col justify-end gap-2.5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-gold px-3 py-2 text-sm text-black">የDAAD ቀነ ገደብ መቼ ነው?</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 0.5, duration: 1.2, times: [0, 0.1, 0.9, 1] }} className="flex w-14 gap-1 rounded-2xl bg-white/10 px-3 py-3">
        {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/60" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }} />)}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }} className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-sm leading-relaxed">
        <Typing text="DAAD EPOS በ25 ቀናት ውስጥ ይዘጋል። CV፣ የትምህርት ማስረጃ እና 2 የምክር ደብዳቤዎች ያዘጋጁ። 📄" speed={35} />
      </motion.div>
    </div>
  );
}

const STEPS = [
  { icon: UserRound, en: ["Tell us your story", "A 5-step profile: degree, GPA, field, languages, goals. Takes two minutes."], am: ["ታሪክዎን ይንገሩን", "ባለ 5 ደረጃ መገለጫ፦ ዲግሪ፣ GPA፣ መስክ፣ ቋንቋ፣ ግብ። ሁለት ደቂቃ ብቻ።"] },
  { icon: Target, en: ["See your real odds", "Every scholarship gets a probability with why you fit — and what's missing."], am: ["እውነተኛ ዕድልዎን ይመልከቱ", "እያንዳንዱ ስኮላርሺፕ ዕድል፣ ምክንያት እና የሚጎድለውን ያሳያል።"] },
  { icon: FileText, en: ["Ship a world-class CV", "STAR-method bullets, ATS score, Europass & Modern templates. Never invents facts."], am: ["ዓለም አቀፍ ደረጃ ሲቪ", "STAR ዘዴ፣ ATS ነጥብ፣ Europass እና ዘመናዊ ቅጦች። ሐሰት አይፈጥርም።"] },
  { icon: Bot, en: ["Ask anything — in Amharic", "Deadlines, documents, IELTS, MoE authentication. Your assistant answers in your language."], am: ["በአማርኛ ማንኛውንም ይጠይቁ", "ቀነ ገደብ፣ ሰነዶች፣ IELTS፣ የትምህርት ሚኒስቴር ማረጋገጫ — በቋንቋዎ።"] },
];

function StepBlock({ i, active, onActive, am }: { i: number; active: boolean; onActive: (i: number) => void; am: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => { if (inView) onActive(i); }, [inView, i, onActive]);
  const s = STEPS[i], [title, desc] = am ? s.am : s.en;
  return (
    <div ref={ref} className="flex min-h-[70vh] flex-col justify-center py-10 lg:min-h-[85vh]">
      <motion.div animate={{ opacity: active ? 1 : 0.25, x: active ? 0 : -12 }} transition={{ type: "spring", stiffness: 150, damping: 20 }}>
        <div className="flex items-center gap-3">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${active ? "bg-gold text-black" : "bg-white/10"}`}><s.icon size={22} /></span>
          <span className="font-mono text-sm text-white/40">0{i + 1} / 04</span>
        </div>
        <h3 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{title}</h3>
        <p className="mt-4 max-w-md text-lg text-white/60">{desc}</p>
      </motion.div>
      <div className="mt-8 lg:hidden"><Phone step={i} am={am} /></div>
    </div>
  );
}

function Phone({ step, am }: { step: number; am: boolean }) {
  return (
    <div className="relative mx-auto h-[540px] w-[270px] rounded-[44px] border border-white/15 bg-gradient-to-b from-slate-700 to-slate-900 p-[10px] shadow-[0_60px_120px_-30px_rgba(21,168,84,.45)]">
      <div className="relative h-full overflow-hidden rounded-[36px] bg-[#071021] text-white">
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-6 pt-3 text-[10px] text-white/70"><span>9:41</span><span>5G ▮▮▮</span></div>
        <div className="flex items-center gap-2 px-4 pt-5 pb-3"><span className="flag-stripe h-3 w-5 rounded-sm" /><span className="text-xs font-bold">ScholarAI</span></div>
        <div className="h-[calc(100%-5.5rem)] px-4 pb-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} className="h-full" initial={{ opacity: 0, y: 30, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -30, filter: "blur(6px)" }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <Screen step={step} am={am} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function PhoneStory() {
  const am = useLocale() === "am";
  const [active, setActive] = useState(0);
  return (
    <section className="relative bg-[#050b16] text-white">
      <div className="mx-auto max-w-6xl px-5 pt-24">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "03 — ጉዞው" : "03 — THE JOURNEY"}</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{am ? "ከአዲስ አበባ እስከ ምረቃ ቀን — በአራት ደረጃዎች።" : "From Addis to admission, in four stops."}</h2>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2">
        <div>{STEPS.map((_, i) => <StepBlock key={i} i={i} active={active === i} onActive={setActive} am={am} />)}</div>
        <div className="hidden lg:block">
          <div className="sticky top-[calc(50vh-270px)] py-10">
            <div className="relative">
              <div className="absolute inset-0 -z-10 m-auto h-80 w-80 rounded-full bg-primary/30 blur-[100px]" />
              <Phone step={active} am={am} />
              <div className="mt-6 flex justify-center gap-2">{STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-gold" : "w-1.5 bg-white/25"}`} />)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
