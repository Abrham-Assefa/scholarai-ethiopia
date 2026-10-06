import { cn } from "@/lib/utils";

export function ProgressRing({ value, size = 64, stroke = 6, className, label }: { value: number; size?: number; stroke?: number; className?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? "var(--primary)" : pct >= 45 ? "var(--gold)" : "var(--red)";
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums">{Math.round(pct)}%</span>
    </div>
  );
}
