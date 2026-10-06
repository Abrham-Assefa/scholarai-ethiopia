"use client";
import { useEffect, useRef } from "react";
import { ADDIS, type Airport } from "./geo";

type LL = [number, number]; // [lat, lon]
// Hand-simplified continent outlines — enough for a recognisable dotted world.
const LAND: LL[][] = [
  [[37,-10],[35,10],[32,32],[30,33],[12,44],[11,51],[-1,42],[-11,40],[-26,33],[-35,20],[-29,16],[-17,12],[-6,12],[4,9],[5,-5],[4,-8],[10,-15],[15,-17],[21,-17],[28,-13],[33,-8]],
  [[-12,49],[-16,50],[-25,47],[-24,44],[-16,44]],
  [[36,-9],[43,-9],[44,-1],[48,-5],[51,2],[54,8],[57,8],[58,6],[62,5],[70,20],[71,28],[69,40],[60,60],[45,50],[42,42],[41,29],[36,28],[38,22],[40,19],[38,16],[45,13],[44,9],[43,3],[36,-6]],
  [[55,10],[58,12],[63,18],[66,24],[60,25],[56,18]],
  [[50,-5],[53,-4],[58,-5],[58,-2],[53,0],[51,1]],
  [[41,29],[42,42],[45,50],[60,60],[69,40],[72,70],[77,105],[70,140],[66,180],[60,165],[52,157],[43,135],[35,129],[38,121],[30,122],[22,114],[10,107],[1,104],[8,98],[16,97],[22,90],[8,77],[20,72],[25,67],[25,57],[22,59],[13,45],[30,32],[37,36]],
  [[31,130],[35,135],[41,141],[45,142],[43,145],[36,140]],
  [[5,95],[-6,106],[-8,115],[-8,125],[-3,141],[-9,141],[-2,131],[1,118],[-4,114],[1,109],[4,101]],
  [[70,-165],[71,-155],[70,-130],[69,-100],[73,-80],[60,-64],[52,-56],[45,-66],[41,-70],[35,-76],[25,-80],[30,-84],[29,-95],[22,-97],[18,-95],[21,-87],[15,-84],[9,-79],[8,-82],[16,-95],[20,-105],[31,-114],[34,-120],[40,-124],[48,-124],[58,-136],[60,-147],[57,-158],[65,-168]],
  [[60,-44],[70,-22],[82,-30],[82,-60],[76,-70],[68,-53]],
  [[12,-72],[10,-62],[5,-52],[-5,-35],[-23,-41],[-34,-53],[-41,-63],[-55,-68],[-50,-75],[-40,-73],[-18,-70],[-5,-81],[1,-80],[8,-77]],
  [[-11,142],[-17,146],[-28,153],[-38,150],[-38,140],[-32,133],[-35,117],[-22,114],[-14,127],[-12,136]],
  [[-35,173],[-41,175],[-46,167],[-41,172]],
];

function inPoly(lat: number, lon: number, poly: LL[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const D = Math.PI / 180;
const vec = (lat: number, lon: number) => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)] as const;

let DOTS: (readonly [number, number, number])[] | null = null;
function dots() {
  if (DOTS) return DOTS;
  DOTS = [];
  for (let lat = -58; lat <= 82; lat += 2.4) {
    const step = 2.4 / Math.max(0.25, Math.cos(lat * D));
    for (let lon = -180; lon < 180; lon += step) if (LAND.some((p) => inPoly(lat, lon, p))) DOTS.push(vec(lat, lon));
  }
  return DOTS;
}

