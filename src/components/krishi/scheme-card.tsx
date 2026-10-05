import { Link } from "@tanstack/react-router";
import { Bookmark, Building2, CalendarDays, Check, IndianRupee, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";
import type { Scheme } from "@/types/app";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const { language } = useApp();
  const translatedStatus = t(language, status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        status === "Open" || status === "Eligible"
          ? "bg-success/15 text-success"
          : status.includes("soon") || status.includes("Potential")
            ? "bg-warning/20 text-warning-foreground"
            : "bg-muted text-muted-foreground",
      )}
    >
      {translatedStatus}
    </span>
  );
}

export function SchemeCard({
  scheme,
  compact = false,
}: {
  scheme: Scheme;
  compact?: boolean;
}) {
  const { savedIds, toggleSaved, language } = useApp();
  const localizedScheme = getLocalizedScheme(scheme, language);
  const saved = savedIds.includes(scheme.id);

  return (
    <article className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={scheme.status} />
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={() => toggleSaved(scheme.id)}
            aria-label={saved ? "Remove saved scheme" : "Save scheme"}
          >
            <Bookmark className={cn(saved && "fill-primary text-primary")} />
          </Button>
        </div>
      </div>

      <h3 className="font-display text-lg font-bold leading-snug">
        {localizedScheme.shortName}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5" />
        {localizedScheme.department}
      </p>

      {!compact && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {localizedScheme.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-xs">
        <div>
          <span className="block text-muted-foreground">{t(language, "Benefit")}</span>
          <b className="mt-1 flex items-center gap-1 text-foreground">
            <IndianRupee className="size-3" />
            {localizedScheme.benefit.replace("₹", "")}
          </b>
        </div>
        <div>
          <span className="block text-muted-foreground">{t(language, "Deadline")}</span>
          <b className="mt-1 flex items-center gap-1 text-foreground">
            <CalendarDays className="size-3" />
            {localizedScheme.deadline}
          </b>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-success">
        <Check className="size-4" />
        {t(language, "Likely eligible")} · {scheme.matchScore}% {t(language, "match")}
      </div>

      <div className="mt-auto flex gap-2 pt-5">
        <Button asChild className="flex-1">
          <Link to="/schemes/$id" params={{ id: scheme.id }}>
            {t(language, "View Details")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/eligibility">{t(language, "Check Eligibility")}</Link>
        </Button>
      </div>
    </article>
  );
}
