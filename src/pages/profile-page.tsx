import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileCheck2,
  Save,
  UserRound,
  LogOut,
  Smartphone,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Sprout,
  MapPin,
  Layers,
  Droplets,
  Calendar,
  Landmark,
  BadgeCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, t } from "@/context/app-context";
import type { FarmerProfile } from "@/types/app";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ---------------------------------------------------------------------------
// Farmer-friendly Options & Mapping Data
// ---------------------------------------------------------------------------

export const STATE_DISTRICTS: Record<string, string[]> = {
  "Telangana": [
    "Warangal", "Karimnagar", "Nalgonda", "Khammam", "Nizamabad", "Mahabubnagar",
    "Medak", "Adilabad", "Ranga Reddy", "Suryapet", "Siddipet", "Jangaon", "Yadadri Bhuvanagiri"
  ],
  "Andhra Pradesh": [
    "Guntur", "Krishna", "Kurnool", "East Godavari", "West Godavari", "Prakasam",
    "Anantapur", "Chittoor", "Visakhapatnam", "YSR Kadapa", "SPS Nellore", "Srikakulam", "Vizianagaram"
  ],
  "Maharashtra": [
    "Pune", "Nashik", "Ahmednagar", "Solapur", "Kolhapur", "Aurangabad", "Nagpur",
    "Amravati", "Jalgaon", "Satara", "Sangli", "Latur", "Yavatmal", "Nanded"
  ],
  "Karnataka": [
    "Belagavi", "Mysuru", "Mandya", "Shivamogga", "Hassan", "Tumakuru", "Ballari",
    "Vijayapura", "Davanagere", "Kalaburagi", "Dharwad", "Raichur"
  ],
  "Tamil Nadu": [
    "Thanjavur", "Madurai", "Coimbatore", "Tiruchirappalli", "Salem", "Erode",
    "Tirunelveli", "Cuddalore", "Dindigul", "Vellore", "Villupuram", "Theni"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Sangrur",
    "Firozpur", "Hoshiarpur", "Gurdaspur", "Moga", "Faridkot", "Muktsar"
  ],
  "Haryana": [
    "Karnal", "Hisar", "Ambala", "Rohtak", "Sirsa", "Kurukshetra",
    "Panipat", "Sonipat", "Jind", "Yamunanagar", "Fatehabad"
  ],
  "Uttar Pradesh": [
    "Varanasi", "Lucknow", "Prayagraj", "Gorakhpur", "Kanpur", "Bareilly",
    "Meerut", "Agra", "Aligarh", "Moradabad", "Ayodhya", "Jhansi", "Muzaffarnagar"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Ujjain", "Jabalpur", "Gwalior", "Sagar",
    "Dewas", "Hoshangabad", "Sehore", "Dhar", "Khargone", "Chhindwara"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Sri Ganganagar", "Alwar",
    "Udaipur", "Bharatpur", "Hanumangarh", "Nagaur", "Barmer", "Chittorgarh"
  ],
  "Gujarat": [
    "Ahmedabad", "Rajkot", "Surat", "Vadodara", "Anand", "Junagadh",
    "Mehsana", "Bhavnagar", "Banaskantha", "Kheda", "Amreli", "Patan"
  ],
  "Bihar": [
    "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia",
    "Rohtas", "Samastipur", "Begusarai", "Nalanda", "Vaishali"
  ],
  "West Bengal": [
    "Purba Bardhaman", "Nadia", "Hooghly", "Murshidabad", "Paschim Medinipur",
    "Malda", "North 24 Parganas", "South 24 Parganas", "Bankura"
  ],
  "Odisha": [
    "Cuttack", "Sambalpur", "Balasore", "Ganjam", "Puri", "Bargarh",
    "Bhadrak", "Mayurbhanj", "Bolangir", "Kalahandi"
  ],
  "Kerala": [
    "Palakkad", "Wayanad", "Idukki", "Alappuzha", "Thrissur", "Kottayam",
    "Kozhikode", "Kannur", "Kollam", "Malappuram"
  ],
  "Assam": ["Kamrup", "Nagaon", "Sonitpur", "Barpeta", "Dhubri", "Dibrugarh"],
  "Chhattisgarh": ["Raipur", "Durg", "Bilaspur", "Rajnandgaon", "Janjgir-Champa"],
  "Jharkhand": ["Ranchi", "Dhanbad", "Giridih", "East Singhbhum", "Bokaro"],
  "Himachal Pradesh": ["Kangra", "Mandi", "Shimla", "Solan", "Sirmaur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Udham Singh Nagar", "Nainital"],
};

