import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Scholarship } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { FavoriteButton } from "./favorite-button";
import { daysLabel } from "@/lib/utils";

/** Found by the web collector in the last 14 days. */
export function isNew(s: Scholarship, now = Date.now()) {
  return s.origin === "discovered" && !!s.discoveredAt && now - new Date(s.discoveredAt + "T00:00:00").getTime() < 14 * 86400e3;
}

export function ScholarshipCard({ s }: { s: Scholarship }) {
  const t = useTranslations("scholarships");
  const locale = useLocale();
  const urgent = s.daysLeft !== null && s.daysLeft !== undefined && s.daysLeft <= 30;
  return (
    <div className="relative group/card h-full">
      <Link href={`/scholarships/${s.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/40">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1 pr-9">
                  {isNew(s) && <Badge className="gap-1 bg-gold text-black hover:bg-gold"><Sparkles size={11} />{t("new")}</Badge>}
                  <Badge variant={s.fundingType === "full" ? "default" : "muted"}>{s.fundingType === "full" ? t("full") : t("partial")}</Badge>
                  {s.level.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
                </div>
              </div>
              <h3 className="font-semibold leading-snug group-hover/card:text-primary transition-colors">{s.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.details?.overview ?? s.covers}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
              <span className="inline-flex items-center gap-1"><MapPin size={12} />{s.country}</span>
              <span className={`inline-flex items-center gap-1 ${urgent ? "font-semibold text-red" : ""}`}><CalendarDays size={12} />{s.status === "rolling" && !s.deadline ? t("rolling") : daysLabel(s.daysLeft, locale)}{s.deadline && s.deadlineConfirmed === false && <span className="rounded bg-gold/15 px-1 text-[10px] font-medium text-amber-700 dark:text-gold" title={t("estimatedHint")}>{t("estimated")}</span>}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
      <div className="absolute top-4 right-4 z-10">
        <FavoriteButton id={s.id} type="scholarship" />
      </div>
    </div>
  );
}
