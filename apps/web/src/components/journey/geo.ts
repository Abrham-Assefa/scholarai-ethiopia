"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Scholarship } from "@/lib/types";

export type Airport = { code: string; city: string; lat: number; lon: number };
export const ADDIS: Airport = { code: "ADD", city: "Addis Ababa", lat: 8.98, lon: 38.79 };

/** Destination airport per scholarship country (used for flights & boarding passes). */
export const AIRPORTS: Record<string, Airport> = {
  Germany: { code: "FRA", city: "Frankfurt", lat: 50.03, lon: 8.57 },
  UK: { code: "LHR", city: "London", lat: 51.47, lon: -0.45 },
  USA: { code: "IAD", city: "Washington", lat: 38.95, lon: -77.45 },
  China: { code: "PEK", city: "Beijing", lat: 40.08, lon: 116.58 },
  "South Korea": { code: "ICN", city: "Seoul", lat: 37.46, lon: 126.44 },
  Japan: { code: "NRT", city: "Tokyo", lat: 35.77, lon: 140.39 },
  Türkiye: { code: "IST", city: "Istanbul", lat: 41.26, lon: 28.74 },
  Hungary: { code: "BUD", city: "Budapest", lat: 47.44, lon: 19.26 },
  Romania: { code: "OTP", city: "Bucharest", lat: 44.57, lon: 26.08 },
  Russia: { code: "SVO", city: "Moscow", lat: 55.97, lon: 37.41 },
  India: { code: "DEL", city: "New Delhi", lat: 28.56, lon: 77.1 },
  Brunei: { code: "BWN", city: "Brunei", lat: 4.94, lon: 114.93 },
  Azerbaijan: { code: "GYD", city: "Baku", lat: 40.47, lon: 50.05 },
  Sweden: { code: "ARN", city: "Stockholm", lat: 59.65, lon: 17.92 },
  Netherlands: { code: "AMS", city: "Amsterdam", lat: 52.31, lon: 4.76 },
  France: { code: "CDG", city: "Paris", lat: 49.01, lon: 2.55 },
  Switzerland: { code: "ZRH", city: "Zürich", lat: 47.46, lon: 8.55 },
  Australia: { code: "SYD", city: "Sydney", lat: -33.94, lon: 151.18 },
  Rwanda: { code: "KGL", city: "Kigali", lat: -1.97, lon: 30.14 },
  Ghana: { code: "ACC", city: "Accra", lat: 5.6, lon: -0.17 },
  EU: { code: "BRU", city: "Brussels", lat: 50.9, lon: 4.48 },
  Africa: { code: "NBO", city: "Nairobi", lat: -1.32, lon: 36.93 },
  Ethiopia: ADDIS,
};
const WORLDWIDE: Airport = { code: "INT", city: "Worldwide", lat: 48, lon: -30 };
export const airportFor = (country: string) => AIRPORTS[country] ?? WORLDWIDE;

const FLAGS: Record<string, string> = {
  Germany: "🇩🇪", UK: "🇬🇧", USA: "🇺🇸", China: "🇨🇳", "South Korea": "🇰🇷", Japan: "🇯🇵", Türkiye: "🇹🇷",
  Hungary: "🇭🇺", Romania: "🇷🇴", Russia: "🇷🇺", India: "🇮🇳", Brunei: "🇧🇳", Azerbaijan: "🇦🇿", Sweden: "🇸🇪",
  Netherlands: "🇳🇱", France: "🇫🇷", Switzerland: "🇨🇭", Australia: "🇦🇺", Rwanda: "🇷🇼", Ghana: "🇬🇭",
  EU: "🇪🇺", Ethiopia: "🇪🇹", Africa: "🌍",
};
export const flagFor = (country: string) => FLAGS[country] ?? "🌐";

let cache: Promise<Scholarship[]> | null = null;
/** One shared fetch for every landing section. */
export function useAllScholarships() {
  const [items, setItems] = useState<Scholarship[]>([]);
  useEffect(() => {
    cache ??= api.scholarships({ limit: "100" }).then((r) => r.items).catch(() => {
      cache = null;
      return [];
    });
    let alive = true;
    cache.then((r) => alive && setItems(r));
    return () => {
      alive = false;
    };
  }, []);
  return items;
}

export const fmtDeadline = (s: Scholarship) => {
  if (!s.deadline) return "ROLLING";
  return new Date(s.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
};
