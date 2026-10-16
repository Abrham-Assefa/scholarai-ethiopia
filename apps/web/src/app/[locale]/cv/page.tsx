"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Download,
  Plus,
  Sparkles,
  Trash2,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Globe,
  Languages,
  BookOpen,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { emptyCV, type CVData, type CVRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CVPreview, type TemplateId, type AccentId, ACCENT_PALETTES } from "@/components/cv-preview";
import { ApiError } from "@/components/api-error";
import { cn } from "@/lib/utils";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const commas = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

// Sample 1: AAU Software Engineering / CS
const SAMPLE_AAU_CS: CVData = {
  personal: {
    fullName: "Abebe Kebede Tadesse",
    email: "abebe.kebede@aau.edu.et",
    phone: "+251 911 234 567",
    city: "Addis Ababa, Ethiopia",
    links: ["github.com/abebek-aau", "linkedin.com/in/abebek-tadesse"],
  },
  summary:
    "High-achieving BSc Software Engineering graduate from Addis Ababa University (GPA 3.89/4.0) with published research in Ethiopic NLP. Selected for national innovation honours; seeking DAAD / Erasmus Mundus Master's scholarship to pursue research in applied artificial intelligence.",
  education: [
    {
      institution: "Addis Ababa University (AAU)",
      degree: "BSc",
      field: "Software Engineering",
      gpa: "3.89",
      scale: "4.0",
      start: "2020",
      end: "2024",
      honors: ["Graduated with Very Great Distinction", "Dean's List for 8 Consecutive Semesters", "Best Senior Thesis Award"],
    },
  ],
  experience: [
    {
      org: "Addis Ababa University AI Research Group",
      role: "Undergraduate Research Assistant",
      start: "2023",
      end: "2024",
      bullets: [
        "Fine-tuned multilingual transformer models on 120,000 Amharic-English parallel sentences, improving BLEU translation score by 4.8 points",
        "Co-authored research paper presented at the AfricaNLP workshop on low-resource language processing",
        "Mentored 6 junior students in PyTorch and transformer architectures for natural language processing",
      ],
    },
    {
      org: "Ethio Telecom",
      role: "Software Engineering Intern",
      start: "2023",
      end: "2023",
      bullets: [
        "Engineered scalable REST microservices with FastAPI and PostgreSQL handling 15,000 daily transaction queries",
        "Reduced database query response latency by 34% through indexing and caching optimizations",
        "Wrote automated unit and integration tests increasing test coverage from 62% to 91%",
      ],
    },
  ],
  projects: [
    {
      name: "FidelNLP: Open-Source Amharic Language Toolkit",
      description: "Developed an open-source text tokenization and sentiment analysis tool for Ethiopic scripts used by 2,800+ developers.",
      tech: ["Python", "PyTorch", "Hugging Face", "FastAPI"],
      link: "github.com/abebek-aau/fidel-nlp",
    },
    {
      name: "Rural Clinic Medical Inventory System",
      description: "Built an offline-first PWA for health extension workers to track essential pharmaceuticals across 14 rural clinics.",
      tech: ["Next.js", "TypeScript", "IndexedDB", "Tailwind CSS"],
      link: "github.com/abebek-aau/clinic-inventory",
    },
  ],
  skills: {
    technical: ["Python", "TypeScript", "PyTorch", "FastAPI", "React / Next.js", "PostgreSQL", "Docker", "Algorithms"],
    soft: ["Academic Research", "Cross-cultural Collaboration", "Technical Writing", "Public Speaking"],
    tools: ["Git & GitHub", "Linux / Bash", "LaTeX", "Docker", "Postman", "VS Code"],
  },
  languages: [
    { name: "Amharic", level: "Native (C2)" },
    { name: "English", level: "Fluent (IELTS 8.0 / C1)" },
    { name: "Oromo", level: "Working Proficiency (B1)" },
  ],
  awards: [
    "Ministry of Innovation and Technology (MInT) Young Innovator Award (1st Place, 2024)",
    "AAU Faculty of Technology Academic Excellence Medal",
  ],
  certifications: [
    "DeepLearning.AI — Deep Learning Specialization (Coursera)",
    "AWS Certified Cloud Practitioner",
  ],
  volunteering: [
    "Lead Instructor at AddisCoder, teaching Python & data structures to 45 high school students",
    "Vice President, AAU Google Developer Student Club (GDSC)",
  ],
  publications: [
    "Tadesse A. K. et al., 'Neural Machine Translation for Low-Resource Ethiopic Scripts', AfricaNLP Workshop, 2024",
  ],
  meta: { targetScholarshipId: null, template: "modern", lang: "en" },
};

