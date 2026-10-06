import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysLabel(days: number | null | undefined, locale = "en") {
  if (days === null || days === undefined) return locale === "am" ? "ቀን ያልተወሰነ" : "Rolling";
  if (days < 0) return locale === "am" ? "አልፏል" : "Closed";
  if (days === 0) return locale === "am" ? "ዛሬ" : "Today";
  return locale === "am" ? `${days} ቀናት ቀርተዋል` : `${days} days left`;
}
