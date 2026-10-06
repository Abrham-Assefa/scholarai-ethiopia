"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { Bot, Check, FileText, Target, UserRound, X } from "lucide-react";

const ROUTE = "M 70 170 C 230 175 250 55 420 60 S 610 185 780 150 S 1010 40 1130 70";
const PLANE = "M21 12 L13.5 10.2 L8.6 3 H6.8 L9.5 10 H4.8 L3 7.2 H1.6 L2.8 12 L1.6 16.8 H3 L4.8 14 H9.5 L6.8 21 H8.6 L13.5 13.8 Z";

const STOPS = [
  { code: "ADD", icon: UserRound, city: ["Addis Ababa", "አዲስ አበባ"], en: ["Tell us your story", "A 5-step profile: degree, GPA, field, languages, goals. Takes two minutes — like filling in your passport."], am: ["ታሪክዎን ይንገሩን", "ባለ 5 ደረጃ መገለጫ፦ ዲግሪ፣ GPA፣ መስክ፣ ቋንቋ፣ ግብ። ሁለት ደቂቃ ብቻ — ፓስፖርት እንደመሙላት።"], tags: [["Profile", "Degree", "GPA 3.62"], ["መገለጫ", "ዲግሪ", "GPA 3.62"]] },
  { code: "FRA", icon: Target, city: ["Frankfurt", "ፍራንክፈርት"], en: ["See your real odds", "Every scholarship gets a probability — with exactly why you fit, and what's still missing."], am: ["እውነተኛ ዕድልዎን ይመልከቱ", "እያንዳንዱ ስኮላርሺፕ ዕድል ያገኛል — ለምን እንደሚስማሙ እና የሚጎድለውን ጭምር።"], tags: [["Hard filters", "TF-IDF", "Why / Missing"], ["ማጣሪያዎች", "TF-IDF", "ለምን / የሚጎድል"]] },
  { code: "LHR", icon: FileText, city: ["London", "ለንደን"], en: ["Ship a world-class CV", "STAR-method bullets, ATS score, Europass & Modern templates. It polishes your words — never invents facts."], am: ["ዓለም አቀፍ ደረጃ ሲቪ", "STAR ዘዴ፣ ATS ነጥብ፣ Europass እና ዘመናዊ ቅጦች። ቃላትዎን ያሻሽላል — ሐሰት አይፈጥርም።"], tags: [["STAR", "ATS 87", "PDF"], ["STAR", "ATS 87", "PDF"]] },
  { code: "YYZ", icon: Bot, city: ["Admission", "ተቀባይነት"], en: ["Ask anything — in Amharic", "Deadlines, documents, IELTS, MoE authentication. Your assistant answers in your language, day or night."], am: ["በአማርኛ ማንኛውንም ይጠይቁ", "ቀነ ገደብ፣ ሰነዶች፣ IELTS፣ የትምህርት ሚኒስቴር ማረጋገጫ — ረዳትዎ በቋንቋዎ ይመልሳል።"], tags: [["EN ⇄ አማ", "RAG", "24/7"], ["EN ⇄ አማ", "RAG", "24/7"]] },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;
const smooth = (t: number) => t * t * (3 - 2 * t);

function Typing({ text, speed = 30, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let id: ReturnType<typeof setInterval>;
    const to = setTimeout(() => { id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed); }, delay);
    return () => { clearTimeout(to); clearInterval(id); };
  }, [text, speed, delay]);
  return <>{text.slice(0, n)}{n < text.length && <span className="ml-px inline-block h-[0.9em] w-px animate-pulse bg-current align-middle" />}</>;
}

