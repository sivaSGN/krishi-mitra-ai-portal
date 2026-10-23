import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { defaultNotifications } from "@/data/schemes";
import type { AppNotification, FarmerProfile, Language } from "@/types/app";
import { translate } from "@/i18n/translations";
import {
  bulkSaveSchemesInDb,
  clearAllSavedSchemesInDb,
  getFarmerProfileFromDb,
  getSavedSchemesFromDb,
  toggleSavedSchemeInDb,
  upsertFarmerProfileInDb,
} from "@/services/farmer-db";
import { getLocalUsers, clearSession } from "@/services/auth-service";

// ---------------------------------------------------------------------------
// Empty profile for new/unknown users — NO real user data as defaults
// ---------------------------------------------------------------------------
const emptyProfile: FarmerProfile = {
  name: "",
  age: "",
  gender: "",
  state: "",
  district: "",
  farmerType: "",
  crop: "",
  experience: "",
  irrigation: "",
  ownership: "",
  landSize: "",
  landLocation: "",
  income: "",
  aadhaar: false,
  bank: false,
  landDocument: false,
};

// ---------------------------------------------------------------------------
// Per-user localStorage key helpers — ALL user data is scoped by mobile number
// ---------------------------------------------------------------------------
function userKey(mobile: string, suffix: string) {
  return `km-u-${mobile}-${suffix}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded — ignore silently
  }
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
type AppContextValue = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  language: Language;
  setLanguage: (v: Language) => void;
  savedIds: string[];
  toggleSaved: (id: string) => void;
  saveAllSchemes: (ids: string[]) => void;
  clearAllSaved: () => void;
  notifications: AppNotification[];
  markRead: (id?: string) => void;
  profile: FarmerProfile;
  updateProfile: (p: FarmerProfile) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isAuthenticated: boolean;
  userMobile: string;
  login: (identifier?: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export const t = (language: Language, key: string) => translate(language, key);

export function useTranslation() {
  const { language } = useApp();
  return {
    t: (key: string) => translate(language, key),
    language,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<Language>("en");
  // New users start with EMPTY saved list — never inherit hardcoded defaults
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  // New users start with an EMPTY profile — never inherit demo user data
  const [profile, setProfile] = useState<FarmerProfile>(emptyProfile);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // No default mobile — prevents cross-user data leakage
  const [userMobile, setUserMobile] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  // -------------------------------------------------------------------------
  // Hydrate from localStorage on mount — scope by authenticated user's mobile
  // -------------------------------------------------------------------------
  useEffect(() => {
    // 1. Restore global (non-user-specific) settings first
    const loadedTheme = readJson<"light" | "dark">("km-theme", "light");
    setTheme(loadedTheme);
    document.documentElement.classList.toggle("dark", loadedTheme === "dark");

    // 2. Check authentication state
    const isLoggedIn =
      readJson<boolean>("km-logged-in", false) && readJson<boolean>("km-auth", false);

    if (!isLoggedIn) {
      // Not logged in — stay in clean empty state, mark hydrated
      setIsAuthenticated(false);
      setHydrated(true);
      return;
    }

    const mobile = readJson<string>("km-user-mobile", "");
    if (!mobile) {
      setIsAuthenticated(false);
      setHydrated(true);
      return;
    }

    // 3. Authenticated — load ONLY this user's scoped data
    setIsAuthenticated(true);
    setUserMobile(mobile);

    const lang = readJson<Language>(userKey(mobile, "language"), "en");
    setLanguage(lang);
    document.documentElement.lang = lang;

    const savedSchemes = readJson<string[]>(userKey(mobile, "saved"), []);
    setSavedIds(savedSchemes);

    const storedProfile = readJson<FarmerProfile | null>(userKey(mobile, "profile"), null);
    if (storedProfile) {
      setProfile(storedProfile);
    }

    const storedNotifs = readJson<AppNotification[]>(
      userKey(mobile, "notifications"),
      defaultNotifications,
    );
    setNotifications(storedNotifs);

    setHydrated(true);

    // 4. Background sync from Supabase — overrides cache with fresh data
    void (async () => {
      const dbResult = await getFarmerProfileFromDb(mobile);
      if (dbResult?.profile) {
        setProfile(dbResult.profile);
        writeJson(userKey(mobile, "profile"), dbResult.profile);
      }
      const dbSaved = await getSavedSchemesFromDb(mobile);
      if (dbSaved && dbSaved.length > 0) {
        setSavedIds(dbSaved);
        writeJson(userKey(mobile, "saved"), dbSaved);
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Persist per-user scoped data whenever it changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    // Global settings (not user-specific)
    document.documentElement.classList.toggle("dark", theme === "dark");
    writeJson("km-theme", theme);

    if (!isAuthenticated || !userMobile) return;

    // Scoped to authenticated user only
    document.documentElement.lang = language;
    writeJson(userKey(userMobile, "language"), language);
    writeJson(userKey(userMobile, "saved"), savedIds);
    writeJson(userKey(userMobile, "notifications"), notifications);
    writeJson(userKey(userMobile, "profile"), profile);
  }, [hydrated, theme, language, savedIds, notifications, profile, isAuthenticated, userMobile]);

  // -------------------------------------------------------------------------
  // Login — load ONLY the new user's data, never bleed previous user's data
  // -------------------------------------------------------------------------
  const login = async (identifier?: string, name?: string) => {
    const mobileNum = identifier && /^\d+$/.test(identifier) ? identifier : "";

    if (!mobileNum) {
      setIsAuthenticated(true);
      writeJson("km-auth", true);
      writeJson("km-logged-in", true);
      return;
    }

    // If switching users, reset ALL in-memory state before loading new user
    if (userMobile && userMobile !== mobileNum) {
      setSavedIds([]);
      setProfile(emptyProfile);
      setNotifications(defaultNotifications);
      setLanguage("en");
    }

    setIsAuthenticated(true);
    setUserMobile(mobileNum);
    writeJson("km-auth", true);
    writeJson("km-logged-in", true);
    writeJson("km-user-mobile", mobileNum);

    // 1. Look up user profile: first check user-scoped cache or DB to preserve returning user's details
    const cachedProfile = readJson<FarmerProfile | null>(userKey(mobileNum, "profile"), null);
    const localUsers = getLocalUsers();
    const dbUser = localUsers.find((u) => u.mobile === mobileNum);

    if (cachedProfile && cachedProfile.name) {
      setProfile(cachedProfile);
    } else if (dbUser) {
      const initialProfile: FarmerProfile = {
        ...emptyProfile,
        name: dbUser.name,
        age: String(dbUser.age),
        state: dbUser.state,
        district: dbUser.district,
        income: dbUser.annualIncome,
      };
      setProfile(initialProfile);
      writeJson(userKey(mobileNum, "profile"), initialProfile);
    } else {
      // 2. Check Supabase for this user's existing profile
      const existing = await getFarmerProfileFromDb(mobileNum);
      if (existing?.profile) {
        setProfile(existing.profile);
        writeJson(userKey(mobileNum, "profile"), existing.profile);
        if (existing.language && (["en", "te", "ta", "hi"] as string[]).includes(existing.language)) {
          const lang = existing.language as Language;
          setLanguage(lang);
          writeJson(userKey(mobileNum, "language"), lang);
        }
      } else if (name) {
        const freshProfile: FarmerProfile = { ...emptyProfile, name };
        setProfile(freshProfile);
        writeJson(userKey(mobileNum, "profile"), freshProfile);
      }
    }

    if (dbUser?.preferredLanguage && (["en", "te", "ta", "hi"] as string[]).includes(dbUser.preferredLanguage)) {
      const lang = dbUser.preferredLanguage as Language;
      setLanguage(lang);
      writeJson(userKey(mobileNum, "language"), lang);
    }

    // 3. Load this user's saved schemes (start empty if none)
    const cachedSaved = readJson<string[]>(userKey(mobileNum, "saved"), []);
    setSavedIds(cachedSaved);

    const dbSaved = await getSavedSchemesFromDb(mobileNum);
    if (dbSaved && dbSaved.length > 0) {
      setSavedIds(dbSaved);
      writeJson(userKey(mobileNum, "saved"), dbSaved);
    }
  };

  // -------------------------------------------------------------------------
  // Logout — clear ALL in-memory state; next user always starts fresh
  // -------------------------------------------------------------------------
  const logout = () => {
    const prevMobile = userMobile;

    setIsAuthenticated(false);
    clearSession();

    // Wipe ALL in-memory state immediately
    setSavedIds([]);
    setProfile(emptyProfile);
    setNotifications(defaultNotifications);
    setLanguage("en");
    setUserMobile("");

    // Clear auth markers and stale non-scoped legacy keys
    if (typeof window !== "undefined") {
      localStorage.removeItem("km-logged-in");
      localStorage.setItem("km-auth", "false");
      localStorage.removeItem("km-user-mobile");
      // Remove old non-scoped legacy keys that could leak data to next user
      localStorage.removeItem("km-saved");
      localStorage.removeItem("km-profile");
      localStorage.removeItem("km-notifications");
      // Clear stale chat threads that are NOT scoped to any user
      for (const lang of ["en", "te", "ta", "hi"]) {
        localStorage.removeItem(`km-chat-threads-${lang}`);
      }
    }

    // Log for debugging
    void prevMobile;

    toast.info("You have been logged out successfully.");
  };

  // -------------------------------------------------------------------------
  // Profile & Scheme actions — always scoped to current user
  // -------------------------------------------------------------------------
  const updateProfile = (p: FarmerProfile) => {
    setProfile(p);
    toast.success("Profile updated");
    void upsertFarmerProfileInDb(p, userMobile, language);
  };

  const saveAllSchemes = (ids: string[]) => {
    setSavedIds(ids);
    toast.success(`All ${ids.length} schemes saved to your profile!`);
    void bulkSaveSchemesInDb(userMobile, ids);
  };

  const clearAllSaved = () => {
    setSavedIds([]);
    toast.info("Cleared all saved schemes");
    void clearAllSavedSchemesInDb(userMobile);
  };

  const toggleSaved = (id: string) => {
    setSavedIds((v) => {
      const removing = v.includes(id);
      const next = removing ? v.filter((x) => x !== id) : [...v, id];
      toast.success(removing ? "Removed from saved schemes" : "Scheme saved");
      void toggleSavedSchemeInDb(userMobile, id, !removing);
      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((v) => (v === "light" ? "dark" : "light")),
      language,
      setLanguage: (lang: Language) => {
        setLanguage(lang);
        if (isAuthenticated && userMobile) {
          writeJson(userKey(userMobile, "language"), lang);
          void upsertFarmerProfileInDb(profile, userMobile, lang);
        }
      },
      savedIds,
      toggleSaved,
      saveAllSchemes,
      clearAllSaved,
      notifications,
      markRead: (id?: string) =>
        setNotifications((v) => v.map((n) => (!id || n.id === id ? { ...n, read: true } : n))),
      profile,
      updateProfile,
      sidebarOpen,
      setSidebarOpen,
      isAuthenticated,
      userMobile,
      login,
      logout,
    }),
    [
      theme,
      language,
      savedIds,
      notifications,
      profile,
      sidebarOpen,
      isAuthenticated,
      userMobile,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}


