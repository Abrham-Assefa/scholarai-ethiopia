"use client";

import type { CVData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Mail, Phone, MapPin, Globe, ExternalLink, Award, BookOpen, GraduationCap, Briefcase, Code, Languages, CheckCircle2 } from "lucide-react";

export type TemplateId = "europass" | "modern" | "academic" | "minimal";

export type AccentId = "emerald" | "navy" | "burgundy" | "slate" | "royal";

export const ACCENT_PALETTES: Record<AccentId, { name: string; primary: string; secondary: string; border: string; bgSoft: string; badge: string }> = {
  emerald: {
    name: "Ethiopian Emerald",
    primary: "text-emerald-800 dark:text-emerald-400",
    secondary: "text-amber-600 dark:text-amber-400",
    border: "border-emerald-700 dark:border-emerald-500",
    bgSoft: "bg-emerald-50 dark:bg-emerald-950/40",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  navy: {
    name: "Scholar Navy",
    primary: "text-blue-900 dark:text-blue-300",
    secondary: "text-amber-600 dark:text-amber-400",
    border: "border-blue-900 dark:border-blue-400",
    bgSoft: "bg-blue-50 dark:bg-blue-950/40",
    badge: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800",
  },
  burgundy: {
    name: "Oxford Burgundy",
    primary: "text-rose-900 dark:text-rose-300",
    secondary: "text-amber-600 dark:text-amber-400",
    border: "border-rose-900 dark:border-rose-500",
    bgSoft: "bg-rose-50 dark:bg-rose-950/40",
    badge: "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  },
  slate: {
    name: "Minimal Slate",
    primary: "text-slate-900 dark:text-slate-100",
    secondary: "text-slate-600 dark:text-slate-400",
    border: "border-slate-800 dark:border-slate-400",
    bgSoft: "bg-slate-100 dark:bg-slate-800/50",
    badge: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  },
  royal: {
    name: "Europass Blue",
    primary: "text-sky-900 dark:text-sky-300",
    secondary: "text-amber-500 dark:text-amber-400",
    border: "border-sky-900 dark:border-sky-400",
    bgSoft: "bg-sky-50 dark:bg-sky-950/40",
    badge: "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800",
  },
};

interface CVPreviewProps {
  cv: CVData;
  template?: TemplateId;
  accent?: AccentId;
  emptyText?: string;
  zoom?: number;
}

export function CVPreview({
  cv,
  template = "modern",
  accent = template === "academic" ? "navy" : template === "europass" ? "royal" : template === "minimal" ? "slate" : "emerald",
  emptyText = "Fill in your full name to generate your live scholarship CV.",
  zoom = 100,
}: CVPreviewProps) {
  if (!cv.personal?.fullName?.trim()) {
    return (
      <div className="flex min-h-[460px] flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h4 className="text-base font-semibold text-foreground">Scholarship CV Preview</h4>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{emptyText}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground/80">
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> ATS 95+ format
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> STAR Action Bullets
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Ethiopian GPA included
          </span>
        </div>
      </div>
    );
  }

  const p = cv.personal;
  const edu = (cv.education || []).filter((e) => e.institution || e.degree);
  const exp = (cv.experience || []).filter((e) => e.org || e.role);
  const projects = (cv.projects || []).filter((pr) => pr.name);
  const skills = cv.skills || { technical: [], soft: [], tools: [] };
  const languages = cv.languages || [];
  const awards = cv.awards || [];
  const certifications = cv.certifications || [];
  const volunteering = cv.volunteering || [];
  const publications = cv.publications || [];

  const pal = ACCENT_PALETTES[accent] || ACCENT_PALETTES.emerald;

  // Render individual template variants
  return (
    <div
      className="origin-top transition-transform duration-200"
      style={{ transform: `scale(${zoom / 100})` }}
      data-testid="cv-preview"
    >
      <article
        className={cn(
          "relative mx-auto w-full max-w-[800px] min-h-[1050px] bg-white p-8 md:p-12 text-slate-800 shadow-xl transition-all",
          "print:m-0 print:p-8 print:shadow-none print:w-full",
          template === "academic" && "font-serif",
          template === "minimal" && "font-sans tracking-tight",
          template === "modern" && "font-sans",
          template === "europass" && "font-sans text-[12.5px]"
        )}
      >
        {/* Subtle decorative top accent bar */}
        {template === "modern" && (
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-700" />
        )}
        {template === "academic" && (
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-950 via-amber-600 to-blue-950" />
        )}
        {template === "europass" && (
          <div className="absolute inset-x-0 top-0 h-2 bg-sky-900" />
        )}

        {/* ============================================================== */}
        {/* HEADER SECTION                                                 */}
        {/* ============================================================== */}
        {template === "academic" ? (
          <header className="mb-6 border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-slate-950">
              {p.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-700">
              {p.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-500" /> {p.email}
                </span>
              )}
              {p.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-500" /> {p.phone}
                </span>
              )}
              {p.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-500" /> {p.city}
                </span>
              )}
              {p.links?.filter(Boolean).map((l, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-blue-900 hover:underline">
                  <Globe className="h-3 w-3 text-slate-500" /> {l.replace(/^https?:\/\//, "")}
                </span>
              ))}
            </div>
          </header>
        ) : template === "europass" ? (
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between border-b-2 border-sky-900 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sky-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Europass
                </span>
                <span className="text-[11px] font-medium text-sky-900">Curriculum Vitae</span>
              </div>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{p.fullName}</h1>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              {p.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-sky-900" />
                  <span>{p.email}</span>
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-sky-900" />
                  <span>{p.phone}</span>
                </div>
              )}
              {p.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-sky-900" />
                  <span>{p.city}</span>
                </div>
              )}
              {p.links?.filter(Boolean).map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-sky-900" />
                  <span>{l.replace(/^https?:\/\//, "")}</span>
                </div>
              ))}
            </div>
          </header>
        ) : template === "minimal" ? (
          <header className="mb-6 border-b border-slate-300 pb-4">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                {p.fullName}
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                Scholarship Applicant · Ethiopia
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {p.email && <span>{p.email}</span>}
              {p.phone && <span>• {p.phone}</span>}
              {p.city && <span>• {p.city}</span>}
              {p.links?.filter(Boolean).map((l, i) => (
                <span key={i}>• {l.replace(/^https?:\/\//, "")}</span>
              ))}
            </div>
          </header>
        ) : (
          /* MODERN EMERALD */
          <header className="mb-6 border-l-4 border-emerald-700 pl-4 py-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {p.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              {p.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-700" /> {p.email}
                </span>
              )}
              {p.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-700" /> {p.phone}
                </span>
              )}
              {p.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700" /> {p.city}
                </span>
              )}
              {p.links?.filter(Boolean).map((l, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-emerald-800 font-medium hover:underline">
                  <ExternalLink className="h-3 w-3" /> {l.replace(/^https?:\/\//, "")}
                </span>
              ))}
            </div>
          </header>
        )}

        {/* ============================================================== */}
        {/* SUMMARY / OBJECTIVE                                            */}
        {/* ============================================================== */}
        {cv.summary && (
          <section className="mb-5">
            <SectionHeader title="Profile & Academic Objective" template={template} pal={pal} icon={<BookOpen className="h-3.5 w-3.5" />} />
            <p className="mt-1.5 text-xs md:text-[13px] leading-relaxed text-slate-700 text-justify">
              {cv.summary}
            </p>
          </section>
        )}

        {/* ============================================================== */}
        {/* EDUCATION SECTION                                              */}
        {/* ============================================================== */}
        {edu.length > 0 && (
          <section className="mb-5">
            <SectionHeader title="Education" template={template} pal={pal} icon={<GraduationCap className="h-3.5 w-3.5" />} />
            <div className="mt-2 space-y-3">
              {edu.map((e, idx) => (
                <div key={idx} className={cn(template === "europass" ? "grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2" : "")}>
                  {template === "europass" && (
                    <div className="text-xs font-semibold text-slate-500">
                      {[e.start, e.end].filter(Boolean).join(" – ")}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {e.degree} {e.field ? `in ${e.field}` : ""}
                      </h4>
                      {template !== "europass" && (
                        <span className="text-xs font-medium text-slate-500">
                          {[e.start, e.end].filter(Boolean).join(" – ")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                      <span className="font-semibold text-slate-800">{e.institution}</span>
                      {e.gpa && (
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-800">
                          GPA {e.gpa} / {e.scale || "4.0"}
                        </span>
                      )}
                    </div>
                    {e.honors && e.honors.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.honors.filter(Boolean).map((h, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                            <Award className="h-3 w-3" /> {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* EXPERIENCE SECTION                                             */}
        {/* ============================================================== */}
        {exp.length > 0 && (
          <section className="mb-5">
            <SectionHeader title="Work & Leadership Experience" template={template} pal={pal} icon={<Briefcase className="h-3.5 w-3.5" />} />
            <div className="mt-2 space-y-4">
              {exp.map((item, idx) => (
                <div key={idx} className={cn(template === "europass" ? "grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2" : "")}>
                  {template === "europass" && (
                    <div className="text-xs font-semibold text-slate-500">
                      {[item.start, item.end].filter(Boolean).join(" – ")}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.role}</h4>
                      {template !== "europass" && (
                        <span className="text-xs font-medium text-slate-500">
                          {[item.start, item.end].filter(Boolean).join(" – ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{item.org}</p>
                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="mt-1.5 space-y-1 pl-4 text-xs md:text-[12.5px] leading-relaxed text-slate-700 list-disc marker:text-slate-400">
                        {item.bullets.filter(Boolean).map((b, bIdx) => (
                          <li key={bIdx} className="text-justify">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* PROJECTS & RESEARCH                                            */}
        {/* ============================================================== */}
        {projects.length > 0 && (
          <section className="mb-5">
            <SectionHeader title="Projects & Research" template={template} pal={pal} icon={<Code className="h-3.5 w-3.5" />} />
            <div className="mt-2 space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200/80 p-2.5 bg-slate-50/50">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{proj.name}</span>
                    {proj.link && (
                      <a
                        href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View project
                      </a>
                    )}
                  </div>
                  {proj.description && (
                    <p className="mt-1 text-xs text-slate-700 leading-snug">{proj.description}</p>
                  )}
                  {proj.tech && proj.tech.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {proj.tech.filter(Boolean).map((t, tIdx) => (
                        <span key={tIdx} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-700 border border-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* SKILLS & TOOLS                                                 */}
        {/* ============================================================== */}
        {(skills.technical.length > 0 || skills.tools.length > 0 || skills.soft.length > 0) && (
          <section className="mb-5">
            <SectionHeader title="Skills & Competencies" template={template} pal={pal} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
            <div className="mt-2 space-y-2 text-xs">
              {skills.technical.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <strong className="min-w-[90px] font-semibold text-slate-900">Technical:</strong>
                  <div className="flex flex-wrap gap-1">
                    {skills.technical.map((s, i) => (
                      <span key={i} className={cn("rounded px-2 py-0.5 text-[11px] font-medium border", pal.badge)}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.tools.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <strong className="min-w-[90px] font-semibold text-slate-900">Tools:</strong>
                  <span className="text-slate-700">{skills.tools.join(" · ")}</span>
                </div>
              )}
              {skills.soft.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <strong className="min-w-[90px] font-semibold text-slate-900">Soft Skills:</strong>
                  <span className="text-slate-700">{skills.soft.join(" · ")}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* LANGUAGES                                                      */}
        {/* ============================================================== */}
        {languages.length > 0 && (
          <section className="mb-5">
            <SectionHeader title="Languages" template={template} pal={pal} icon={<Languages className="h-3.5 w-3.5" />} />
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {languages.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
                  <span className="font-bold text-slate-900">{l.name}</span>
                  <span className="text-[11px] text-slate-600">({l.level || "Proficient"})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* HONORS, CERTIFICATIONS, VOLUNTEERING, PUBLICATIONS            */}
        {/* ============================================================== */}
        {publications.length > 0 && (
          <section className="mb-4">
            <SectionHeader title="Publications & Conference Papers" template={template} pal={pal} icon={<BookOpen className="h-3.5 w-3.5" />} />
            <ul className="mt-1.5 list-disc pl-4 text-xs space-y-1 text-slate-700">
              {publications.filter(Boolean).map((pub, i) => (
                <li key={i}>{pub}</li>
              ))}
            </ul>
          </section>
        )}

        {awards.length > 0 && (
          <section className="mb-4">
            <SectionHeader title="Awards & Achievements" template={template} pal={pal} icon={<Award className="h-3.5 w-3.5" />} />
            <ul className="mt-1.5 list-disc pl-4 text-xs space-y-1 text-slate-700">
              {awards.filter(Boolean).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>
        )}

        {certifications.length > 0 && (
          <section className="mb-4">
            <SectionHeader title="Certifications" template={template} pal={pal} icon={<Award className="h-3.5 w-3.5" />} />
            <ul className="mt-1.5 list-disc pl-4 text-xs space-y-1 text-slate-700">
              {certifications.filter(Boolean).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        )}

        {volunteering.length > 0 && (
          <section className="mb-4">
            <SectionHeader title="Community & Volunteering" template={template} pal={pal} icon={<Award className="h-3.5 w-3.5" />} />
            <ul className="mt-1.5 list-disc pl-4 text-xs space-y-1 text-slate-700">
              {volunteering.filter(Boolean).map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer verification line */}
        <footer className="mt-8 border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
          <span>ScholarAI Verified CV · Generated for Global Opportunity Applications</span>
          <span>scholarai.et</span>
        </footer>
      </article>
    </div>
  );
}

function SectionHeader({
  title,
  template,
  pal,
  icon,
}: {
  title: string;
  template: TemplateId;
  pal: (typeof ACCENT_PALETTES)[AccentId];
  icon?: React.ReactNode;
}) {
  if (template === "academic") {
    return (
      <div className="mb-2 border-b border-slate-800 pb-0.5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
          {title}
        </h3>
      </div>
    );
  }

  if (template === "europass") {
    return (
      <div className="mb-2 border-b-2 border-sky-900 pb-0.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
          {title}
        </h3>
      </div>
    );
  }

  if (template === "minimal") {
    return (
      <div className="mb-2 border-b border-slate-300 pb-1">
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-700">
          {title}
        </h3>
      </div>
    );
  }

  // MODERN
  return (
    <div className="mb-2 flex items-center justify-between border-b border-emerald-700/60 pb-1">
      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
    </div>
  );
}
