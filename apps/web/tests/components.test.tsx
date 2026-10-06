import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CVPreview } from "@/components/cv-preview";
import { emptyCV } from "@/lib/types";

describe("ProgressRing", () => {
  it("renders the clamped percentage", () => {
    render(<ProgressRing value={137} label="match" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

describe("CVPreview", () => {
  it("shows the empty hint without a name", () => {
    render(<CVPreview cv={emptyCV()} template="europass" emptyText="Fill name" />);
    expect(screen.getByText("Fill name")).toBeInTheDocument();
  });
  it("renders sections once filled", () => {
    const cv = emptyCV();
    cv.personal.fullName = "Abebe Kebede";
    cv.education[0] = { ...cv.education[0], institution: "Addis Ababa University", degree: "BSc", field: "EE", gpa: "3.8" };
    render(<CVPreview cv={cv} template="modern" emptyText="x" />);
    expect(screen.getByText("Abebe Kebede")).toBeInTheDocument();
    expect(screen.getByText(/Addis Ababa University/)).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
  });
});
