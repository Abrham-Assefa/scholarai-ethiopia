import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Scholarship } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { daysLabel } from "@/lib/utils";

export function ScholarshipCard({ s }: { s: Scholarship }) {
  const t = useTranslations("scholarships");
  const locale = useLocale();
  const urgent = s.daysLeft !== null && s.daysLeft !== undefined && s.daysLeft <= 30;
  return (
    <Link href={`/scholarships/${s.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="mb-2 flex flex-wrap gap-1">
            <Badge variant={s.fundingType === "full" ? "default" : "muted"}>{s.fundingType === "full" ? t("full") : t("partial")}</Badge>
            {s.level.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
          </div>
          <h3 className="font-semibold leading-snug">{s.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.covers}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin size={12} />{s.country}</span>
            <span className={`inline-flex items-center gap-1 ${urgent ? "font-semibold text-red" : ""}`}><CalendarDays size={12} />{daysLabel(s.daysLeft, locale)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
