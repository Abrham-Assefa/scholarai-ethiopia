import { describe, expect, it } from "vitest";
import { countdown, isNewEvent, keyDate, urgencyTone } from "@/lib/conferences";
import type { Conference } from "@/lib/types";

const base: Conference = {
  id: "x", title: "X", startDate: "2027-02-03", fundingType: "full", age: { min: null, max: null }, ethiopiansEligible: true,
};

describe("conference helpers", () => {
  it("prefers the application deadline over the event start", () => {
    expect(keyDate({ ...base, deadline: "2026-11-15" })).toBe("2026-11-15");
    expect(keyDate(base)).toBe("2027-02-03");
  });

  it("counts down to the deadline, else to the start", () => {
    expect(countdown({ ...base, daysLeft: 9, startsIn: 120 })).toEqual({ kind: "apply", n: 9 });
    expect(countdown({ ...base, daysLeft: null, startsIn: 30 })).toEqual({ kind: "start", n: 30 });
    expect(countdown({ ...base, daysLeft: -2, startsIn: -1 })).toBeNull();
  });

  it("colours urgency red / gold / green", () => {
    expect(urgencyTone(5)).toContain("red");
    expect(urgencyTone(30)).toContain("gold");
    expect(urgencyTone(90)).toContain("primary");
  });

  it("flags recently discovered events as new", () => {
    const now = new Date("2026-10-07T12:00:00").getTime();
    expect(isNewEvent({ ...base, origin: "discovered", discoveredAt: "2026-10-01" }, now)).toBe(true);
    expect(isNewEvent({ ...base, origin: "discovered", discoveredAt: "2026-09-01" }, now)).toBe(false);
    expect(isNewEvent({ ...base, origin: "curated", discoveredAt: "2026-10-06" }, now)).toBe(false);
  });
});
