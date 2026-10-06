import { describe, expect, it } from "vitest";
import { cn, daysLabel } from "@/lib/utils";
import { emptyCV } from "@/lib/types";

describe("daysLabel", () => {
  it("handles rolling, closed, today and future in English", () => {
    expect(daysLabel(null)).toBe("Rolling");
    expect(daysLabel(-1)).toBe("Closed");
    expect(daysLabel(0)).toBe("Today");
    expect(daysLabel(12)).toBe("12 days left");
  });
  it("returns Amharic strings for am locale", () => {
    expect(daysLabel(3, "am")).toContain("ቀናት");
    expect(daysLabel(null, "am")).toBe("ቀን ያልተወሰነ");
  });
});

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("p-2", "p-4", false && "hidden")).toBe("p-4");
  });
});

describe("emptyCV", () => {
  it("defaults to europass + Amharic/English languages", () => {
    const cv = emptyCV();
    expect(cv.meta.template).toBe("europass");
    expect(cv.languages.map((l) => l.name)).toEqual(["Amharic", "English"]);
  });
});