export const AGE_OPTIONS = [
  { value: "20", label: "20 years (Young Farmer)" },
  { value: "22", label: "22 years" },
  { value: "25", label: "25 years" },
  { value: "28", label: "28 years" },
  { value: "30", label: "30 years" },
  { value: "32", label: "32 years" },
  { value: "35", label: "35 years" },
  { value: "38", label: "38 years" },
  { value: "40", label: "40 years" },
  { value: "42", label: "42 years" },
  { value: "45", label: "45 years" },
  { value: "46", label: "46 years" },
  { value: "48", label: "48 years" },
  { value: "50", label: "50 years" },
  { value: "52", label: "52 years" },
  { value: "55", label: "55 years" },
  { value: "58", label: "58 years" },
  { value: "60", label: "60 years" },
  { value: "65", label: "65+ years (Senior Farmer)" },
];

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male (पुरुष / పురుషుడు)" },
  { value: "Female", label: "Female (महिला / మహిళ)" },
  { value: "Other", label: "Other" },
];

export const FARMER_TYPE_OPTIONS = [
  { value: "Small Farmer", label: "Small Farmer (1 - 2 hectares / 2.5 - 5 acres)" },
  { value: "Marginal Farmer", label: "Marginal Farmer (< 1 hectare / up to 2.5 acres)" },
  { value: "Semi-Medium Farmer", label: "Semi-Medium Farmer (2 - 4 hectares / 5 - 10 acres)" },
  { value: "Medium Farmer", label: "Medium Farmer (4 - 10 hectares / 10 - 25 acres)" },
  { value: "Large Farmer", label: "Large Farmer (> 10 hectares / > 25 acres)" },
  { value: "Tenant Farmer", label: "Tenant Farmer / Sharecropper (Bataidar / Kaulu)" },
  { value: "Women Farmer", label: "Women Farmer (Mahila Kisan / SHG Member)" },
  { value: "Organic Farmer", label: "Organic / Natural Farming Practitioner" },
];

export const CROP_OPTIONS = [
  { value: "Paddy & Cotton", label: "Paddy & Cotton (వరి & పత్తి / धान और कपास)" },
  { value: "Paddy / Rice", label: "Paddy / Rice (धान / వరి)" },
  { value: "Cotton", label: "Cotton (कपास / పత్తి)" },
  { value: "Wheat", label: "Wheat (गेहूं / గోధుమ)" },
  { value: "Wheat & Mustard", label: "Wheat & Mustard (गेहूं और सरसों)" },
  { value: "Chilli & Spices", label: "Chilli & Spices (मिर्च और मसाले / మిరప)" },
  { value: "Maize / Corn", label: "Maize / Corn (मक्का / మొక్కజొన్న)" },
  { value: "Sugarcane", label: "Sugarcane (गन्ना / చెరకు)" },
  { value: "Soybean", label: "Soybean (सोयाबीन)" },
  { value: "Pulses & Grams", label: "Pulses & Grams (Red gram, Bengal gram / పప్పులు)" },
  { value: "Groundnut & Oilseeds", label: "Groundnut & Oilseeds (मूंगफली / వేరుశెనగ)" },
  { value: "Millets", label: "Millets (Jowar, Bajra, Ragi / చిరుధాన్యాలు)" },
  { value: "Vegetables", label: "Vegetables (Tomato, Onion, Potato / కూరగాయలు)" },
  { value: "Horticulture", label: "Fruits & Horticulture (Mango, Banana, Citrus)" },
  { value: "Mixed Crops", label: "Mixed / Multi-crop Farming" },
];

export const EXPERIENCE_OPTIONS = [
  { value: "1-3 years", label: "1 - 3 years (Beginner Farmer)" },
  { value: "4-7 years", label: "4 - 7 years (Growing Experience)" },
  { value: "8-12 years", label: "8 - 12 years (Experienced)" },
  { value: "15 years", label: "15 years" },
  { value: "18 years", label: "18 years" },
  { value: "13-20 years", label: "13 - 20 years (Well Experienced)" },
  { value: "20+ years", label: "20+ years (Master Farmer / Generations)" },
];

