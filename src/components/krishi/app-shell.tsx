import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Bookmark,
  ChevronDown,
  CircleHelp,
  FileCheck2,
  Languages,
  LayoutDashboard,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Sprout,
  Sun,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp, t } from "@/context/app-context";
import type { Language } from "@/types/app";
import { cn } from "@/lib/utils";
const nav = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/assistant", "AI Assistant", Bot],
  ["/schemes", "Find Schemes", Search],
  ["/eligibility", "Eligibility Checker", FileCheck2],
  ["/recommended", "Recommended for You", WandSparkles],
  ["/saved", "Saved Schemes", Bookmark],
  ["/notifications", "Notifications", Bell],
  ["/profile", "My Profile", UserRound],
  ["/help", "Help & Support", CircleHelp],
] as const;
const langs: { code: Language; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "te", label: "తెలుగు", short: "TE" },
  { code: "ta", label: "தமிழ்", short: "TA" },
  { code: "hi", label: "हिन्दी", short: "HI" },
];
export function Brand() {
  const { language } = useApp();
  return (
    <Link to="/dashboard" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Sprout className="size-6" />
      </span>
      <span>
        <b className="block font-display text-[17px] leading-tight">{t(language, "brand_title")}</b>
        <small className="text-[10px] font-semibold uppercase text-muted-foreground">
          {t(language, "brand_subtitle")}
        </small>
      </span>
    </Link>
  );
}
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useApp();
  const current = langs.find((x) => x.code === language) ?? langs[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          aria-label="Change language"
          className={compact ? "min-h-11 min-w-11" : "min-h-11"}
        >
          <Languages />
          {!compact && (
            <>
              <span>{current.label}</span>
              <ChevronDown className="size-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {langs.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={cn(language === l.code && "bg-secondary")}
          >
            <span className="w-7 text-xs font-bold text-primary">{l.short}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="min-h-11 min-w-11"
    >
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}
function SidebarContent() {
  const { language, profile, setSidebarOpen, notifications, isAuthenticated, logout } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between border-b px-5">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
          className="lg:hidden min-h-11 min-w-11"
        >
          <X />
        </Button>
      </div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {nav.map(([to, label, Icon]) => {
          const active = pathname === to || (to === "/schemes" && pathname.startsWith("/schemes/"));
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{t(language, label)}</span>
              {label === "Notifications" && notifications.some((n) => !n.read) && (
                <span
                  className="ml-auto size-2 rounded-full bg-warning"
                  aria-label="Unread notifications"
                />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-2 py-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        {isAuthenticated ? (
          <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/80 transition group">
            <Link
              to="/profile"
              aria-label={`${t(language, "My Profile")}: ${profile.name}`}
              className="flex min-w-0 flex-1 items-center gap-3 outline-none"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                {profile.name.split(" ").map(n=>n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{profile.name}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.farmerType}</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                void navigate({ to: "/login" });
              }}
              title={t(language, "Logout")}
              aria-label={t(language, "Logout")}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : (
          <Button asChild className="w-full justify-center gap-2 font-bold" size="sm">
            <Link to="/login">
              <LogIn className="size-4" />
              {t(language, "Sign in to Portal")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, notifications, profile, isAuthenticated, logout, language } = useApp();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("scheme-search") ?? "").trim();
    void navigate({ to: "/schemes", search: query ? { q: query } : (undefined as never) });
  };
  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        {t(language, "skip_to_content")}
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-card lg:block">
        <SidebarContent />
      </aside>
      {sidebarOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") setSidebarOpen(false);
            }}
            className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-72 bg-card shadow-2xl lg:hidden"
          >
            <SidebarContent />
          </aside>
        </>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden min-h-11 min-w-11"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
          >
            <Menu />
          </Button>
          <form onSubmit={submitSearch} className="relative hidden max-w-xl flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="scheme-search"
              aria-label={t(language, "Find Schemes")}
              placeholder={t(language, "search_placeholder")}
              className="h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector compact />
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" className="relative min-h-11 min-w-11">
              <Link
                to="/notifications"
                aria-label={unread > 0 ? `${t(language, "Notifications")}, ${unread}` : t(language, "Notifications")}
              >
                <Bell aria-hidden="true" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            </Button>

            {/* Profile / Auth Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="min-h-11 gap-2 px-2 md:px-3">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {profile.name.split(" ").map(n=>n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden md:inline font-semibold">{profile.name.split(" ")[0]}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-sm font-bold leading-none">{profile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{profile.district}, {profile.state}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {profile.farmerType}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer font-medium">
                    <UserRound className="size-4 text-primary" />
                    <span>{t(language, "My Profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/saved" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Bookmark className="size-4 text-primary" />
                    <span>{t(language, "Saved Schemes")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/help" className="flex items-center gap-2 cursor-pointer font-medium">
                    <CircleHelp className="size-4 text-primary" />
                    <span>{t(language, "Help & Support")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAuthenticated ? (
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      void navigate({ to: "/login" });
                    }}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-semibold gap-2"
                  >
                    <LogOut className="size-4" />
                    <span>{t(language, "Logout")}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      void navigate({ to: "/login" });
                    }}
                    className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer font-semibold gap-2"
                  >
                    <LogIn className="size-4" />
                    <span>{t(language, "Login")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="outline-none page-enter min-h-[calc(100vh-4rem)] p-4 md:p-6 xl:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-primary">
          <Leaf className="size-4" />
          Scheme Connect
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
      {actions}
    </div>
  );
}
