import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Bookmark,
  CheckCircle2,
  FileCheck2,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";

/** Returns true only when the user has filled in both personal and farming details */
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

export function DashboardPage() {
  const { savedIds, profile, language } = useApp();
  const profileComplete = isProfileComplete(profile);
  const displayName = profile.name && profile.name !== "Farmer" ? profile.name : null;

  const stats = [
    [t(language, "available_schemes"), "120+", ShieldCheck, t(language, "this_month")],
    [t(language, "eligible_schemes"), profileComplete ? "5" : "â€”", CheckCircle2, profileComplete ? t(language, "highly_matched") : "Complete profile first"],
    [t(language, "saved_schemes"), String(savedIds.length), Bookmark, t(language, "view_shortlist")],
    [t(language, "recommended_schemes"), profileComplete ? "8" : "â€”", TrendingUp, profileComplete ? t(language, "based_on_profile") : "Complete profile first"],
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary">{t(language, "saturday_date")}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            {t(language, "good_morning")}, {displayName ? displayName.split(" ")[0] : "Farmer"} ðŸ‘‹
          </h1>
          <p className="mt-1 text-muted-foreground">{t(language, "dashboard_hero_subtitle")}</p>
        </div>

        {/* Profile Completion Banner â€” shown until profile is done */}
        {!profileComplete && (
          <div className="mb-6 rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
                <AlertCircle className="size-6" />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">Complete Your Farmer Profile</h2>
                <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                  Your profile is incomplete. Fill in your farming details to unlock personalized scheme recommendations, eligibility checks, and AI guidance.
                </p>
              </div>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 gap-2">
                <Link to="/profile">
                  <UserRound className="size-4" />
                  Complete Profile
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
              {[
                { label: "Recommended Schemes", locked: true },
                { label: "Eligibility Check", locked: true },
                { label: "AI-Personalised Help", locked: true },
                { label: "Browse All Schemes", locked: false },
              ].map(({ label, locked }) => (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 font-semibold ${
                    locked
                      ? "border-amber-300/50 bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "border-emerald-300/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {locked ? (
                    <span className="size-1.5 rounded-full bg-amber-400" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Hero Banner */}
        <section className="relative overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-lg md:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">
              <Bot className="size-4" />
              {t(language, "ai_scheme_companion")}
            </div>
            <h2 className="text-2xl font-extrabold md:text-3xl">{t(language, "ask_scheme_connect")}</h2>
            <p className="mt-2 text-sm text-primary-foreground/80 md:text-base">{t(language, "hero_quote")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to="/assistant">
                  <Bot /> {t(language, "ask_ai")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                <Link to="/eligibility">
                  <FileCheck2 /> {t(language, "check_eligibility")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                <Link to="/schemes">
                  <Search /> {t(language, "find_schemes")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute -bottom-14 -right-8 hidden size-56 rounded-full border-[28px] border-primary-foreground/10 md:block" />
          <div className="absolute right-20 top-7 hidden opacity-15 lg:block">
            <ShieldCheck className="size-32" />
          </div>
        </section>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, Icon, note]) => (
            <div key={label} className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                  <Icon />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>

        {/* Profile-gated section: Recommended OR "Complete Profile" nudge */}
        {profileComplete ? (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold">{t(language, "recommended_for_you")}</h2>
                <p className="text-sm text-muted-foreground">{t(language, "top_matches_profile")}</p>
              </div>
              <Button asChild variant="ghost">
                <Link to="/recommended">{t(language, "view_all")} <ArrowRight /></Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schemes.slice(0, 3).map((s) => (
                <Link
                  key={s.id}
                  to="/schemes/$id"
                  params={{ id: s.id }}
                  className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-2.5 py-0.5">{s.category}</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">{s.matchScore}% match</span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors">{s.shortName}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                    View Details <ArrowRight className="size-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold">{t(language, "recommended_for_you")}</h2>
              <p className="text-sm text-muted-foreground">Based on your farmer profile</p>
            </div>
            <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-card p-12 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-muted-foreground mb-4">
                <Sparkles className="size-8" />
              </span>
              <h3 className="text-lg font-bold">Complete your profile to see recommendations</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Once you fill in your farming details, our AI will match you with the best government schemes for your situation.
              </p>
              <Button asChild className="mt-5 gap-2">
                <Link to="/profile"><UserRound className="size-4" /> Complete Profile Now</Link>
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