// Sample 2: Hawassa Medicine / Public Health
const SAMPLE_HAWASSA_MED: CVData = {
  personal: {
    fullName: "Dr. Selamawit Desta Bekele",
    email: "selamawit.desta@hu.edu.et",
    phone: "+251 922 876 543",
    city: "Hawassa, Sidama, Ethiopia",
    links: ["linkedin.com/in/selamawit-desta-md"],
  },
  summary:
    "Doctor of Medicine (MD) graduate from Hawassa University College of Medicine (GPA 3.84/4.0) with hands-on epidemiological research in maternal and child health. Applying for Chevening and Commonwealth Shared Scholarships to pursue an MSc in Global Health.",
  education: [
    {
      institution: "Hawassa University College of Medicine and Health Sciences",
      degree: "Doctor of Medicine (MD)",
      field: "Medicine",
      gpa: "3.84",
      scale: "4.0",
      start: "2018",
      end: "2025",
      honors: ["Top 3% Class Rank", "Gold Medal for Outstanding Clinical Practice", "University Research Fellow"],
    },
  ],
  experience: [
    {
      org: "Hawassa University Comprehensive Specialized Hospital",
      role: "Lead Clinical Intern",
      start: "2023",
      end: "2024",
      bullets: [
        "Managed clinical care and emergency triage for over 1,600 inpatient admissions across pediatric and internal medicine wards",
        "Supervised patient record digitisation for 22 junior medical students, reducing record retrieval times by 40%",
        "Presented 8 morbidity and mortality clinical audits identifying key antimicrobial stewardship opportunities",
      ],
    },
    {
      org: "Sidama Regional Health Bureau",
      role: "Field Epidemiology Research Assistant",
      start: "2022",
      end: "2023",
      bullets: [
        "Conducted cross-sectional nutritional assessments across 640 rural households in 4 woredas of Sidama region",
        "Analyzed biometric survey data in SPSS and prepared policy recommendations presented to regional health officers",
      ],
    },
  ],
  projects: [
    {
      name: "Sidama Community Maternal Health Outreach",
      description: "Led an educational campaign reaching 800+ pregnant mothers on danger signs during pregnancy and hospital delivery.",
      tech: ["Epidemiology", "Community Health", "KoboToolbox"],
      link: "",
    },
  ],
  skills: {
    technical: ["Clinical Epidemiology", "Biostatistics", "SPSS", "KoboToolbox", "Systematic Reviews"],
    soft: ["Clinical Empathy", "Crisis Management", "Public Health Advocacy", "Team Leadership"],
    tools: ["MS Excel Advanced", "EndNote", "RStudio", "Epi Info"],
  },
  languages: [
    { name: "Amharic", level: "Native (C2)" },
    { name: "Sidama", level: "Fluent (C1)" },
    { name: "English", level: "Fluent (TOEFL iBT 107 / C1)" },
  ],
  awards: [
    "Ethiopian Medical Students Association (EMSA) Best Humanitarian Project Award",
    "Sidama Regional Health Bureau Exemplary Volunteer Recognition",
  ],
  certifications: [
    "WHO Guidelines on Maternal and Perinatal Health Care",
    "NIH Introduction to the Principles and Practice of Clinical Research (IPPCR)",
  ],
  volunteering: [
    "Public Health Standing Committee Officer, EMSA Hawassa",
    "Organized voluntary blood donation campaign collecting 420 units for Hawassa Blood Bank",
  ],
  publications: [
    "Bekele S. D. et al., 'Determinants of Maternal Health Service Utilization in Rural Southern Ethiopia', East African Journal of Health Sciences, 2024",
  ],
  meta: { targetScholarshipId: null, template: "academic", lang: "en" },
};

