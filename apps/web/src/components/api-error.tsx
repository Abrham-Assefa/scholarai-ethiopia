"use client";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/api";
import { Button } from "./ui/button";

export function ApiError({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const t = useTranslations("common");
  return (
    <div className="rounded-xl border border-red/40 bg-red/5 p-4 text-sm">
      <p>{t("error", { url: API_URL })}</p>
      {message && <p className="mt-1 font-mono text-xs text-muted-foreground">{message}</p>}
      {onRetry && <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>{t("retry")}</Button>}
    </div>
  );
}
