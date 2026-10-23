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
  UserRound,
  Sparkles,
  ChevronDown,
  User,
  Calendar,
  MapPin,
  Sprout,
  Droplets,
  Layers,
  IndianRupee,
  BadgeCheck,
  Landmark,
  FileCheck2,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/krishi/scheme-card";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";
import type { FarmerProfile, Language } from "@/types/app";
import {
  STATE_DISTRICTS,
  AGE_OPTIONS,
  FARMER_TYPE_OPTIONS,
  CROP_OPTIONS,
  EXPERIENCE_OPTIONS,
  IRRIGATION_OPTIONS,
  OWNERSHIP_OPTIONS,
  LAND_SIZE_OPTIONS,
  LAND_LOCATION_OPTIONS,
  INCOME_OPTIONS,
} from "@/pages/profile-page";

const stepsKeys = [
  "Personal Information",
  "Farming Information",
  "Land Information",
  "Income & Documents",
  "Eligibility Result",
];

// Helper: Custom Dropdown Field
function FarmerSelectField({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  helperText,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  icon?: any;
  helperText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {Icon && <Icon className="size-4 text-primary shrink-0" />}
        {label}
      </label>

      {/* Main Select Dropdown */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border bg-background px-3.5 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
        >
          <option value="">{`-- Select ${label} --`}</option>
          {!options.some((opt) => opt.value === value) && value && (
            <option value={value}>{value}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      </div>

      {helperText && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

// Helper: Tap-to-Select Button Cards (e.g. for Gender)
function FarmerButtonCards({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; icon?: any }[];
  onChange: (val: string) => void;
  icon?: any;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {Icon && <Icon className="size-4 text-primary shrink-0" />}
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const OptIcon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border h-11 px-3 text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/30"
                  : "border-border/70 bg-card hover:border-primary/40 text-foreground font-medium"
              }`}
            >
              {OptIcon ? (
                <OptIcon className="size-4 shrink-0 text-primary" />
              ) : isSelected ? (
                <Check className="size-4 shrink-0 text-primary" />
              ) : null}
              <span className="text-xs leading-tight truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EligibilityPage() {
  const { language, profile } = useApp();
  const [step, setStep] = useState(0);

  // Initialize form state from the user's own profile — never inject demo defaults
  const [form, setForm] = useState<FarmerProfile>(() => ({
    name: profile.name || "",
    age: profile.age || "",
    gender: profile.gender || "",
    state: profile.state || "",
    district: profile.district || "",
    farmerType: profile.farmerType || "",
    crop: profile.crop || "",
    experience: profile.experience || "",
    irrigation: profile.irrigation || "",
    ownership: profile.ownership || "",
    landSize: profile.landSize || "",
    landLocation: profile.landLocation || "",
    income: profile.income || "",
    aadhaar: profile.aadhaar ?? false,
    bank: profile.bank ?? false,
    landDocument: profile.landDocument ?? false,
  }));

  const update = (k: keyof FarmerProfile, v: string | boolean) => {
    setForm((p) => {
      const updated = { ...p, [k]: v };
      // When state changes, auto-select first district of that state
      if (k === "state" && typeof v === "string") {
        const availableDistricts = STATE_DISTRICTS[v] || [];
        if (availableDistricts.length > 0 && !availableDistricts.includes(p.district)) {
          updated.district = availableDistricts[0]!;
        }
      }
      return updated;
    });
  };

  if (step === 4) return <Results restart={() => setStep(0)} />;

  // Available districts for current selected state
  const stateDistricts = STATE_DISTRICTS[form.state] || [
    "Guntur", "Krishna", "Kurnool", "East Godavari", "Warangal", "Nalgonda"
  ];
  const districtOptions = stateDistricts.map((d) => ({ value: d, label: d }));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={t(language, "Check Your Scheme Eligibility")}
          description={t(language, "eligibility_page_desc")}
        />

        <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="mb-3 flex justify-between text-xs font-bold text-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                {t(language, "Step")} {step + 1} {t(language, "of")} 5
              </span>
              <span className="font-extrabold text-primary">
                {t(language, stepsKeys[step] ?? "")}
              </span>
            </div>
            <Progress value={(step + 1) * 20} className="h-2" />
            <div className="mt-4 hidden justify-between md:flex">
              {stepsKeys.map((x, i) => (
                <div key={x} className="flex w-1/5 flex-col items-center text-center">
                  <span
                    className={
                      (i <= step
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground") +
                      " grid size-8 place-items-center rounded-full text-xs font-bold transition-all"
                    }
                  >
                    {i < step ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className="mt-2 max-w-28 text-[11px] font-semibold text-muted-foreground">
                    {t(language, x)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Header */}
          <div className="mb-6 border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {step === 0 && <UserRound className="size-5 text-primary" />}
              {step === 1 && <Sprout className="size-5 text-primary" />}
              {step === 2 && <Layers className="size-5 text-primary" />}
              {step === 3 && <FileCheck2 className="size-5 text-primary" />}
              {t(language, stepsKeys[step] ?? "")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select your options from the dropdowns below.
            </p>
          </div>

          {/* ================================================================= */}
          {/* STEP 0: Personal Information */}
          {/* ================================================================= */}
          {step === 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <User className="size-4 text-primary shrink-0" />
                  {t(language, "Name")}
                </label>
                <div className="relative">
                  <input
                    value={String(form.name)}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="h-11 w-full rounded-xl border bg-background px-3.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Age Dropdown */}
              <FarmerSelectField
                label={t(language, "Age")}
                value={form.age}
                options={AGE_OPTIONS}
                onChange={(v) => update("age", v)}
                icon={Calendar}
              />

              {/* Gender Radio Buttons */}
              <FarmerButtonCards
                label={t(language, "Gender")}
                value={form.gender || ""}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                onChange={(v) => update("gender", v)}
                icon={UserRound}
              />

              {/* State Dropdown */}
              <FarmerSelectField
                label={t(language, "State")}
                value={form.state}
                options={Object.keys(STATE_DISTRICTS).map((s) => ({ value: s, label: s }))}
                onChange={(v) => update("state", v)}
                icon={MapPin}
              />

              {/* District Dropdown (dynamically populated) */}
              <FarmerSelectField
                label={t(language, "District")}
                value={form.district}
                options={districtOptions}
                onChange={(v) => update("district", v)}
                icon={MapPin}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: Farming Information */}
          {/* ================================================================= */}
          {step === 1 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Farmer Type Dropdown */}
              <FarmerSelectField
                label={t(language, "Farmer Type")}
                value={form.farmerType}
                options={FARMER_TYPE_OPTIONS}
                onChange={(v) => update("farmerType", v)}
                icon={UserRound}
              />

              {/* Crop Type Dropdown */}
              <FarmerSelectField
                label={t(language, "Crop Type")}
                value={form.crop}
                options={CROP_OPTIONS}
                onChange={(v) => update("crop", v)}
                icon={Sprout}
              />

              {/* Farming Experience Dropdown */}
              <FarmerSelectField
                label={t(language, "Farming Experience")}
                value={form.experience}
                options={EXPERIENCE_OPTIONS}
                onChange={(v) => update("experience", v)}
                icon={Calendar}
              />

              {/* Irrigation Type Dropdown */}
              <FarmerSelectField
                label={t(language, "Irrigation Type")}
                value={form.irrigation}
                options={IRRIGATION_OPTIONS}
                onChange={(v) => update("irrigation", v)}
                icon={Droplets}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: Land Information */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Land Ownership */}
              <div className="sm:col-span-2">
                <FarmerSelectField
                  label={t(language, "Land Ownership")}
                  value={form.ownership}
                  options={OWNERSHIP_OPTIONS}
                  onChange={(v) => update("ownership", v)}
                  icon={Landmark}
                />
              </div>

              {/* Land Size */}
              <FarmerSelectField
                label={t(language, "Land Size")}
                value={form.landSize}
                options={LAND_SIZE_OPTIONS}
                onChange={(v) => update("landSize", v)}
                icon={Layers}
              />

              {/* Land Location */}
              <FarmerSelectField
                label={t(language, "Land Location")}
                value={form.landLocation}
                options={LAND_LOCATION_OPTIONS}
                onChange={(v) => update("landLocation", v)}
                icon={MapPin}
              />
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: Income & Documents */}
          {/* ================================================================= */}
          {step === 3 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Annual Income */}
              <div className="sm:col-span-2">
                <FarmerSelectField
                  label={t(language, "Annual Income")}
                  value={form.income}
                  options={INCOME_OPTIONS}
                  onChange={(v) => update("income", v)}
                  icon={IndianRupee}
                />
              </div>

              {/* Document Availability Cards */}
              <div className="sm:col-span-2 space-y-3 pt-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-primary shrink-0" />
                  Available Farmer Documents
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(
                    [
                      ["aadhaar", "Aadhaar Card", "Government UID document"],
                      ["bank", "Bank Account", "Active DBT enabled account"],
                      ["landDocument", "Land Patta / Passbook", "Ownership or tenancy proof"],
                    ] as const
                  ).map(([key, label, desc]) => {
                    const isChecked = Boolean(form[key as keyof FarmerProfile]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update(key as keyof FarmerProfile, !isChecked)}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                          isChecked
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border/70 bg-card hover:border-primary/40 opacity-75"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border text-xs transition ${
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isChecked && <Check className="size-3.5 stroke-[3]" />}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{t(language, label)}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Required Certificates Dropdown */}
              <div className="sm:col-span-2 space-y-1.5 pt-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <FileText className="size-4 text-primary shrink-0" />
                  {t(language, "Required certificates")}
                </label>
                <div className="relative">
                  <select className="h-11 w-full appearance-none rounded-xl border bg-background px-3.5 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm">
                    <option>{t(language, "Income certificate available")}</option>
                    <option>{t(language, "Can arrange if required")}</option>
                    <option>{t(language, "Not available")}</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t pt-5">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="gap-2 h-11 px-4 font-semibold"
            >
              <ArrowLeft className="size-4" />
              {t(language, "Back")}
            </Button>
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="gap-2 h-11 px-6 font-bold shadow-sm"
            >
              {step === 3 ? t(language, "Analyze Eligibility") : t(language, "Continue")}
              <ArrowRight className="size-4" />
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
            <Button variant="outline" onClick={restart} className="gap-2">
              <RotateCcw className="size-4" />
              {t(language, "Start again")}
            </Button>
          }
        />

        <section className="mb-6 rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
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
            <div className="rounded-xl bg-primary-foreground/10 p-3">
              <b className="block text-xl">1</b>
              {t(language, "Eligible")}
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-3">
              <b className="block text-xl">1</b>
              {t(language, "Potential")}
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-3">
              <b className="block text-xl">1</b>
              {t(language, "Not eligible")}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {results.map(({ s, status, reason, icon: Icon }) => {
            const locScheme = getLocalizedScheme(s, language);
            return (
              <section key={s.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-6" />
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
                      <div className="rounded-xl bg-muted p-3">
                        <b className="text-foreground">{t(language, "Benefit")}</b>
                        <p className="mt-1 text-muted-foreground">{locScheme.benefit}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <b className="text-foreground">{t(language, "Documents")}</b>
                        <p className="mt-1 text-muted-foreground">
                          {locScheme.documents.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <b className="text-foreground">{t(language, "Next step")}</b>
                        <p className="mt-1 text-muted-foreground">
                          {t(language, "Review details and official rules")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/schemes/$id" params={{ id: s.id }}>
                      <FileText className="size-4" />
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