function CVMaker() {
  const t = useTranslations("cv");
  const searchParams = useSearchParams();
  const target = searchParams?.get("target") ?? null;

  const [cv, setCv] = useState<CVData>(() => ({
    ...emptyCV(),
    meta: { ...emptyCV().meta, targetScholarshipId: target },
  }));
  const [rec, setRec] = useState<CVRecord | null>(null);
  const [busy, setBusy] = useState<"save" | "enhance" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accent, setAccent] = useState<AccentId>("emerald");
  const [zoom, setZoom] = useState<number>(100);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [gpaConv, setGpaConv] = useState<{
    german: number;
    german_label: string;
    uk: string;
    us_letter: string;
    percentage: number;
  } | null>(null);

  const [section, setSection] = useState<
    "personal" | "summary" | "education" | "experience" | "projects" | "skills" | "extras"
  >("personal");
  const [formVersion, setFormVersion] = useState<number>(0);

  const idRef = useRef<string | null>(null);
  const template = (cv.meta.template as TemplateId) || "modern";

  const upd = useCallback((fn: (c: CVData) => void) => {
    setCv((c) => {
      const n = structuredClone(c);
      fn(n);
      return n;
    });
  }, []);

  const save = useCallback(
    async (data: CVData) => {
      setBusy("save");
      setError(null);
      try {
        await api.ensureAuth();
        const r = idRef.current
          ? await api.updateCV(idRef.current, {
              data,
              template: data.meta.template,
              lang: data.meta.lang,
            })
          : await api.createCV(data, data.meta.template, data.meta.lang);
        idRef.current = r.id;
        setRec(r);
        return r;
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    []
  );

  // Autosave + live ATS score, debounced
  useEffect(() => {
    if (!cv.personal.fullName) return;
    const id = setTimeout(() => save(cv), 900);
    return () => clearTimeout(id);
  }, [cv, save]);

  // GPA live conversion with safe bounds check
  const gpaVal = Number(cv.education[0]?.gpa);
  const gpaScale = Number(cv.education[0]?.scale) || 4;
  useEffect(() => {
    if (!gpaVal || gpaVal <= 0 || gpaVal > gpaScale) {
      setGpaConv(null);
      return;
    }
    const id = setTimeout(() => {
      api
        .gpa(gpaVal, gpaScale)
        .then(setGpaConv)
        .catch(() => setGpaConv(null));
    }, 450);
    return () => clearTimeout(id);
  }, [gpaVal, gpaScale]);

  async function enhance() {
    const r = idRef.current ? rec : await save(cv);
    if (!r) return;
    setBusy("enhance");
    setError(null);
    try {
      const e = await api.enhanceCV(r.id);
      setRec(e);
      setCv(e.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function download() {
    const r = await save(cv);
    if (!r) return;
    setBusy("pdf");
    try {
      const blob = await api.exportCV(r.id, template);
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `${cv.personal.fullName.replace(/\s+/g, "_") || "scholarship_cv"}_${template}.pdf`,
      });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  function loadSample(sample: CVData) {
    setCv(structuredClone(sample));
    setFormVersion((v) => v + 1);
    if (sample.meta.template === "academic") setAccent("navy");
    else if (sample.meta.template === "europass") setAccent("royal");
    else if (sample.meta.template === "minimal") setAccent("slate");
    else setAccent("emerald");
  }

  function resetCV() {
    setCv(emptyCV());
    setGpaConv(null);
    setRec(null);
    idRef.current = null;
    setFormVersion((v) => v + 1);
  }

  const sections = useMemo(
    () =>
      [
        { id: "personal", icon: User, label: t("sections.personal") },
        { id: "summary", icon: FileText, label: t("sections.summary") },
        { id: "education", icon: GraduationCap, label: t("sections.education") },
        { id: "experience", icon: Briefcase, label: t("sections.experience") },
        { id: "projects", icon: Code, label: t("sections.projects") },
        { id: "skills", icon: Languages, label: t("sections.skills") },
        { id: "extras", icon: Award, label: t("sections.extras") },
      ] as const,
    [t]
  );

  const templatesList: { id: TemplateId; label: string; hint: string; badge: string }[] = [
    { id: "modern", label: t("modern"), hint: t("modernHint"), badge: "Popular" },
    { id: "academic", label: t("academic"), hint: t("academicHint"), badge: "DAAD / US" },
    { id: "europass", label: t("europass"), hint: t("europassHint"), badge: "EU Standard" },
    { id: "minimal", label: t("minimal"), hint: t("minimalHint"), badge: "STEM / ATS 99" },
  ];

  return (
    <div className="pb-16">
      {/* ============================================================== */}
      {/* TOP HERO TOOLBAR                                               */}
      {/* ============================================================== */}
      <div className="rounded-2xl border bg-card/60 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                <FileText className="h-4 w-4" />
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                ATS Guard 95+
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSample(SAMPLE_AAU_CS)}
              className="text-xs"
              title="Pre-fill with AAU Software Engineering scholar sample"
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              {t("loadAauSample")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSample(SAMPLE_HAWASSA_MED)}
              className="text-xs"
              title="Pre-fill with Medical / Public Health scholar sample"
            >
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              {t("loadMedSample")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCV}
              className="text-xs text-muted-foreground hover:text-destructive"
              title="Clear all fields to start fresh"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("clearForm")}
            </Button>
          </div>
        </div>

        {/* TEMPLATE PICKER STRIP */}
        <div className="mt-5 border-t pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("template")}
              </Label>
              <div className="mt-1.5 grid grid-cols-2 sm:flex sm:flex-wrap gap-2" role="radiogroup">
                {templatesList.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    role="radio"
                    aria-checked={template === tpl.id}
                    onClick={() => {
                      upd((c) => {
                        c.meta.template = tpl.id;
                      });
                      if (tpl.id === "academic") setAccent("navy");
                      else if (tpl.id === "europass") setAccent("royal");
                      else if (tpl.id === "minimal") setAccent("slate");
                      else setAccent("emerald");
                    }}
                    className={cn(
                      "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                      template === tpl.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <span className="text-xs font-bold text-foreground">{tpl.label}</span>
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                        {tpl.badge}
                      </span>
                    </div>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">{tpl.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Actions */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              <Select
                className="h-9 w-28 text-xs font-medium"
                value={cv.meta.lang}
                onChange={(e) => upd((c) => { c.meta.lang = e.target.value as "en" | "am"; })}
                aria-label={t("lang")}
              >
                <option value="en">English (EN)</option>
                <option value="am">አማርኛ (AM)</option>
              </Select>

              <Button
                variant="gold"
                size="sm"
                disabled={!!busy || !cv.personal.fullName}
                onClick={enhance}
                className="h-9 text-xs shadow-sm font-semibold"
                title="AI STAR-bullet enhancer with honesty guard"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {busy === "enhance" ? t("enhancing") : t("enhance")}
              </Button>

              <Button
                size="sm"
                disabled={!!busy || !cv.personal.fullName}
                onClick={download}
                className="h-9 text-xs shadow-sm font-semibold"
                title="Download ReportLab generated PDF"
              >
                <Download className="h-3.5 w-3.5" />
                {t("download")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 text-xs"
                title="Print or view A4 print preview"
              >
                <Printer className="h-3.5 w-3.5" />
                {t("print")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ApiError message={error} />
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE                                      */}
      {/* ============================================================== */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: FORM TABS & INPUTS (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card/60 p-1.5 shadow-sm">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    section === s.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE SECTION FORM */}
          <Card key={formVersion} className="shadow-sm">
            <CardContent className="space-y-4 p-5">
              {/* SECTION 1: PERSONAL */}
              {section === "personal" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fn">{t("fullName")}</Label>
                    <Input
                      id="fn"
                      placeholder="e.g. Abebe Kebede Tadesse"
                      value={cv.personal.fullName}
                      onChange={(e) => upd((c) => { c.personal.fullName = e.target.value; })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="em">{t("email")}</Label>
                      <Input
                        id="em"
                        type="email"
                        placeholder="abebe@example.com"
                        value={cv.personal.email}
                        onChange={(e) => upd((c) => { c.personal.email = e.target.value; })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ph">{t("phone")}</Label>
                      <Input
                        id="ph"
                        placeholder="+251 911 234 567"
                        value={cv.personal.phone}
                        onChange={(e) => upd((c) => { c.personal.phone = e.target.value; })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ci">{t("city")}</Label>
                    <Input
                      id="ci"
                      placeholder="Addis Ababa, Ethiopia"
                      value={cv.personal.city}
                      onChange={(e) => upd((c) => { c.personal.city = e.target.value; })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="links">{t("links")}</Label>
                    <Input
                      id="links"
                      placeholder="linkedin.com/in/username, github.com/username"
                      defaultValue={(cv.personal.links || []).join(", ")}
                      onBlur={(e) => upd((c) => { c.personal.links = commas(e.target.value); })}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Comma-separated URLs or handles (e.g. LinkedIn, GitHub, Google Scholar).
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 2: SUMMARY */}
              {section === "summary" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("sections.summary")}</Label>
                    <span className="text-[11px] text-muted-foreground">
                      {cv.summary?.length || 0} characters
                    </span>
                  </div>
                  <Textarea
                    rows={6}
                    placeholder={t("summaryPh")}
                    value={cv.summary}
                    onChange={(e) => upd((c) => { c.summary = e.target.value; })}
                    className="leading-relaxed"
                  />
                  <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Scholarship Winning Formula:
                    </p>
                    <p>1. Who you are & your graduation status (e.g. AAU Computer Science graduate, GPA 3.89).</p>
                    <p>2. Your strongest proof of excellence (research paper, national award, leadership initiative).</p>
                    <p>3. Exactly what programme/scholarship you aim for and how you plan to contribute back to Ethiopia.</p>
                  </div>
                </div>
              )}

              {/* SECTION 3: EDUCATION */}
              {section === "education" && (
                <div className="space-y-4">
                  {cv.education.map((e, i) => (
                    <div key={i} className="space-y-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {t("sections.education")} #{i + 1}
                        </span>
                        {cv.education.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => upd((c) => { c.education.splice(i, 1); })}
                          >
                            <Trash2 className="h-3 w-3" />
                            {t("remove")}
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label>{t("institution")}</Label>
                        <Input
                          placeholder="e.g. Addis Ababa University"
                          value={e.institution}
                          onChange={(ev) => upd((c) => { c.education[i].institution = ev.target.value; })}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>{t("degree")}</Label>
                          <Input
                            placeholder="e.g. BSc, BA, MD, MSc"
                            value={e.degree}
                            onChange={(ev) => upd((c) => { c.education[i].degree = ev.target.value; })}
                          />
                        </div>
                        <div>
                          <Label>{t("field")}</Label>
                          <Input
                            placeholder="e.g. Software Engineering"
                            value={e.field}
                            onChange={(ev) => upd((c) => { c.education[i].field = ev.target.value; })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <Label>{t("gpa")}</Label>
                          <Input
                            placeholder="3.85"
                            value={e.gpa ?? ""}
                            onChange={(ev) => upd((c) => { c.education[i].gpa = ev.target.value; })}
                          />
                        </div>
                        <div>
                          <Label>{t("scale")}</Label>
                          <Select
                            value={e.scale}
                            onChange={(ev) => upd((c) => { c.education[i].scale = ev.target.value; })}
                          >
                            <option value="4.0">4.0</option>
                            <option value="100">100%</option>
                          </Select>
                        </div>
                        <div>
                          <Label>{t("start")}</Label>
                          <Input
                            placeholder="2020"
                            value={e.start}
                            onChange={(ev) => upd((c) => { c.education[i].start = ev.target.value; })}
                          />
                        </div>
                        <div>
                          <Label>{t("end")}</Label>
                          <Input
                            placeholder="2024"
                            value={e.end}
                            onChange={(ev) => upd((c) => { c.education[i].end = ev.target.value; })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>{t("honors")}</Label>
                        <Input
                          placeholder="Very Great Distinction, Dean's List (comma separated)"
                          defaultValue={(e.honors || []).join(", ")}
                          onBlur={(ev) => upd((c) => { c.education[i].honors = commas(ev.target.value); })}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() =>
                      upd((c) => {
                        c.education.push({
                          institution: "",
                          degree: "",
                          field: "",
                          gpa: "",
                          scale: "4.0",
                          start: "",
                          end: "",
                          honors: [],
                        });
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("add")} {t("sections.education")}
                  </Button>
                </div>
              )}

              {/* SECTION 4: EXPERIENCE */}
              {section === "experience" && (
                <div className="space-y-4">
                  {cv.experience.map((e, i) => (
                    <div key={i} className="space-y-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {t("sections.experience")} #{i + 1}
                        </span>
                        {cv.experience.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => upd((c) => { c.experience.splice(i, 1); })}
                          >
                            <Trash2 className="h-3 w-3" />
                            {t("remove")}
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>{t("org")}</Label>
                          <Input
                            placeholder="e.g. Addis Ababa University AI Lab"
                            value={e.org}
                            onChange={(ev) => upd((c) => { c.experience[i].org = ev.target.value; })}
                          />
                        </div>
                        <div>
                          <Label>{t("role")}</Label>
                          <Input
                            placeholder="e.g. Research Assistant"
                            value={e.role}
                            onChange={(ev) => upd((c) => { c.experience[i].role = ev.target.value; })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>{t("start")}</Label>
                          <Input
                            placeholder="2023"
                            value={e.start}
                            onChange={(ev) => upd((c) => { c.experience[i].start = ev.target.value; })}
                          />
                        </div>
                        <div>
                          <Label>{t("end")}</Label>
                          <Input
                            placeholder="Present"
                            value={e.end}
                            onChange={(ev) => upd((c) => { c.experience[i].end = ev.target.value; })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <Label>{t("bullets")}</Label>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" /> STAR Formula
                          </span>
                        </div>
                        <Textarea
                          rows={4}
                          placeholder={t("bulletsPh")}
                          value={e.bullets.join("\n")}
                          onChange={(ev) => upd((c) => { c.experience[i].bullets = ev.target.value.split("\n"); })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() =>
                      upd((c) => {
                        c.experience.push({ org: "", role: "", start: "", end: "", bullets: [""] });
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("add")} {t("sections.experience")}
                  </Button>
                </div>
              )}

              {/* SECTION 5: PROJECTS & RESEARCH */}
              {section === "projects" && (
                <div className="space-y-4">
                  {(cv.projects || []).map((p, i) => (
                    <div key={i} className="space-y-3 rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Project #{i + 1}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => upd((c) => { c.projects.splice(i, 1); })}
                        >
                          <Trash2 className="h-3 w-3" />
                          {t("remove")}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>{t("projectName")}</Label>
                          <Input
                            placeholder="e.g. FidelNLP Tool"
                            value={p.name}
                            onChange={(ev) => upd((c) => { c.projects[i].name = ev.target.value; })}
                          />
                        </div>
                        <div>
                          <Label>{t("projectLink")}</Label>
                          <Input
                            placeholder="github.com/username/project"
                            value={p.link}
                            onChange={(ev) => upd((c) => { c.projects[i].link = ev.target.value; })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>{t("projectDesc")}</Label>
                        <Textarea
                          rows={2}
                          placeholder="Summarize the motivation, implementation, and quantified outcome"
                          value={p.description}
                          onChange={(ev) => upd((c) => { c.projects[i].description = ev.target.value; })}
                        />
                      </div>

                      <div>
                        <Label>{t("projectTech")}</Label>
                        <Input
                          placeholder="Python, PyTorch, Next.js, PostgreSQL (comma separated)"
                          defaultValue={(p.tech || []).join(", ")}
                          onBlur={(ev) => upd((c) => { c.projects[i].tech = commas(ev.target.value); })}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() =>
                      upd((c) => {
                        if (!c.projects) c.projects = [];
                        c.projects.push({ name: "", description: "", tech: [], link: "" });
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("add")} Project / Research
                  </Button>
                </div>
              )}

              {/* SECTION 6: SKILLS & LANGUAGES */}
              {section === "skills" && (
                <div className="space-y-4">
                  <div>
                    <Label>{t("technical")}</Label>
                    <Input
                      placeholder="Python, TypeScript, SQL, Docker, Data Analysis"
                      defaultValue={cv.skills.technical.join(", ")}
                      onBlur={(e) => upd((c) => { c.skills.technical = commas(e.target.value); })}
                    />
                  </div>
                  <div>
                    <Label>{t("tools")}</Label>
                    <Input
                      placeholder="Git, Linux, LaTeX, VS Code, Postman"
                      defaultValue={cv.skills.tools.join(", ")}
                      onBlur={(e) => upd((c) => { c.skills.tools = commas(e.target.value); })}
                    />
                  </div>
                  <div>
                    <Label>{t("soft")}</Label>
                    <Input
                      placeholder="Cross-cultural Collaboration, Academic Writing, Leadership"
                      defaultValue={cv.skills.soft.join(", ")}
                      onBlur={(e) => upd((c) => { c.skills.soft = commas(e.target.value); })}
                    />
                  </div>
                  <div>
                    <Label>{t("languages")}</Label>
                    <Input
                      placeholder="Amharic — Native, English — Fluent (IELTS 7.5)"
                      defaultValue={cv.languages.map((l) => `${l.name} — ${l.level}`).join(", ")}
                      onBlur={(e) =>
                        upd((c) => {
                          c.languages = commas(e.target.value).map((x) => {
                            const [name, level = "Fluent"] = x.split(/—|-/).map((y) => y.trim());
                            return { name, level };
                          });
                        })
                      }
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Format: Language — Level (e.g. &quot;English — IELTS 7.5 / C1&quot;, &quot;Amharic — Native&quot;).
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 7: EXTRAS */}
              {section === "extras" && (
                <div className="space-y-4">
                  <div>
                    <Label>{t("publications")}</Label>
                    <Textarea
                      rows={3}
                      placeholder="Authors, 'Paper Title', Conference / Journal, Year"
                      defaultValue={(cv.publications || []).join("\n")}
                      onBlur={(e) => upd((c) => { c.publications = lines(e.target.value); })}
                    />
                  </div>
                  <div>
                    <Label>{t("awards")}</Label>
                    <Textarea
                      rows={3}
                      placeholder="One award per line"
                      defaultValue={cv.awards.join("\n")}
                      onBlur={(e) => upd((c) => { c.awards = lines(e.target.value); })}
                    />
                  </div>
                  <div>
                    <Label>{t("volunteering")}</Label>
                    <Textarea
                      rows={3}
                      placeholder="One volunteering / leadership activity per line"
                      defaultValue={cv.volunteering.join("\n")}
                      onBlur={(e) => upd((c) => { c.volunteering = lines(e.target.value); })}
                    />
                  </div>
                  <div>
                    <Label>{t("certifications")}</Label>
                    <Textarea
                      rows={3}
                      placeholder="One certification per line"
                      defaultValue={cv.certifications.join("\n")}
                      onBlur={(e) => upd((c) => { c.certifications = lines(e.target.value); })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* ETHIOPIAN GPA CONVERSION WIDGET                                */}
          {/* ============================================================== */}
          {gpaConv && (
            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    {t("gpaConv")} (Based on Ethiopian {cv.education[0]?.gpa}/{cv.education[0]?.scale || "4.0"})
                  </span>
                  <span className="rounded bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {gpaConv.percentage}% Equivalent
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg border bg-card p-2.5 shadow-xs">
                    <p className="text-[11px] font-medium text-muted-foreground">{t("german")}</p>
                    <p className="text-xl font-extrabold text-foreground">{gpaConv.german}</p>
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                      {gpaConv.german_label}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-2.5 shadow-xs">
                    <p className="text-[11px] font-medium text-muted-foreground">{t("uk")}</p>
                    <p className="text-base font-bold text-foreground mt-1">{gpaConv.uk}</p>
                  </div>
                  <div className="rounded-lg border bg-card p-2.5 shadow-xs">
                    <p className="text-[11px] font-medium text-muted-foreground">{t("us")}</p>
                    <p className="text-xl font-extrabold text-foreground">{gpaConv.us_letter}</p>
                    <p className="text-[10px] text-muted-foreground">Grade A/4.0 Scale</p>
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] text-muted-foreground text-center">
                  💡 <strong>Tip for DAAD / European applications:</strong> The modified Bavarian formula is standard across Germany and Austria (1.0 is best; ≤ 1.5 qualifies for highest tier scholarships).
                </p>
              </CardContent>
            </Card>
          )}

          {/* ============================================================== */}
          {/* ATS SCORECARD & OPTIMIZATION PANEL                             */}
          {/* ============================================================== */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {t("ats")}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {busy === "save" ? t("saving") : rec ? t("saved") : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="flex flex-col items-center">
                  <ProgressRing value={rec?.ats?.score ?? (cv.personal.fullName ? 78 : 20)} size={88} label={t("ats")} />
                  <span className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {(rec?.ats?.score ?? 78) >= 85 ? t("atsExcellent") : t("atsGood")}
                  </span>
                </div>

                <div className="flex-1 text-xs space-y-2 w-full">
                  {rec?.ats?.breakdown && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2 text-muted-foreground">
                      {Object.entries(rec.ats.breakdown).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize">{k}:</span>
                          <strong className="text-foreground">{v}/100</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5 text-primary" />
                      {t("suggestions")}
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                      {(rec?.ats?.suggestions ?? [
                        "Use STAR format: Situation, Task, Action, Result",
                        "Include at least 2 quantifiable numbers or percentages in achievements",
                        "Ensure your full name, email, and city are present in the header",
                      ])
                        .slice(0, 4)
                        .map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                    </ul>
                  </div>

                  {rec?.enhancement && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs">
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        ATS Improvement: {rec.enhancement.scoreBefore} →{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {rec.enhancement.scoreAfter}
                        </span>
                        {rec.enhancement.flagged > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            · {t("flagged", { n: rec.enhancement.flagged })}
                          </span>
                        )}
                      </p>
                      {rec.enhancement.questions?.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-foreground">{t("questions")}:</p>
                          <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-muted-foreground">
                            {rec.enhancement.questions.slice(0, 3).map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: LIVE A4 PREVIEW (5 COLS) */}
        <div
          className={cn(
            fullscreen
              ? "fixed inset-0 z-50 overflow-y-auto bg-background/95 p-6 backdrop-blur"
              : "lg:col-span-5 lg:sticky lg:top-20 lg:self-start"
          )}
        >
          {/* PREVIEW TOOLBAR */}
          <div className="mb-2 flex items-center justify-between rounded-xl border bg-card/80 px-3 py-2 shadow-xs backdrop-blur">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>{t("preview")}</span>
              <span className="text-muted-foreground font-normal">
                · {t(template)}
              </span>
            </div>

            {/* Canvas controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(70, z - 10))}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("zoom")}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-muted-foreground w-8 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t("zoom")}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <div className="h-3 w-px bg-border mx-1" />
              <button
                type="button"
                onClick={() => setFullscreen(!fullscreen)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Toggle fullscreen preview"
              >
                {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* PALETTE PICKER */}
          <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground font-medium">{t("palette")}:</span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(ACCENT_PALETTES) as AccentId[]).map((palId) => (
                <button
                  key={palId}
                  type="button"
                  onClick={() => setAccent(palId)}
                  className={cn(
                    "h-4 w-4 rounded-full border transition-transform",
                    accent === palId && "ring-2 ring-primary ring-offset-1 scale-110",
                    palId === "emerald" && "bg-emerald-600",
                    palId === "navy" && "bg-blue-900",
                    palId === "burgundy" && "bg-rose-900",
                    palId === "slate" && "bg-slate-800",
                    palId === "royal" && "bg-sky-700"
                  )}
                  title={ACCENT_PALETTES[palId].name}
                />
              ))}
            </div>
          </div>

          {/* THE A4 SHEET CANVAS */}
          <div
            className={cn(
              "overflow-x-auto rounded-2xl border bg-slate-200/70 p-3 dark:bg-slate-900/60 shadow-inner flex justify-center",
              fullscreen && "max-w-4xl mx-auto my-4"
            )}
          >
            <CVPreview
              cv={cv}
              template={template}
              accent={accent}
              emptyText={t("noPreview")}
              zoom={zoom}
            />
          </div>

          {fullscreen && (
            <div className="mt-4 flex justify-center">
              <Button onClick={() => setFullscreen(false)} variant="outline">
                <Minimize2 className="h-4 w-4 mr-2" />
                Close Fullscreen
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CVPage() {
  return (
    <Suspense>
      <CVMaker />
    </Suspense>
  );
}
