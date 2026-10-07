import type { Conference } from "./types";

/** Found by the web collector in the last 14 days. */
export function isNewEvent(c: Conference, now = Date.now()) {
  return c.origin === "discovered" && !!c.discoveredAt && now - new Date(c.discoveredAt + "T00:00:00").getTime() < 14 * 86400e3;
}

/** The date that matters next: the application deadline when known, else the event start. */
export const keyDate = (c: Conference) => c.deadline ?? c.startDate ?? null;

export const isOnline = (c: Conference) => /online|virtual/i.test(c.location ?? "");

export function countdown(c: Conference) {
  if (typeof c.daysLeft === "number" && c.daysLeft >= 0) return { kind: "apply" as const, n: c.daysLeft };
  if (typeof c.startsIn === "number" && c.startsIn >= 0) return { kind: "start" as const, n: c.startsIn };
  return null;
}

/** red < 2 weeks, gold < 45 days, green otherwise. */
export function urgencyTone(n: number) {
  if (n < 14) return "bg-red/10 text-red ring-red/30";
  if (n < 45) return "bg-gold/15 text-amber-700 ring-gold/40 dark:text-gold";
  return "bg-primary/10 text-primary ring-primary/30";
}
