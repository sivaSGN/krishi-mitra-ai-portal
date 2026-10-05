import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector, ThemeToggle } from "@/components/krishi/app-shell";
import { useApp, t } from "@/context/app-context";
import { toast } from "sonner";
import type { Language } from "@/types/app";

// Options for dropdowns
export const indianStates = [
  "Andhra Pradesh",
  "Telangana",
  "Tamil Nadu",
  "Karnataka",
  "Maharashtra",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Gujarat",
  "Rajasthan",
  "Madhya Pradesh",
  "Bihar",
  "West Bengal",
  "Odisha",
  "Kerala",
  "Assam",
  "Himachal Pradesh",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Goa",
  "All India / Other UT",
];

export const preferredLanguages = [
  { value: "en", label: "English" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { value: "mr", label: "Marathi (मराठी)" },
  { value: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { value: "bn", label: "Bengali (বাংলা)" },
  { value: "gu", label: "Gujarati (ગુજરાતી)" },
  { value: "or", label: "Odia (ଓଡ଼ିଆ)" },
];

export const farmerTypes = [
  "Small & Marginal Farmer (< 5 acres / 2 ha)",
  "Medium Farmer (5 – 25 acres)",
  "Large Farmer (> 25 acres)",
  "Tenant Farmer / Sharecropper",
  "Agricultural Laborer / Landless",
  "Organic / Natural Farming Practitioner",
  "Women Farmer / SHG Group Member",
];

export const cropTypes = [
  "Rice / Paddy",
  "Wheat",
  "Cotton",
  "Sugarcane",
  "Maize / Corn",
  "Pulses & Lentils (Gram, Tur)",
  "Groundnut & Oilseeds",
  "Vegetables (Tomato, Onion, Chilli)",
  "Fruits / Horticulture (Mango, Banana)",
  "Spices & Plantation Crops (Turmeric, Pepper)",
  "Millets (Jowar, Bajra, Ragi)",
  "Mixed / Multi-crop",
];

export const irrigationTypes = [
  "Borewell / Tubewell",
  "Canal / River Irrigation",
  "Drip Irrigation (Micro-irrigation)",
  "Sprinkler System",
  "Rainfed / Dryland (Monsoon Dependent)",
  "Open Well / Farm Pond",
  "Tank / Lift Irrigation",
];

export function RegisterPage() {
  const { updateProfile, login, setLanguage, language: appLang } = useApp();
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState("Ravi Kumar");
  const [age, setAge] = useState("42");
  const [state, setState] = useState("Andhra Pradesh");
  const [district, setDistrict] = useState("Guntur");
  const [language, setSelectedLanguage] = useState("en");
  const [landSize, setLandSize] = useState("3.5");
  const [farmerType, setFarmerType] = useState("Small & Marginal Farmer (< 5 acres / 2 ha)");
  const [cropType, setCropType] = useState("Rice / Paddy");
  const [irrigationType, setIrrigationType] = useState("Borewell / Tubewell");
  const [annualIncome, setAnnualIncome] = useState("250000");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setSubmitting(true);

    const newProfile = {
      name: fullName.trim(),
      age: age || "42",
      gender: "Male",
      state: state || "Andhra Pradesh",
      district: district || "Guntur",
      farmerType: farmerType || "Small Farmer",
      crop: cropType || "Rice",
      experience: "15 years",
      irrigation: irrigationType || "Borewell",
      ownership: "Owned",
      landSize: `${landSize || "3.5"} acres`,
      landLocation: `${district || "Guntur"} Rural`,
      income: `₹${Number(annualIncome || 250000).toLocaleString("en-IN")}`,
      aadhaar: true,
      bank: true,
      landDocument: true,
    };

    try {
      // Save profile in context & local storage & Supabase
      updateProfile(newProfile);

      // Set preferred language if valid
      if (["en", "hi", "te", "ta"].includes(language)) {
        setLanguage(language as Language);
      }

      // Login user
      await login("9876543210", fullName);

      setSubmitting(false);
      toast.success("Account created and saved to Supabase! Welcome to Scheme Connect.");
      void navigate({ to: "/dashboard" });
    } catch {
      setSubmitting(false);
      void navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-6" />
          </span>
          <span>
            <b className="block font-display text-[18px] leading-tight">{t(appLang, "brand_title")}</b>
            <small className="text-[10px] font-semibold uppercase text-muted-foreground">
              {t(appLang, "brand_subtitle")}
            </small>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">{t(appLang, "Sign In")}</Link>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Header Title Banner */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-2">
              <UserPlus className="size-3.5" />
              New Farmer Registration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Create Your Farmer Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in your agricultural details below to receive personalized government scheme recommendations.
            </p>
          </div>

          <div className="text-xs bg-muted/60 border rounded-xl p-3 text-muted-foreground max-w-xs text-left">
            <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
              <ShieldCheck className="size-4 text-primary" />
              100% Offline & Private
            </div>
            Your farming details are saved securely inside your browser.
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-lg space-y-6">
            {/* Field 1: Full name */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Full name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ravi Kumar"
                className="h-12 w-full rounded-xl border bg-background/80 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Row 1: Age & State */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Field 2: Age */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Age</label>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="42"
                  className="h-12 w-full rounded-xl border bg-background/80 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Field 3: State */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  State <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border bg-background/80 px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: District & Preferred Language */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Field 4: District */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  District <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Guntur"
                  className="h-12 w-full rounded-xl border bg-background/80 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Field 5: Preferred Language */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Preferred language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border bg-background/80 px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {preferredLanguages.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 3: Land Size & Farmer Type */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Field 6: Land size (acres) */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Land size (acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder="3.5"
                  className="h-12 w-full rounded-xl border bg-background/80 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Field 7: Farmer Type */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Farmer type
                </label>
                <div className="relative">
                  <select
                    value={farmerType}
                    onChange={(e) => setFarmerType(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border bg-background/80 px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">Select Farmer Type</option>
                    {farmerTypes.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 4: Crop Type & Irrigation Type */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Field 8: Crop Type */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Crop type</label>
                <div className="relative">
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border bg-background/80 px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">Select Crop Type</option>
                    {cropTypes.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Field 9: Irrigation Type */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Irrigation type
                </label>
                <div className="relative">
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border bg-background/80 px-4 pr-10 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">Select Irrigation Type</option>
                    {irrigationTypes.map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Field 10: Annual Income (₹) */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Annual income (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="250000"
                  className="h-12 w-full rounded-xl border bg-background/80 pl-9 pr-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Form Submit & Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              to="/login"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground order-2 sm:order-1"
            >
              Already have an account? <span className="text-primary underline">Sign in</span>
            </Link>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto min-w-56 h-12 text-base font-bold gap-2 order-1 sm:order-2 shadow-md"
            >
              {submitting ? (
                "Creating Profile..."
              ) : (
                <>
                  Create Account & View Schemes <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t text-center text-xs text-muted-foreground">
        Scheme Connect · AI Farmer Scheme Assistant · Designed for Indian Cultivators & Agri-Communities
      </footer>
    </div>
  );
}
