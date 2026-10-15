"use client";

import { use } from "react";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, Calendar, CheckCircle, CheckCircle2, Clock, DollarSign, ExternalLink, FileText, Globe2, Laptop, Shield, Sparkles } from "lucide-react";
import { getJobBySlug, getJobsByCategory } from "@/lib/jobs-data";
import { JobCard } from "@/components/job-card";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = use(params);
  const job = getJobBySlug(id);

  if (!job) {
    notFound();
  }

  const relatedJobs = getJobsByCategory(job.category)
    .filter((j) => j.id !== job.id)
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/jobs" className="hover:text-foreground">
          Jobs
        </Link>
        <span>/</span>
        <Link href={`/jobs/${job.category}`} className="hover:text-foreground">
          {job.categoryLabel}
        </Link>
        <span>/</span>
        <span className="truncate max-w-[200px] text-foreground font-medium">{job.title}</span>
      </div>

      {/* Main Job Header Banner */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border bg-muted px-2.5 py-0.5 text-xs font-semibold">
                {job.categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Globe2 size={13} />
                {job.workModeLabel}
              </span>
              <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium">
                {job.jobType} · {job.experienceLevel}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Building2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={16} className="text-muted-foreground" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <DollarSign size={16} />
                {job.salary}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-muted-foreground" />
                Deadline: {job.deadline}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col md:min-w-[200px]">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              Apply Online Now
              <ExternalLink size={15} />
            </a>

            <Link
              href="/cv"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
            >
              <FileText size={14} />
              Tailor CV for this Job
            </Link>
          </div>
        </div>

        {/* Ethiopia friendly notice */}
        {job.ethiopiaFriendly && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Verified Remote for Ethiopia:</strong> This employer accepts candidates working online from Ethiopia. Payments can be settled via international USD wire transfer or online payment platforms.
            </span>
          </div>
        )}
      </div>

      {/* Main Details Columns */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Details, Responsibilities, Requirements */}
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Role Overview</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {job.summary}
            </p>
          </div>

          {/* Required Skills Tags */}
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Required Technologies & Skills</h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Key Responsibilities</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {job.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Prerequisites & Requirements</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Benefits & Compensation</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {job.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Job Snapshot Card */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-foreground">Job Snapshot</h3>
            <div className="divide-y text-xs">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Company</span>
                <span className="font-semibold text-foreground">{job.company}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-foreground">{job.categoryLabel}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Work Style</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{job.workModeLabel}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Salary</span>
                <span className="font-semibold text-foreground">{job.salary}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-semibold text-foreground">{job.experienceLevel}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Posted Date</span>
                <span className="font-semibold text-foreground">{job.postedDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Application Deadline</span>
                <span className="font-semibold text-foreground">{job.deadline}</span>
              </div>
            </div>

            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              Apply Online <ExternalLink size={13} />
            </a>
          </div>

          {/* ScholarAI CV Helper Callout */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Sparkles size={16} className="text-amber-500" />
              Maximize Your Chances
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use ScholarAI's CV Maker with the STAR method and ATS scoring to highlight your {job.categoryLabel} achievements.
            </p>
            <Link
              href="/cv"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Open CV Maker →
            </Link>
          </div>
        </div>
      </div>

      {/* Related Jobs Section */}
      {relatedJobs.length > 0 && (
        <div className="border-t pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">More {job.categoryLabel} Openings</h2>
            <Link
              href={`/jobs/${job.category}`}
              className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              View all in this category →
            </Link>
          </div>

          <div className="grid gap-4">
            {relatedJobs.map((rj) => (
              <JobCard key={rj.id} job={rj} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