function useCount(to: number, from = 0, delay = 0, duration = 1.4) {
  const [n, setN] = useState(from);
  useEffect(() => {
    const c = animate(from, to, { duration, delay, ease, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to, from, delay, duration]);
  return n;
}

/* ---------------- Scenes ---------------- */

function PassportScene({ am }: { am: boolean }) {
  const rows: [string, string][] = am
    ? [["ስም", "ሰላም ተስፋዬ"], ["ዩኒቨርሲቲ", "አዲስ አበባ ዩኒቨርሲቲ"], ["መስክ", "Software Engineering"], ["ግብ", "MSc · Germany"]]
    : [["Name", "Selam Tesfaye"], ["University", "Addis Ababa University"], ["Field", "Software Engineering"], ["Goal", "MSc · Germany"]];
  return (
    <motion.div initial={{ rotateX: 25, y: 30, opacity: 0 }} animate={{ rotateX: 0, y: 0, opacity: 1 }} transition={{ duration: 0.8, ease }}
      style={{ transformPerspective: 900 }} className="relative overflow-hidden rounded-2xl bg-[#f5efdc] p-5 text-slate-800 shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)]">
      <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(45deg,transparent_0_9px,rgba(7,140,63,.12)_9px_10px)]" />
      <div className="relative">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-slate-500">
          <span>{am ? "የተማሪ ፓስፖርት" : "STUDENT PASSPORT"}</span>
          <span className="flex items-center gap-1">{[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="h-1.5 w-4 rounded-full bg-slate-300" animate={{ backgroundColor: "#078c3f" }} transition={{ delay: 0.3 + i * 0.45 }} />)}</span>
        </div>
        <div className="mt-4 flex gap-4">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
            className="grid h-28 w-24 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-3xl font-black text-[#fff]">ST</motion.div>
          <div className="min-w-0 flex-1 space-y-2">
            {rows.map(([k, v], i) => (
              <div key={k}>
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{k}</p>
                <p className="truncate text-sm font-bold"><Typing text={v} delay={300 + i * 450} /></p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[10px] text-slate-500">GPA</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-300/70"><motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-gold" initial={{ width: 0 }} animate={{ width: "90.5%" }} transition={{ delay: 1.6, duration: 1, ease }} /></div>
          <span className="font-mono text-sm font-black">3.62</span>
        </div>
        <p className="mt-4 truncate font-mono text-[11px] tracking-[0.18em] text-slate-500"><Typing text="P<ETHTESFAYE<<SELAM<<<<<<<<<<<<<<<<<<" speed={18} delay={2200} /></p>
      </div>
    </motion.div>
  );
}

function OddsScene({ am }: { am: boolean }) {
  const n = useCount(92, 0, 0.2, 1.6);
  const why = am ? ["የGPA መስፈርት ተሟልቷል", "መስክ ከፕሮግራሙ ጋር ይዛመዳል", "2 ዓመት የሥራ ልምድ"] : ["GPA above threshold", "Field matches the programme", "2 years work experience"];
  const missing = am ? "IELTS 6.5 ገና አልተሰቀለም" : "IELTS 6.5 not uploaded yet";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="9" />
            <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#odds)" strokeWidth="9" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.92 }} transition={{ delay: 0.2, duration: 1.6, ease }} />
            <defs><linearGradient id="odds"><stop offset="0" stopColor="#15a854" /><stop offset="1" stopColor="#f2b705" /></linearGradient></defs>
          </svg>
          <span className="absolute inset-0 grid place-items-center text-3xl font-black tabular-nums">{n}%</span>
          <motion.span className="absolute inset-0 rounded-full border-2 border-primary" initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ delay: 1.8, duration: 1.2, repeat: Infinity, repeatDelay: 1 }} />
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-widest text-white/45">{am ? "ምርጥ ተዛማጅ" : "TOP MATCH"}</p>
          <p className="text-xl font-black">DAAD EPOS</p>
          <p className="text-xs text-white/55">{am ? "ጀርመን · ሙሉ ድጋፍ" : "Germany · Fully funded"}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {why.map((w, i) => (
          <motion.li key={w} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.25, ease }} className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-primary"><Check size={12} strokeWidth={3} /></span>{w}
          </motion.li>
        ))}
        <motion.li initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5, ease }} className="flex items-center gap-2 text-red">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-red/15"><X size={12} strokeWidth={3} /></span>{missing}
        </motion.li>
      </ul>
    </div>
  );
}

function CvScene({ am }: { am: boolean }) {
  const ats = useCount(87, 54, 1.4, 1.6);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="font-mono text-[10px] tracking-widest text-white/45">{am ? "በፊት" : "BEFORE"}</p>
        <p className="relative mt-1 inline-block text-white/70">
          • Worked on a hospital app.
          <motion.span className="absolute left-0 top-1/2 h-0.5 bg-red" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.5, duration: 0.5 }} />
        </p>
      </div>
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 160, damping: 18 }}
        className="rounded-2xl bg-[#fbf7ec] p-4 text-slate-900 shadow-[0_30px_70px_-30px_rgba(0,0,0,.6)]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-bold tracking-widest text-primary">{am ? "በኋላ · STAR" : "AFTER · STAR METHOD"}</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">✨ Enhanced</span>
        </div>
        <p className="mt-2 min-h-[3.5rem] text-sm font-medium leading-snug">• <Typing text="Led a 4-person team to build a clinic booking app, cutting patient wait times by 35% for 1,200 users." speed={20} delay={1100} /></p>
      </motion.div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-baseline justify-between"><p className="text-sm font-semibold">{am ? "ATS ነጥብ" : "ATS score"}</p><p className="font-mono text-2xl font-black tabular-nums text-gold">{ats}<span className="text-sm text-white/40">/100</span></p></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-red via-gold to-primary" initial={{ width: "54%" }} animate={{ width: "87%" }} transition={{ delay: 1.4, duration: 1.6, ease }} /></div>
        <div className="mt-3 flex gap-2 text-[11px]">{["Europass", "Modern", "PDF ↓"].map((x, i) => <motion.span key={x} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 + i * 0.1 }} className="rounded-full border border-white/15 px-2.5 py-1">{x}</motion.span>)}</div>
      </div>
    </div>
  );
}

