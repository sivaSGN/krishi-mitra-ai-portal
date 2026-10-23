import { BrainCircuit, CheckCircle2, Sparkles, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { SchemeCard } from "@/components/krishi/scheme-card";
import { Button } from "@/components/ui/button";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";

function isProfileComplete(profile: {
  name?: string;
  state?: string;
  district?: string;
  income?: string;
  farmerType?: string;
  crop?: string;
}): boolean {
  return Boolean(
    profile.name && profile.name !== "Farmer" && profile.name.trim() !== "" &&
    profile.state && profile.state.trim() !== "" &&
    profile.district && profile.district.trim() !== "" &&
    profile.income && profile.income.trim() !== "" &&
    profile.farmerType && profile.farmerType.trim() !== "" &&
    profile.crop && profile.crop.trim() !== ""
  );
}

export function RecommendedPage() {
  const { language, profile } = useApp();
  const profileComplete = isProfileComplete(profile);

  if (!profileComplete) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title={t(language, "Recommended for You")}
            description="Personalized government schemes matched to your profile"
          />
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card p-16 text-center">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-500 mb-5">
              <Sparkles className="size-10" />
            </span>
            <h2 className="text-2xl font-bold">Profile Incomplete</h2>
            <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
              To see personalized scheme recommendations matched to your situation, please complete your farmer profile first.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/profile">
                <UserRound className="size-4" />
                Complete Profile Details
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const recommendedList = [
    schemes[0]!, schemes[10]!, schemes[3]!, schemes[6]!, schemes[1]!, schemes[2]!,
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px]">
        <PageHeader
          title={t(language, "Recommended for You")}
          description={t(language, "recommended_desc")}
        />
        <div className="grid gap-5 xl:grid-cols-2">
          {recommendedList.map((raw) => {
            const s = getLocalizedScheme(raw, language);
            return (
              <section
                key={s.id}
                className="grid gap-0 overflow-hidden rounded-lg border bg-card shadow-sm sm:grid-cols-[1fr_190px]"
              >
                <SchemeCard scheme={raw} compact />
                <div className="border-t bg-secondary/50 p-5 sm:border-l sm:border-t-0">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="text-primary" />
                    <span className="text-xs font-bold uppercase text-muted-foreground">
                      {t(language, "AI Match Score")}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-4xl font-extrabold text-primary">
                    {s.matchScore}%
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${s.matchScore}%` }} />
                  </div>
                  <h4 className="mt-5 text-sm font-bold">{t(language, "Why recommended")}</h4>
                  <ul className="mt-2 space-y-2">
                    {s.why.map((x) => (
                      <li key={x} className="flex gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

