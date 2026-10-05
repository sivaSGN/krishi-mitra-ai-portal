import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Bookmark,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/krishi/app-shell";
import { SchemeCard } from "@/components/krishi/scheme-card";
import {
  CategoryChart,
  EligibilityChart,
  SavedChart,
  SearchChart,
} from "@/components/krishi/charts";
import { Button } from "@/components/ui/button";
import { activities, schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";

const activityTranslations: Record<string, Record<string, string>> = {
  ta: {
    "Eligibility checked for PM-KISAN": "PM-கிசான் தகுதி சரிபார்க்கப்பட்டது",
    "Saved PM-KUSUM": "PM-குசும் திட்டம் சேமிக்கப்பட்டது",
    "Asked AI about crop insurance": "பயிர் காப்பீடு பற்றி AI இடம் கேட்கப்பட்டது",
    "Viewed Kisan Credit Card": "கிசான் கிரெடிட் கார்டு பார்க்கப்பட்டது",
  },
  te: {
    "Eligibility checked for PM-KISAN": "పీఎం-కిసాన్ కోసం అర్హత తనిఖీ చేయబడింది",
    "Saved PM-KUSUM": "పీఎం-కుసుమ్ సేవ్ చేయబడింది",
    "Asked AI about crop insurance": "పంట బీమా గురించి AI ని అడిగారు",
    "Viewed Kisan Credit Card": "కిసాన్ క్రెడిట్ కార్డ్ వివరాలు వీక్షించారు",
  },
  hi: {
    "Eligibility checked for PM-KISAN": "पीएम-किसान के लिए पात्रता जाँची गई",
    "Saved PM-KUSUM": "पीएम-कुसुम सहेजा गया",
    "Asked AI about crop insurance": "फसल बीमा के बारे में AI से पूछा",
    "Viewed Kisan Credit Card": "किसान क्रेडिट कार्ड देखा गया",
  },
};

export function DashboardPage() {
  const { savedIds, profile, language } = useApp();

  const stats = [
    [t(language, "available_schemes"), "120+", ShieldCheck, t(language, "this_month")],
    [t(language, "recommended_schemes"), "8", TrendingUp, t(language, "based_on_profile")],
    [t(language, "eligible_schemes"), "5", CheckCircle2, t(language, "highly_matched")],
    [t(language, "saved_schemes"), String(savedIds.length), Bookmark, t(language, "view_shortlist")],
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary">{t(language, "saturday_date")}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            {t(language, "good_morning")}, {profile.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t(language, "dashboard_hero_subtitle")}
          </p>
        </div>

        <section className="relative overflow-hidden rounded-lg bg-primary p-6 text-primary-foreground shadow-lg md:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">
              <Bot className="size-4" />
              {t(language, "ai_scheme_companion")}
            </div>
            <h2 className="text-2xl font-extrabold md:text-3xl">{t(language, "ask_scheme_connect")}</h2>
            <p className="mt-2 text-sm text-primary-foreground/80 md:text-base">
              {t(language, "hero_quote")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to="/assistant">
                  <Bot />
                  {t(language, "ask_ai")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <Link to="/eligibility">
                  <FileCheck2 />
                  {t(language, "check_eligibility")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              >
                <Link to="/schemes">
                  <Search />
                  {t(language, "find_schemes")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute -bottom-14 -right-8 hidden size-56 rounded-full border-[28px] border-primary-foreground/10 md:block" />
          <div className="absolute right-20 top-7 hidden opacity-15 lg:block">
            <ShieldCheck className="size-32" />
          </div>
        </section>

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

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">{t(language, "recommended_for_you")}</h2>
              <p className="text-sm text-muted-foreground">
                {t(language, "top_matches_profile")}
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/recommended">
                {t(language, "view_all")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schemes.slice(0, 3).map((s) => (
              <SchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Analytics
            title={t(language, "monthly_searches")}
            note={t(language, "discovery_activity_note")}
          >
            <SearchChart />
          </Analytics>
          <Analytics
            title={t(language, "scheme_categories")}
            note={t(language, "distribution_support_note")}
          >
            <CategoryChart />
          </Analytics>
          <Analytics
            title={t(language, "eligibility_results_title")}
            note={t(language, "latest_profile_analysis")}
          >
            <EligibilityChart />
          </Analytics>
          <Analytics
            title={t(language, "saved_schemes_growth")}
            note={t(language, "shortlist_growth_note")}
          >
            <SavedChart />
          </Analytics>
        </div>

        <section className="mt-6 rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold">{t(language, "recent_activity")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {activities.map((a, i) => {
              const translatedActivity = activityTranslations[language]?.[a] ?? a;
              return (
                <div key={a} className="flex items-start gap-3 rounded-lg bg-muted p-3">
                  <Clock3 className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{translatedActivity}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {i + 1} {i ? t(language, "days_ago") : t(language, "day_ago")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Analytics({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}
