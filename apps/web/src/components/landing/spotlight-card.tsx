"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Card with cursor-tracking radial glow and subtle 3D tilt. */
export function SpotlightCard({ className, children, tilt = true, ...rest }: React.HTMLAttributes<HTMLDivElement> & { tilt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`);
    if (tilt) {
      const rx = ((y / r.height) - 0.5) * -8, ry = ((x / r.width) - 0.5) * 8;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    }
  };
  const onLeave = () => { const el = ref.current; if (el) el.style.transform = ""; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("spot rounded-2xl border bg-card", tilt && "tilt", className)} {...rest}>
      {children}
    </div>
  );
}
