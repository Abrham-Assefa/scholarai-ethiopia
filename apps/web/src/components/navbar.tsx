"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ArrowUpRight, ChevronDown, GraduationCap, IdCard, Menu, Moon, Sun, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const links = [
  { href: "/scholarships", key: "scholarships" },
  { href: "/conferences", key: "conferences" },
  { href: "/cv", key: "cv" },
  { href: "/assistant", key: "assistant" },
  { href: "/dashboard", key: "dashboard" },
] as const;

const guideLinks = [
  { href: "/passport", key: "passport", descriptionKey: "passportDescription", icon: IdCard },
  { href: "/embassy-scholarships", key: "embassies", descriptionKey: "embassiesDescription", icon: GraduationCap },
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
  const [guidesOpen, setGuidesOpen] = useState(false);
  const guidesActive = guideLinks.some((link) => pathname.startsWith(link.href));
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="flag-stripe h-1" />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={cn("rounded-lg px-3 py-2 text-sm hover:bg-muted", pathname.startsWith(l.href) && "bg-muted font-semibold")}>
              {t(l.key)}
            </Link>
          ))}
          <div
            className="relative group"
            onMouseEnter={() => setGuidesOpen(true)}
            onMouseLeave={() => setGuidesOpen(false)}
            onFocus={() => setGuidesOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setGuidesOpen(false);
            }}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={guidesOpen}
              onClick={() => setGuidesOpen(!guidesOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                (guidesActive || guidesOpen) && "bg-muted font-semibold"
              )}
            >
              {t("guides")}
              <ChevronDown size={14} className={cn("transition-transform duration-200", guidesOpen && "rotate-180")} aria-hidden="true" />
            </button>
            <div className="invisible absolute right-0 top-full z-50 w-80 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-2xl border bg-background/95 p-2 shadow-2xl shadow-black/15 backdrop-blur-xl">
                <div className="px-3 pb-2 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{t("guideMenuEyebrow")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("guideMenuDescription")}</p>
                </div>
                <div className="grid gap-1">
                  {guideLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setGuidesOpen(false)}
                        className={cn(
                          "group/item flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-primary/15 hover:bg-primary/5",
                          active && "border-primary/15 bg-primary/5"
                        )}
                      >
                        <span className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover/item:bg-primary group-hover/item:text-primary-foreground",
                          active && "bg-primary text-primary-foreground"
                        )}>
                          <Icon size={19} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{t(link.key)}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{t(link.descriptionKey)}</span>
                        </span>
                        <ArrowUpRight size={15} className="shrink-0 text-muted-foreground opacity-0 transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-2 border-t px-3 pt-2 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t("guideMenuFooter")}
                </div>
              </div>
            </div>
          </div>
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
        <nav className="border-t px-4 py-2 md:hidden space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">{t(l.key)}</Link>
          ))}
          <div>
            <button
              type="button"
              aria-expanded={guidesOpen}
              aria-controls="mobile-guide-links"
              onClick={() => setGuidesOpen(!guidesOpen)}
              className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted", guidesActive && "bg-muted font-semibold")}
            >
              {t("guides")}
              <ChevronDown size={16} className={cn("transition-transform", guidesOpen && "rotate-180")} aria-hidden="true" />
            </button>
            {guidesOpen && (
              <div id="mobile-guide-links" className="mt-1 grid gap-1 rounded-2xl border bg-muted/30 p-2">
                {guideLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => { setOpen(false); setGuidesOpen(false); }}
                    className={cn("flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-primary/15 hover:bg-background", pathname.startsWith(link.href) && "border-primary/15 bg-background font-semibold")}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <link.icon size={18} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm">{t(link.key)}</span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{t(link.descriptionKey)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