function ChatScene({ am }: { am: boolean }) {
  return (
    <div className="flex min-h-[340px] flex-col justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-auto flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-black"><Bot size={16} /></span>
        <div><p className="text-sm font-bold">ScholarAI</p><p className="flex items-center gap-1 text-[10px] text-primary"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />{am ? "መስመር ላይ" : "online"}</p></div>
        <span className="ml-auto rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px]">EN ⇄ አማ</span>
      </div>
      <motion.div initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="ml-auto max-w-[85%] origin-bottom-right rounded-2xl rounded-br-sm bg-gold px-3.5 py-2 text-sm text-black">የDAAD ቀነ ገደብ መቼ ነው? ምን ሰነዶች ያስፈልጉኛል?</motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 0.5, duration: 1.2, times: [0, 0.1, 0.9, 1] }} className="flex w-16 gap-1 rounded-2xl bg-white/10 px-3.5 py-3">
        {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/60" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }} />)}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, ease }} className="max-w-[92%] origin-bottom-left rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed">
        <Typing text="DAAD EPOS በ25 ቀናት ውስጥ ይዘጋል። 📄 CV፣ የትምህርት ማስረጃ (በትምህርት ሚኒስቴር የተረጋገጠ) እና 2 የምክር ደብዳቤዎች ያዘጋጁ።" speed={32} delay={1700} />
      </motion.div>
    </div>
  );
}

const SCENES = [PassportScene, OddsScene, CvScene, ChatScene];

function MountInView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  return <div ref={ref} className="min-h-[300px]">{seen && children}</div>;
}

/* ---------------- Route map ---------------- */

