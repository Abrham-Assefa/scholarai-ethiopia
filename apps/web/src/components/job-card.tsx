"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, DollarSign, Globe2, Sparkles } from "lucide-react";
import type { JobOpening } from "@/lib/jobs-data";
import { Badge } from "@/components/ui/badge";

export function JobCard({ job }: { job: JobOpening }) {
  const [copied, setCopied] = useState(false);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "system-administration":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "system-support":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "system-developer":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:border-emerald-500/40 hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getCategoryColor(job.category)}`}>
                {job.categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Globe2 size={12} />
                {job.workModeLabel}
              </span>
              {job.featured && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Sparkles size={11} /> Featured
                </span>
              )}
            </div>

            <h3 className="pt-1 text-lg font-bold tracking-tight text-foreground transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Link href={`/jobs/detail/${job.slug}`}>
                {job.title}
              </Link>
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <Building2 size={13} className="text-muted-foreground" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <Globe2 size={13} className="text-muted-foreground" />
                {job.location}
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <DollarSign size={13} />
                {job.salary}
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-muted-foreground">
            <span className="inline-block rounded bg-muted px-2 py-0.5 font-medium">
              {job.jobType} · {job.experienceLevel}
            </span>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {job.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-foreground/30"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="rounded-md border bg-muted/30 px-1.5 py-0.5 text-[11px] text-muted-foreground">
              +{job.skills.length - 5}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            Deadline: <strong className="text-foreground/80">{job.deadline}</strong>
          </span>
          {job.ethiopiaFriendly && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} /> Remote from Ethiopia OK
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/detail/${job.slug}`}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            Details
            <ChevronRight size={13} />
          </Link>
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            Apply Online
          </a>
        </div>
      </div>
    </div>
  );
}
