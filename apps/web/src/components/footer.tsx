"use client";
import { useLocale } from "next-intl";
import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "./navbar";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function Footer() {
  const am = useLocale() === "am";
  const cols = [
    {
      h: am ? "ያስሱ" : "Explore",
      l: [
        { href: "/scholarships", t: am ? "ስኮላርሺፖች" : "Scholarships" },
        { href: "/conferences", t: am ? "ኮንፈረንሶች" : "Conferences" },
        { href: "/dashboard", t: am ? "ዳሽቦርድ" : "Dashboard" },
      ],
    },
    {
      h: am ? "መሳሪያዎች" : "Tools",
      l: [
        { href: "/onboarding", t: am ? "መገለጫ ይፍጠሩ" : "Build your profile" },
        { href: "/cv", t: am ? "ሲቪ ማዘጋጃ" : "CV Maker" },
        { href: "/assistant", t: am ? "AI ረዳት" : "AI Assistant" },
      ],
    },
  ];
  return (
    <footer className="relative overflow-hidden border-t bg-card/40">
      <div className="flag-stripe absolute inset-x-0 top-0 h-1" />
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex"><Logo className="text-lg" markClassName="h-10 w-10" /></Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {am ? "ለኢትዮጵያ ተማሪዎች ስኮላርሺፕ ለማግኘት፣ ሲቪ ለማዘጋጀት እና የጊዜ ገደቦችን ለመከታተል የተሰራ AI መድረክ።" : "The AI co-pilot helping Ethiopian students find scholarships, build world-class CVs and never miss a deadline."}
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={13} className="text-primary" />{am ? "አዲስ አበባ፣ ኢትዮጵያ" : "Addis Ababa, Ethiopia"}</p>
          </div>

          {cols.map((c) => (
            <div key={c.h}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{c.h}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.l.map((x) => (
                  <li key={x.href}><Link href={x.href} className="transition-colors hover:text-primary">{x.t}</Link></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 rounded-2xl border bg-background/60 p-5 md:col-span-1">
            <p className="font-semibold">{am ? "የጊዜ ገደብ አያምልጥዎ" : "Never miss a deadline"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{am ? "መገለጫዎን በ2 ደቂቃ ይሙሉ — ተዛማጆችና አስታዋሾች ያግኙ።" : "Fill your profile in 2 minutes — get matches and reminders."}</p>
            <Link href="/onboarding" className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-[#fff] transition-opacity hover:opacity-90">
              {am ? "ይጀምሩ" : "Get started"}<ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ScholarAI Ethiopia · {am ? "የጊዜ ገደቦች በየዓመቱ ይቀየራሉ — ሁልጊዜ ኦፊሴላዊውን ገጽ ያረጋግጡ።" : "Deadlines change yearly — always confirm on the official site."}</p>
          <div className="flex items-center gap-4">
            <a href={`${API}/docs`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><BookOpen size={13} />API docs</a>
            <LanguageSwitcher testId="footer-lang-switch" />
          </div>
        </div>
      </div>
    </footer>
  );
}
