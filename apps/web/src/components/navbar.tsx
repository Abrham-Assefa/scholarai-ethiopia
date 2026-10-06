"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { GraduationCap, Menu, Moon, Sun, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/scholarships", key: "scholarships" },
  { href: "/conferences", key: "conferences" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/cv", key: "cv" },
  { href: "/assistant", key: "assistant" },
] as const;

export function LanguageSwitcher({ className, testId = "lang-switch" }: { className?: string; testId?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const other = locale === "en" ? "am" : "en";
  return (
    <button
      type="button"
      aria-label="Switch language"
      onClick={() => router.replace(pathname, { locale: other })}
      className={cn("rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted", className)}
      data-testid={testId}
    >
      {locale === "en" ? "አማርኛ" : "English"}
    </button>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="flag-stripe h-1" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap size={18} /></span>
          <span>ScholarAI <span className="text-primary">Ethiopia</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={cn("rounded-lg px-3 py-2 text-sm hover:bg-muted", pathname.startsWith(l.href) && "bg-muted font-semibold")}>
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" aria-label={t("toggleTheme")} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            <Sun className="hidden dark:block" size={18} /><Moon className="dark:hidden" size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</Button>
        </div>
      </div>
      {open && (
        <nav className="border-t px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">{t(l.key)}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
