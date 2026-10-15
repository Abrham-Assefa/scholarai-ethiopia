"use client";

import { use, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Briefcase, CheckCircle2, Filter, Globe2, Laptop, Search, Shield, Terminal, Users } from "lucide-react";
import { CATEGORY_INFO, JOBS_LIST, type JobCategory } from "@/lib/jobs-data";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";

const CATEGORY_TABS: { id: JobCategory | "all"; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "all", label: "All Online Jobs", icon: Globe2 },
  { id: "system-administration", label: "System Administration", icon: Shield },
  { id: "system-support", label: "System Support", icon: Users },
  { id: "system-developer", label: "System Developer", icon: Terminal },
];

export default function JobCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { category: rawCategory } = use(params);
  const category = rawCategory as JobCategory;
  const info = CATEGORY_INFO[category] || {
    title: "Online Tech Jobs Openings",
    description: "Browse remote and online job opportunities open for Ethiopian tech professionals worldwide.",
    badge: "Online Careers",
  };

  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filteredJobs = useMemo(() => {
    return JOBS_LIST.filter((job) => {
      // Category match
      if (category in CATEGORY_INFO && job.category !== category) {
        return false;
      }
      // Level filter
      if (levelFilter !== "all" && job.experienceLevel !== levelFilter) {
        return false;
      }
      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes(q));
        const matchesSummary = job.summary.toLowerCase().includes(q);
        return matchesTitle || matchesCompany || matchesSkills || matchesSummary;
      }
      return true;
    });
  }, [category, levelFilter, query]);

  return (
    <div className="space-y-8">
      {/* Back button and Category Header */}
      <div>
        <div className="flex items-center gap-2 pb-3">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={14} />
            All Jobs
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-xs font-medium text-foreground">{info.badge}</span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-background to-amber-500/10 p-6 md:p-8">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-xs backdrop-blur dark:text-emerald-400">
              <Laptop size={14} />
              100% Online / Remote Opportunities
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl text-foreground">
              {info.title}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base leading-relaxed">
              {info.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Verified Remote Employers
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <CheckCircle2 size={14} className="text-emerald-500" />
                USD Salary Compensation
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Work From Anywhere in Ethiopia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === category;
          const href = tab.id === "all" ? "/jobs" : `/jobs/${tab.id}`;
          return (
            <Link
              key={tab.id}
              href={href}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Filters & Search Bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by role, skills (Linux, Python, Cloud, Support) or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">All Experience Levels</option>
            <option value="Junior">Junior / Entry-Level</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
        </div>
      </div>

      {/* Results Count & CV Tool CTA banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3 text-xs">
        <span className="font-semibold text-foreground">
          Showing {filteredJobs.length} open {filteredJobs.length === 1 ? "position" : "positions"}
        </span>

        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Need an ATS-optimized tech CV?</span>
          <Link
            href="/cv"
            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Build your CV with ScholarAI →
          </Link>
        </div>
      </div>

      {/* Jobs List Grid */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search size={20} />
          </div>
          <h3 className="mt-3 text-base font-semibold">No job openings found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search terms or clearing the experience level filter.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setLevelFilter("all");
            }}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
