import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, Bell, Bot, FileText, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LiveStats } from "@/components/live-stats";

function Landing() {
  const t = useTranslations("landing");
  const features = [
    { icon: Sparkles, key: "match" },
    { icon: FileText, key: "cv" },
    { icon: Bot, key: "assistant" },
    { icon: Bell, key: "deadlines" },
  ] as const;
  const steps = t.raw("steps") as string[];
  return (
    <div className="space-y-20">
      <section className="fade-up grid items-center gap-10 pt-6 md:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-xs font-semibold">{t("badge")}</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link href="/onboarding">{t("cta")} <ArrowRight size={16} /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/scholarships">{t("browse")}</Link></Button>
          </div>
          <LiveStats />
        </div>
        <div className="relative hidden md:block">
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/20 via-gold/10 to-red/10 blur-2xl" />
          <Card className="relative"><CardContent className="space-y-3 p-6">
            {[92, 78, 61].map((p, i) => (
              <div key={p} className="flex items-center gap-4 rounded-lg border p-3">
                <span className="text-xl font-bold" style={{ color: p > 70 ? "var(--primary)" : "var(--gold)" }}>{p}%</span>
                <div className="flex-1">
                  <div className="h-3 w-40 rounded bg-muted" />
                  <div className="mt-2 h-2 w-24 rounded bg-muted" />
                </div>
                <span className="text-xs text-muted-foreground">{[14, 40, 77][i]}d</span>
              </div>
            ))}
          </CardContent></Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, key }) => (
          <Card key={key}><CardContent className="p-5">
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={20} /></span>
            <h3 className="font-semibold">{t(`features.${key}.title`)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(`features.${key}.desc`)}</p>
          </CardContent></Card>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold">{t("howTitle")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-xl border p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">⚠️ {t("verify")}</p>
      </section>
    </div>
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing />;
}
