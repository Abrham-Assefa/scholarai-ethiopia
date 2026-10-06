"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { Level, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { ApiError } from "@/components/api-error";
import { cn } from "@/lib/utils";

const LEVELS: Level[] = ["bachelor", "master", "phd", "postdoc", "short-course"];
const CHANNELS = ["telegram", "sms", "email", "push"] as const;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const steps = t.raw("steps") as string[];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [p, setP] = useState<Partial<Profile>>({
    degreeLevelSought: "master", gpaScale: 4, workYears: 0, leadership: false, financialNeed: true,
    interests: [], preferredCountries: [], notifications: { telegram: true }, lang: locale as "en" | "am",
  });
  const [interestsText, setInterestsText] = useState("");
  const [countriesText, setCountriesText] = useState("");
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  async function finish() {
    setSaving(true); setError(null);
    try {
      await api.ensureAuth();
      await api.putProfile({ ...p, interests: split(interestsText), preferredCountries: split(countriesText) });
      router.push("/dashboard");
    } catch (e) { setError((e as Error).message); setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <ol className="mt-6 flex items-center gap-2" aria-label="progress">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-gold text-slate-900" : "bg-muted")}>{i < step ? <Check size={14} /> : i + 1}</span>
            <span className={cn("hidden text-xs sm:block", i === step && "font-semibold")}>{s}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <Card className="mt-6"><CardContent className="space-y-4 p-6">
        {step === 0 && (
          <fieldset>
            <legend className="mb-3 font-medium">{t("goal.label")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEVELS.map((l) => (
                <button key={l} type="button" onClick={() => set("degreeLevelSought", l)} className={cn("rounded-lg border p-3 text-left text-sm hover:bg-muted", p.degreeLevelSought === l && "border-primary bg-primary/10 font-semibold")}>{t(`goal.${l}`)}</button>
              ))}
            </div>
          </fieldset>
        )}
        {step === 1 && (<>
          <div><Label htmlFor="name">{t("education.name")}</Label><Input id="name" value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label htmlFor="field">{t("education.field")}</Label><Input id="field" placeholder={t("education.fieldPh")} value={p.field ?? ""} onChange={(e) => set("field", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="gpa">{t("education.gpa")}</Label><Input id="gpa" type="number" step="0.01" min="0" max={p.gpaScale} value={p.gpa ?? ""} onChange={(e) => set("gpa", e.target.value ? Number(e.target.value) : null)} /></div>
            <div><Label htmlFor="scale">{t("education.scale")}</Label><Select id="scale" value={p.gpaScale} onChange={(e) => set("gpaScale", Number(e.target.value))}><option value={4}>4.0</option><option value={100}>100</option></Select></div>
          </div>
          <div><Label htmlFor="region">{t("education.region")}</Label><Input id="region" placeholder={t("education.regionPh")} value={p.region ?? ""} onChange={(e) => set("region", e.target.value)} /></div>
        </>)}
        {step === 2 && (<>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="et">{t("scores.englishTest")}</Label><Select id="et" value={p.englishTest ?? ""} onChange={(e) => set("englishTest", e.target.value || null)}><option value="">{t("scores.none")}</option><option>IELTS</option><option>TOEFL</option><option>Duolingo</option></Select></div>
            <div><Label htmlFor="es">{t("scores.englishScore")}</Label><Input id="es" type="number" step="0.5" value={p.englishScore ?? ""} onChange={(e) => set("englishScore", e.target.value ? Number(e.target.value) : null)} /></div>
          </div>
          <div><Label htmlFor="wy">{t("scores.workYears")}</Label><Input id="wy" type="number" min="0" value={p.workYears} onChange={(e) => set("workYears", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.leadership} onChange={(e) => set("leadership", e.target.checked)} />{t("scores.leadership")}</label>
        </>)}
        {step === 3 && (<>
          <div><Label htmlFor="int">{t("interests.label")}</Label><Input id="int" placeholder={t("interests.ph")} value={interestsText} onChange={(e) => setInterestsText(e.target.value)} /></div>
          <div><Label htmlFor="cty">{t("interests.countries")}</Label><Input id="cty" placeholder={t("interests.countriesPh")} value={countriesText} onChange={(e) => setCountriesText(e.target.value)} /></div>
        </>)}
        {step === 4 && (
          <fieldset>
            <legend className="mb-3 font-medium">{t("notifications.label")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((c) => (
                <label key={c} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={!!p.notifications?.[c]} onChange={(e) => set("notifications", { ...p.notifications, [c]: e.target.checked })} />{t(`notifications.${c}`)}</label>
              ))}
            </div>
          </fieldset>
        )}
        {error && <ApiError message={error} />}
        <div className="flex justify-between pt-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>{t("back")}</Button>
          {step < steps.length - 1
            ? <Button onClick={() => setStep(step + 1)}>{t("next")}</Button>
            : <Button variant="gold" disabled={saving} onClick={finish}>{saving ? t("saving") : t("finish")}</Button>}
        </div>
      </CardContent></Card>
    </div>
  );
}
