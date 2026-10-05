import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileCheck2,
  Pencil,
  Save,
  UserRound,
  LogOut,
  Smartphone,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, t } from "@/context/app-context";
import type { FarmerProfile } from "@/types/app";
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

const groups: {
  key: string;
  labelKey: string;
  fields: { key: keyof FarmerProfile; labelKey: string }[];
}[] = [
  {
    key: "personal",
    labelKey: "Personal Information",
    fields: [
      { key: "name", labelKey: "Full name" },
      { key: "age", labelKey: "Age" },
      { key: "gender", labelKey: "Gender" },
      { key: "state", labelKey: "State" },
      { key: "district", labelKey: "District" },
    ],
  },
  {
    key: "farming",
    labelKey: "Farming Information",
    fields: [
      { key: "farmerType", labelKey: "Farmer type" },
      { key: "crop", labelKey: "Primary crop" },
      { key: "experience", labelKey: "Experience" },
      { key: "irrigation", labelKey: "Irrigation" },
    ],
  },
  {
    key: "land",
    labelKey: "Land Information",
    fields: [
      { key: "ownership", labelKey: "Ownership" },
      { key: "landSize", labelKey: "Land size" },
      { key: "landLocation", labelKey: "Land location" },
      { key: "income", labelKey: "Annual income" },
    ],
  },
];

export function ProfilePage() {
  const { profile, updateProfile, logout, isAuthenticated, language } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);

  const change = (key: keyof FarmerProfile, value: string) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
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
              <Button
                onClick={() => {
                  if (editing) updateProfile(draft);
                  setEditing((v) => !v);
                }}
              >
                {editing ? <Save className="size-4" /> : <Pencil className="size-4" />}
                {editing ? t(language, "Save Profile") : t(language, "Edit Profile")}
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
        <section className="mb-6 flex flex-col items-center justify-between gap-5 rounded-xl border bg-card p-6 shadow-sm sm:flex-row">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="grid size-20 place-items-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground shadow-sm">
              {getInitials(profile.name)}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  {isAuthenticated ? t(language, "Active Session") : t(language, "Guest Mode")}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5">
                {profile.farmerType} · {profile.district}, {profile.state}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {t(language, "Farmer ID")}: SCH-2026-9824
                </span>
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                  {t(language, "Profile 92% complete")}
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

        {/* Profile Tabs */}
        <Tabs defaultValue="personal">
          <TabsList className="h-auto w-full justify-start overflow-x-auto p-1 bg-muted/60">
            {groups.map((g) => (
              <TabsTrigger key={g.key} value={g.key} className="py-2">
                {t(language, g.labelKey)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="documents" className="py-2">
              {t(language, "Documents_tab")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="py-2">
              {t(language, "Preferences_tab")}
            </TabsTrigger>
            <TabsTrigger value="account" className="py-2 text-destructive font-semibold">
              {t(language, "Account_tab")}
            </TabsTrigger>
          </TabsList>

          {groups.map((g) => (
            <TabsContent
              key={g.key}
              value={g.key}
              className="mt-4 rounded-xl border bg-card p-6 shadow-sm"
            >
              <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
                <UserRound className="text-primary" />
                {t(language, g.labelKey)}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {g.fields.map((f) => (
                  <label key={f.key} className="text-sm font-semibold">
                    {t(language, f.labelKey)}
                    <input
                      disabled={!editing}
                      value={String(draft[f.key])}
                      onChange={(e) => change(f.key, e.target.value)}
                      className="mt-2 h-11 w-full rounded-md border bg-background px-3 font-normal disabled:bg-muted disabled:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                ))}
              </div>
            </TabsContent>
          ))}

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4 rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold">{t(language, "Document Availability")}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {t(language, "doc_availability_desc")}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Aadhaar Card", profile.aadhaar],
                ["Bank Account (Direct DBT)", profile.bank],
                ["Land Ownership Document", profile.landDocument],
              ].map(([x, ok]) => (
                <div key={String(x)} className="rounded-lg border p-4 bg-muted/20">
                  <span className="text-sm font-bold block">{t(language, String(x))}</span>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${
                      ok ? "text-success" : "text-destructive"
                    }`}
                  >
                    <span className={`size-2 rounded-full ${ok ? "bg-success" : "bg-destructive"}`} />
                    {ok ? t(language, "Verified & Available") : t(language, "Not Added")}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-4 rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold">{t(language, "Communication Preferences")}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {t(language, "pref_desc")}
            </p>
            <div className="space-y-3">
              {[
                "pref_1",
                "pref_2",
                "pref_3",
                "pref_4",
              ].map((k) => (
                <label
                  key={k}
                  className="flex items-center justify-between rounded-lg bg-muted p-4 text-sm font-semibold cursor-pointer hover:bg-muted/80 transition"
                >
                  {t(language, k)}
                  <input type="checkbox" defaultChecked className="size-4 accent-primary" />
                </label>
              ))}
            </div>
          </TabsContent>

          {/* Account & Logout Tab */}
          <TabsContent value="account" className="mt-4 rounded-xl border bg-card p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold">{t(language, "Account Session & Security")}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t(language, "account_desc")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4 bg-muted/20 flex items-start gap-3">
                <Smartphone className="size-5 text-primary mt-0.5" />
                <div>
                  <b className="block text-sm">{t(language, "Registered Mobile")}</b>
                  <span className="text-xs text-muted-foreground">+91 98765 43210 (Linked)</span>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/20 flex items-start gap-3">
                <Calendar className="size-5 text-primary mt-0.5" />
                <div>
                  <b className="block text-sm">{t(language, "Last Active")}</b>
                  <span className="text-xs text-muted-foreground">Today · Browser Session Active</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <b className="block text-sm font-bold text-destructive">
                    {t(language, "Sign Out of Scheme Connect")}
                  </b>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(language, "logout_desc")}
                  </p>
                  <div className="pt-3">
                    <Button variant="destructive" onClick={handleLogout} className="gap-2">
                      <LogOut className="size-4" />
                      {t(language, "Log Out Now")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