function RouteMap({ frac, active, onPick, am }: { frac: MotionValue<number>; active: number; onPick: (i: number) => void; am: boolean }) {
  const path = useRef<SVGPathElement>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const px = useMotionValue(70), py = useMotionValue(170), rot = useMotionValue(0);

  useLayoutEffect(() => {
    const el = path.current!, len = el.getTotalLength();
    setPts([0, 1 / 3, 2 / 3, 1].map((f) => { const p = el.getPointAtLength(f * len); return { x: p.x, y: p.y }; }));
    const place = (f: number) => {
      const a = el.getPointAtLength(f * len), b = el.getPointAtLength(Math.min(len, f * len + 2)), c = el.getPointAtLength(Math.max(0, f * len - 2));
      px.set(a.x); py.set(a.y); rot.set((Math.atan2(b.y - c.y, b.x - c.x) * 180) / Math.PI);
    };
    place(frac.get());
    return frac.on("change", place);
  }, [frac, px, py, rot]);

  return (
    <svg viewBox="0 0 1200 230" className="h-[clamp(130px,24vh,230px)] w-full overflow-visible">
      <defs>
        <linearGradient id="trail" x1="0" x2="1"><stop offset="0" stopColor="#15a854" /><stop offset=".55" stopColor="#f2b705" /><stop offset="1" stopColor="#e5322d" /></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <path ref={path} d={ROUTE} fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      <motion.path d={ROUTE} fill="none" stroke="url(#trail)" strokeWidth="9" strokeLinecap="round" style={{ pathLength: frac }} filter="url(#glow)" opacity=".5" />
      <motion.path d={ROUTE} fill="none" stroke="url(#trail)" strokeWidth="3.5" strokeLinecap="round" style={{ pathLength: frac }} />
      {pts.map((p, i) => {
        const on = i <= active, cur = i === active;
        return (
          <g key={i} onClick={() => onPick(i)} className="cursor-pointer" role="button" aria-label={STOPS[i].code}>
            <circle cx={p.x} cy={p.y} r="34" fill="transparent" />
            {cur && <motion.circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#f2b705" strokeWidth="2" initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
            <circle cx={p.x} cy={p.y} r={cur ? 11 : 8} fill={on ? (cur ? "#f2b705" : "#15a854") : "var(--lbg)"} stroke={on ? "none" : "currentColor"} strokeOpacity=".4" strokeWidth="2" className="transition-all duration-500" />
            <text x={p.x} y={p.y + (i % 2 ? -30 : 44)} textAnchor="middle" className="fill-current font-mono text-[22px] font-black" opacity={on ? 1 : 0.35}>{STOPS[i].code}</text>
            <text x={p.x} y={p.y + (i % 2 ? -10 : 64)} textAnchor="middle" className="fill-current text-[13px]" opacity={on ? 0.6 : 0.25}>{STOPS[i].city[am ? 1 : 0]}</text>
          </g>
        );
      })}
      <motion.g style={{ x: px, y: py, rotate: rot }}>
        <circle r="22" fill="#f2b705" opacity=".25" filter="url(#glow)" />
        <path d={PLANE} transform="translate(-12 -12) scale(1)" fill="#f2b705" stroke="#0b1a2e" strokeWidth=".6" />
      </motion.g>
    </svg>
  );
}

function StopText({ i, am, big }: { i: number; am: boolean; big?: boolean }) {
  const s = STOPS[i], [title, desc] = am ? s.am : s.en;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-black shadow-[0_10px_40px_-10px_rgba(242,183,5,.8)]"><s.icon size={22} /></span>
        <div className="font-mono text-xs leading-tight text-white/50">
          <p>{am ? "ማቆሚያ" : "STOP"} 0{i + 1} / 04</p>
          <p className="font-bold text-white">{s.code} · {s.city[am ? 1 : 0]}</p>
        </div>
      </div>
      <h3 className={`mt-5 font-black tracking-tight ${big ? "text-4xl xl:text-6xl" : "text-3xl"}`}>{title}</h3>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-white/60">{desc}</p>
      <div className="mt-5 flex flex-wrap gap-2">{s.tags[am ? 1 : 0].map((t) => <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px]">{t}</span>)}</div>
    </div>
  );
}

export function RouteStory() {
  const am = useLocale() === "am";
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const frac = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const pct = useTransform(frac, (v) => `${Math.round(v * 100)}%`);

  useMotionValueEvent(p, "change", (v) => {
    const c = Math.min(0.9999, Math.max(0, v)) * 4, i = Math.floor(c), t = c - i;
    // Plane dwells at each stop for the first half of its segment, then flies to the next.
    frac.set(i >= 3 ? 1 : (i + smooth(Math.max(0, (t - 0.5) / 0.5))) / 3);
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(3, Math.floor(Math.min(0.9999, Math.max(0, v)) * 4));
    setActive((a) => { if (a !== i) setDir(i > a ? 1 : -1); return i; });
  });

  const pick = (i: number) => {
    const el = ref.current; if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (i / 4 + 0.02) * (el.offsetHeight - window.innerHeight), behavior: "smooth" });
  };

  const Scene = SCENES[active];
  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "03 — የበረራ መስመር" : "03 — FLIGHT PATH"}</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{am ? "ከአዲስ አበባ እስከ ተቀባይነት — በአራት ማቆሚያዎች።" : "From Addis to admission, in four stops."}</h2>
      </div>
      <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs lg:flex">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="text-white/50">ET-2026</span><span className="font-bold">ADD → {am ? "ተቀባይነት" : "ADMISSION"}</span>
        <motion.span className="w-10 text-right font-bold text-gold">{pct}</motion.span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: pinned cinematic route */}
      <section ref={ref} className="relative hidden h-[480vh] bg-[var(--lbg)] text-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-5 pb-6 pt-24">
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] text-white/20" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
            {header}
            <div className="mt-2"><RouteMap frac={frac} active={active} onPick={pick} am={am} /></div>
            <div className="relative grid flex-1 grid-cols-[1fr_1.05fr] items-center gap-12">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={`t${active}`} custom={dir} initial={{ opacity: 0, y: 40 * dir, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -40 * dir, filter: "blur(8px)" }} transition={{ duration: 0.5, ease }}>
                  <StopText i={active} am={am} big />
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div key={`s${active}`} initial={{ opacity: 0, x: 60 * dir, rotate: 2 * dir }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: -60 * dir, rotate: -2 * dir }} transition={{ duration: 0.55, ease }}>
                  <Scene am={am} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile / tablet: vertical route */}
      <section className="relative bg-[var(--lbg)] px-5 py-24 text-white lg:hidden">
        {header}
        <ol className="relative mt-12 space-y-16 border-l-2 border-dashed border-white/15 pl-6">
          {STOPS.map((_, i) => {
            const S = SCENES[i];
            return (
              <motion.li key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.6, ease }} className="relative">
                <span className="absolute -left-[33px] top-3 h-4 w-4 rounded-full bg-gold ring-4 ring-[var(--lbg)]" />
                <StopText i={i} am={am} />
                <div className="mt-6"><MountInView><S am={am} /></MountInView></div>
              </motion.li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
