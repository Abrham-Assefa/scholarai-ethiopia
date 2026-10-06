"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { Level, Scholarship } from "@/lib/types";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { cn, daysLabel } from "@/lib/utils";

const LEVELS: { v: Level; en: string; am: string }[] = [
  { v: "bachelor", en: "Bachelor's", am: "ባችለር" },
  { v: "master", en: "Master's", am: "ማስተርስ" },
  { v: "phd", en: "PhD", am: "ፒኤችዲ" },
];
const FIELDS = ["Engineering", "Health", "Business", "Computer Science", "Agriculture", "Any"];

/** Client-side heuristic score so the demo feels instant; real matcher runs after onboarding. */
function score(s: Scholarship, gpa: number, field: string) {
  // Competitive international awards implicitly expect a higher GPA than domestic/rolling ones.
  const min = s.eligibility.minGpa ?? (s.country === "Ethiopia" ? 2.8 : s.fundingType === "full" ? 3.4 : 3.1);
  const competitive = s.country !== "Ethiopia" && s.fundingType === "full";
  // Domestic/rolling awards saturate quickly; competitive ones keep rewarding a higher GPA.
  let p = competitive ? 40 + (gpa - min) * 55 : 58 + Math.min(gpa - min, 0.4) * 25;
  if (gpa < min) p -= competitive ? 25 : 10;
  if (field !== "Any" && s.fields.some((f) => f.toLowerCase().includes(field.toLowerCase().split(" ")[0]))) p += 18;
  if (s.fundingType === "full") p += 6;
  if ((s.daysLeft ?? 99) < 20) p -= 8;
  if (s.daysLeft === null) p -= 4;
  return Math.round(Math.max(8, Math.min(97, p)));
}

export function MatcherDemo() {
  const locale = useLocale();
  const am = locale === "am";
  const [level, setLevel] = useState<Level>("master");
  const [gpa, setGpa] = useState(3.6);
  const [field, setField] = useState("Engineering");
  const [pool, setPool] = useState<Scholarship[]>([]);
  useEffect(() => { api.scholarships({ level, limit: "100" }).then((r) => setPool(r.items)).catch(() => setPool([])); }, [level]);
  const top = pool.map((s) => ({ s, p: score(s, gpa, field) })).sort((a, b) => b.p - a.p).slice(0, 4);

  return (
    <div className="glass grid gap-6 rounded-3xl p-6 md:grid-cols-5 md:p-8">
      <div className="space-y-5 md:col-span-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{am ? "ደረጃ" : "Level"}</p>
          <div className="mt-2 inline-flex rounded-xl border bg-background p-1">
            {LEVELS.map((l) => <button key={l.v} type="button" onClick={() => setLevel(l.v)} className={cn("rounded-lg px-3 py-1.5 text-sm transition-all", level === l.v ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted")}>{am ? l.am : l.en}</button>)}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GPA</p><span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold tabular-nums text-primary">{gpa.toFixed(2)} / 4.0</span></div>
          <input type="range" min={2} max={4} step={0.05} value={gpa} onChange={(e) => setGpa(Number(e.target.value))} className="mt-3 w-full accent-[var(--primary)]" aria-label="GPA" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{am ? "የትምህርት መስክ" : "Field"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FIELDS.map((f) => <button key={f} type="button" onClick={() => setField(f)} className={cn("rounded-full border px-3 py-1 text-xs transition-all", field === f ? "border-gold bg-gold/20 font-semibold" : "hover:bg-muted")}>{f}</button>)}
          </div>
        </div>
        <Button className="btn-glow w-full" size="lg" asChild><Link href="/onboarding"><Sparkles size={16} />{am ? "ሙሉ ማዛመድ ያግኙ" : "Get my full match report"}<ArrowRight size={16} /></Link></Button>
      </div>
      <div className="md:col-span-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{am ? "ፈጣን ውጤቶች" : "Instant preview"} · {pool.length} {am ? "ስኮላርሺፖች" : "scholarships"}</p>
        <ul className="space-y-2">
          {top.length === 0 && [0, 1, 2, 3].map((i) => <li key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
          {top.map(({ s, p }, i) => (
            <li key={s.id} className="reveal" style={{ animationDelay: `${i * 0.06}s` }}>
              <Link href={`/scholarships/${s.id}`} className="flex items-center gap-3 rounded-xl border bg-background/70 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
                <ProgressRing value={p} size={48} stroke={4} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.country} · {s.fundingType === "full" ? (am ? "ሙሉ ድጋፍ" : "Fully funded") : (am ? "ከፊል" : "Partial")} · {daysLabel(s.daysLeft, locale)}</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
