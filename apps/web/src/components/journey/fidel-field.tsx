"use client";
import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

const FIDEL = "ሀለሐመሠረሰሸቀበቨተቸኀነኘአከኸወዐዘዠየደጀገጠጨጰጸፀፈፐሁሊሜርሶቂባቲኑኪዋዩዱጊጦፊፖ";

/** Canvas of Ge'ez letters that swell, glow and scatter away from the cursor like iron filings. */
export function FidelField() {
  const am = useLocale() === "am";
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = `${getComputedStyle(document.documentElement).getPropertyValue("--font-ethiopic") || "Noto Sans Ethiopic"}, Kefa, sans-serif`;
    type G = { ch: string; x: number; y: number; s: number; ox: number; oy: number; h: number };
    let cells: G[] = [], raf = 0, visible = false, w = 0, h = 0;
    const mouse = { x: -9999, y: -9999 };
    const ripples: { x: number; y: number; t: number }[] = [];
    const gap = 46;

    const fit = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = [];
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) cells.push({ ch: FIDEL[Math.floor(Math.random() * FIDEL.length)], x, y, s: 1, ox: 0, oy: 0, h: 0 });
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }); io.observe(canvas);
    const mv = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const lv = () => { mouse.x = mouse.y = -9999; };
    const dn = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 }); };
    canvas.addEventListener("pointermove", mv); canvas.addEventListener("pointerleave", lv); canvas.addEventListener("pointerdown", dn);
    const t0 = performance.now();

    function loop() {
      cancelAnimationFrame(raf);
      if (!visible) return;
      const time = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const dark = document.documentElement.classList.contains("dark");
      ripples.forEach((r) => (r.t += 1 / 60));
      while (ripples.length && ripples[0].t > 2) ripples.shift();
      for (const c of cells) {
        const dx = c.x - mouse.x, dy = c.y - mouse.y, d = Math.hypot(dx, dy);
        const near = Math.max(0, 1 - d / 190);
        let push = near * 26;
        let heat = near;
        for (const r of ripples) {
          const rd = Math.hypot(c.x - r.x, c.y - r.y), front = r.t * 520;
          const band = Math.max(0, 1 - Math.abs(rd - front) / 60) * (1 - r.t / 2);
          push += band * 22; heat = Math.max(heat, band);
        }
        const wave = reduced ? 0 : (Math.sin(c.x * 0.012 + time * 1.2) + Math.cos(c.y * 0.015 - time)) * 0.25;
        const ang = Math.atan2(dy, dx);
        c.ox += (Math.cos(ang) * push - c.ox) * 0.12;
        c.oy += (Math.sin(ang) * push - c.oy) * 0.12;
        c.s += (1 + heat * 1.4 + wave * 0.15 - c.s) * 0.12;
        c.h += (heat - c.h) * 0.1;
        const g = c.h;
        ctx.font = `${g > 0.3 ? 700 : 400} ${Math.round(18 * c.s)}px ${family}`;
        ctx.fillStyle = dark
          ? g > 0.02 ? `rgba(${Math.round(255 - g * 13)},${Math.round(255 - g * 72)},${Math.round(255 - g * 250)},${0.1 + g * 0.9})` : `rgba(255,255,255,${0.07 + (wave + 0.5) * 0.06})`
          : g > 0.02 ? `rgba(${Math.round(11 + g * 170)},${Math.round(26 + g * 100)},${Math.round(46 - g * 40)},${0.12 + g * 0.88})` : `rgba(11,26,46,${0.08 + (wave + 0.5) * 0.06})`;
        ctx.fillText(c.ch, c.x + c.ox, c.y + c.oy);
      }
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointermove", mv); canvas.removeEventListener("pointerleave", lv); canvas.removeEventListener("pointerdown", dn);
    };
  }, []);

  return (
    <section className="relative h-[85vh] min-h-[560px] overflow-hidden bg-[var(--lbg)] text-white">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="pointer-events-none absolute inset-0 fidel-veil" />
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-5 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-gold">{am ? "07 — ቋንቋዎ" : "07 — YOUR LANGUAGE"}</p>
        <h2 className="mt-4 font-ethiopic text-5xl font-bold leading-tight sm:text-7xl">ቋንቋዎን ይናገራል።</h2>
        <p className="mt-3 text-2xl font-semibold text-white/70 sm:text-3xl">{am ? "በአማርኛ እና በእንግሊዝኛ — ሙሉ በሙሉ።" : "It speaks your language."}</p>
        <p className="mt-6 max-w-xl text-white/50">{am ? "ጠቋሚዎን በፊደላቱ ላይ ያንቀሳቅሱ ወይም ጠቅ ያድርጉ።" : "The whole platform — menus, matches and the AI assistant — works in Amharic and English. Move your cursor through the ፊደል, or click to send a ripple."}</p>
      </div>
    </section>
  );
}
