import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  IndianRupee,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/krishi/app-shell";
import { StatusBadge } from "@/components/krishi/scheme-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";

export function SchemeDetailsPage({ id }: { id: string }) {
  const { savedIds, toggleSaved, language } = useApp();
  const rawScheme = schemes.find((x) => x.id === id);

  if (!rawScheme) {
    return (
      <AppShell>
        <div className="grid min-h-[70vh] place-items-center text-center">
          <div>
            <h1 className="text-2xl font-bold">{t(language, "Scheme not found")}</h1>
            <Button asChild className="mt-4">
              <Link to="/schemes">{t(language, "Browse schemes")}</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const s = getLocalizedScheme(rawScheme, language);
  const saved = savedIds.includes(s.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px]">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/schemes">
            <ArrowLeft />
            {t(language, "Back to schemes")}
          </Link>
        </Button>

        <section className="rounded-lg border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge status={s.status} />
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                  {t(language, s.category)}
                </span>
              </div>
              <h1 className="max-w-3xl text-2xl font-extrabold md:text-4xl">{s.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                {s.department}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toggleSaved(s.id)}>
                <Bookmark className={saved ? "fill-primary text-primary" : ""} />
                {saved ? t(language, "Saved") : t(language, "Save Scheme")}
              </Button>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground">
            {s.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary p-4">
              <IndianRupee className="text-primary" />
              <span className="mt-2 block text-xs text-muted-foreground">{t(language, "Benefit")}</span>
              <b>{s.benefit}</b>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <CalendarDays className="text-primary" />
              <span className="mt-2 block text-xs text-muted-foreground">{t(language, "Important date")}</span>
              <b>{s.deadline}</b>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <MapPin className="text-primary" />
              <span className="mt-2 block text-xs text-muted-foreground">{t(language, "Coverage")}</span>
              <b>{s.state}</b>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/eligibility">
                <ShieldCheck />
                {t(language, "Check My Eligibility")}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/assistant">
                <Bot />
                {t(language, "Ask AI About This Scheme")}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById("process")?.scrollIntoView({ behavior: "smooth" })}
            >
              <BookOpen />
              {t(language, "Application Guide")}
            </Button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Info title={t(language, "Who is eligible?")} icon={<CheckCircle2 />} items={s.eligibility} />
            <Info title={t(language, "Required documents")} icon={<FileText />} items={s.documents} />

            <section id="process" className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold">{t(language, "Application process")}</h2>
              <div className="mt-6 space-y-0">
                {s.applicationSteps.map((x, i) => (
                  <div key={x} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    {i < s.applicationSteps.length - 1 && (
                      <span className="absolute left-[17px] top-9 h-full w-px bg-border" />
                    )}
                    <div>
                      <p className="font-bold">{x}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(language, "step_instruction")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold">{t(language, "Important dates")}</h2>
              {s.dates.map((d) => (
                <div key={d.label} className="mt-4 flex justify-between border-b pb-4 last:border-0 last:pb-0">
                  <span className="text-sm text-muted-foreground">{d.label}</span>
                  <b className="text-sm">{d.value}</b>
                </div>
              ))}
            </section>

            <section className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold">{t(language, "Frequently asked questions")}</h2>
              <Accordion type="single" collapsible className="mt-3">
                {s.faqs.map((f, i) => (
                  <AccordionItem value={String(i)} key={f.q}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="leading-6 text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Info({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x} className="flex gap-2 rounded-lg bg-muted p-3 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            {x}
          </li>
        ))}
      </ul>
    </section>
  );
}
