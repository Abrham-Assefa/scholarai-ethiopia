"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Scholarship } from "@/lib/types";
import { airportFor, fmtDeadline } from "./geo";

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·-";

/** Solari-style split-flap text: every cell cycles through glyphs before settling. */
export function SplitFlap({ text, len, className = "" }: { text: string; len: number; className?: string }) {
  const target = text.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").padEnd(len).slice(0, len);
  const [shown, setShown] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(target); return; }
    const from = prev.current;
    prev.current = target;
    const settle = Array.from({ length: len }, (_, i) => (from[i] === target[i] ? 0 : 4 + i * 0.9 + Math.random() * 6));
    let step = 0;
    const id = setInterval(() => {
      step++;
      setShown(Array.from({ length: len }, (_, i) => (step >= settle[i] ? target[i] : CHARS[(CHARS.indexOf(from[i]) + step + i) % CHARS.length])).join(""));
      if (settle.every((s) => step >= s)) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [target, len]);
  return (
    <span className={`inline-flex gap-[2px] ${className}`} aria-label={text}>
      {shown.split("").map((c, i) => (
        <span key={i} aria-hidden className="flap relative inline-flex h-[1.6em] w-[1.05em] items-center justify-center overflow-hidden rounded-[3px] bg-[#0d1626] font-mono font-bold text-[#f8e7a1] shadow-[inset_0_-1px_0_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.06)]">
          <span key={c} className="flap-char">{c}</span>
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/70" />
        </span>
      ))}
    </span>
  );
}

const levelCode = (s: Scholarship) => (s.level.includes("phd") ? "PHD" : s.level.includes("master") ? "MSC" : s.level.includes("bachelor") ? "BSC" : "SHT");

export function DepartureBoard({ items, onHover }: { items: Scholarship[]; onHover?: (code: string | null) => void }) {
  const am = useLocale() === "am";
  const rows = 6;
  const sorted = [...items].sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(sorted.length / rows));
  useEffect(() => {
    const id = setInterval(() => setPage((p) => (p + 1) % pages), 6500);
    return () => clearInterval(id);
  }, [pages]);
  const slice = sorted.slice(page * rows, page * rows + rows);
  while (slice.length < rows && sorted.length) slice.push(sorted[slice.length % sorted.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#060c18] p-3 shadow-[0_40px_120px_-40px_rgba(242,183,5,.35)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-lg text-black">✈</span>
          <div>
            <p className="font-mono text-sm font-bold tracking-[0.25em] text-gold">{am ? "መነሻዎች · DEPARTURES" : "DEPARTURES"}</p>
            <p className="text-[11px] text-white/50">{am ? "ከአዲስ አበባ ወደ ዓለም · ቀጥታ ከ API" : "Addis Ababa → the world · live from the API"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} type="button" aria-label={`Page ${i + 1}`} onClick={() => setPage(i)} className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-gold" : "w-1.5 bg-white/25 hover:bg-white/50"}`} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[auto_auto_1fr_auto] gap-x-3 gap-y-1 px-1 pb-1 font-mono text-[10px] tracking-widest text-white/40 sm:grid-cols-[auto_auto_1fr_auto_auto]">
        <span>{am ? "ቀን" : "DATE"}</span><span>{am ? "ወደ" : "TO"}</span><span>{am ? "ስኮላርሺፕ" : "SCHOLARSHIP"}</span><span className="hidden sm:block">GATE</span><span>STATUS</span>
      </div>
      <ul className="space-y-1.5">
        {slice.map((s, i) => {
          const ap = airportFor(s.country);
          const urgent = (s.daysLeft ?? 999) <= 30;
          const status = s.deadline === null ? "OPEN" : urgent ? "BOARDING" : "ON TIME";
          return (
            <li key={i}>
              <Link href={`/scholarships/${s.id}`} onMouseEnter={() => onHover?.(ap.code)} onMouseLeave={() => onHover?.(null)}
                className="group grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 rounded-lg px-1 py-1 text-[11px] transition-colors hover:bg-white/[0.04] sm:grid-cols-[auto_auto_1fr_auto_auto] sm:text-[13px]">
                <SplitFlap text={fmtDeadline(s)} len={7} />
                <SplitFlap text={ap.code} len={3} />
                <span className="min-w-0 overflow-hidden"><SplitFlap text={s.title} len={34} /></span>
                <span className="hidden sm:inline-flex"><SplitFlap text={levelCode(s)} len={3} /></span>
                <span className={`inline-flex min-w-[78px] items-center justify-center gap-1.5 rounded px-1.5 py-1 font-mono text-[10px] font-bold tracking-wider sm:text-[11px] ${status === "BOARDING" ? "bg-red/20 text-red-300" : status === "OPEN" ? "bg-sky-500/15 text-sky-300" : "bg-primary/20 text-emerald-300"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status === "BOARDING" ? "animate-pulse bg-red-400" : status === "OPEN" ? "bg-sky-400" : "bg-emerald-400"}`} />{status}
                </span>
              </Link>
            </li>
          );
        })}
        {sorted.length === 0 && Array.from({ length: rows }).map((_, i) => <li key={i} className="h-8 animate-pulse rounded bg-white/5" />)}
      </ul>
    </div>
  );
}