export const IRRIGATION_OPTIONS = [
  { value: "Borewell", label: "Borewell / Tubewell (बोरवेल / బోరుబావి)" },
  { value: "Canal / River Irrigation", label: "Canal / River Irrigation (नहर / కాలువ నీరు)" },
  { value: "Drip Irrigation", label: "Drip Irrigation (Micro-irrigation / డ్రిప్)" },
  { value: "Sprinkler System", label: "Sprinkler Irrigation System (स्प्रिंकलर)" },
  { value: "Rainfed / Dryland", label: "Rainfed / Dryland (Monsoon Dependent / వర్షాధారం)" },
  { value: "Open Well / Farm Pond", label: "Open Well / Farm Pond (खुला कुआं / బావి)" },
  { value: "Tank / Lift Irrigation", label: "Tank / Lift Irrigation (लिफ्ट सिंचाई)" },
];

export const OWNERSHIP_OPTIONS = [
  { value: "Owned", label: "Owned (Pattadar / Self Title / స్వంత భూమి)" },
  { value: "Ancestral / Family Owned", label: "Ancestral / Joint Family Land (పూర్వీకుల భూమి)" },
  { value: "Leased / Rented", label: "Leased / Rented (Kaulu Raithu / पट्टे पर)" },
  { value: "Sharecropper / Tenant", label: "Sharecropper / Tenant (Bataidar / కౌలుదారు)" },
  { value: "Government Patta / Assigned", label: "Government Patta / Assigned Land" },
];

export const LAND_SIZE_OPTIONS = [
  { value: "Less than 1 acre", label: "Less than 1 acre (< 1 acre)" },
  { value: "1.0 - 2.5 acres", label: "1.0 - 2.5 acres (Marginal Farmer)" },
  { value: "2.5 - 3.5 acres", label: "2.5 - 3.5 acres" },
  { value: "3.5 acres", label: "3.5 acres" },
  { value: "3.5 - 5.0 acres", label: "3.5 - 5.0 acres (Small Farmer)" },
  { value: "5.0 - 10.0 acres", label: "5.0 - 10.0 acres (Semi-Medium)" },
  { value: "10.0 - 20.0 acres", label: "10.0 - 20.0 acres (Medium Farmer)" },
  { value: "More than 20 acres", label: "More than 20 acres (Large Farmer)" },
  { value: "Landless / Farm Worker", label: "Landless / Agricultural Laborer" },
];

export const LAND_LOCATION_OPTIONS = [
  { value: "Warangal Rural", label: "Warangal Rural" },
  { value: "Village / Rural Agriculture Belt", label: "Village / Rural Agricultural Belt" },
  { value: "Near Canal / River Basin", label: "Near Canal / River Command Basin" },
  { value: "Dryland / Rainfed Zone", label: "Dryland / Rainfed Zone" },
  { value: "Hill / Valley / Lowland Area", label: "Hill / Valley / Lowland Area" },
  { value: "Forest Fringe / Tribal Region", label: "Forest Fringe / Tribal Region" },
  { value: "Peri-Urban / City Outskirts", label: "Peri-Urban / City Outskirts" },
];

export const INCOME_OPTIONS = [
  { value: "Below ₹50,000", label: "Below ₹50,000" },
  { value: "₹50,000 - ₹1,00,000", label: "₹50,000 - ₹1,00,000" },
  { value: "₹1,00,000 - ₹1,80,000", label: "₹1,00,000 - ₹1,80,000" },
  { value: "₹1,80,000", label: "₹1,80,000" },
  { value: "₹1,80,000 - ₹2,50,000", label: "₹1,80,000 - ₹2,50,000" },
  { value: "₹2,50,000 - ₹4,00,000", label: "₹2,50,000 - ₹4,00,000" },
  { value: "₹4,00,000 - ₹6,00,000", label: "₹4,00,000 - ₹6,00,000" },
  { value: "Above ₹6,00,000", label: "Above ₹6,00,000" },
];

