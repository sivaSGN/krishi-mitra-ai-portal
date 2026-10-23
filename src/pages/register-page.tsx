import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sprout,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
  User,
  MapPin,
  IndianRupee,
  ChevronDown,
  Globe,
  Edit2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector, ThemeToggle } from "@/components/krishi/app-shell";
import { useApp, t } from "@/context/app-context";
import { registerUser } from "@/services/auth-service";
import { toast } from "sonner";
import type { Language } from "@/types/app";
import { STATE_DISTRICTS, AGE_OPTIONS } from "@/pages/profile-page";

// Re-exported for compatibility with profile and scheme modules
export const indianStates = [
  "Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Maharashtra",
  "Uttar Pradesh", "Punjab", "Haryana", "Gujarat", "Rajasthan", "Madhya Pradesh",
  "Bihar", "West Bengal", "Odisha", "Kerala", "Assam", "Himachal Pradesh",
  "Chhattisgarh", "Jharkhand", "Uttarakhand", "Goa", "All India / Other UT",
];

export const preferredLanguages = [
  { value: "en", label: "English" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
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
  "Rice / Paddy", "Wheat", "Cotton", "Sugarcane", "Maize / Corn",
  "Pulses & Lentils (Gram, Tur)", "Groundnut & Oilseeds",
  "Vegetables (Tomato, Onion, Chilli)", "Fruits / Horticulture (Mango, Banana)",
  "Spices & Plantation Crops (Turmeric, Pepper)", "Millets (Jowar, Bajra, Ragi)", "Mixed / Multi-crop",
];

export const irrigationTypes = [
  "Borewell / Tubewell", "Canal / River Irrigation", "Drip Irrigation (Micro-irrigation)",
  "Sprinkler System", "Rainfed / Dryland (Monsoon Dependent)", "Open Well / Farm Pond", "Tank / Lift Irrigation",
];

export function RegisterPage() {
  const { updateProfile, login, setLanguage, language: appLang } = useApp();
  const navigate = useNavigate();

  // Wizard Step: 1 = Farmer Details, 2 = Mobile & Password
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Profile Details (Name, Age, Income, State, District, Language)
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Step 2: Account Credentials (Mobile & Password)
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // When state changes, update available districts
  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict("");
  };

  // Validate Step 1 and proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      toast.error("Please select a valid age between 18 and 120.");
      return;
    }
    if (!state.trim()) {
      toast.error("Please select your state.");
      return;
    }
    if (!district.trim()) {
      toast.error("Please select your district.");
      return;
    }
    const cleanIncome = annualIncome.replace(/\D/g, "");
    if (!cleanIncome || Number(cleanIncome) <= 0) {
      toast.error("Please enter your annual income.");
      return;
    }

    setStep(2);
  };

  // Complete Registration at Step 2
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);
    try {
      const numericIncome = Number(annualIncome.replace(/\D/g, "")) || 0;
      const formattedIncome = `₹${numericIncome.toLocaleString("en-IN")}`;

      const result = await registerUser({
        name: fullName.trim(),
        age: parseInt(age, 10),
        state: state.trim(),
        district: district.trim(),
        preferredLanguage: selectedLanguage,
        annualIncome: formattedIncome,
        mobile: cleanMobile,
        password,
      });

      if (!result.success) {
        setSubmitting(false);
        toast.error(result.message);
        return;
      }

      // Initialize fresh empty profile with only the registered personal info
      updateProfile({
        name: fullName.trim(),
        age: age.trim(),
        gender: "",
        state: state.trim(),
        district: district.trim(),
        farmerType: "",
        crop: "",
        experience: "",
        irrigation: "",
        ownership: "",
        landSize: "",
        landLocation: "",
        income: formattedIncome,
        aadhaar: false,
        bank: false,
        landDocument: false,
      });

      if (["en", "hi", "te", "ta"].includes(selectedLanguage)) {
        setLanguage(selectedLanguage as Language);
      }

      await login(cleanMobile, fullName.trim());
      setSubmitting(false);
      toast.success("Account created successfully! Welcome to Scheme Connect.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setSubmitting(false);
      console.error("Registration error:", err);
      toast.error("An error occurred during registration. Please try again.");
    }
  };

  const currentDistricts = state && STATE_DISTRICTS[state] ? STATE_DISTRICTS[state] : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <Link to="/login" className="flex items-center gap-3">
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

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-3">
            <UserPlus className="size-3.5" />
            Farmer Registration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Join Scheme Connect
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your registration in two quick steps using the dropdowns below.
          </p>
        </div>

        {/* 2-Step Progress Indicator */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => step === 2 && setStep(1)}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              step === 1
                ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                : "border-border/60 bg-card hover:border-primary/40 cursor-pointer"
            }`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold transition ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {step === 2 ? <CheckCircle2 className="size-4" /> : "1"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Farmer Details</p>
              <p className="text-[11px] text-muted-foreground truncate">Name, age, income & region</p>
            </div>
          </button>

          {/* Step 2 Pill */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              step === 2
                ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                : "border-border/60 bg-card/60 opacity-70"
            }`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold transition ${
                step === 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Mobile & Password</p>
              <p className="text-[11px] text-muted-foreground truncate">Credentials & login setup</p>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* STEP 1: Farmer Profile Details */}
        {/* =================================================================== */}
        {step === 1 && (
          <form
            onSubmit={handleProceedToStep2}
            className="rounded-2xl border bg-card p-6 sm:p-8 shadow-lg space-y-5 animate-in fade-in-50 duration-200"
          >
            <div className="border-b pb-3 mb-1">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="size-4 text-primary" />
                Step 1: Personal & Farming Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your details from the dropdowns below to personalize your scheme recommendations.
              </p>
            </div>

            {/* Row 1: Full Name & Age */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Age Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">
                  Age <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border bg-background/80 pl-9 pr-9 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                  >
                    <option value="">Select Age</option>
                    {AGE_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: State & District Dropdowns */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* State Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">
                  State <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border bg-background/80 px-3.5 pr-9 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* District Dropdown (Dynamic based on selected state) */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">
                  District <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border bg-background/80 pl-9 pr-9 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                  >
                    <option value="">Select District</option>
                    {currentDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 3: Annual Income & Preferred Language */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Income */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">
                  Annual Income (₹) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground flex items-center">
                    <IndianRupee className="size-4" />
                  </span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    placeholder="250000"
                    className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Preferred Language Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">
                  Preferred Language
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border bg-background/80 pl-10 pr-9 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                  >
                    {preferredLanguages.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-2">
              <Button type="submit" className="w-full h-11 font-bold gap-2 text-base shadow-sm">
                Continue to Mobile & Password
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* STEP 2: Mobile Number & Password */}
        {/* =================================================================== */}
        {step === 2 && (
          <form
            onSubmit={handleRegister}
            className="rounded-2xl border bg-card p-6 sm:p-8 shadow-lg space-y-5 animate-in fade-in-50 duration-200"
          >
            {/* Summary preview of Step 1 */}
            <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-3.5 py-2.5 text-xs">
              <div className="truncate">
                <span className="font-bold text-foreground">{fullName || "Farmer"}</span>
                <span className="text-muted-foreground"> · Age {age} · {district}, {state} · {annualIncome ? `₹${Number(annualIncome).toLocaleString("en-IN")}` : ""}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline ml-2 shrink-0 cursor-pointer"
              >
                <Edit2 className="size-3" />
                Edit
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-b pb-3 mb-1">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Passwords are cryptographically hashed and never stored in plain text.</span>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground flex items-center gap-1">
                  <Smartphone className="size-4" />
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="h-11 w-full rounded-xl border bg-background/80 pl-16 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-wider shadow-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">This mobile number will be your login username.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Create Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="h-11 w-full rounded-xl border bg-background/80 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-destructive mt-1 font-medium">Passwords do not match.</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-[11px] text-success mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Passwords match!
                </p>
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 px-4 font-semibold gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 font-bold gap-2 text-base shadow-sm"
              >
                {submitting ? (
                  "Creating Account..."
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Sign In Link */}
        <div className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t text-center text-xs text-muted-foreground bg-card/40">
        Scheme Connect · AI-Powered Farmer Scheme Assistant · Designed for Indian Cultivators
      </footer>
    </div>
  );
}
