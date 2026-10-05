import { useState } from "react";
import { BookmarkCheck, BookmarkX, Trash2, Search, Filter } from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { SchemeCard } from "@/components/krishi/scheme-card";
import { Button } from "@/components/ui/button";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { Link } from "@tanstack/react-router";

export function SavedPage() {
  const { savedIds, saveAllSchemes, clearAllSaved, language } = useApp();
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("all");

  const saved = schemes.filter((s) => savedIds.includes(s.id));

  const filtered = saved.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortName.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.state.toLowerCase().includes(search.toLowerCase()) ||
      s.benefit.toLowerCase().includes(search.toLowerCase());

    const matchesState =
      selectedState === "all" || s.state.toLowerCase().includes(selectedState.toLowerCase());

    return matchesSearch && matchesState;
  });

  const handleSaveAll100 = () => {
    const allIds = schemes.map((s) => s.id);
    saveAllSchemes(allIds);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <PageHeader
          title={t(language, "Saved Schemes")}
          description={
            saved.length
              ? `${saved.length} of ${schemes.length} schemes saved to your profile and database.`
              : t(language, "saved_desc")
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {saved.length < schemes.length && (
                <Button
                  onClick={handleSaveAll100}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <BookmarkCheck className="mr-2 size-4" />
                  Save All 100 Schemes
                </Button>
              )}
              {saved.length > 0 && (
                <Button variant="outline" onClick={clearAllSaved} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 size-4" />
                  Clear All
                </Button>
              )}
            </div>
          }
        />

        {saved.length > 0 ? (
          <>
            {/* Filter and Search Bar for Saved Schemes */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-3.5 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search within saved schemes..."
                  className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All States ({saved.length})</option>
                  <option value="india">All India (Central)</option>
                  <option value="telangana">Telangana</option>
                  <option value="andhra">Andhra Pradesh</option>
                  <option value="tamil">Tamil Nadu</option>
                </select>
              </div>
            </div>

            {filtered.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((s) => (
                  <SchemeCard key={s.id} scheme={s} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <p>No saved schemes match your search or filter.</p>
                <Button variant="link" onClick={() => { setSearch(""); setSelectedState("all"); }}>
                  Reset filters
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="grid min-h-[55vh] place-items-center rounded-lg border border-dashed bg-card">
            <div className="max-w-md text-center p-6">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <BookmarkX className="size-8" />
              </span>
              <h2 className="mt-4 text-xl font-bold">{t(language, "No saved schemes yet")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(language, "no_saved_desc")}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={handleSaveAll100} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <BookmarkCheck className="mr-2 size-4" />
                  Save All 100 Schemes
                </Button>
                <Button asChild variant="outline">
                  <Link to="/schemes">{t(language, "Explore schemes")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