function slerp(a: readonly number[], b: readonly number[], t: number) {
  const dot = Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
  const w = Math.acos(dot) || 1e-6, s = Math.sin(w);
  const k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s;
  const lift = 1 + Math.sin(Math.PI * t) * w * 0.22;
  return [(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift];
}

export function Globe({ destinations, highlight, className }: { destinations: Airport[]; highlight?: string | null; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const props = useRef({ destinations, highlight });
  props.current = { destinations, highlight };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pts = dots();
    let rot = -ADDIS.lon * D + 0.35, tilt = 0.42, vel = 0, tvel = 0, raf = 0, visible = true;
    let drag: { x: number; y: number } | null = null;
    const t0 = performance.now();

    const fit = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }); io.observe(canvas);

    const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      vel = (e.clientX - drag.x) * 0.005; tvel = (e.clientY - drag.y) * 0.003;
      rot += vel; tilt = Math.max(-0.6, Math.min(1.1, tilt + tvel));
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => { drag = null; canvas.style.cursor = "grab"; };
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

    function loop() {
      cancelAnimationFrame(raf);
      if (!visible) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const R = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
      const time = (performance.now() - t0) / 1000;
      if (!drag) { vel = vel * 0.95 + (reduced ? 0 : 0.0016) * 0.05; rot += vel; tilt += (0.42 - tilt) * 0.02; }
      const cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
      const proj = (v: readonly number[]) => {
        const x = v[0] * cr + v[2] * sr, z0 = -v[0] * sr + v[2] * cr;
        const y = v[1] * ct - z0 * st, z = v[1] * st + z0 * ct;
        return { x: cx + x * R, y: cy - y * R, z, out: x * x + y * y > 1 };
      };
      ctx.clearRect(0, 0, w, h);

      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, "#10233d"); body.addColorStop(1, "#050b16");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
      ctx.strokeStyle = "rgba(94,234,212,0.18)"; ctx.lineWidth = 1; ctx.stroke();

      for (const p of pts) {
        const q = proj(p);
        if (q.z <= 0) continue;
        ctx.fillStyle = `rgba(148,210,189,${0.15 + q.z * 0.6})`;
        const s = 0.8 + q.z * 1.2;
        ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
      }

      const A = vec(ADDIS.lat, ADDIS.lon);
      const { destinations: dests, highlight: hl } = props.current;
      dests.forEach((d, i) => {
        if (d.code === ADDIS.code) return;
        const B = vec(d.lat, d.lon), hot = hl === d.code;
        const path = Array.from({ length: 49 }, (_, k) => proj(slerp(A, B, k / 48)));
        ctx.lineWidth = hot ? 2.2 : 1;
        for (let k = 1; k < path.length; k++) {
          const a = path[k - 1], b = path[k];
          if (a.z < 0 && !a.out) continue;
          ctx.strokeStyle = hot ? "rgba(242,183,5,0.95)" : `rgba(242,183,5,${0.12 + 0.25 * (k / 48)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        const head = ((time * 0.22 + i * 0.137) % 1.25);
        if (head <= 1) {
          for (let k = 0; k < 10; k++) {
            const tt = head - k * 0.012;
            if (tt < 0) break;
            const q = proj(slerp(A, B, tt));
            if (q.z < 0 && !q.out) continue;
            ctx.fillStyle = `rgba(255,236,170,${(1 - k / 10) * 0.95})`;
            ctx.beginPath(); ctx.arc(q.x, q.y, (hot ? 2.8 : 2) * (1 - k / 14), 0, Math.PI * 2); ctx.fill();
          }
        }
        const end = path[48];
        if (end.z > 0) {
          const pulse = (time * 0.8 + i * 0.3) % 1;
          ctx.strokeStyle = `rgba(242,183,5,${1 - pulse})`;
          ctx.beginPath(); ctx.arc(end.x, end.y, 2 + pulse * (hot ? 14 : 8), 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = "#f2b705"; ctx.beginPath(); ctx.arc(end.x, end.y, hot ? 3.5 : 2.2, 0, Math.PI * 2); ctx.fill();
          if (hot || end.z > 0.55) {
            ctx.font = `${hot ? 700 : 600} ${hot ? 12 : 10}px ui-monospace, monospace`;
            ctx.fillStyle = hot ? "#fde68a" : "rgba(226,232,240,0.7)";
            ctx.fillText(d.code, end.x + 6, end.y - 6);
          }
        }
      });

      const a = proj(A);
      if (a.z > 0) {
        const pulse = (time * 0.6) % 1;
        ctx.fillStyle = `rgba(21,168,84,${0.5 * (1 - pulse)})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, 4 + pulse * 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(a.x, a.y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.font = "700 12px ui-monospace, monospace"; ctx.fillStyle = "#bbf7d0";
        ctx.fillText("ADD · Addis Ababa", a.x + 9, a.y + 4);
      }
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  return <canvas ref={ref} className={className} style={{ cursor: "grab", touchAction: "pan-y" }} aria-label="Interactive globe of scholarship destinations from Addis Ababa" role="img" />;
}
