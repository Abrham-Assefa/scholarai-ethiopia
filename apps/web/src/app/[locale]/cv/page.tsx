"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Plus, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { emptyCV, type CVData, type CVRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CVPreview } from "@/components/cv-preview";
import { ApiError } from "@/components/api-error";
import { cn } from "@/lib/utils";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const commas = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function CVMaker() {
  const t = useTranslations("cv");
  const target = useSearchParams().get("target");
  const [cv, setCv] = useState<CVData>(() => ({ ...emptyCV(), meta: { ...emptyCV().meta, targetScholarshipId: target } }));
  const [rec, setRec] = useState<CVRecord | null>(null);
  const [busy, setBusy] = useState<"save" | "enhance" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpaConv, setGpaConv] = useState<{ german: number; german_label: string; uk: string; us_letter: string } | null>(null);
  const [section, setSection] = useState<"personal" | "summary" | "education" | "experience" | "skills" | "extras">("personal");
  const idRef = useRef<string | null>(null);
  const template = cv.meta.template;

  const upd = (fn: (c: CVData) => void) => setCv((c) => { const n = structuredClone(c); fn(n); return n; });

  const save = useCallback(async (data: CVData) => {
    setBusy("save"); setError(null);
    try {
      await api.ensureAuth();
      const r = idRef.current ? await api.updateCV(idRef.current, { data, template: data.meta.template, lang: data.meta.lang }) : await api.createCV(data, data.meta.template, data.meta.lang);
      idRef.current = r.id; setRec(r); return r;
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }, []);

  // Autosave + live ATS score, debounced
  useEffect(() => {
    if (!cv.personal.fullName) return;
    const id = setTimeout(() => save(cv), 900);
    return () => clearTimeout(id);
  }, [cv, save]);

  const gpaVal = Number(cv.education[0]?.gpa);
  useEffect(() => {
    if (!gpaVal || gpaVal <= 0) { setGpaConv(null); return; }
    const id = setTimeout(() => api.gpa(gpaVal, Number(cv.education[0]?.scale) || 4).then(setGpaConv).catch(() => setGpaConv(null)), 500);
    return () => clearTimeout(id);
  }, [gpaVal, cv.education]);

  async function enhance() {
    const r = idRef.current ? rec : await save(cv);
    if (!r) return;
    setBusy("enhance"); setError(null);
    try { const e = await api.enhanceCV(r.id); setRec(e); setCv(e.data); } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  async function download() {
    const r = await save(cv);
    if (!r) return;
    setBusy("pdf");
    try {
      const blob = await api.exportCV(r.id, template);
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: `${cv.personal.fullName.replace(/\s+/g, "_") || "cv"}_${template}.pdf` });
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  const sections = useMemo(() => ["personal", "summary", "education", "experience", "skills", "extras"] as const, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="mb-0">{t("template")}</Label>
          <div className="inline-flex rounded-lg border p-0.5" role="radiogroup">
            {(["europass", "modern"] as const).map((tp) => (
              <button key={tp} type="button" role="radio" aria-checked={template === tp} onClick={() => upd((c) => { c.meta.template = tp; })} className={cn("rounded-md px-3 py-1 text-sm", template === tp && "bg-primary text-primary-foreground")}>{t(tp)}</button>
            ))}
          </div>
          <Select className="w-28" value={cv.meta.lang} onChange={(e) => upd((c) => { c.meta.lang = e.target.value as "en" | "am"; })} aria-label={t("lang")}><option value="en">English</option><option value="am">አማርኛ</option></Select>
          <Button variant="gold" disabled={!!busy || !cv.personal.fullName} onClick={enhance}><Sparkles size={14} />{busy === "enhance" ? t("enhancing") : t("enhance")}</Button>
          <Button disabled={!!busy || !cv.personal.fullName} onClick={download}><Download size={14} />{t("download")}</Button>
        </div>
      </div>
      {error && <div className="mt-4"><ApiError message={error} /></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left: form */}
        <div>
          <div className="mb-3 flex flex-wrap gap-1">
            {sections.map((s) => <button key={s} type="button" onClick={() => setSection(s)} className={cn("rounded-full border px-3 py-1 text-xs", section === s && "bg-foreground text-background")}>{t(`sections.${s}`)}</button>)}
          </div>
          <Card><CardContent className="space-y-3 p-5">
            {section === "personal" && (<>
              <div><Label htmlFor="fn">{t("fullName")}</Label><Input id="fn" value={cv.personal.fullName} onChange={(e) => upd((c) => { c.personal.fullName = e.target.value; })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="em">{t("email")}</Label><Input id="em" type="email" value={cv.personal.email} onChange={(e) => upd((c) => { c.personal.email = e.target.value; })} /></div>
                <div><Label htmlFor="ph">{t("phone")}</Label><Input id="ph" value={cv.personal.phone} onChange={(e) => upd((c) => { c.personal.phone = e.target.value; })} /></div>
              </div>
              <div><Label htmlFor="ci">{t("city")}</Label><Input id="ci" value={cv.personal.city} onChange={(e) => upd((c) => { c.personal.city = e.target.value; })} /></div>
            </>)}
            {section === "summary" && <Textarea rows={6} placeholder={t("summaryPh")} value={cv.summary} onChange={(e) => upd((c) => { c.summary = e.target.value; })} />}
            {section === "education" && (<>
              {cv.education.map((e, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div><Label>{t("institution")}</Label><Input value={e.institution} onChange={(ev) => upd((c) => { c.education[i].institution = ev.target.value; })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{t("degree")}</Label><Input value={e.degree} placeholder="BSc" onChange={(ev) => upd((c) => { c.education[i].degree = ev.target.value; })} /></div>
                    <div><Label>{t("field")}</Label><Input value={e.field} onChange={(ev) => upd((c) => { c.education[i].field = ev.target.value; })} /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div><Label>{t("gpa")}</Label><Input value={e.gpa ?? ""} onChange={(ev) => upd((c) => { c.education[i].gpa = ev.target.value; })} /></div>
                    <div><Label>/</Label><Select value={e.scale} onChange={(ev) => upd((c) => { c.education[i].scale = ev.target.value; })}><option>4.0</option><option>100</option></Select></div>
                    <div><Label>{t("start")}</Label><Input value={e.start} placeholder="2020" onChange={(ev) => upd((c) => { c.education[i].start = ev.target.value; })} /></div>
                    <div><Label>{t("end")}</Label><Input value={e.end} placeholder="2024" onChange={(ev) => upd((c) => { c.education[i].end = ev.target.value; })} /></div>
                  </div>
                  {cv.education.length > 1 && <Button size="sm" variant="ghost" onClick={() => upd((c) => { c.education.splice(i, 1); })}><Trash2 size={12} />{t("remove")}</Button>}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => upd((c) => { c.education.push({ institution: "", degree: "", field: "", gpa: "", scale: "4.0", start: "", end: "", honors: [] }); })}><Plus size={12} />{t("add")}</Button>
            </>)}
            {section === "experience" && (<>
              {cv.experience.map((e, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{t("org")}</Label><Input value={e.org} onChange={(ev) => upd((c) => { c.experience[i].org = ev.target.value; })} /></div>
                    <div><Label>{t("role")}</Label><Input value={e.role} onChange={(ev) => upd((c) => { c.experience[i].role = ev.target.value; })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{t("start")}</Label><Input value={e.start} onChange={(ev) => upd((c) => { c.experience[i].start = ev.target.value; })} /></div>
                    <div><Label>{t("end")}</Label><Input value={e.end} onChange={(ev) => upd((c) => { c.experience[i].end = ev.target.value; })} /></div>
                  </div>
                  <div><Label>{t("bullets")}</Label><Textarea rows={4} placeholder={t("bulletsPh")} value={e.bullets.join("\n")} onChange={(ev) => upd((c) => { c.experience[i].bullets = ev.target.value.split("\n"); })} /></div>
                  {cv.experience.length > 1 && <Button size="sm" variant="ghost" onClick={() => upd((c) => { c.experience.splice(i, 1); })}><Trash2 size={12} />{t("remove")}</Button>}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => upd((c) => { c.experience.push({ org: "", role: "", start: "", end: "", bullets: [""] }); })}><Plus size={12} />{t("add")}</Button>
            </>)}
            {section === "skills" && (<>
              <div><Label>{t("technical")}</Label><Input defaultValue={cv.skills.technical.join(", ")} onBlur={(e) => upd((c) => { c.skills.technical = commas(e.target.value); })} /></div>
              <div><Label>{t("tools")}</Label><Input defaultValue={cv.skills.tools.join(", ")} onBlur={(e) => upd((c) => { c.skills.tools = commas(e.target.value); })} /></div>
              <div><Label>{t("soft")}</Label><Input defaultValue={cv.skills.soft.join(", ")} onBlur={(e) => upd((c) => { c.skills.soft = commas(e.target.value); })} /></div>
              <div><Label>{t("languages")}</Label><Input defaultValue={cv.languages.map((l) => `${l.name} — ${l.level}`).join(", ")} onBlur={(e) => upd((c) => { c.languages = commas(e.target.value).map((x) => { const [name, level = ""] = x.split(/—|-/).map((y) => y.trim()); return { name, level }; }); })} /></div>
            </>)}
            {section === "extras" && (<>
              <div><Label>{t("awards")}</Label><Textarea rows={3} defaultValue={cv.awards.join("\n")} onBlur={(e) => upd((c) => { c.awards = lines(e.target.value); })} /></div>
              <div><Label>{t("certifications")}</Label><Textarea rows={3} defaultValue={cv.certifications.join("\n")} onBlur={(e) => upd((c) => { c.certifications = lines(e.target.value); })} /></div>
              <div><Label>{t("volunteering")}</Label><Textarea rows={3} defaultValue={cv.volunteering.join("\n")} onBlur={(e) => upd((c) => { c.volunteering = lines(e.target.value); })} /></div>
            </>)}
          </CardContent></Card>

          {/* ATS panel */}
          <Card className="mt-4"><CardHeader><CardTitle className="flex items-center justify-between">{t("ats")} <span className="text-xs font-normal text-muted-foreground">{busy === "save" ? "…" : rec ? t("saved") : ""}</span></CardTitle></CardHeader>
            <CardContent className="flex gap-4">
              <ProgressRing value={rec?.ats?.score ?? 0} size={80} label={t("ats")} />
              <div className="flex-1 text-sm">
                {rec?.ats?.breakdown && <div className="mb-2 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">{Object.entries(rec.ats.breakdown).map(([k, v]) => <span key={k}>{k}: <strong>{v}</strong></span>)}</div>}
                <p className="font-medium">{t("suggestions")}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">{(rec?.ats?.suggestions ?? []).slice(0, 5).map((s) => <li key={s}>{s}</li>)}</ul>
                {rec?.enhancement && (<div className="mt-2 rounded-lg bg-muted p-2 text-xs">
                  <p>ATS {rec.enhancement.scoreBefore} → <strong>{rec.enhancement.scoreAfter}</strong>{rec.enhancement.flagged > 0 && <> · {t("flagged", { n: rec.enhancement.flagged })}</>}</p>
                  {rec.enhancement.questions?.length > 0 && <><p className="mt-1 font-medium">{t("questions")}</p><ul className="list-disc pl-4">{rec.enhancement.questions.slice(0, 3).map((q) => <li key={q}>{q}</li>)}</ul></>}
                </div>)}
              </div>
            </CardContent></Card>

          {gpaConv && (
            <Card className="mt-4"><CardHeader><CardTitle>{t("gpaConv")}</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
              <div><p className="text-xs text-muted-foreground">{t("german")}</p><p className="text-lg font-bold">{gpaConv.german}</p><p className="text-[10px] text-muted-foreground">{gpaConv.german_label}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("uk")}</p><p className="text-lg font-bold">{gpaConv.uk}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("us")}</p><p className="text-lg font-bold">{gpaConv.us_letter}</p></div>
            </CardContent></Card>
          )}
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("preview")} · {t(template)}</p>
          <div className="overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-800"><CVPreview cv={cv} template={template} emptyText={t("noPreview")} /></div>
        </div>
      </div>
    </div>
  );
}

export default function CVPage() {
  return <Suspense><CVMaker /></Suspense>;
}
