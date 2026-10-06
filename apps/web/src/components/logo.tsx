import { cn } from "@/lib/utils";

/**
 * ScholarAI mark — an ink squircle (inverts with the theme) holding a mortarboard,
 * a tricolour flight route rising out of Ethiopia and the gold star as the tassel.
 */
export function LogoMark({ className, title = "ScholarAI Ethiopia" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label={title} className={cn("h-8 w-8 shrink-0", className)}>
      <rect width="48" height="48" rx="14" className="fill-foreground" />
      <path d="M15.5 21.2v5.3c0 2.6 3.8 4.6 8.5 4.6s8.5-2 8.5-4.6v-5.3" className="fill-background" />
      <path d="M24 8.5 39 15.6 24 22.7 9 15.6z" className="fill-background stroke-foreground" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.5 40.2c3.6-2.6 7.6-3.8 12-3.7" stroke="#078C3F" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M20.8 36.6c3.6.1 6.9-.9 9.8-3" stroke="#F2B705" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M31.8 32.6c1.6-1.4 3-3 4.2-4.9" stroke="#DA121A" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="m38.6 18.4 1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#F2B705" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <LogoMark className={markClassName} />
      <span className="leading-none">
        Scholar<span className="text-primary">AI</span>
        <span className="ml-1 font-semibold text-muted-foreground">Ethiopia</span>
      </span>
    </span>
  );
}
