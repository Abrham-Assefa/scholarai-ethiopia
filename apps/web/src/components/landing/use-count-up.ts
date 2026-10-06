"use client";
import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number | null | undefined, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const current = useRef(0);
  useEffect(() => {
    if (target === null || target === undefined) return;
    const start = performance.now();
    const from = current.current;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      current.current = v;
      setValue(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}
