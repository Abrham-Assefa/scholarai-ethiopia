export type Level = "bachelor" | "master" | "phd" | "postdoc" | "short-course";

export interface Scholarship {
  id: string;
  title: string;
  provider?: string;
  country: string;
  countries: string[];
  level: Level[];
  fields: string[];
  fundingType: "full" | "partial";
  covers?: string;
  eligibility: {
    nationalities?: string[];
    ethiopiansEligible?: boolean;
    minGpa?: number | null;
    englishTest?: string;
    workYearsMin?: number;
    ageLimit?: number | null;
  };
  deadline: string | null;
  deadlineText?: string;
  url: string;
  tags: string[];
  description?: string;
  status: string;
  daysLeft?: number | null;
  requiredDocuments?: string[];
  deadlineConfirmed?: boolean;
  details?: ScholarshipDetails | null;
  sources?: string[];
  lastVerified?: string | null;
  origin?: "curated" | "discovered";
  lastChecked?: string | null;
  checkStatus?: string | null;
  discoveredAt?: string | null;
}

export interface CollectorStats {
  checked?: number; reachable?: number; discovered?: number; updated?: number; closed?: number; rolled?: number; provider?: string;
}

export interface CollectorRun {
  id: string;
  trigger: "auto" | "manual";
  status: "running" | "ok" | "error";
  startedAt: string;
  finishedAt: string | null;
  stats: CollectorStats & { conferences?: CollectorStats };
  changes: { id: string; kind: string; detail: string; type?: "conference" }[];
  errors: string[];
}

export interface CollectorStatus {
  enabled: boolean;
  intervalHours: number;
  running: boolean;
  lastRun: CollectorRun | null;
  lastSuccessAt: string | null;
  nextRunAt: string | null;
  totals: { scholarships: number; discovered: number; conferences?: number; conferencesDiscovered?: number };
}

export interface ScholarshipDetails {
  overview?: string;
  whoCanApply?: string[];
  benefits?: string[];
  howToApply?: string[];
  documents?: string[];
  selection?: string;
  ethiopiaTips?: string[];
  applicationOpens?: string;
}

export interface Conference {
  id: string;
  title: string;
  location?: string;
  when?: string;
  startDate: string | null;
  funding?: string;
  fundingType: "full" | "partial";
  audience?: string;
  age: { min: number | null; max: number | null };
  url?: string;
  ethiopiansEligible: boolean;
  description?: string;
  deadline?: string | null;
  status?: "open" | "closed";
  dateConfirmed?: boolean;
  details?: ScholarshipDetails | null;
  sources?: string[];
  lastVerified?: string | null;
  origin?: "curated" | "discovered";
  lastChecked?: string | null;
  checkStatus?: string | null;
  discoveredAt?: string | null;
  daysLeft?: number | null;
  startsIn?: number | null;
}

export interface Match {
  scholarshipId: string;
  title: string;
  country: string;
  deadline: string | null;
  daysLeft: number | null;
  probability: number;
  why: string[];
  missing: string[];
  effortHours: number;
  url?: string;
  fundingType?: string;
  level?: Level[];
}

export interface Profile {
  name?: string | null;
  email?: string | null;
  lang?: "en" | "am" | null;
  region?: string | null;
  degreeLevelSought: Level;
  field?: string | null;
  gpa?: number | null;
  gpaScale: number;
  nationalExamScore?: number | null;
  englishTest?: string | null;
  englishScore?: number | null;
  workYears: number;
  financialNeed: boolean;
  leadership: boolean;
  interests: string[];
  preferredCountries: string[];
  notifications: Record<string, unknown>;
}

export interface CVData {
  personal: { fullName: string; email: string; phone: string; city: string; links: string[] };
  summary: string;
  education: { institution: string; degree: string; field: string; gpa: string | number | null; scale: string; start: string; end: string; honors: string[] }[];
  experience: { org: string; role: string; start: string; end: string; bullets: string[] }[];
  projects: { name: string; description: string; tech: string[]; link: string }[];
  skills: { technical: string[]; soft: string[]; tools: string[] };
  languages: { name: string; level: string }[];
  awards: string[];
  certifications: string[];
  volunteering: string[];
  publications: string[];
  meta: { targetScholarshipId: string | null; template: "europass" | "modern" | "academic" | "minimal"; lang: "en" | "am" };
}

export interface CVRecord {
  id: string;
  template: "europass" | "modern" | "academic" | "minimal";
  lang: "en" | "am";
  targetScholarshipId: string | null;
  data: CVData;
  atsScore: number | null;
  ats: { score: number; breakdown: Record<string, number>; suggestions: string[] };
  version: number;
  enhancement?: { questions: string[]; flagged: number; scoreBefore: number; scoreAfter: number };
}

export interface ChatReply {
  reply: string;
  lang: string;
  intent: string;
  toolCalls: { name: string; args: Record<string, unknown>; count: number }[];
  sources: { id: string; title: string; country: string; deadline: string | null; url: string }[];
  provider: string;
}

export const emptyCV = (): CVData => ({
  personal: { fullName: "", email: "", phone: "", city: "", links: [] },
  summary: "",
  education: [{ institution: "", degree: "", field: "", gpa: "", scale: "4.0", start: "", end: "", honors: [] }],
  experience: [{ org: "", role: "", start: "", end: "", bullets: [""] }],
  projects: [],
  skills: { technical: [], soft: [], tools: [] },
  languages: [
    { name: "Amharic", level: "Native" },
    { name: "English", level: "Fluent" },
  ],
  awards: [],
  certifications: [],
  volunteering: [],
  publications: [],
  meta: { targetScholarshipId: null, template: "europass", lang: "en" },
});
