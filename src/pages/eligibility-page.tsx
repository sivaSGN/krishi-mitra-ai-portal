import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/krishi/scheme-card";
import { defaultProfile, schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";
import type { FarmerProfile, Language } from "@/types/app";

const stepsKeys = [
  "Personal Information",
  "Farming Information",
  "Land Information",
  "Income & Documents",
  "Eligibility Result",
];

const fields: [keyof FarmerProfile, string][][] = [
  [
    ["name", "Name"],
    ["age", "Age"],
    ["gender", "Gender"],
    ["state", "State"],
    ["district", "District"],
  ],
  [
    ["farmerType", "Farmer Type"],
    ["crop", "Crop Type"],
    ["experience", "Farming Experience"],
    ["irrigation", "Irrigation Type"],
  ],
  [
    ["ownership", "Land Ownership"],
    ["landSize", "Land Size"],
    ["landLocation", "Land Location"],
  ],
  [["income", "Annual Income"]],
];

export function EligibilityPage() {
  const { language } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FarmerProfile>(defaultProfile);

  const update = (k: keyof FarmerProfile, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  if (step === 4) return <Results restart={() => setStep(0)} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={t(language, "Check Your Scheme Eligibility")}
          description={t(language, "eligibility_page_desc")}
        />
        <section className="rounded-lg border bg-card p-5 shadow-sm md:p-8">
          <div className="mb-8">
            <div className="mb-3 flex justify-between text-xs font-bold">
              <span>
                {t(language, "Step")} {step + 1} {t(language, "of")} 5
              </span>
              <span>{t(language, stepsKeys[step] ?? "")}</span>
            </div>
            <Progress value={(step + 1) * 20} />
            <div className="mt-4 hidden justify-between md:flex">
              {stepsKeys.map((x, i) => (
                <div key={x} className="flex w-1/5 flex-col items-center text-center">
                  <span
                    className={
                      (i <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground") +
                      " grid size-8 place-items-center rounded-full text-xs font-bold"
                    }
                  >
                    {i < step ? <Check /> : i + 1}
                  </span>
                  <span className="mt-2 max-w-28 text-[11px] font-semibold text-muted-foreground">
                    {t(language, x)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="mb-5 text-xl font-bold">{t(language, stepsKeys[step] ?? "")}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields[step]?.map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">
                {t(language, label)}
                <input
                  value={String(form[key])}
                  onChange={(e) => update(key, e.target.value)}
                  className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            ))}

            {step === 3 && (
              <>
                {(
                  [
                    ["aadhaar", "Aadhaar available"],
                    ["bank", "Bank account available"],
                    ["landDocument", "Land document available"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between rounded-lg border bg-muted p-4 text-sm font-semibold"
                  >
                    {t(language, label)}
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof FarmerProfile])}
                      onChange={(e) => update(key as keyof FarmerProfile, e.target.checked)}
                      className="size-5 accent-primary"
                    />
                  </label>
                ))}
                <label className="sm:col-span-2 text-sm font-semibold">
                  {t(language, "Required certificates")}
                  <select className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal">
                    <option>{t(language, "Income certificate available")}</option>
                    <option>{t(language, "Can arrange if required")}</option>
                    <option>{t(language, "Not available")}</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft />
              {t(language, "Back")}
            </Button>
            <Button onClick={() => setStep((s) => s + 1)}>
              {step === 3 ? t(language, "Analyze Eligibility") : t(language, "Continue")}
              <ArrowRight />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

const reasonTranslations: Record<Language, { r1: string; r2: string; r3: string }> = {
  ta: {
    r1: "உங்கள் நில உரிமை விவரங்கள், ஆதார் மற்றும் வங்கி விவரங்கள் முக்கிய நிபந்தனைகளுடன் பொருந்துகின்றன.",
    r2: "உங்கள் விவசாய செயல்பாடு பொருந்துகிறது, ஆனால் இறுதி கடன் ஒப்புதல் வங்கி முடிவைப் பொறுத்தது.",
    r3: "தற்போதைய சுயவிவரத்தில் தகுதியான உள்கட்டமைப்பு திட்ட முன்மொழிவு சேர்க்கப்படவில்லை.",
  },
  te: {
    r1: "మీ భూమి యాజమాన్యం, ఆధార్ మరియు బ్యాంక్ వివరాలు ప్రధాన అర్హత నిబంధనలకు సరిపోలుతున్నాయి.",
    r2: "మీ వ్యవసాయ కార్యకలాపం సరిపోలుతుంది, అయితే తుది రుణ ఆమోదం బ్యాంక్ నిబంధనలపై ఆధారపడి ఉంటుంది.",
    r3: "ప్రస్తుత ప్రొఫైల్‌లో అర్హతగల మౌలిక సదుపాయాల ప్రాజెక్ట్ ప్రతిపాదన లేదు.",
  },
  hi: {
    r1: "आपकी भूमि स्वामित्व प्रोफ़ाइल, आधार और बैंक विवरण मुख्य शर्तों से मेल खाते हैं।",
    r2: "आपकी खेती की गतिविधि मेल खाती है, लेकिन अंतिम ऋण स्वीकृति संबंधित बैंक पर निर्भर करती है।",
    r3: "वर्तमान प्रोफ़ाइल में कोई पात्र बुनियादी ढांचा परियोजना प्रस्ताव शामिल नहीं है।",
  },
  en: {
    r1: "Your landholding profile, Aadhaar and bank details match the main demo conditions.",
    r2: "Your farming activity matches, but final credit approval depends on the participating bank.",
    r3: "The current profile does not include a qualifying infrastructure project proposal.",
  },
};

function Results({ restart }: { restart: () => void }) {
  const { language } = useApp();

  const currentReasons = reasonTranslations[language] || reasonTranslations.en;

  const results = [
    {
      s: schemes[0]!,
      status: "Eligible",
      reason: currentReasons.r1,
      icon: CheckCircle2,
    },
    {
      s: schemes[2]!,
      status: "Potentially Eligible",
      reason: currentReasons.r2,
      icon: ShieldCheck,
    },
    {
      s: schemes[5]!,
      status: "Not Eligible",
      reason: currentReasons.r3,
      icon: XCircle,
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title={t(language, "Eligibility Analysis Complete")}
          description={t(language, "eligibility_complete_desc")}
          actions={
            <Button variant="outline" onClick={restart}>
              <RotateCcw />
              {t(language, "Start again")}
            </Button>
          }
        />

        <section className="mb-6 rounded-lg bg-primary p-6 text-primary-foreground shadow-lg">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-primary-foreground/15">
              <ShieldCheck className="size-8" />
            </span>
            <div>
              <p className="text-sm text-primary-foreground/75">{t(language, "Profile match")}</p>
              <p className="text-3xl font-extrabold">3 {t(language, "schemes analyzed")}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-primary-foreground/10 p-3">
              <b className="block text-xl">1</b>
              {t(language, "Eligible")}
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-3">
              <b className="block text-xl">1</b>
              {t(language, "Potential")}
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-3">
              <b className="block text-xl">1</b>
              {t(language, "Not eligible")}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {results.map(({ s, status, reason, icon: Icon }) => {
            const locScheme = getLocalizedScheme(s, language);
            return (
              <section key={s.id} className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <Icon />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold">{locScheme.shortName}</h2>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <b className="text-foreground">{t(language, "Reason")}:</b> {reason}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-lg bg-muted p-3">
                        <b>{t(language, "Benefit")}</b>
                        <p className="mt-1 text-muted-foreground">{locScheme.benefit}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <b>{t(language, "Documents")}</b>
                        <p className="mt-1 text-muted-foreground">
                          {locScheme.documents.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <b>{t(language, "Next step")}</b>
                        <p className="mt-1 text-muted-foreground">
                          {t(language, "Review details and official rules")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/schemes/$id" params={{ id: s.id }}>
                      <FileText />
                      {t(language, "View Scheme")}
                    </Link>
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          {t(language, "demo_result_note")}
        </p>
      </div>
    </AppShell>
  );
}
