import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, FileText, ShieldCheck } from "lucide-react";

export default function PassportPage() {
  const t = useTranslations("passport");
  const steps = t.raw("steps") as { title: string; description: string }[];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-gold/10 p-6 md:p-10">
        <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{t("subtitle")}</p>
        <a
          href="https://ics.gov.et/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t("officialLink")} <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{t("stepsTitle")}</h2>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border bg-card p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 leading-6 text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <aside className="rounded-2xl border border-gold/40 bg-gold/10 p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <ShieldCheck size={18} aria-hidden="true" /> {t("importantTitle")}
        </h2>
        <p className="mt-2 leading-6 text-muted-foreground">{t("important")}</p>
        <a
          href="https://ics.gov.et/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <FileText size={16} aria-hidden="true" /> {t("source")} <Check size={14} aria-hidden="true" />
        </a>
      </aside>
    </div>
  );
}
