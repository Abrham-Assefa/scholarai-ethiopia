"use client";

import type { CVData, CVRecord, ChatReply, CollectorStatus, Conference, Match, Profile, Scholarship } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "scholarai.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as Record<string, string>) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j);
    } catch {}
    throw new ApiError(res.status, msg);
  }
  if (res.headers.get("content-type")?.includes("application/pdf")) return (await res.blob()) as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; llmProvider: string }>("/health"),
  stats: () => request<{ total: number; open: number; countries: number; conferences: number }>("/v1/scholarships/stats"),
  scholarships: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<{ items: Scholarship[]; total: number }>(`/v1/scholarships${qs ? `?${qs}` : ""}`);
  },
  scholarship: (id: string) => request<Scholarship>(`/v1/scholarships/${id}`),
  collectorStatus: () => request<CollectorStatus>("/v1/collector/status"),
  runCollector: () => request<{ status: string; runId: string }>("/v1/collector/run", { method: "POST" }),
  conferences: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<{ items: Conference[]; total: number }>(`/v1/conferences${qs ? `?${qs}` : ""}`);
  },
  conference: (id: string) => request<Conference>(`/v1/conferences/${id}`),
  login: async (phone: string, code: string) => {
    const r = await request<{ accessToken: string; user: { id: string; phone: string; name?: string } }>("/v1/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
    setToken(r.accessToken);
    return r;
  },
  /** Demo login: silently authenticate with a device-local phone number. */
  ensureAuth: async () => {
    if (getToken()) return;
    let phone = window.localStorage.getItem("scholarai.phone");
    if (!phone) {
      phone = `+2519${Math.floor(10000000 + Math.random() * 89999999)}`;
      window.localStorage.setItem("scholarai.phone", phone);
    }
    await api.login(phone, "123456");
  },
  getProfile: () => request<Profile>("/v1/me/profile"),
  putProfile: (p: Partial<Profile>) => request<Profile>("/v1/me/profile", { method: "PUT", body: JSON.stringify(p) }),
  matches: () => request<{ items: Match[]; total: number }>("/v1/matches"),
  deadlines: (days = 90) => request<{ items: { scholarshipId: string; title: string; country: string; deadline: string; daysLeft: number; probability: number | null }[] }>(`/v1/deadlines?days=${days}`),
  createCV: (data: Partial<CVData>, template: string, lang: string) =>
    request<CVRecord>("/v1/cv", { method: "POST", body: JSON.stringify({ data, template, lang }) }),
  updateCV: (id: string, body: { data?: Partial<CVData>; template?: string; lang?: string }) =>
    request<CVRecord>(`/v1/cv/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  getCV: (id: string) => request<CVRecord>(`/v1/cv/${id}`),
  listCVs: () => request<{ items: CVRecord[] }>("/v1/cv"),
  enhanceCV: (id: string) => request<CVRecord>(`/v1/cv/${id}/enhance`, { method: "POST", body: JSON.stringify({ section: "all" }) }),
  exportCV: (id: string, template: string) =>
    request<Blob>(`/v1/cv/${id}/export`, { method: "POST", body: JSON.stringify({ format: "pdf", template }) }),
  chat: (message: string, lang: string, history: { role: string; content: string }[]) =>
    request<ChatReply>("/v1/chat", { method: "POST", body: JSON.stringify({ message, lang, history }) }),
  gpa: (gpa: number, scale = 4) => request<{ german: number; german_label: string; uk: string; us_letter: string; percentage: number }>("/v1/tools/gpa", { method: "POST", body: JSON.stringify({ gpa, scale }) }),
  getFavorites: () => request<{ items: { id: string; itemId: string; itemType: string; createdAt: string }[] }>("/v1/favorites"),
  addFavorite: (itemId: string, itemType: "scholarship" | "conference") =>
    request<{ id: string; itemId: string; itemType: string }>("/v1/favorites", { method: "POST", body: JSON.stringify({ itemId, itemType }) }),
  removeFavorite: (itemId: string) => request<{ ok: boolean; itemId: string }>(`/v1/favorites/${itemId}`, { method: "DELETE" }),
};
