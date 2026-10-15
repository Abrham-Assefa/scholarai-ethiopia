"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, Building2, ClipboardCheck, FileText } from "lucide-react";

type EmbassyProgram = {
  country: string;
  embassy: string;
  program: string;
  description: string;
  programUrl: string;
  embassyUrl: string;
};

type DocumentItem = { title: string; description: string };

export default function EmbassyScholarshipsPage() {
  const t = useTranslations("embassyScholarships");
  const programs = t.raw("programs") as EmbassyProgram[];
  const documents = t.raw("documents") as DocumentItem[];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-gold/10 p-6 md:p-10">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <Building2 size={16} aria-hidden="true" /> {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{t("intro")}</p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{t("programsTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {programs.map((program) => (
            <article key={program.country} className="flex flex-col rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{program.country}</p>
              <h3 className="mt-2 text-lg font-bold">{program.program}</h3>
              <p className="mt-1 text-sm font-medium">{program.embassy}</p>
              <p className="mt-3 flex-1 leading-6 text-muted-foreground">{program.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
                <a href={program.programUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {t("programLink")} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
                <a href={program.embassyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {t("embassyLink")} <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 rounded-xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">{t("availabilityNote")}</p>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <ClipboardCheck size={22} aria-hidden="true" /> {t("documentsTitle")}
        </h2>
        <p className="mb-4 leading-6 text-muted-foreground">{t("documentsIntro")}</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {documents.map((document) => (
            <li key={document.title} className="flex gap-3 rounded-xl border bg-card p-4">
              <FileText className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true" />
              <div>
                <h3 className="font-semibold">{document.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{document.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <aside className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 p-5">
          <h3 className="font-bold">{t("appointmentTitle")}</h3>
          <p className="mt-2 leading-6 text-muted-foreground">{t("appointmentNote")}</p>
        </aside>
      </section>
    </div>
  );
}
