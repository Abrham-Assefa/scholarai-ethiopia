"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Briefcase, CheckCircle2, ChevronRight, DollarSign, Filter, Globe2, Laptop, Search, Shield, Sparkles, Terminal, Users } from "lucide-react";
import { JOBS_LIST, type JobCategory } from "@/lib/jobs-data";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";

const CATEGORY_CARDS = [
  {
    id: "system-administration",
    title: "System Administration",
    desc: "Linux/Unix servers, AWS/GCP cloud, Kubernetes, DevOps, Docker & network security.",
    count: JOBS_LIST.filter((j) => j.category === "system-administration").length,
    icon: Shield,
    color: "from-sky-500/10 to-blue-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400",
  },
  {
    id: "system-support",
    title: "System Support",
    desc: "IT Service Desk, Tier 2/3 diagnostics, identity management, VPNs & application troubleshooting.",
    count: JOBS_LIST.filter((j) => j.category === "system-support").length,
    icon: Users,
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  {
    id: "system-developer",
    title: "System Developer",
    desc: "Full-Stack, Backend Python/FastAPI, Go systems, Next.js, distributed databases & microservices.",
    count: JOBS_LIST.filter((j) => j.category === "system-developer").length,
    icon: Terminal,
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
];

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredJobs = useMemo(() => {
    return JOBS_LIST.filter((job) => {
      if (selectedCategory !== "all" && job.category !== selectedCategory) {
        return false;
      }
      if (levelFilter !== "all" && job.experienceLevel !== levelFilter) {
        return false;
      }
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
  }, [selectedCategory, levelFilter, query]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-500/15 via-background to-amber-500/15 p-6 sm:p-10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1 text-xs font-semibold text-emerald-600 shadow-xs backdrop-blur dark:text-emerald-400">
            <Globe2 size={14} />
            Remote Careers For Ethiopian Talent
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            Work Online in Tech: <span className="text-emerald-600 dark:text-emerald-400">Admin, Support & Dev</span>
          </h1>

          <p className="text-sm text-muted-foreground sm:text-base leading-relaxed">
            Curated 100% remote online job openings for Ethiopian engineers and IT professionals. 
            Earn international USD salaries from Addis Ababa or anywhere across the globe.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <CheckCircle2 size={15} className="text-emerald-500" />
              100% Remote / Online
            </span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <DollarSign size={15} className="text-emerald-500" />
              Paid in USD ($1,800 – $7,500/mo)
            </span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Sparkles size={15} className="text-amber-500" />
              Direct Apply Links
            </span>
          </div>
        </div>
      </div>

      {/* Category Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CATEGORY_CARDS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-gradient-to-br p-5 transition hover:shadow-md ${cat.color} ${
                isSelected ? "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-background" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-xs">
                    <Icon size={20} />
                  </div>
                  <span className="rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-bold shadow-2xs backdrop-blur">
                    {cat.count} Open Roles
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-foreground">{cat.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "all" : cat.id)}
                  className="text-xs font-semibold hover:underline"
                >
                  {isSelected ? "Showing this category" : "Filter these jobs"}
                </button>
                <Link
                  href={`/jobs/${cat.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-emerald-600"
                >
                  View category <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by role, skills (Linux, Python, Cloud, Support) or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          className="rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Tech Disciplines</option>
          <option value="system-administration">System Administration</option>
          <option value="system-support">System Support</option>
          <option value="system-developer">System Developer</option>
        </select>

        <select
          className="rounded-md border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">All Experience Levels</option>
          <option value="Junior">Junior / Entry-Level</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
        </select>
      </div>

      {/* Results Count & Quick CV link */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3 text-xs">
        <span className="font-semibold text-foreground">
          Showing {filteredJobs.length} active online {filteredJobs.length === 1 ? "position" : "positions"}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Applying for remote tech jobs?</span>
          <Link
            href="/cv"
            className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Create your ATS-ready CV →
          </Link>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
