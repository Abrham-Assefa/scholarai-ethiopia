import type { CVData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CVPreview({ cv, template, emptyText }: { cv: CVData; template: "europass" | "modern"; emptyText: string }) {
  if (!cv.personal.fullName) return <p className="p-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  const modern = template === "modern";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-4">
      <h3 className={cn("mb-1 text-xs font-bold uppercase tracking-wider", modern ? "text-emerald-700 border-b border-emerald-700" : "text-sky-900 border-b-2 border-sky-900")}>{title}</h3>
      {children}
    </section>
  );
  const edu = cv.education.filter((e) => e.institution);
  const exp = cv.experience.filter((e) => e.org || e.role);
  return (
    <article className="bg-white p-8 text-[13px] leading-snug text-slate-900 shadow-inner" data-testid="cv-preview">
      <header className={cn(modern ? "border-l-4 border-emerald-700 pl-3" : "text-center")}>
        <h2 className="text-2xl font-bold">{cv.personal.fullName}</h2>
        <p className="text-xs text-slate-600">{[cv.personal.email, cv.personal.phone, cv.personal.city, ...cv.personal.links].filter(Boolean).join(" · ")}</p>
      </header>
      {cv.summary && <Section title="Profile"><p>{cv.summary}</p></Section>}
      {edu.length > 0 && <Section title="Education">{edu.map((e, i) => (
        <div key={i} className="mb-1.5 flex justify-between gap-2"><div><strong>{e.degree}{e.field ? ` in ${e.field}` : ""}</strong><div>{e.institution}{e.gpa ? ` · GPA ${e.gpa}/${e.scale}` : ""}</div></div><span className="text-xs text-slate-500">{[e.start, e.end].filter(Boolean).join(" – ")}</span></div>
      ))}</Section>}
      {exp.length > 0 && <Section title="Experience">{exp.map((e, i) => (
        <div key={i} className="mb-2"><div className="flex justify-between gap-2"><strong>{e.role}{e.org ? ` — ${e.org}` : ""}</strong><span className="text-xs text-slate-500">{[e.start, e.end].filter(Boolean).join(" – ")}</span></div><ul className="ml-4 list-disc">{e.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}</ul></div>
      ))}</Section>}
      {(cv.skills.technical.length + cv.skills.soft.length + cv.skills.tools.length) > 0 && <Section title="Skills">
        {cv.skills.technical.length > 0 && <p><strong>Technical:</strong> {cv.skills.technical.join(", ")}</p>}
        {cv.skills.tools.length > 0 && <p><strong>Tools:</strong> {cv.skills.tools.join(", ")}</p>}
        {cv.skills.soft.length > 0 && <p><strong>Soft:</strong> {cv.skills.soft.join(", ")}</p>}
      </Section>}
      {cv.languages.length > 0 && <Section title="Languages"><p>{cv.languages.map((l) => `${l.name} (${l.level})`).join(" · ")}</p></Section>}
      {cv.awards.length > 0 && <Section title="Awards"><ul className="ml-4 list-disc">{cv.awards.map((a) => <li key={a}>{a}</li>)}</ul></Section>}
      {cv.certifications.length > 0 && <Section title="Certifications"><ul className="ml-4 list-disc">{cv.certifications.map((a) => <li key={a}>{a}</li>)}</ul></Section>}
      {cv.volunteering.length > 0 && <Section title="Volunteering"><ul className="ml-4 list-disc">{cv.volunteering.map((a) => <li key={a}>{a}</li>)}</ul></Section>}
    </article>
  );
}
