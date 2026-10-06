"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bot, Send, User, Wrench } from "lucide-react";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import type { ChatReply } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; meta?: ChatReply };

export default function AssistantPage() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const [lang, setLang] = useState<"en" | "am">(locale as "en" | "am");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const suggestions = t.raw("suggestions") as string[];
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send(text = input) {
    const q = text.trim();
    if (!q || busy) return;
    setInput(""); setBusy(true);
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: q }]);
    try {
      const r = await api.chat(q, lang, history);
      setMsgs((m) => [...m, { role: "assistant", content: r.reply, meta: r }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col">
      <div className="flex items-start justify-between gap-3">
        <div><h1 className="text-3xl font-bold">{t("title")}</h1><p className="text-muted-foreground">{t("subtitle")}</p></div>
        <div className="inline-flex rounded-lg border p-0.5" role="radiogroup" aria-label="Reply language">
          {(["en", "am"] as const).map((l) => <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={cn("rounded-md px-3 py-1 text-sm", lang === l && "bg-primary text-primary-foreground")}>{l === "en" ? "English" : "አማርኛ"}</button>)}
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border bg-muted/30 p-4" data-testid="chat-log">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-muted">{s}</button>)}</div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-gold text-slate-900" : "bg-primary text-primary-foreground")}>{m.role === "user" ? <User size={14} /> : <Bot size={14} />}</span>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border")}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.meta && m.meta.toolCalls.length > 0 && <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Wrench size={10} />{t("tool")}: {m.meta.toolCalls.map((c) => `${c.name}(${c.count})`).join(", ")}</p>}
              {m.meta && m.meta.sources.length > 0 && (
                <div className="mt-2 border-t pt-2 text-xs"><p className="mb-1 font-semibold">{t("sources")}</p>
                  <ul className="space-y-0.5">{m.meta.sources.slice(0, 5).map((s) => <li key={s.id}><Link href={`/scholarships/${s.id}`} className="text-primary hover:underline">{s.title}</Link> · {s.country}{s.deadline ? ` · ${s.deadline}` : ""}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-muted-foreground">{t("thinking")}</p>}
        <div ref={bottom} />
      </div>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("placeholder")} aria-label={t("placeholder")} />
        <Button type="submit" disabled={busy || !input.trim()}><Send size={14} />{t("send")}</Button>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