// Helper Component for Farmer Select Dropdown
function ProfileSelectField({
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
  icon?: React.ComponentType<{ className?: string }>;
  helperText?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-primary" />}
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-xl border-2 border-border bg-background px-3.5 pr-10 text-sm font-semibold text-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer"
        >
          <option value="">{`-- Select ${label} --`}</option>
          {!options.some((o) => o.value === value) && value && (
            <option value={value}>{value}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {helperText && <span className="text-[11px] text-muted-foreground">{helperText}</span>}
    </div>
  );
}

export function ProfilePage() {
  const { profile, updateProfile, logout, isAuthenticated, language } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(profile);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const change = (key: keyof FarmerProfile, value: unknown) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      // When state changes, auto-select first valid district of that state
      if (key === "state" && typeof value === "string" && STATE_DISTRICTS[value]) {
        const available = STATE_DISTRICTS[value];
        if (!available.includes(next.district)) {
          next.district = available[0] || "";
        }
      }
      return next;
    });
  };

  const handleNextTab = (targetTab: string) => {
    updateProfile(draft);
    setActiveTab(targetTab);
    toast.success("Details saved! Moving to next section.");
  };

  const handleSaveProfile = () => {
    updateProfile(draft);
    toast.success("Farmer profile successfully updated in database!");
  };

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  const getInitials = (name: string) => {
    return (name || "Farmer")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const availableDistricts = STATE_DISTRICTS[draft.state] || [draft.district || "Warangal"];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl pb-12">
        <PageHeader
          title={t(language, "Farmer Profile")}
          description={t(language, "profile_page_desc")}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/eligibility">
                  <FileCheck2 className="size-4" />
                  {t(language, "Run Eligibility Check")}
                </Link>
              </Button>
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="size-4" />
                {t(language, "Save Profile")}
              </Button>

              {/* Logout Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <LogOut className="size-4" />
                    {t(language, "Logout")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t(language, "Are you sure you want to log out?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(language, "logout_dialog_desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t(language, "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t(language, "Log Out Now")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          }
        />

        {/* Profile Summary Card */}
        <section className="mb-6 flex flex-col items-center justify-between gap-5 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="grid size-20 place-items-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-sm">
              {getInitials(draft.name)}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold">{draft.name || "Farmer"}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  {isAuthenticated ? t(language, "Active Session") : t(language, "Guest Mode")}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5">
                {[draft.farmerType, draft.crop, draft.district, draft.state].filter(Boolean).join(" · ") || "Farming details incomplete"}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {t(language, "Farmer ID")}: SCH-2026-9824
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                  <BadgeCheck className="size-3.5" />
                  Database Synchronized
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <LogOut className="size-4" />
            {t(language, "Sign Out")}
          </Button>
        </section>

        {/* Profile Tabs Navigation with Step Indication */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto p-1.5 bg-muted/60 rounded-xl gap-1">
            <TabsTrigger value="personal" className="py-2.5 px-4 font-bold flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-xs text-primary">1</span>
              {t(language, "Personal Information")}
            </TabsTrigger>
            <TabsTrigger value="farming" className="py-2.5 px-4 font-bold flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-xs text-primary">2</span>
              {t(language, "Farming Information")}
            </TabsTrigger>
            <TabsTrigger value="land" className="py-2.5 px-4 font-bold flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-xs text-primary">3</span>
              {t(language, "Land Information")}
            </TabsTrigger>
            <TabsTrigger value="documents" className="py-2.5 px-4 font-bold flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary/20 text-xs text-primary">4</span>
              {t(language, "Documents_tab")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="py-2.5 px-4 font-bold">
              {t(language, "Preferences_tab")}
            </TabsTrigger>
            <TabsTrigger value="account" className="py-2.5 px-4 text-destructive font-semibold">
              {t(language, "Account_tab")}
            </TabsTrigger>
          </TabsList>

          {/* --------------------------------------------------------------- */}
          {/* 1. PERSONAL INFORMATION TAB                                     */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="personal" className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <UserRound className="size-5 text-primary" />
                  {t(language, "Personal Information")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your basic profile details using the dropdown menus below.
                </p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Step 1 of 4
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserRound className="size-3.5 text-primary" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => change("name", e.target.value)}
                  placeholder="Enter full name"
                  className="h-12 w-full rounded-xl border-2 border-border bg-background px-3.5 text-sm font-semibold text-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <span className="text-[11px] text-muted-foreground">Name as registered in Aadhaar / Land record</span>
              </div>

              {/* Age Dropdown */}
              <ProfileSelectField
                label="Age"
                value={draft.age}
                options={AGE_OPTIONS}
                onChange={(val) => change("age", val)}
                icon={Calendar}
                helperText="Select farmer age in completed years"
              />

              {/* Gender Dropdown */}
              <ProfileSelectField
                label="Gender"
                value={draft.gender}
                options={GENDER_OPTIONS}
                onChange={(val) => change("gender", val)}
                icon={UserRound}
                helperText="Required for gender-targeted subsidies (e.g. Mahila Kisan schemes)"
              />

              {/* State Dropdown */}
              <ProfileSelectField
                label="State"
                value={draft.state}
                options={Object.keys(STATE_DISTRICTS).map((s) => ({ value: s, label: s }))}
                onChange={(val) => change("state", val)}
                icon={MapPin}
                helperText="Changing state will update the available district list"
              />

              {/* District Dropdown (Dynamic) */}
              <ProfileSelectField
                label="District"
                value={draft.district}
                options={availableDistricts.map((d) => ({ value: d, label: d }))}
                onChange={(val) => change("district", val)}
                icon={MapPin}
                helperText={`Districts belonging to ${draft.state}`}
              />
            </div>

            {/* Bottom Next Navigation Bar */}
            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Auto-saved to database on advance</span>
              <Button onClick={() => handleNextTab("farming")} className="gap-2 font-bold h-11 px-6">
                Next: Farming Information
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* 2. FARMING INFORMATION TAB                                      */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="farming" className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Sprout className="size-5 text-primary" />
                  {t(language, "Farming Information")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your farming type, major crops, and irrigation facilities from the options.
                </p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Step 2 of 4
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Farmer Type Dropdown */}
              <ProfileSelectField
                label="Farmer Type (Category)"
                value={draft.farmerType}
                options={FARMER_TYPE_OPTIONS}
                onChange={(val) => change("farmerType", val)}
                icon={UserRound}
                helperText="Based on official PM-KISAN / State landholding classification"
              />

              {/* Primary Crop Dropdown */}
              <ProfileSelectField
                label="Primary Crop"
                value={draft.crop}
                options={CROP_OPTIONS}
                onChange={(val) => change("crop", val)}
                icon={Sprout}
                helperText="Main cash or food crop cultivated in current agricultural season"
              />

              {/* Farming Experience Dropdown */}
              <ProfileSelectField
                label="Farming Experience"
                value={draft.experience}
                options={EXPERIENCE_OPTIONS}
                onChange={(val) => change("experience", val)}
                icon={Calendar}
                helperText="Total years of farming experience"
              />

              {/* Irrigation Source Dropdown */}
              <ProfileSelectField
                label="Irrigation Facility"
                value={draft.irrigation}
                options={IRRIGATION_OPTIONS}
                onChange={(val) => change("irrigation", val)}
                icon={Droplets}
                helperText="Primary source of water used for crop cultivation"
              />
            </div>

            {/* Bottom Navigation Bar */}
            <div className="pt-4 border-t flex items-center justify-between">
              <Button variant="outline" onClick={() => setActiveTab("personal")} className="gap-2 h-11">
                <ArrowLeft className="size-4" />
                Previous: Personal
              </Button>
              <Button onClick={() => handleNextTab("land")} className="gap-2 font-bold h-11 px-6">
                Next: Land Information
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* 3. LAND INFORMATION TAB                                         */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="land" className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Layers className="size-5 text-primary" />
                  {t(language, "Land Information")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your land holding size, ownership title, and income bracket.
                </p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Step 3 of 4
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Land Ownership Dropdown */}
              <ProfileSelectField
                label="Land Ownership Status"
                value={draft.ownership}
                options={OWNERSHIP_OPTIONS}
                onChange={(val) => change("ownership", val)}
                icon={Landmark}
                helperText="Legal ownership classification of agricultural land"
              />

              {/* Land Size Dropdown */}
              <ProfileSelectField
                label="Total Land Size (Acres)"
                value={draft.landSize}
                options={LAND_SIZE_OPTIONS}
                onChange={(val) => change("landSize", val)}
                icon={Layers}
                helperText="Critical parameter used to determine scheme subsidy eligibility"
              />

              {/* Land Location Dropdown */}
              <ProfileSelectField
                label="Land Location / Terrain"
                value={draft.landLocation}
                options={LAND_LOCATION_OPTIONS}
                onChange={(val) => change("landLocation", val)}
                icon={MapPin}
                helperText="Geographic landscape where farm land is situated"
              />

              {/* Annual Income Dropdown */}
              <ProfileSelectField
                label="Annual Household Income"
                value={draft.income}
                options={INCOME_OPTIONS}
                onChange={(val) => change("income", val)}
                icon={Landmark}
                helperText="Combined family income bracket from all sources"
              />
            </div>

            {/* Bottom Navigation Bar */}
            <div className="pt-4 border-t flex items-center justify-between">
              <Button variant="outline" onClick={() => setActiveTab("farming")} className="gap-2 h-11">
                <ArrowLeft className="size-4" />
                Previous: Farming
              </Button>
              <Button onClick={() => handleNextTab("documents")} className="gap-2 font-bold h-11 px-6">
                Next: Document Details
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* 4. DOCUMENTS TAB                                                */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="documents" className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <ShieldCheck className="size-5 text-primary" />
                  {t(language, "Document Availability")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select available government identity, banking, and land documents.
                </p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                Step 4 of 4
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Aadhaar Card Dropdown */}
              <div className="rounded-xl border p-4 bg-muted/20 flex flex-col justify-between gap-3">
                <div>
                  <b className="text-sm block">Aadhaar Card</b>
                  <p className="text-xs text-muted-foreground mt-0.5">Required for farmer biometric authentication & KYC</p>
                </div>
                <ProfileSelectField
                  label="Status"
                  value={draft.aadhaar ? "Available" : "Not Available"}
                  options={[
                    { value: "Available", label: "Available & Verified ✓" },
                    { value: "Not Available", label: "Not Available / Pending ✗" },
                  ]}
                  onChange={(val) => change("aadhaar", val === "Available")}
                />
              </div>

              {/* Bank Account Dropdown */}
              <div className="rounded-xl border p-4 bg-muted/20 flex flex-col justify-between gap-3">
                <div>
                  <b className="text-sm block">Direct DBT Bank Account</b>
                  <p className="text-xs text-muted-foreground mt-0.5">Active bank account seeded with Aadhaar for direct payments</p>
                </div>
                <ProfileSelectField
                  label="Status"
                  value={draft.bank ? "Available" : "Not Available"}
                  options={[
                    { value: "Available", label: "Linked Active DBT Account ✓" },
                    { value: "Not Available", label: "Not Linked / Pending ✗" },
                  ]}
                  onChange={(val) => change("bank", val === "Available")}
                />
              </div>

              {/* Land Ownership Document Dropdown */}
              <div className="rounded-xl border p-4 bg-muted/20 flex flex-col justify-between gap-3">
                <div>
                  <b className="text-sm block">Land Title / Passbook</b>
                  <p className="text-xs text-muted-foreground mt-0.5">Pattadar Passbook, 1B ROR, or Tenant lease agreement</p>
                </div>
                <ProfileSelectField
                  label="Status"
                  value={draft.landDocument ? "Available" : "Not Available"}
                  options={[
                    { value: "Available", label: "Passbook / Document Available ✓" },
                    { value: "Not Available", label: "Not Available / In Process ✗" },
                  ]}
                  onChange={(val) => change("landDocument", val === "Available")}
                />
              </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="pt-4 border-t flex items-center justify-between">
              <Button variant="outline" onClick={() => setActiveTab("land")} className="gap-2 h-11">
                <ArrowLeft className="size-4" />
                Previous: Land
              </Button>
              <Button onClick={handleSaveProfile} className="gap-2 font-bold h-11 px-8 bg-success hover:bg-success/90 text-white">
                <Check className="size-4" />
                Save & Complete Profile
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* 5. PREFERENCES TAB                                              */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="preferences" className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold">{t(language, "Communication Preferences")}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t(language, "pref_desc")}
              </p>
            </div>
            <div className="space-y-3">
              {[
                "pref_1",
                "pref_2",
                "pref_3",
                "pref_4",
              ].map((k) => (
                <label
                  key={k}
                  className="flex items-center justify-between rounded-xl bg-muted p-4 text-sm font-semibold cursor-pointer hover:bg-muted/80 transition"
                >
                  {t(language, k)}
                  <input type="checkbox" defaultChecked className="size-4 accent-primary" />
                </label>
              ))}
            </div>
            <div className="pt-4 border-t flex justify-end">
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="size-4" />
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* --------------------------------------------------------------- */}
          {/* 6. ACCOUNT TAB                                                  */}
          {/* --------------------------------------------------------------- */}
          <TabsContent value="account" className="mt-4 rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold">{t(language, "Account Session & Security")}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t(language, "account_desc")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4 bg-muted/20 flex items-start gap-3">
                <Smartphone className="size-5 text-primary mt-0.5" />
                <div>
                  <b className="block text-sm">{t(language, "Registered Mobile")}</b>
                  <span className="text-xs text-muted-foreground">+91 98765 43210 (Linked to SQLite DB)</span>
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-muted/20 flex items-start gap-3">
                <Calendar className="size-5 text-primary mt-0.5" />
                <div>
                  <b className="block text-sm">{t(language, "Account Active Since")}</b>
                  <span className="text-xs text-muted-foreground">Kharif Season 2026</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-destructive">{t(language, "End Farmer Session")}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign out from this device. All saved schemes and profile data remain securely in database.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="size-4" />
                {t(language, "Logout")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
