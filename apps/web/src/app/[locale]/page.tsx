import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Bell, Bot, FileText, Globe2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Stats } from "@/components/landing/stats";
import { DeadlineTicker } from "@/components/landing/ticker";
import { MatcherDemo } from "@/components/landing/matcher-demo";
import { SpotlightCard } from "@/components/landing/spotlight-card";

const COUNTRIES = ["🇩🇪 Germany", "🇬🇧 United Kingdom", "🇺🇸 USA", "🇰🇷 South Korea", "🇯🇵 Japan", "🇨🇳 China", "🇹🇷 Türkiye", "🇭🇺 Hungary", "🇸🇪 Sweden", "🇳🇱 Netherlands", "🇦🇺 Australia", "🇨🇦 Canada", "🇫🇷 France", "🇮🇹 Italy", "🇨🇭 Switzerland", "🇷🇺 Russia", "🇮🇳 India", "🇿🇦 South Africa", "🇪🇬 Egypt", "🇲🇦 Morocco"];

function Landing({ locale }: { locale: string }) {
  const t = useTranslations("landing");
  const am = locale === "am";
  const features = [
    { icon: Sparkles, key: "match", accent: "from-primary/20 to-primary/0 text-primary" },
    { icon: FileText, key: "cv", accent: "from-gold/25 to-gold/0 text-amber-600 dark:text-gold" },
    { icon: Bot, key: "assistant", accent: "from-red/20 to-red/0 text-red" },
    { icon: Bell, key: "deadlines", accent: "from-sky-500/20 to-sky-500/0 text-sky-600" },
  ] as const;
  const steps = t.raw("steps") as string[];

  return (
    <div className="relative -mt-8 space-y-24 overflow-x-clip pb-8 md:space-y-32">
      {/* ---------- HERO ---------- */}
      <section className="relative pt-14 md:pt-20">
        <div className="grid-bg pointer-events-none absolute inset-x-[-50vw] -top-8 h-[720px]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)] blur-2xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="reveal reveal-1 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-semibold">
              <span className="flag-stripe inline-block h-2.5 w-5 rounded-sm" /> {t("badge")}
            </span>
            <h1 className="reveal reveal-2 mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              {am ? (
                <>{t("title")}</>
              ) : (
                <>Find scholarships.<br /><span className="text-shine">Build your CV.</span><br />Never miss a deadline.</>
              )}
            </h1>
            <p className="reveal reveal-3 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{t("subtitle")}</p>
            <div className="reveal reveal-4 mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="btn-glow h-13 rounded-xl px-7 text-base" asChild><Link href="/onboarding">{t("cta")} <ArrowRight size={18} /></Link></Button>
              <Button size="lg" variant="outline" className="h-13 rounded-xl px-7 text-base backdrop-blur" asChild><Link href="/scholarships">{t("browse")}</Link></Button>
            </div>
            <Stats />
          </div>
          <div className="reveal reveal-3 hidden lg:block"><HeroVisual /></div>
        </div>
      </section>

      {/* ---------- TICKER ---------- */}
      <section className="space-y-3">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{am ? "የሚቀርቡ ቀነ ገደቦች" : "Closing soon"}</p>
        <DeadlineTicker />
      </section>

      {/* ---------- MATCHER DEMO ---------- */}
      <section>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Zap size={12} />{am ? "ቀጥታ ይሞክሩ" : "Try it live"}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{am ? "በ10 ሰከንድ ውስጥ ማዛመድዎን ይመልከቱ" : "See your matches in 10 seconds"}</h2>
          <p className="mt-3 text-muted-foreground">{am ? "ደረጃዎን፣ GPA እና መስክዎን ያንሸራትቱ — ውጤቶች ወዲያውኑ ይቀየራሉ።" : "Slide your GPA, pick a level and field — the ranking updates instantly from real scholarship data."}</p>
        </div>
        <MatcherDemo />
      </section>

      {/* ---------- FEATURES ---------- */}
      <section>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{am ? "ከፍለጋ እስከ ማመልከቻ ሁሉም በአንድ ቦታ" : "Everything from search to submit"}</h2>
            <p className="mt-2 text-muted-foreground">{am ? "ለኢትዮጲያውያን ተማሪዎች የተገነባ።" : "Built around how Ethiopian students actually apply."}</p>
          </div>
          <Link href="/scholarships" className="group inline-flex items-center gap-1 text-sm font-semibold text-primary">{t("browse")} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, key, accent }, i) => (
            <SpotlightCard key={key} className="reveal p-6" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} ring-1 ring-inset ring-current/20`}><Icon size={22} /></div>
              <h3 className="text-lg font-semibold">{t(`features.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`features.${key}.desc`)}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ---------- COUNTRIES MARQUEE ---------- */}
      <section className="space-y-4">
        <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"><Globe2 size={14} /> {am ? "ዕድሎች በ20+ አገሮች" : "Opportunities in 20+ countries"}</p>
        <div className="-mx-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee flex w-max gap-3 [animation-duration:60s]">
            {[...COUNTRIES, ...COUNTRIES].map((c, i) => <span key={i} className="shrink-0 rounded-full border bg-card px-4 py-2 text-sm">{c}</span>)}
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("howTitle")}</h2>
          <ol className="relative mt-8 space-y-6 border-l-2 border-dashed pl-8">
            {steps.map((s, i) => (
              <li key={s} className="reveal relative" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="absolute -left-[41px] flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-4 ring-background">{i + 1}</span>
                <p className="text-lg font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </div>
        <SpotlightCard tilt={false} className="p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck size={20} /></span>
            <div>
              <h3 className="font-semibold">{am ? "ሐቀኛ AI" : "Honest by design"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{am ? "ሲቪ አሻሻዩ መቼም ቁጥሮችን ወይም እውነታዎችን አይፈጥርም። የማዛመጃ ውጤቶች ለምን እና ምን እንደሚጎድል ያብራራሉ።" : "The CV enhancer never invents numbers or facts — a guard rejects anything you didn't say. Every match explains why you fit and what you're missing."}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[["0", am ? "የተፈጠሩ እውነታዎች" : "invented facts"], ["2", am ? "ቋንቋዎች" : "languages"], ["100%", am ? "ከመስመር ውጭ ይሰራል" : "works offline"]].map(([v, l]) => (
              <div key={l} className="rounded-xl border bg-background/60 p-3"><p className="text-2xl font-extrabold text-primary">{v}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">⚠️ {t("verify")}</p>
        </SpotlightCard>
      </section>

      {/* ---------- CTA BAND ---------- */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-emerald-800 p-10 text-white md:p-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-red/30 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">{am ? "ዛሬ ማመልከት ይጀምሩ።" : "Your scholarship starts today."}</h2>
            <p className="mt-3 max-w-xl text-white/80">{am ? "መገለጫዎን በ2 ደቂቃ ያዘጋጁ፣ የተደረደሩ ማዛመዶችን ያግኙ፣ ሲቪዎን ይገንቡ።" : "Set up your profile in 2 minutes, get ranked matches with explanations, and build a CV that passes the ATS."}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button size="lg" variant="gold" className="h-13 rounded-xl text-base shadow-xl" asChild><Link href="/onboarding">{t("cta")} <ArrowRight size={18} /></Link></Button>
            <Button size="lg" variant="outline" className="h-13 rounded-xl border-white/40 bg-white/10 text-base text-white hover:bg-white/20" asChild><Link href="/assistant">{am ? "ረዳቱን ይጠይቁ" : "Ask the assistant"}</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing locale={locale} />;
}
