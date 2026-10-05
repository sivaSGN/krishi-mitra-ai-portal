import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import { SchemeCard } from "@/components/krishi/scheme-card";
import { Button } from "@/components/ui/button";
import { schemes } from "@/data/schemes";
import { useApp, t } from "@/context/app-context";
import { getLocalizedScheme } from "@/i18n/scheme-translations";

const categories = [
  "All categories",
  "Financial Assistance",
  "Crop Insurance",
  "Loans",
  "Irrigation",
  "Equipment Subsidy",
  "Solar Energy",
  "Seeds & Fertilizers",
  "Women Farmers",
  "Small Farmers",
];

const selectClass =
  "mb-4 mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring";

export function SchemesPage() {
  const { language } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "All categories");
  const [state, setState] = useState("All India");
  const [farmerType, setFarmerType] = useState("All farmers");
  const [benefitType, setBenefitType] = useState("All benefits");
  const [eligibility, setEligibility] = useState("All eligibility");
  const [deadline, setDeadline] = useState("Any deadline");
  const [sort, setSort] = useState("Best match");
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(6);

  const filtered = useMemo(
    () =>
      schemes
        .filter((scheme) => {
          const loc = getLocalizedScheme(scheme, language);
          const text =
            `${loc.name} ${loc.shortName} ${loc.description} ${loc.department} ${loc.benefit} ${scheme.name} ${scheme.shortName}`.toLowerCase();
          const farmerMatch =
            farmerType === "All farmers" ||
            (farmerType === "Small & marginal" &&
              scheme.eligibility.some((item) => /small|marginal|cultivator|farmer/i.test(item))) ||
            (farmerType === "Women farmers" && scheme.category === "Women Farmers") ||
            (farmerType === "Farmer groups" &&
              scheme.eligibility.some((item) => /group|FPO|PACS/i.test(item)));
          const benefitMatch =
            benefitType === "All benefits" ||
            (benefitType === "Cash support" && /₹|income support/i.test(scheme.benefit)) ||
            (benefitType === "Subsidy" && /subsidy|assistance/i.test(scheme.benefit)) ||
            (benefitType === "Credit & insurance" &&
              /credit|insurance|protection|interest/i.test(scheme.benefit));
          const eligibilityMatch =
            eligibility === "All eligibility" ||
            (eligibility === "Strong match" && scheme.matchScore >= 85) ||
            (eligibility === "Good match" && scheme.matchScore >= 75 && scheme.matchScore < 85) ||
            (eligibility === "Explore" && scheme.matchScore < 75);
          const deadlineMatch =
            deadline === "Any deadline" ||
            (deadline === "Open now" && scheme.status === "Open") ||
            deadline === scheme.status;
          return (
            text.includes(query.toLowerCase()) &&
            (category === categories[0] || scheme.category === category) &&
            (state === "All India" || scheme.state === state || scheme.state === "All India") &&
            farmerMatch &&
            benefitMatch &&
            eligibilityMatch &&
            deadlineMatch
          );
        })
        .sort((a, b) =>
          sort === "Best match"
            ? b.matchScore - a.matchScore
            : sort === "Deadline soon"
              ? a.status === "Closing soon"
                ? -1
                : 1
              : a.name.localeCompare(b.name),
        ),
    [query, category, state, farmerType, benefitType, eligibility, deadline, sort, language],
  );

  const clearFilters = () => {
    setQuery("");
    setCategory(categories[0] ?? "All categories");
    setState("All India");
    setFarmerType("All farmers");
    setBenefitType("All benefits");
    setEligibility("All eligibility");
    setDeadline("Any deadline");
    setLimit(6);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <PageHeader
          title={t(language, "Find Government Schemes")}
          description={t(language, "find_schemes_desc")}
          actions={
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              aria-controls="scheme-filters"
            >
              <Filter />
              {t(language, "Filters")}
            </Button>
          }
        />
        <div className="mb-5 flex gap-3">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              aria-label={t(language, "Find Schemes")}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(6);
              }}
              placeholder={t(language, "search_placeholder")}
              className="h-12 w-full rounded-lg border bg-card pl-12 pr-12 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-0.5 top-1/2 min-h-11 min-w-11 -translate-y-1/2 text-muted-foreground"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside
            id="scheme-filters"
            aria-label="Scheme filters"
            className={`${showFilters ? "block " : "hidden "}h-fit rounded-lg border bg-card p-4 shadow-sm md:block`}
          >
            <div className="mb-4 flex items-center gap-2 font-bold">
              <SlidersHorizontal className="size-4" />
              {t(language, "Filters")}
            </div>
            <FilterSelect
              label={t(language, "Category")}
              value={category}
              onChange={setCategory}
              options={categories}
            />
            <FilterSelect
              label={t(language, "State")}
              value={state}
              onChange={setState}
              options={["All India", "Telangana"]}
            />
            <FilterSelect
              label={t(language, "Farmer Type")}
              value={farmerType}
              onChange={setFarmerType}
              options={["All farmers", "Small & marginal", "Women farmers", "Farmer groups"]}
            />
            <FilterSelect
              label={t(language, "Benefit Type")}
              value={benefitType}
              onChange={setBenefitType}
              options={["All benefits", "Cash support", "Subsidy", "Credit & insurance"]}
            />
            <FilterSelect
              label={t(language, "Eligibility")}
              value={eligibility}
              onChange={setEligibility}
              options={["All eligibility", "Strong match", "Good match", "Explore"]}
            />
            <FilterSelect
              label={t(language, "Deadline")}
              value={deadline}
              onChange={setDeadline}
              options={["Any deadline", "Open now", "Closing soon", "Year-round"]}
            />
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              {t(language, "Clear all")}
            </Button>
          </aside>
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                <b className="text-foreground">{filtered.length}</b> {t(language, "schemes_found")}
              </p>
              <select
                aria-label="Sort schemes"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Best match">{t(language, "Best match")}</option>
                <option value="Deadline soon">{t(language, "Deadline soon")}</option>
                <option value="Name A–Z">{t(language, "Name A–Z")}</option>
              </select>
            </div>
            {filtered.length ? (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {filtered.slice(0, limit).map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center rounded-lg border border-dashed">
                <div className="text-center">
                  <Search className="mx-auto size-10 text-muted-foreground" />
                  <h3 className="mt-3 font-bold">{t(language, "No schemes found")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(language, "no_schemes_tip")}
                  </p>
                </div>
              </div>
            )}
            {limit < filtered.length && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => setLimit((value) => value + 6)}>
                  {t(language, "Load more schemes")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const { language } = useApp();
  return (
    <label className="block text-xs font-bold uppercase">
      {label}
      <select
        aria-label={`Filter by ${label.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {t(language, option)}
          </option>
        ))}
      </select>
    </label>
  );
}
