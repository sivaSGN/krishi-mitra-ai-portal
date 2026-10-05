import { BrainCircuit, CheckCircle2, Info } from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { SchemeCard } from "@/components/krishi/scheme-card";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";

export function RecommendedPage() {
  const { language } = useApp();
  const recommendedList = [
    schemes[0]!,
    schemes[10]!,
    schemes[3]!,
    schemes[6]!,
    schemes[1]!,
    schemes[2]!,
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px]">
        <PageHeader
          title={t(language, "Recommended for You")}
          description={t(language, "recommended_desc")}
        />
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-info/25 bg-info/10 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-info" />
          <p>
            <b>{t(language, "Demo recommendations:")}</b> {t(language, "demo_rec_banner")}
          </p>
        </div>
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
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${s.matchScore}%` }}
                    />
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
