"use client";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { api } from "@/lib/api";
import type { Scholarship } from "@/lib/types";

const FALLBACK = [
  { title: "DAAD EPOS Scholarship", country: "Germany", p: 92, d: 14 },
  { title: "Chevening Scholarship", country: "United Kingdom", p: 78, d: 40 },
  { title: "KAIST International Scholarship", country: "South Korea", p: 64, d: 77 },
];

export function HeroVisual() {
  const [items, setItems] = useState(FALLBACK);
  const [ats, setAts] = useState(0);
  useEffect(() => {
    api.scholarships({ funding: "full", limit: "3" })
      .then((r) => setItems(r.items.map((s: Scholarship, i) => ({ title: s.title, country: s.country, p: [92, 78, 64][i], d: s.daysLeft ?? 30 + i * 20 }))))
      .catch(() => undefined);
    const t = setTimeout(() => setAts(86), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[520px]" aria-hidden>
      {/* glow blobs */}
      <div className="blob absolute -left-10 top-10 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
      <div className="blob absolute -right-6 bottom-6 h-56 w-56 rounded-full bg-gold/30 blur-3xl [animation-delay:-6s]" />
      <div className="blob absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-red/20 blur-3xl [animation-delay:-12s]" />

      {/* main match stack */}
      <div className="glass float absolute left-0 top-8 w-[340px] rounded-2xl p-4" style={{ "--r": "-2deg" } as React.CSSProperties}>
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold"><Sparkles size={12} className="text-primary" /> Your matches</span>
          <span className="relative inline-flex items-center gap-1.5 text-muted-foreground"><span className="pulse-dot relative inline-block h-1.5 w-1.5 rounded-full bg-primary text-primary" /> live</span>
        </div>
        <ul className="space-y-2">
          {items.map((m, i) => (
            <li key={m.title} className="reveal flex items-center gap-3 rounded-xl border bg-background/60 p-2.5" style={{ animationDelay: `${0.4 + i * 0.15}s` }}>
              <ProgressRing value={m.p} size={44} stroke={4} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.title}</p>
                <p className="text-[11px] text-muted-foreground">{m.country} · {m.d}d left</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ATS card */}
      <div className="glass float-slow absolute right-0 top-0 w-[200px] rounded-2xl p-4" style={{ "--r": "3deg" } as React.CSSProperties}>
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold"><FileText size={12} className="text-gold" /> ATS score</p>
        <div className="flex items-center gap-3">
          <ProgressRing value={ats} size={56} stroke={5} />
          <div className="text-[11px] leading-tight text-muted-foreground">STAR bullets<br />Honesty guard ✓</div>
        </div>
      </div>

      {/* deadline toast */}
      <div className="glass float absolute bottom-10 right-4 w-[250px] rounded-2xl p-3 [animation-delay:-3s]" style={{ "--r": "-1deg" } as React.CSSProperties}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red/15 text-red"><Bell size={13} /></span>
          <div className="text-xs"><p className="font-semibold">Deadline in 14 days</p><p className="text-muted-foreground">DAAD EPOS — upload MoE-authenticated transcript</p></div>
        </div>
      </div>

      {/* amharic chip */}
      <div className="glass float-slow absolute bottom-0 left-8 rounded-full px-3 py-1.5 text-xs font-medium [animation-delay:-5s]">
        <CheckCircle2 size={12} className="mr-1 inline text-primary" /> በአማርኛም ይሰራል · Works in Amharic
      </div>
    </div>
  );
}
