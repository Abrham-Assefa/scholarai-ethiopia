"use client";

import { useFavorites, type FavoriteType } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import { Bookmark, Heart } from "lucide-react";
import { useLocale } from "next-intl";

interface FavoriteButtonProps {
  id: string;
  type: FavoriteType;
  className?: string;
  variant?: "icon" | "button" | "card-action";
  iconType?: "heart" | "bookmark";
  showCount?: boolean;
}

export function FavoriteButton({
  id,
  type,
  className,
  variant = "icon",
  iconType = "bookmark",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(id, type);
  const locale = useLocale();
  const am = locale === "am";

  const Icon = iconType === "heart" ? Heart : Bookmark;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id, type);
  };

  const title = active
    ? am
      ? "ከተወዳጆች አስወግድ"
      : "Remove from favorites"
    : am
    ? "ወደ ተወዳጆች አስቀምጥ"
    : "Save to favorites";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={title}
        title={title}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200",
          active
            ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-xs"
            : "border-border bg-card hover:bg-muted text-foreground",
          className
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            active ? "fill-amber-500 text-amber-500 scale-110" : "text-muted-foreground"
          )}
        />
        <span>
          {active
            ? am
              ? "የተቀመጠ (ተወዳጅ)"
              : "Saved in Favorites"
            : am
            ? "ወደ ተወዳጆች አስቀምጥ"
            : "Save to Favorites"}
        </span>
      </button>
    );
  }

  // Icon / card-action variant
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={title}
      title={title}
      className={cn(
        "relative grid h-8 w-8 place-items-center rounded-full border transition-all duration-200",
        active
          ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30"
          : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary/50 hover:bg-background hover:text-foreground backdrop-blur",
        className
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-all duration-200",
          active ? "fill-amber-500 text-amber-500 scale-110" : "hover:scale-105"
        )}
      />
    </button>
  );
}
